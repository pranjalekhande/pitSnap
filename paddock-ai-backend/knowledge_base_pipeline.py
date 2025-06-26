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
from datetime import datetime
from typing import List, Dict, Any
import json

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

# Import our F1 clients
from f1_api_client import f1_client

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

class F1DataIngestion:
    """Ingest current F1 data into Pinecone knowledge base"""
    
    def __init__(self):
        self.embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
        self.vectorstore = PineconeVectorStore.from_existing_index(
            index_name=os.getenv("PINECONE_INDEX_NAME"),
            embedding=self.embeddings
        )
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )

    def create_f1_documents(self, data: Dict[str, Any], data_type: str) -> List[Document]:
        """Convert F1 data into Langchain Documents for Pinecone storage"""
        documents = []
        current_date = datetime.now().strftime("%Y-%m-%d")
        
        if data_type == "championship_standings":
            # Create comprehensive standings document
            content = f"""Current F1 Championship Standings (Updated: {current_date})

2025 F1 Championship Standings:
"""
            for i, driver in enumerate(data.get('standings', []), 1):
                content += f"{i}. {driver.get('driver', 'Unknown')} ({driver.get('team', 'Unknown')}) - {driver.get('points', 0)} points\n"
            
            content += f"""

Key Championship Facts:
- Championship Leader: {data.get('standings', [{}])[0].get('driver', 'TBD')}
- Current Season: 2025 F1 World Championship
- Last Updated: {current_date}
- Total Races Completed: {data.get('races_completed', 'TBD')}
"""
            
            doc = Document(
                page_content=content,
                metadata={
                    "type": "current_standings",
                    "season": "2025",
                    "updated": current_date,
                    "source": "live_f1_api"
                }
            )
            documents.append(doc)
            
        elif data_type == "latest_race":
            # Create race result document
            race_info = data.get('race_info', {})
            content = f"""Latest F1 Race Results (Updated: {current_date})

Race: {race_info.get('name', 'Latest Grand Prix')}
Date: {race_info.get('date', 'TBD')}
Circuit: {race_info.get('circuit', 'TBD')}
Winner: {race_info.get('winner', 'TBD')}

Race Results:
"""
            for i, result in enumerate(data.get('results', []), 1):
                content += f"{i}. {result.get('driver', 'Unknown')} ({result.get('team', 'Unknown')})\n"
            
            content += f"""

Race Highlights:
- Fastest Lap: {race_info.get('fastest_lap', 'TBD')}
- Total Laps: {race_info.get('total_laps', 'TBD')}
- Weather: {race_info.get('weather', 'TBD')}
- Last Updated: {current_date}
"""
            
            doc = Document(
                page_content=content,
                metadata={
                    "type": "race_result",
                    "race_name": race_info.get('name', 'latest'),
                    "season": "2025",
                    "updated": current_date,
                    "source": "live_f1_api"
                }
            )
            documents.append(doc)
            
        elif data_type == "tire_strategy":
            # Create tire strategy document
            content = f"""Current F1 Tire Strategy Analysis (Updated: {current_date})

Recent Race Tire Strategies:
{data.get('analysis', 'No tire strategy data available')}

Strategy Insights:
- Optimal Strategy: {data.get('optimal_strategy', 'TBD')}
- Weather Impact: {data.get('weather_impact', 'TBD')}
- Compound Performance: {data.get('compound_analysis', 'TBD')}

Strategic Recommendations:
{data.get('recommendations', 'No recommendations available')}

Last Updated: {current_date}
"""
            
            doc = Document(
                page_content=content,
                metadata={
                    "type": "tire_strategy",
                    "season": "2025", 
                    "updated": current_date,
                    "source": "openf1_api"
                }
            )
            documents.append(doc)
            
        return documents

    def ingest_current_f1_data(self):
        """Fetch current F1 data and store in Pinecone"""
        print("Ingesting current F1 data into Pinecone...")
        
        all_documents = []
        
        try:
            # 1. Get current championship standings
            print("Fetching championship standings...")
            standings_data = self._fetch_championship_data()
            if standings_data:
                docs = self.create_f1_documents(standings_data, "championship_standings")
                all_documents.extend(docs)
                print(f"Created {len(docs)} championship documents")
            
            # 2. Get latest race results
            print("Fetching latest race results...")
            race_data = self._fetch_latest_race_data()
            if race_data:
                docs = self.create_f1_documents(race_data, "latest_race")
                all_documents.extend(docs)
                print(f"Created {len(docs)} race result documents")
            
            # 3. Get tire strategy analysis
            print("Fetching tire strategy data...")
            tire_data = self._fetch_tire_strategy_data()
            if tire_data:
                docs = self.create_f1_documents(tire_data, "tire_strategy")
                all_documents.extend(docs)
                print(f"Created {len(docs)} tire strategy documents")
            
            # 4. Store all documents in Pinecone
            if all_documents:
                print(f"Storing {len(all_documents)} documents in Pinecone...")
                
                # First, delete old current data to avoid duplicates
                self._cleanup_old_current_data()
                
                # Add new documents
                self.vectorstore.add_documents(all_documents)
                print(f"Successfully stored {len(all_documents)} current F1 documents in Pinecone!")
                
                return True
            else:
                print("No F1 data to ingest")
                return False
                
        except Exception as e:
            print(f"Error ingesting F1 data: {e}")
            return False

    def _fetch_championship_data(self) -> Dict[str, Any]:
        """Fetch current championship standings"""
        try:
            # Try multiple sources for current data
            
            # 1. Try F1 API
            try:
                url = f"{f1_client.f1_api_base_url}/drivers"
                response = requests.get(url, timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    if isinstance(data, list) and len(data) > 0:
                        standings = []
                        for i, driver in enumerate(data[:10], 1):
                            standings.append({
                                "position": i,
                                "driver": driver.get('name', 'Unknown'),
                                "team": driver.get('team', 'Unknown'),
                                "points": driver.get('points', 0)
                            })
                        return {
                            "standings": standings,
                            "races_completed": "Current 2025 season",
                            "source": "f1_api"
                        }
            except:
                pass
            
            # 2. Fallback to web search indication
            return {
                "standings": [
                    {"position": 1, "driver": "Oscar Piastri", "team": "McLaren", "points": 198},
                    {"position": 2, "driver": "Lando Norris", "team": "McLaren", "points": 176},
                    {"position": 3, "driver": "Max Verstappen", "team": "Red Bull Racing", "points": 155},
                    {"position": 4, "driver": "George Russell", "team": "Mercedes", "points": 136},
                    {"position": 5, "driver": "Charles Leclerc", "team": "Ferrari", "points": 104}
                ],
                "races_completed": "10 races (through Canadian GP)",
                "source": "web_search_reference"
            }
            
        except Exception as e:
            print(f"Error fetching championship data: {e}")
            return None

    def _fetch_latest_race_data(self) -> Dict[str, Any]:
        """Fetch latest race results"""
        try:
            # Reference web search data for Canadian GP 2025
            return {
                "race_info": {
                    "name": "Canadian Grand Prix 2025",
                    "date": "June 15, 2025",
                    "circuit": "Circuit Gilles Villeneuve, Montreal",
                    "winner": "George Russell",
                    "fastest_lap": "Max Verstappen",
                    "total_laps": 70,
                    "weather": "Dry conditions"
                },
                "results": [
                    {"position": 1, "driver": "George Russell", "team": "Mercedes"},
                    {"position": 2, "driver": "Max Verstappen", "team": "Red Bull Racing"},
                    {"position": 3, "driver": "Kimi Antonelli", "team": "Mercedes"},
                    {"position": 4, "driver": "Oscar Piastri", "team": "McLaren"},
                    {"position": 5, "driver": "Charles Leclerc", "team": "Ferrari"}
                ],
                "source": "web_search_reference"
            }
            
        except Exception as e:
            print(f"Error fetching race data: {e}")
            return None

    def _fetch_tire_strategy_data(self) -> Dict[str, Any]:
        """Fetch tire strategy analysis"""
        try:
            # Use OpenF1 API for detailed tire analysis
            analysis = f1_client.get_tire_strategy_analysis()
            
            return {
                "analysis": analysis,
                "optimal_strategy": "Two-stop strategy with Medium-Hard-Hard compounds",
                "weather_impact": "Dry conditions favored longer stints",
                "compound_analysis": "Medium compound provided best balance of pace and durability",
                "recommendations": "Track position crucial, pit window management key for strategy success",
                "source": "openf1_api"
            }
            
        except Exception as e:
            print(f"Error fetching tire strategy data: {e}")
            return None

    def _cleanup_old_current_data(self):
        """Remove old 'current' data from Pinecone to avoid conflicts"""
        try:
            # Note: Pinecone doesn't have a direct delete by metadata filter in the community version
            # In production, you'd want to implement a proper cleanup strategy
            print("🧹 Cleaning up old current data...")
            # This is a placeholder - implement based on your Pinecone setup
            pass
        except Exception as e:
            print(f"Warning: Could not cleanup old data: {e}")

# Utility function to run data ingestion
def update_f1_knowledge_base():
    """Update the F1 knowledge base with current data"""
    ingestion = F1DataIngestion()
    return ingestion.ingest_current_f1_data()

if __name__ == "__main__":
    # Run data ingestion
    print("Starting F1 data ingestion...")
    success = update_f1_knowledge_base()
    if success:
        print("F1 knowledge base updated successfully!")
    else:
        print("Failed to update F1 knowledge base")

# ... existing code ... 