from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
from groq import Groq
import pytesseract
import os
import threading
import time

from rag_utils import store_document, ask_question

app = Flask(__name__)
CORS(app)  # React (alag port pe chalta hai) se requests allow karne ke liye zaroori hai

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY)

TEXT_MODEL = "openai/gpt-oss-20b"


def extract_text(image):
    """
    Image se text nikalta hai locally Tesseract OCR se.
    No external API call, no network delay, no timeout risk —
    sab kuch server pe hi hota hai isliye fast hai.

    Speed ke liye teen optimizations:
    1. Image ko chhote max width tak resize karte hain (Render ke weak
       free-tier CPU pe bade images Tesseract ko bahut slow kar dete hain)
    2. Grayscale mein convert karte hain — color info OCR ke liye zaroori
       nahi, isse processing thodi aur fast hoti hai
    3. Tesseract ka faster engine mode (--oem 1 --psm 6) use karte hain,
       jo simple uniform-block text ke liye optimized hai
    """
    image = image.convert("L")  # grayscale

    max_width = 1000
    if image.width > max_width:
        ratio = max_width / image.width
        new_size = (max_width, int(image.height * ratio))
        image = image.resize(new_size, Image.LANCZOS)

    custom_config = r'--oem 1 --psm 6'
    text = pytesseract.image_to_string(image, config=custom_config)
    return text.strip()


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
    """Document image leke, Tesseract OCR + Groq simplification karke result deta hai"""
    t0 = time.time()

    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    file = request.files["image"]
    image = Image.open(file.stream)

    try:
        raw_text = extract_text(image)
    except Exception as e:
        print(f"[OCR ERROR] {e}", flush=True)
        return jsonify({
            "raw_text": "",
            "simplified": "Sorry, I couldn't read this document right now. Please try again in a moment."
        })

    t1 = time.time()
    print(f"[TIMING] Tesseract OCR took {t1 - t0:.2f} seconds", flush=True)

    if not raw_text.strip():
        return jsonify({
            "raw_text": "",
            "simplified": "I couldn't find any readable text in this image. Try a clearer photo of the document."
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