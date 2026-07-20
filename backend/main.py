from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import json
from dotenv import load_dotenv
from PyPDF2 import PdfReader
from langchain_openai import ChatOpenAI
from typing import List, Dict, Optional

load_dotenv()

app = FastAPI(title="IKIP API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

documents_db = []
UPLOAD_DIR = "uploads"
ENTITY_FILE = "entities.json"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def load_entities() -> Dict:
    if os.path.exists(ENTITY_FILE):
        with open(ENTITY_FILE, "r") as f:
            return json.load(f)
    return {}


def save_entities(entities: Dict):
    with open(ENTITY_FILE, "w") as f:
        json.dump(entities, f)


entities = load_entities()


class QueryRequest(BaseModel):
    question: str


def load_pdf(filepath: str) -> str:
    reader = PdfReader(filepath)
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""
    return text


def load_txt(filepath: str) -> str:
    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()


def load_documents():
    docs = []
    for filename in os.listdir(UPLOAD_DIR):
        filepath = os.path.join(UPLOAD_DIR, filename)
        if filename.endswith(".pdf"):
            text = load_pdf(filepath)
            docs.append({"content": text, "source": filename})
        elif filename.endswith(".txt"):
            text = load_txt(filepath)
            docs.append({"content": text, "source": filename})
    return docs


def split_text(text: str, chunk_size=1000, overlap=200) -> List[str]:
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return chunks


def extract_entities(text: str, filename: str) -> List[str]:
    llm = ChatOpenAI(
        model="grok-2-mini-1212",
        openai_api_key=os.getenv("GROK_API_KEY"),
        openai_api_base="https://api.x.ai/v1",
        temperature=0
    )
    prompt = f"""Extract key industrial entities (equipment names, part numbers, incident IDs, process steps) from the following text. Return only a JSON array of entities, no other text.

Text: {text[:3000]}

JSON Array:"""
    response = llm.invoke(prompt)
    try:
        return json.loads(response.content.strip())
    except:
        return []


def search_documents(question: str, top_k=3) -> List[Dict]:
    question_words = set(question.lower().split())
    scored_docs = []
    for doc in documents_db:
        doc_words = set(doc["content"].lower().split())
        match_score = len(question_words & doc_words)
        scored_docs.append({"score": match_score, **doc})
    scored_docs.sort(key=lambda x: x["score"], reverse=True)
    return scored_docs[:top_k]


@app.get("/")
async def root():
    return {"message": "IKIP API is running!"}


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    global entities
    file_location = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_location, "wb") as f:
        f.write(await file.read())
    
    related_entities = []
    doc_text = ""
    
    # Extract entities from the new file if it's a supported type
    if file.filename.endswith(".pdf"):
        doc_text = load_pdf(file_location)
    elif file.filename.endswith(".txt"):
        doc_text = load_txt(file_location)
    
    if doc_text:
        new_entities = extract_entities(doc_text, file.filename)
        
        # Find matches with existing entities
        for entity in new_entities:
            if entity in entities:
                related_entities.append({
                    "entity": entity,
                    "found_in": entities[entity]
                })
            # Update entities with new file
            if entity not in entities:
                entities[entity] = []
            if file.filename not in entities[entity]:
                entities[entity].append(file.filename)
        
        save_entities(entities)
    
    return {
        "filename": file.filename,
        "message": "File uploaded successfully",
        "related_entities": related_entities
    }


@app.post("/ingest")
async def ingest_documents():
    global documents_db
    docs = load_documents()
    if not docs:
        raise HTTPException(status_code=400, detail="No documents to ingest")
    
    documents_db = []
    for doc in docs:
        chunks = split_text(doc["content"])
        for chunk in chunks:
            documents_db.append({"content": chunk, "source": doc["source"]})
    
    return {"message": "Documents ingested successfully", "chunks_loaded": len(documents_db)}


@app.post("/query")
async def query(request: QueryRequest):
    global documents_db
    if not documents_db:
        raise HTTPException(status_code=400, detail="Please ingest documents first")
    
    # Search for relevant chunks
    relevant_docs = search_documents(request.question)
    context = "\n\n".join([f"[{doc['source']}] {doc['content']}" for doc in relevant_docs])
    sources = list(set([doc['source'] for doc in relevant_docs]))
    
    llm = ChatOpenAI(
        model="grok-2-mini-1212",
        openai_api_key=os.getenv("GROK_API_KEY"),
        openai_api_base="https://api.x.ai/v1",
        temperature=0
    )
    
    prompt = f"""You are an AI assistant for an industrial knowledge intelligence platform (IKIP). 

Answer the question based on the following context. Follow these steps exactly:

1. First, list which documents you are checking and what key information you found in each (reasoning trace)
2. Then provide your final answer
3. Assign a confidence score from 0-100 based on how certain you are
4. If confidence is below 70, explicitly recommend human verification

Format your response as JSON with these keys:
- "reasoning_steps": array of strings, each step explaining what you checked
- "answer": the final answer
- "confidence": number 0-100
- "needs_verification": boolean (true if confidence < 70)

Context:
{context}

Question: {request.question}

JSON Response:"""
    
    response = llm.invoke(prompt)
    
    try:
        parsed_response = json.loads(response.content.strip())
        return {
            "reasoning_steps": parsed_response.get("reasoning_steps", []),
            "answer": parsed_response.get("answer", response.content),
            "confidence": parsed_response.get("confidence", 50),
            "needs_verification": parsed_response.get("needs_verification", True),
            "sources": sources
        }
    except:
        return {
            "reasoning_steps": ["Generated answer without structured reasoning"],
            "answer": response.content,
            "confidence": 50,
            "needs_verification": True,
            "sources": sources
        }
