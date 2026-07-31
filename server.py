from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import pytesseract
from groq import Groq
import os
import platform

from rag_utils import store_document, ask_question

app = Flask(__name__)
CORS(app)  # React (alag port pe chalta hai) se requests allow karne ke liye zaroori hai

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

# Tesseract path — sirf Windows pe zaroori hai, Linux (Render) pe apne aap mil jata hai
if platform.system() == "Windows":
    pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

client = Groq(api_key=GROQ_API_KEY)


def extract_text(image):
    """Image se text nikalta hai OCR use karke"""
    return pytesseract.image_to_string(image)


def simplify_text(text):
    """Complex text ko simple language mein convert karta hai"""
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
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
    return jsonify({"status": "DocuChat backend is running"})


@app.route("/api/simplify", methods=["POST"])
def simplify_endpoint():
    """Document image leke, OCR + simplification karke result deta hai"""
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    file = request.files["image"]
    image = Image.open(file.stream)

    raw_text = extract_text(image)
    simplified = simplify_text(raw_text)

    # Document ko RAG ke liye store karo taaki follow-up questions puchhe ja sakein
    store_document(raw_text)

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
    app.run(debug=False, port=port, host='0.0.0.0')