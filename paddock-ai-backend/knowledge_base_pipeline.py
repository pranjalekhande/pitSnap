# This script will contain the logic for our one-time knowledge base pipeline.
# It will load documents, split them into chunks, generate embeddings,
# and upload them to our Pinecone vector store.

import os
import time
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from pinecone import Pinecone
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_pinecone import PineconeVectorStore
from langchain_core.documents import Document
import re

# Load environment variables from .env file
load_dotenv()

# --- Configuration ---
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
SOURCE_DATA_PATH = "./data"
# Using a single, reliable, and comprehensive source to build the initial knowledge base.
WEB_SOURCES = [
    "https://f1chronicle.com/a-beginners-guide-to-formula-1/"
]

def clean_text(text: str) -> str:
    """A helper function to clean up raw text scraped from HTML."""
    # Replace multiple newlines, tabs, and spaces with a single space
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def get_article_urls(hub_url):
    """Scrapes the hub page to find all individual article links."""
    print(f"Scraping hub page {hub_url} for article links...")
    urls = set() # Use a set to avoid duplicates
    try:
        response = requests.get(hub_url)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')
        # Find all <a> tags whose href contains '/en/latest/article.'
        for a_tag in soup.find_all('a', href=re.compile(r"/en/latest/article\.")):
            full_url = "https://www.formula1.com" + a_tag['href']
            urls.add(full_url)
    except requests.RequestException as e:
        print(f"Fatal Error: Could not scrape the hub URL {hub_url}. Error: {e}")
        return []
    print(f"Found {len(urls)} unique article links.")
    return list(urls)

def main():
    """
    Main function to run the knowledge base pipeline.
    This function loads documents from a reliable web source, processes them, 
    and uploads them to a Pinecone vector store.
    """
    print("--- Starting Knowledge Base Pipeline ---")

    # 1. Validate environment variables
    if not all([PINECONE_API_KEY, PINECONE_INDEX_NAME, OPENAI_API_KEY]):
        print("Error: Missing one or more required environment variables.")
        return

    # 2. Initialize Pinecone
    print(f"Initializing Pinecone... Index: '{PINECONE_INDEX_NAME}'")
    pc = Pinecone(api_key=PINECONE_API_KEY)
    
    # Check if the index exists, create it if it doesn't
    if PINECONE_INDEX_NAME not in pc.list_indexes().names():
        print(f"Index '{PINECONE_INDEX_NAME}' not found. Creating a new one...")
        # OpenAI's text-embedding-3-small uses 1536 dimensions
        pc.create_index(
            name=PINECONE_INDEX_NAME,
            dimension=1536,
            metric='cosine',
            # TODO: Configure spec for production use (e.g., pod spec)
        )
        # It can take a moment for the index to be ready
        time.sleep(1)
        print("Index created successfully.")
    else:
        print("Index found.")

    # 3. Load content directly using requests and BeautifulSoup
    print(f"Loading and parsing content from {len(WEB_SOURCES)} web page(s)...")
    all_texts = []
    for url in WEB_SOURCES:
        try:
            response = requests.get(url)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            # Use our new cleaning function
            cleaned_text = clean_text(soup.get_text())
            all_texts.append(cleaned_text)
        except requests.RequestException as e:
            print(f"Warning: Could not load URL {url}. Error: {e}")
    
    if not all_texts:
        print("Error: No content could be loaded from any web source.")
        return
    print(f"Loaded content from {len(all_texts)} source(s) successfully.")

    # 4. Split the combined text
    print("Splitting documents into smaller chunks...")
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1500, chunk_overlap=200)
    chunks = text_splitter.create_documents(all_texts)
    print(f"Split content into {len(chunks)} chunks.")

    # 5. Initialize OpenAI Embeddings
    print("Initializing OpenAI embeddings model...")
    embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

    # 6. Embed chunks and upload to Pinecone
    print(f"Embedding chunks and uploading to Pinecone index '{PINECONE_INDEX_NAME}'...")
    # This command handles embedding and uploading in one go.
    # It will replace the entire index with the new documents.
    PineconeVectorStore.from_documents(
        documents=chunks,
        embedding=embeddings,
        index_name=PINECONE_INDEX_NAME
    )
    print("--- Knowledge Base Pipeline Finished Successfully ---")


if __name__ == "__main__":
    main() 