FROM python:3.11-slim

WORKDIR /app

# Tesseract OCR engine install karo (pytesseract sirf ek Python wrapper hai,
# actual OCR engine system level pe install hona chahiye)
RUN apt-get update && apt-get install -y --no-install-recommends tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["python", "server.py"]