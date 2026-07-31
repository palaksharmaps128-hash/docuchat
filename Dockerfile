FROM python:3.11-slim

# System dependencies: Tesseract for OCR, FFmpeg for Whisper audio processing
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["python", "server.py"]