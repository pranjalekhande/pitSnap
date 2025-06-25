# 02 - Paddock AI: Backend Technical Plan

This document provides a granular, technical checklist for building the Paddock AI backend service. This service will power the Pit Wall, Ask the Paddock, and Smart Debates features.

**Tech Stack:**
-   **Orchestration**: LangChain (Python)
-   **LLM**: OpenAI (GPT-4)
-   **Vector Store**: Pinecone
-   **API Framework**: FastAPI
-   **Live Data**: Ergast F1 API (for development)

---

### **Step 1: Project Setup & Environment**
-   Initialize a new Python project for our backend service (e.g., using Poetry or pip).
-   Install necessary libraries:
    -   `langchain` & `langchain-openai`: For the core RAG logic and OpenAI integration.
    -   `pinecone-client`: To connect to our vector store.
    -   `fastapi` & `uvicorn`: To create and serve our API endpoint.
    -   `python-dotenv`: To manage API keys securely.
    -   `requests` or `httpx`: To fetch data from the F1 API.
-   Create a `.env` file and add your `OPENAI_API_KEY` and `PINECONE_API_KEY`.

---

### **Step 2: The Knowledge Base Pipeline (One-time script)**
*This script will be run locally to populate our Pinecone index.*

-   **Load Documents**: Use LangChain's `PyPDFLoader` to load the F1 rulebooks and `WebBaseLoader` for key web articles.
-   **Split Documents**: Use a `RecursiveCharacterTextSplitter` to break the documents into smaller, semantically meaningful chunks. This is crucial for accurate retrieval.
-   **Embed & Store**:
    -   Initialize the OpenAI embeddings model: `OpenAIEmbeddings()`.
    -   Initialize the Pinecone client and connect to your index.
    -   Use LangChain's `Pinecone.from_documents()` to automatically generate embeddings for each chunk and upload them to your Pinecone index.

---

### **Step 3: The Live Data Client**
*A module within the backend service, e.g., `f1_api_client.py`.*

-   Create a simple Python client with a function `get_latest_race_events()`.
-   This function will call the Ergast F1 API to get the latest race results or live data. It will parse the JSON and return a simple list of events.

---

### **Step 4: The Core RAG Chain (The "Brain")**
*The core logic of our service, using LangChain Expression Language (LCEL).*

-   **Define Retriever**: Create a retriever from our Pinecone vector store: `vectorstore.as_retriever()`.
-   **Create Prompt Template**: Design a `ChatPromptTemplate` that takes the original `event` (from the F1 API) and the `context` (from Pinecone) as input. The prompt will instruct the AI on how to behave, e.g., *"Based on the following F1 data, explain the significance of the event. Context: {context}. Event: {event}"*.
-   **Define LLM**: Initialize the OpenAI model: `ChatOpenAI(model="gpt-4", temperature=0)`.
-   **Stitch it Together**: Create the final `chain` that pipes these elements together: `contextualized_question -> retriever -> prompt -> model -> output_parser`.

---

### **Step 5: The API Endpoint**
*The main entry point of the service, e.g., `main.py` using FastAPI.*

-   Define a single endpoint, e.g., `POST /get_pit_wall_feed`.
-   This endpoint will:
    1.  Call our `f1_api_client` to get the latest events.
    2.  For each event, invoke our LangChain RAG `chain` to generate an intelligent insight.
    3.  Add logic here to also fetch related official articles/videos.
    4.  Format the results into a clean JSON list of "cards" and return it. 