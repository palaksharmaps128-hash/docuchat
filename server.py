from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import pytesseract
from groq import Groq
import whisper
import tempfile
import io

from rag_utils import store_document, ask_question
import pyttsx3

app = Flask(__name__)
CORS(app)  # React (alag port pe chalta hai) se requests allow karne ke liye zaroori hai

import os
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

# Tesseract path set karo (Windows ke liye zaroori hai)
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

client = Groq(api_key=GROQ_API_KEY)

# Whisper model ek hi baar load hoga jab server start hoga
whisper_model = whisper.load_model("base")


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


@app.route("/api/transcribe", methods=["POST"])
def transcribe_endpoint():
    """Recorded audio ko text mein convert karta hai"""
    if "audio" not in request.files:
        return jsonify({"error": "No audio uploaded"}), 400

    file = request.files["audio"]

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp_file:
        file.save(tmp_file.name)
        result = whisper_model.transcribe(tmp_file.name, language="en")

    return jsonify({"text": result["text"].strip()})


@app.route("/api/speak", methods=["POST"])
def speak_endpoint():
    """Diye gaye text ko server pe bolta hai (offline, pyttsx3 use karke)"""
    data = request.get_json()
    text = data.get("text", "")

    engine = pyttsx3.init()
    engine.setProperty('rate', 180)
    voices = engine.getProperty('voices')
    for voice in voices:
        if 'female' in voice.name.lower() or 'zira' in voice.name.lower():
            engine.setProperty('voice', voice.id)
            break
    engine.say(text)
    engine.runAndWait()
    engine.stop()

    return jsonify({"status": "done"})


if __name__ == "__main__":
    app.run(debug=True, port=5000, host='0.0.0.0')