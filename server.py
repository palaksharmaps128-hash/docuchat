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
# Free OCR.space API key — "helloworld" demo key duniya bhar ke logo ke beech
# shared hoti hai isliye overload/slow ho sakti hai. Apni khud ki free key
# https://ocr.space/ocrapi se lekar OCR_SPACE_API_KEY env variable mein
# Render pe set karna behtar hai (2 minute ka kaam, zyada reliable hoga).
OCR_SPACE_API_KEY = os.environ.get("OCR_SPACE_API_KEY", "helloworld")

client = Groq(api_key=GROQ_API_KEY)


def extract_text(image):
    """
    Image se text nikalta hai — OCR.space ke free cloud API se.
    Agar pehli try timeout ho jaye (shared demo key overload ki wajah se),
    ek baar retry karta hai. Agar dono baar fail ho, clear exception raise
    karta hai taaki caller isse gracefully handle kar sake.
    """
    buffer = io.BytesIO()
    image.convert("RGB").save(buffer, format="JPEG")
    buffer.seek(0)
    image_bytes = buffer.getvalue()

    last_error = None
    for attempt in range(2):
        try:
            response = requests.post(
                "https://api.ocr.space/parse/image",
                files={"file": ("image.jpg", io.BytesIO(image_bytes), "image/jpeg")},
                data={"apikey": OCR_SPACE_API_KEY, "language": "eng"},
                timeout=30
            )
            result = response.json()

            if result.get("IsErroredOnProcessing"):
                return ""

            parsed_results = result.get("ParsedResults", [])
            if not parsed_results:
                return ""

            return parsed_results[0].get("ParsedText", "")
        except Exception as e:
            last_error = e
            continue  # ek baar aur try karo

    # Dono attempts fail ho gaye — clear error raise karo
    raise RuntimeError(f"OCR service is not responding right now: {last_error}")


def simplify_text(text):
    """Complex text ko simple language mein convert karta hai"""
    response = client.chat.completions.create(
        model="openai/gpt-oss-20b",
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


# ---------- API Routes ----------

@app.route("/")
def home():
    return jsonify({"status": "InsightBot backend is running"})


@app.route("/api/simplify", methods=["POST"])
def simplify_endpoint():
    """Document image leke, OCR + simplification karke result deta hai"""
    t0 = time.time()

    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    file = request.files["image"]
    image = Image.open(file.stream)

    try:
        raw_text = extract_text(image)
    except Exception:
        # OCR service down/timeout — crash karne ke bajaye friendly JSON
        # response bhejo, taaki frontend proper message dikha sake
        return jsonify({
            "raw_text": "",
            "simplified": "Sorry, I couldn't read this document right now — the text-recognition service is slow or unavailable. Please try again in a moment."
        })

    t1 = time.time()
    print(f"[TIMING] OCR took {t1 - t0:.2f} seconds", flush=True)

    if not raw_text.strip():
        return jsonify({
            "raw_text": "",
            "simplified": "I couldn't find any readable text in this image. Try a clearer photo of the document."
        })

    simplified = simplify_text(raw_text)
    t2 = time.time()
    print(f"[TIMING] Groq LLM call took {t2 - t1:.2f} seconds", flush=True)

    # RAG embeddings background mein banao — taaki summary turant mil jaye, wait na karna pade
    threading.Thread(target=store_document, args=(raw_text,)).start()

    print(f"[TIMING] TOTAL before response: {t2 - t0:.2f} seconds", flush=True)

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