#!/usr/bin/env python3
"""
Check Pinecone Data Script

This script checks what F1 data is currently stored in your Pinecone 
knowledge base and shows you the latest updates.

Usage:
    python check_pinecone_data.py
"""

import os
import sys
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add parent directory to path to import our modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from langchain_openai import OpenAIEmbeddings
from langchain_pinecone import PineconeVectorStore

def check_pinecone_data():
    """Check what F1 data is stored in Pinecone"""
    print("=" * 60)
    print("🔍 PINECONE F1 DATA CHECKER")
    print("=" * 60)
    print(f"Checked at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    try:
        # Initialize Pinecone connection
        embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
        vectorstore = PineconeVectorStore.from_existing_index(
            index_name=os.getenv("PINECONE_INDEX_NAME"),
            embedding=embeddings
        )

        # Test queries to check what data exists
        test_queries = [
            "current F1 championship standings 2025",
            "latest F1 race results Canadian GP",
            "Oscar Piastri McLaren points",
            "2025 F1 season data",
            "current race winner results"
        ]

        print("🔍 SEARCHING FOR CURRENT F1 DATA...")
        print("-" * 40)

        for i, query in enumerate(test_queries, 1):
            print(f"\n{i}. Query: '{query}'")
            print("   Results:")
            
            try:
                # Search for relevant documents
                docs = vectorstore.similarity_search(query, k=3)
                
                if docs:
                    for j, doc in enumerate(docs, 1):
                        # Extract metadata
                        metadata = doc.metadata
                        content_preview = doc.page_content[:200] + "..." if len(doc.page_content) > 200 else doc.page_content
                        
                        print(f"     [{j}] Type: {metadata.get('type', 'unknown')}")
                        print(f"         Source: {metadata.get('source', 'unknown')}")
                        print(f"         Updated: {metadata.get('timestamp', 'unknown')}")
                        print(f"         Content: {content_preview}")
                        print()
                else:
                    print("     ❌ No results found")
                    
            except Exception as e:
                print(f"     ❌ Error searching: {e}")

        # Check for specific current data
        print("\n" + "=" * 60)
        print("🏆 CHECKING FOR SPECIFIC 2025 DATA...")
        print("-" * 40)
        
        # Look for championship standings
        standings_docs = vectorstore.similarity_search("Oscar Piastri McLaren 198 points 2025 championship", k=1)
        if standings_docs:
            print("✅ Found 2025 Championship Standings:")
            print(f"    {standings_docs[0].page_content[:300]}...")
        else:
            print("❌ No 2025 Championship Standings found")

        # Look for latest race
        race_docs = vectorstore.similarity_search("George Russell Mercedes won Canadian GP 2025", k=1)
        if race_docs:
            print("\n✅ Found Latest Race Results:")
            print(f"    {race_docs[0].page_content[:300]}...")
        else:
            print("\n❌ No 2025 Race Results found")

        print("\n" + "=" * 60)
        print("📊 SUMMARY")
        print("=" * 60)
        print("✅ Pinecone connection successful")
        print("✅ Index accessible and queryable")
        
        # Count documents with current data
        current_data_count = 0
        try:
            all_docs = vectorstore.similarity_search("F1 2025", k=10)
            current_data_count = len([doc for doc in all_docs if "2025" in doc.page_content])
        except:
            pass
            
        print(f"📈 Found ~{current_data_count} documents with 2025 F1 data")
        print()
        print("💡 TIP: You can also check your Pinecone web console at:")
        print("   https://app.pinecone.io/")
        print("   Go to your index → Browse data to see all stored vectors")

        return True

    except Exception as e:
        print(f"❌ Error connecting to Pinecone: {e}")
        print("\n🔧 Troubleshooting:")
        print("1. Check your .env file has correct PINECONE_API_KEY")
        print("2. Verify PINECONE_INDEX_NAME is correct")
        print("3. Ensure your Pinecone index exists")
        return False

if __name__ == "__main__":
    check_pinecone_data() 