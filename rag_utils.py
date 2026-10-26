import chromadb
from groq import Groq
import threading
import re

# ChromaDB client - stores data locally, no server/subscription needed
chroma_client = chromadb.Client()

# Lock so that only one document store/fetch operation runs at a time.
# This stops the "delete old collection -> create new -> add data" sequence
# from being interrupted by another thread (which earlier caused a race
# condition and a "Collection does not exist" error).
doc_lock = threading.Lock()


def chunk_text(text, chunk_size=600, overlap=40):
    """
    Splits a document into smaller chunks.
    chunk_size = number of words in each chunk
    overlap = number of words shared between two chunks (so context isn't lost)
    """
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = start + chunk_size
        chunk = " ".join(words[start:end])
        chunks.append(chunk)
        start += chunk_size - overlap
    return chunks


def store_document(text, doc_id="current_doc"):
    """
    Splits the document into chunks and stores them in a ChromaDB collection.
    For every new document, the old collection is deleted and a new one is created,
    because this is a single-document tool (only one document's context is kept at a time).

    The whole delete+create+add sequence is wrapped in a lock so that if two
    documents are uploaded together (or in quick succession), their background
    threads don't delete each other's collection midway.
    """
    with doc_lock:
        # Remove the old collection if it exists
        try:
            chroma_client.delete_collection(name="doc_collection")
        except Exception:
            pass

        collection = chroma_client.create_collection(name="doc_collection")

        chunks = chunk_text(text)
        ids = [f"{doc_id}_{i}" for i in range(len(chunks))]

        collection.add(
            documents=chunks,
            ids=ids
        )
        return collection


def try_calculator_tool(question):
    """Agent tool: if the question is a simple math expression, use the calculator."""
    match = re.search(r'[\d\.\s\+\-\*/\(\)%]{3,}', question)
    if match and any(c.isdigit() for c in match.group()) and any(op in match.group() for op in '+-*/'):
        try:
            expr = match.group().strip()
            result = eval(expr, {"__builtins__": {}})
            return f"🧮 Using the calculator tool: {expr} = {result}"
        except Exception:
            return None
    return None


def ask_question(question, groq_api_key):
    """
    Takes the user's question and first looks for the answer in ChromaDB (the document).
    If the document doesn't contain the answer, the LLM gives a helpful answer from general knowledge.
    If no document has been uploaded yet (a fresh "New Chat", i.e. general chatbot mode),
    it answers directly from general knowledge, with no error.
    """
    calc_result = try_calculator_tool(question)
    if calc_result:
        return calc_result

    # Fetch the collection inside the lock, so that if a document is still
    # being stored (delete+create+add in progress), the question doesn't
    # look for the collection in the middle of that process.
    context = ""
    with doc_lock:
        try:
            collection = chroma_client.get_collection(name="doc_collection")
            # Find the 3 most relevant chunks
            results = collection.query(
                query_texts=[question],
                n_results=3
            )
            relevant_chunks = results["documents"][0]
            context = "\n\n".join(relevant_chunks)
        except Exception:
            # No document uploaded yet: general chat mode.
            # Context stays empty and the LLM answers from general knowledge.
            context = ""

    client = Groq(api_key=groq_api_key)

    prompt = f"""You are DocuChat, a warm and friendly AI assistant that helps people understand documents. Respond naturally like a friendly assistant would — not overly formal or robotic.

Rules for how to respond:
- If the user is just greeting you (e.g. "hi", "hello"), greet them back warmly and ask how you can help — don't mention the document.
- If the user is saying goodbye (e.g. "bye", "see you"), reply warmly and invite them to come back anytime — don't mention the document.
- If the user makes small talk or asks a casual/random question unrelated to the document, answer it in a friendly, conversational way using your own knowledge.
- If the user asks something about the document, answer using the context below as the primary source, in clear, friendly language (2-4 sentences).
- If the context does NOT contain the answer to a document-related question, use your own general knowledge to give a helpful answer — start that reply with "📘 This isn't mentioned in the document, but here's a general answer:" followed by the information.
- Match the user's language and style: if they write in English, reply in English. If they write in Hindi or Hinglish (Hindi words typed in English/Roman letters, e.g. "kya haal hai", "kaam kar rahe ho kya"), reply back in the same casual Hinglish style — don't force pure English or pure Hindi script.

Keep all replies warm, natural, and concise — like a helpful friend, not a formal report.

Document context:
{context}

User message: {question}
"""

    response = client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.5
    )

    return response.choices[0].message.content