import chromadb
from groq import Groq

# ChromaDB client - stores data locally, no server/subscription needed
chroma_client = chromadb.Client()

def chunk_text(text, chunk_size=300, overlap=50):
    """
    Simple document ko chhote chunks mein todta hai.
    chunk_size = har chunk mein kitne words honge
    overlap = do chunks ke beech kitna text common rahega (context na tute isliye)
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
    Document ke chunks banake ChromaDB collection mein store karta hai.
    Har naye document ke liye purani collection delete karke nayi banate hain,
    kyunki yeh single-document tool hai (ek time pe ek hi document ka context rakhna hai).
    """
    # Purani collection hatao agar hai
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


def ask_question(question, groq_api_key):
    """
    User ka sawaal leke, pehle ChromaDB (document) se answer dhoondhta hai.
    Agar document mein answer nahi milta, LLM apne general knowledge se helpful answer deta hai.
    """
    collection = chroma_client.get_collection(name="doc_collection")

    # Sabse relevant 3 chunks dhoondo
    results = collection.query(
        query_texts=[question],
        n_results=3
    )

    relevant_chunks = results["documents"][0]
    context = "\n\n".join(relevant_chunks)

    client = Groq(api_key=groq_api_key)

    prompt = f"""You are DocuChat, a warm and friendly AI assistant that helps people understand documents. Respond naturally like a friendly assistant would — not overly formal or robotic.

Rules for how to respond:
- If the user is just greeting you (e.g. "hi", "hello"), greet them back warmly and ask how you can help — don't mention the document.
- If the user is saying goodbye (e.g. "bye", "see you"), reply warmly and invite them to come back anytime — don't mention the document.
- If the user makes small talk or asks a casual/random question unrelated to the document, answer it in a friendly, conversational way using your own knowledge.
- If the user asks something about the document, answer using the context below as the primary source, in clear, friendly language (2-4 sentences).
- If the context does NOT contain the answer to a document-related question, use your own general knowledge to give a helpful answer — start that reply with "📘 This isn't mentioned in the document, but here's a general answer:" followed by the information.

Keep all replies warm, natural, and concise — like a helpful friend, not a formal report.

Document context:
{context}

User message: {question}
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.5
    )

    return response.choices[0].message.content