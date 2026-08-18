from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
from groq import Groq
import os
import threading
import io
import base64
import time

from rag_utils import store_document, ask_question

app = Flask(__name__)
CORS(app)  # React (alag port pe chalta hai) se requests allow karne ke liye zaroori hai

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY)

VISION_MODEL = "qwen/qwen3.6-27b"  # Groq ka current vision-capable model


def image_to_data_uri(image):
    """PIL image ko base64 data URI mein convert karta hai (Groq ko bhejne ke liye)"""
    buffer = io.BytesIO()
    image.convert("RGB").save(buffer, format="JPEG", quality=85)
    b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return f"data:image/jpeg;base64,{b64}"


def extract_and_simplify(image):
    """
    Image ko seedha Groq ke vision model ko bhejta hai — ek hi call mein
    document ka text bhi padhta hai (OCR) aur usko simplify bhi kar deta hai.
    OCR.space poori tarah hata diya gaya hai kyunki Render ke server se
    api.ocr.space tak connection hi nahi ban raha tha (network-level
    timeout, key ka issue nahi tha) — isse response ek hi fast Groq call
    mein aa jata hai, koi extra delay nahi.
    """
    data_uri = image_to_data_uri(image)

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
                            "RAW_TEXT_START\n"
                            "<the transcribed text here>\n"
                            "RAW_TEXT_END\n"
                            "SIMPLIFIED_START\n"
                            "<the simplified bullet points here>\n"
                            "SIMPLIFIED_END"
                        )
                    },
                    {
                        "type": "image_url",
                        "image_url": {"url": data_uri}
                    }
                ]
            }
        ]
    )

    content = response.choices[0].message.content

    raw_text = ""
    simplified = ""
    try:
        raw_text = content.split("RAW_TEXT_START")[1].split("RAW_TEXT_END")[0].strip()
        simplified = content.split("SIMPLIFIED_START")[1].split("SIMPLIFIED_END")[0].strip()
    except Exception:
        # Agar model ne exact format follow nahi kiya, poora response
        # simplified ke roop mein dikha do taaki kuch na kuch mile
        simplified = content.strip()
        raw_text = content.strip()

    return raw_text, simplified


# ---------- API Routes ----------

@app.route("/")
def home():
    return jsonify({"status": "InsightBot backend is running"})


@app.route("/api/simplify", methods=["POST"])
def simplify_endpoint():
    """Document image leke, ek hi fast Groq call mein padhta aur simplify karta hai"""
    t0 = time.time()

    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    file = request.files["image"]
    image = Image.open(file.stream)

    try:
        raw_text, simplified = extract_and_simplify(image)
    except Exception as e:
        print(f"[VISION ERROR] {e}", flush=True)
        return jsonify({
            "raw_text": "",
            "simplified": "Sorry, I couldn't read this document right now. Please try again in a moment."
        })

    t1 = time.time()
    print(f"[TIMING] Vision OCR+simplify took {t1 - t0:.2f} seconds", flush=True)

    if not raw_text.strip():
        return jsonify({
            "raw_text": "",
            "simplified": "I couldn't find any readable text in this image. Try a clearer photo of the document."
        })

    # RAG embeddings background mein banao — taaki summary turant mil jaye, wait na karna pade
    threading.Thread(target=store_document, args=(raw_text,)).start()

    print(f"[TIMING] TOTAL before response: {t1 - t0:.2f} seconds", flush=True)

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