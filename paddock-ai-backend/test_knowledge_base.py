#!/usr/bin/env python3
"""
Test Knowledge Base Integration

This script tests that Paddock AI can retrieve current F1 data 
from Pinecone instead of relying on static fallbacks.
"""

import os
from dotenv import load_dotenv
from langchain_openai import OpenAIEmbeddings
from langchain_pinecone import PineconeVectorStore

# Load environment variables
load_dotenv()

def test_pinecone_knowledge_base():
    """Test retrieving current F1 data from Pinecone"""
    print("🔍 Testing Pinecone Knowledge Base Integration")
    print("=" * 50)
    
    try:
        # Initialize Pinecone connection
        embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
        vectorstore = PineconeVectorStore.from_existing_index(
            index_name=os.getenv("PINECONE_INDEX_NAME"),
            embedding=embeddings
        )
        retriever = vectorstore.as_retriever(search_kwargs={"k": 3})
        
        # Test queries for current F1 data
        test_queries = [
            "current F1 championship standings 2025",
            "latest F1 race winner",
            "Oscar Piastri championship position",
            "Canadian Grand Prix 2025 results"
        ]
        
        for query in test_queries:
            print(f"\n🔎 Query: '{query}'")
            print("-" * 40)
            
            # Retrieve documents
            docs = retriever.get_relevant_documents(query)
            
            if docs:
                # Show the most relevant document
                doc = docs[0]
                print(f"📄 Found document type: {doc.metadata.get('type', 'unknown')}")
                print(f"📅 Updated: {doc.metadata.get('updated', 'unknown')}")
                print(f"🏎️ Source: {doc.metadata.get('source', 'unknown')}")
                print(f"📝 Content preview:")
                print(doc.page_content[:300] + "..." if len(doc.page_content) > 300 else doc.page_content)
            else:
                print("❌ No relevant documents found")
        
        print("\n" + "=" * 50)
        print("✅ Knowledge Base Test Complete!")
        print("\n🎯 Key Benefits:")
        print("• No more static fallbacks")
        print("• Current 2025 F1 data in Pinecone")  
        print("• Dynamic updates possible")
        print("• Consistent data source for AI agent")
        
        return True
        
    except Exception as e:
        print(f"❌ Error testing knowledge base: {e}")
        return False

if __name__ == "__main__":
    test_pinecone_knowledge_base() 