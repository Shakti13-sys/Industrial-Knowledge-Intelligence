# Industrial Knowledge Intelligence Platform (IKIP)

![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Pydantic](https://img.shields.io/badge/Pydantic-E92063?style=for-the-badge&logo=pydantic&logoColor=white)
![TF-IDF](https://img.shields.io/badge/TF--IDF-Information%20Retrieval-0A66C2?style=for-the-badge)
![LLM](https://img.shields.io/badge/LLM-AI-8A2BE2?style=for-the-badge)
![RAG](https://img.shields.io/badge/RAG-Retrieval--Augmented--Generation-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Docker Compose](https://img.shields.io/badge/Docker_Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![JSON](https://img.shields.io/badge/JSON-000000?style=for-the-badge&logo=json&logoColor=white)

## 🚀 Overview

The Industrial Knowledge Intelligence Platform (IKIP) is a robust application designed to revolutionize how organizations access and leverage critical information from unstructured industrial documents. This platform enables users to ingest, organize, and intelligently query various document types, such as manuals, logs, and reports. By integrating Retrieval-Augmented Generation (RAG) with Large Language Models (LLMs), IKIP provides quick, accurate, and context-aware answers to complex queries, significantly enhancing operational knowledge accessibility and decision-making.

# 📑 Table of Contents

- [🚀 Overview](#-overview)
- [✨ Features](#-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Getting Started](#-getting-started)
- [💡 Usage](#-usage)
- [📂 Project Structure](#-project-structure)
- [👥 Contributors](#-contributors)
  
## ✨ Features

*   **Secure User Authentication and Authorization**: Robust JWT-based security for user access.
*   **API for Document Ingestion and Management**: Seamlessly upload, store, and manage industrial documents.
*   **API for Entity Extraction and Management**: Automatically identify and manage key entities within documents.
*   **TF-IDF based Knowledge Retrieval**: Efficiently retrieve relevant document chunks using TF-IDF and cosine similarity.
*   **Integration with Large Language Models (LLMs)**: Leverage LLMs for intelligent querying and generating insightful responses.
*   **Interactive Chat Interface**: A natural language chat interface for asking questions and receiving answers from the knowledge base.
*   **Dashboard for System Overview**: Provides a comprehensive overview of system activity and knowledge base statistics.
*   **Containerized Deployment**: Easy setup and scalable deployment using Docker and Docker Compose.
*   **Modular and Scalable Architecture**: Designed for maintainability and future expansion for both frontend and backend.
*   **Modern and Responsive User Interface**: Built with React and Tailwind CSS for an intuitive and engaging user experience.

## 🛠️ Tech Stack

IKIP is built using a modern full-stack architecture leveraging a combination of powerful technologies:

**Backend:**
*   **Framework**: FastAPI (Python web framework)
*   **Data Validation**: Pydantic
*   **ASGI Server**: Uvicorn (implied)
*   **Authentication**: python-jose (JWT), passlib (Password Hashing)
*   **Storage**: In-memory with disk persistence (for demo/hackathon, designed for future integration with vector/graph databases)

**Frontend:**
*   **UI Library**: React
*   **Build Tool**: Vite
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS
*   **Routing**: React Router (inferred)
*   **HTTP Client**: Axios/Fetch API (inferred)

**DevOps & Deployment:**
*   **Containerization**: Docker
*   **Orchestration**: Docker Compose
*   **Reverse Proxy/Static Server**: Nginx

## 🚀 Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Before you begin, ensure you have the following installed on your system:
*   Python 3.8+
*   Node.js (LTS recommended) & npm (or yarn)
*   An OpenAI API Key
*   [Docker](https://docs.docker.com/get-docker/)
*   [Docker Compose](https://docs.docker.com/compose/install/)

### Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Shakti13-sys/Industrial-Knowledge-Intelligence.git
```
```bash
cd Industrial-Knowledge-Intelligence
```

### 2. Backend Setup

Navigate to the `backend` directory and set up the Python environment.

```bash
cd backend
```

**Create a Virtual Environment:**

```bash
python -m venv venv
```

**Activate the Virtual Environment:**

*   **macOS/Linux:**
    ```bash
    source venv/bin/activate
    ```
*   **Windows:**
    ```bash
    venv\Scripts\activate
    ```

**Install Dependencies:**

```bash
pip install -r requirements.txt
```

**Configure Environment Variables:**

Create a `.env` file in the `backend` directory and add your OpenAI API key:

```
OPENAI_API_KEY="YOUR_OPENAI_API_KEY"
```
Replace `"YOUR_OPENAI_API_KEY"` with your actual key.

### 3. Frontend Setup

Open a new terminal, navigate to the `frontend` directory, and install Node.js dependencies.

```bash
cd ../frontend # If you are still in the backend directory
# or: cd Industrial-Knowledge-Intelligence/frontend
```

**Install Dependencies:**

```bash
npm install
# or yarn install
```
### 4. Build and run the Docker containers:
    The `docker-compose.yml` file orchestrates the backend API, frontend application, and an Nginx reverse proxy.
    ```bash
    docker-compose up --build -d
    ```
    This command will:
    *   Build the `backend` Docker image based on `backend/Dockerfile`.
    *   Build the `frontend` Docker image based on `frontend/Dockerfile`.
    *   Start the `backend` service, `frontend` service, and an `nginx` proxy in detached mode.


## Usage

### 1. Start the Backend API

Make sure your Python virtual environment for the backend is active.

```bash
cd backend
# Activate virtual environment if not already active
# source venv/bin/activate (macOS/Linux)
# venv\Scripts\activate (Windows)

uvicorn main:app --reload
```
The backend API will be running at `http://127.0.0.1:8000`.

### 2. Start the Frontend Application

Open a **new terminal**, navigate to the `frontend` directory.

```bash
cd frontend

npm run dev
# or yarn dev
```
The frontend application will be available at `http://localhost:3000`.

Open your web browser and visit `http://localhost:3000` to access the Industrial Knowledge Intelligence platform. You can now upload PDF documents, manage entities, and interact with the AI query engine.

### Initial Credentials

The application includes user authentication. For initial access, you may need to configure a default user or create one via the API. Please refer to the `backend/app/config.py` file or environment variables for default credentials, or consult the API documentation at `/api/docs` for user creation endpoints if available.

## 💡 Usage

After successfully installing and running the application, follow these steps to interact with IKIP:

1.  **Login**: Navigate to `http://localhost` and log in using your configured credentials.
2.  **Upload Documents**: Go to the "Documents" page. Here you can upload unstructured industrial documents (e.g., `.txt` files from the `sample-data` directory) to populate your knowledge base. The system will process and chunk these documents for retrieval.
3.  **Manage Entities**: Visit the "Entities" page to view and potentially manage key information extracted from your documents.
4.  **Query the Knowledge Base**: Head to the "Chat" page. You can now ask natural language questions related to the content of your uploaded documents. The LLM, powered by RAG, will retrieve relevant information and generate intelligent responses.
5.  **Monitor Dashboard**: The "Dashboard" provides an overview of your system's activity, document count, and other relevant metrics.
6.  **Explore API**: For developers, the FastAPI Swagger UI at `http://localhost/api/docs` provides a comprehensive interface to interact directly with the backend API, test endpoints, and understand the data models.

## 📂 Project Structure

The repository is organized into distinct directories for clarity and modularity:

```
IKIP
├── backend/                  
│   ├── app/                  
│   │   ├── routers/          
│   │   ├── config.py         
│   │   ├── ingestion.py      
│   │   ├── llm.py            
│   │   ├── retrieval.py      
│   │   ├── schemas.py        
│   │   ├── security.py       
│   │   └── storage.py        
│   ├── Dockerfile            
│   └── requirements.txt      
├── frontend/                 
│   ├── public/               
│   ├── src/                  
│   │   ├── components/       
│   │   ├── hooks/            
│   │   ├── lib/              
│   │   ├── pages/            
│   │   ├── App.tsx           
│   │   └── main.tsx          
│   ├── Dockerfile            
│   ├── nginx.conf            
│   ├── package.json          
│   └── vite.config.ts        
├── sample-data/              
├── docker-compose.yml        
└── README.md                 
```
## 👥 Contributors

- **[shakti13-sys](https://github.com/Shakti13-sys)**  
- **[girish-indurkar](https://github.com/girish-indurkar)**
  
