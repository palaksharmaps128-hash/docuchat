from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
from groq import Groq
import os
import threading
import io
import base64
import requests
import time

from rag_utils import store_document, ask_question

app = Flask(__name__)
CORS(app)  # React (alag port pe chalta hai) se requests allow karne ke liye zaroori hai

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
# Apni personal free OCR.space key — shared "helloworld" demo key se zyada reliable
OCR_SPACE_API_KEY = os.environ.get("OCR_SPACE_API_KEY", "helloworld")

client = Groq(api_key=GROQ_API_KEY)

TEXT_MODEL = "openai/gpt-oss-20b"
VISION_MODEL = "qwen/qwen3.6-27b"


def extract_text_ocrspace(image_bytes):
    """
    OCR.space se image ka text nikalta hai. Agar pehli try fail ho
    (timeout/network issue), ek baar retry karta hai. Dono fail ho to
    exception raise karta hai taaki caller Groq vision pe fallback kar sake.
    """
    last_error = None
    for attempt in range(2):
        try:
            response = requests.post(
                "https://api.ocr.space/parse/image",
                files={"file": ("image.jpg", io.BytesIO(image_bytes), "image/jpeg")},
                data={"apikey": OCR_SPACE_API_KEY, "language": "eng"},
                timeout=20
            )
            result = response.json()

            if result.get("IsErroredOnProcessing"):
                raise RuntimeError(f"OCR.space error: {result.get('ErrorMessage')}")

            parsed_results = result.get("ParsedResults", [])
            if not parsed_results:
                raise RuntimeError("OCR.space returned no results")

            text = parsed_results[0].get("ParsedText", "")
            if not text.strip():
                raise RuntimeError("OCR.space returned empty text")

            return text
        except Exception as e:
            last_error = e
            print(f"[OCR.space] Attempt {attempt + 1} failed: {e}", flush=True)
            continue

    raise RuntimeError(f"OCR.space failed after retries: {last_error}")


def simplify_text(text):
    """Complex text ko simple language mein convert karta hai"""
    response = client.chat.completions.create(
        model=TEXT_MODEL,
        messages=[
            {
                "role": "system",
                "content": "You are an assistant that explains complex legal and medical documents in very simple, easy-to-understand language for common people. Keep the explanation SHORT and to the point — use 4-6 brief bullet points covering only the most important information. Avoid long paragraphs and unnecessary detail."
            },
            {
                "role": "user",
                "content": f"Summarize and simplify this document in a short, easy-to-read way (max 100-120 words):\n\n{text}"
            }
        ]
    )
    return response.choices[0].message.content


def extract_and_simplify_vision(image_bytes):
    """
    Fallback: agar OCR.space fail ho jaye, seedha Groq ke vision model se
    ek hi call mein text bhi nikalta hai aur simplify bhi kar deta hai.
    """
    b64 = base64.b64encode(image_bytes).decode("utf-8")
    data_uri = f"data:image/jpeg;base64,{b64}"

    response = client.chat.completions.create(
        model=VISION_MODEL,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": (
                            "This image contains a document (legal/medical/general). "
                            "Do two things:\n"
                            "1. Read and transcribe ALL the text visible in the image, exactly as written.\n"
                            "2. Then explain it in very simple, easy-to-understand language for common "
                            "people — 4-6 short bullet points covering only the most important information, "
                            "max 100-120 words total.\n\n"
                            "Reply in EXACTLY this format, nothing else before or after:\n"
                            "RAW_TEXT_START\n<transcribed text>\nRAW_TEXT_END\n"
                            "SIMPLIFIED_START\n<simplified bullet points>\nSIMPLIFIED_END"
                        )
                    },
                    {"type": "image_url", "image_url": {"url": data_uri}}
                ]
            }
        ]
    )

    content = response.choices[0].message.content
    try:
        raw_text = content.split("RAW_TEXT_START")[1].split("RAW_TEXT_END")[0].strip()
        simplified = content.split("SIMPLIFIED_START")[1].split("SIMPLIFIED_END")[0].strip()
    except Exception:
        raw_text = content.strip()
        simplified = content.strip()

    return raw_text, simplified


# ---------- API Routes ----------

@app.route("/")
def home():
    return jsonify({"status": "InsightBot backend is running"})


@app.route("/api/simplify", methods=["POST"])
def simplify_endpoint():
    """
    Document image leke text nikalta aur simplify karta hai.
    Pehle OCR.space try karta hai (fast, apni key ke saath reliable).
    Agar wo fail ho jaye, automatically Groq vision pe fallback ho jata
    hai — user ko error dikhne ka chance bahut kam ho jata hai.
    """
    t0 = time.time()

    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    file = request.files["image"]
    image = Image.open(file.stream)

    buffer = io.BytesIO()
    image.convert("RGB").save(buffer, format="JPEG", quality=88)
    image_bytes = buffer.getvalue()

    raw_text = ""
    simplified = ""

    try:
        raw_text = extract_text_ocrspace(image_bytes)
        t1 = time.time()
        print(f"[TIMING] OCR.space took {t1 - t0:.2f} seconds", flush=True)

        simplified = simplify_text(raw_text)
        t2 = time.time()
        print(f"[TIMING] Groq simplify took {t2 - t1:.2f} seconds", flush=True)

    except Exception as e:
        print(f"[FALLBACK] OCR.space failed, trying Groq vision: {e}", flush=True)
        try:
            raw_text, simplified = extract_and_simplify_vision(image_bytes)
            t2 = time.time()
            print(f"[TIMING] Vision fallback took {t2 - t0:.2f} seconds", flush=True)
        except Exception as e2:
            print(f"[FALLBACK FAILED] Vision also failed: {e2}", flush=True)
            return jsonify({
                "raw_text": "",
                "simplified": "Sorry, I couldn't read this document right now. Please try again in a moment."
            })

    if not raw_text.strip():
        return jsonify({
            "raw_text": "",
            "simplified": "I couldn't find any readable text in this image. Try a clearer photo of the document."
        })

    # RAG embeddings background mein banao — taaki summary turant mil jaye, wait na karna pade
    threading.Thread(target=store_document, args=(raw_text,)).start()

    print(f"[TIMING] TOTAL before response: {time.time() - t0:.2f} seconds", flush=True)

    return jsonify({
        "raw_text": raw_text,
        "simplified": simplified
    })


@app.route("/api/ask", methods=["POST"])
def ask_endpoint():
    """Document ke baare mein sawaal ka jawab deta hai"""
    data = request.get_json()
    question = data.get("question", "")

    if not question.strip():
        return jsonify({"error": "No question provided"}), 400

    answer = ask_question(question, GROQ_API_KEY)
    return jsonify({"answer": answer})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=False, port=port, host='0.0.0.0', threaded=True)