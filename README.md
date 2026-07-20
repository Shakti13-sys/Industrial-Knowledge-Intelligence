# Industrial Knowledge Intelligence Platform (IKIP)

A simplified build for ET AI Hackathon 2026, Problem Statement #8.

## Tech Stack
- Frontend: Next.js + Tailwind CSS
- Backend: FastAPI
- AI: Grok (xAI)
- RAG: LangChain + FAISS

## Setup Instructions

### Backend Setup
1. Navigate to backend directory: `cd backend`
2. Install dependencies: `pip install -r requirements.txt`
3. Create `.env` file from `.env.example` and add your Grok API key
4. Run backend: `uvicorn main:app --reload`

### Frontend Setup
1. Navigate to frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Run frontend: `npm run dev`

## Usage
1. Upload industrial documents (PDF or text files)
2. Ingest the documents to create vector embeddings
3. Ask questions about your documents
