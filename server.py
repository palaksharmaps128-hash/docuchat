from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
from groq import Groq
import os
import threading
import time
import io
import requests

from rag_utils import store_document, ask_question

app = Flask(__name__)
CORS(app)  # React (alag port pe chalta hai) se requests allow karne ke liye zaroori hai

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY)

TEXT_MODEL = "openai/gpt-oss-20b"

# OCR.space free API key — ocr.space/ocrapi/freekey se milti hai, sirf email chahiye,
# card nahi. "helloworld" (demo/shared key) use nahi kar rahe kyunki woh heavily
# rate-limited hai aur unreliable — apni personal key normal, better limits deti hai.
OCR_SPACE_API_KEY = os.environ.get("OCR_SPACE_API_KEY")


def extract_text(image, max_retries=2):
    """
    Image se text nikalta hai OCR.space API se, apni personal free key ke saath.

    Retry logic add kiya hai: agar pehli try timeout ho jaaye ya fail ho jaaye
    (network glitch, temporary server issue), toh automatically ek aur try
    karta hai before giving up — isse reliability improve hoti hai.
    """
    buffer = io.BytesIO()
    image.convert("RGB").save(buffer, format="JPEG", quality=85)
    buffer.seek(0)

    last_error = None
    for attempt in range(max_retries):
        try:
            buffer.seek(0)
            response = requests.post(
                "https://api.ocr.space/parse/image",
                files={"file": ("image.jpg", buffer, "image/jpeg")},
                data={"apikey": OCR_SPACE_API_KEY, "language": "eng"},
                timeout=25
            )
            result = response.json()

            if result.get("IsErroredOnProcessing"):
                last_error = result.get("ErrorMessage", "OCR processing error")
                continue

            parsed_results = result.get("ParsedResults", [])
            if not parsed_results:
                last_error = "No parsed results returned"
                continue

            return parsed_results[0].get("ParsedText", "").strip()

        except requests.exceptions.RequestException as e:
            last_error = str(e)
            continue

    print(f"[OCR ERROR] All retries failed: {last_error}", flush=True)
    return ""


def simplify_text(text):
    """Extracted text ko simple language mein convert karta hai (sirf text jaata hai, image nahi — kam tokens)"""
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


# ---------- API Routes ----------

@app.route("/")
def home():
    return jsonify({"status": "InsightBot backend is running"})


@app.route("/api/simplify", methods=["POST"])
def simplify_endpoint():
    """Document image leke, OCR.space + Groq simplification karke result deta hai"""
    t0 = time.time()

    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    file = request.files["image"]
    image = Image.open(file.stream)

    raw_text = extract_text(image)

    t1 = time.time()
    print(f"[TIMING] OCR took {t1 - t0:.2f} seconds", flush=True)

    if not raw_text.strip():
        return jsonify({
            "raw_text": "",
            "simplified": "I couldn't read this document right now. Please try again with a clearer photo, or in a moment."
        })

    try:
        simplified = simplify_text(raw_text)
    except Exception as e:
        print(f"[LLM ERROR] {e}", flush=True)
        return jsonify({
            "raw_text": raw_text,
            "simplified": "Sorry, something went wrong while simplifying this document. Please try again."
        })

    t2 = time.time()
    print(f"[TIMING] Groq simplify took {t2 - t1:.2f} seconds", flush=True)

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