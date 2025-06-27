#!/usr/bin/env python3
"""
Update F1 Knowledge Base Script

This script fetches current F1 data and stores it in Pinecone,
replacing static fallbacks with dynamic, up-to-date information.

Usage:
    python update_knowledge_base.py
"""

import os
import sys
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add parent directory to path to import our modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from knowledge_base_pipeline import update_f1_knowledge_base

def main():
    """Main function to update F1 knowledge base"""
    print("=" * 60)
    print("F1 KNOWLEDGE BASE UPDATER")
    print("=" * 60)
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Check environment variables
    required_vars = ["PINECONE_API_KEY", "PINECONE_INDEX_NAME", "OPENAI_API_KEY"]
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        print("Missing required environment variables:")
        for var in missing_vars:
            print(f"   - {var}")
        print("\nPlease add these to your .env file")
        return False
    
    print("Environment variables loaded")
    print("Starting F1 data ingestion...")
    print()
    
    try:
        # Run the knowledge base update
        success = update_f1_knowledge_base()
        
        if success:
            print()
            print("=" * 60)
            print("F1 KNOWLEDGE BASE UPDATED SUCCESSFULLY!")
            print("=" * 60)
            print("Current data now stored in Pinecone:")
            print("   • 2025 Championship Standings")
            print("   • Latest Race Results (Canadian GP)")
            print("   • Current Tire Strategy Analysis")
            print()
            print("Paddock AI can now access up-to-date F1 information!")
            return True
        else:
            print()
            print("=" * 60)
            print("FAILED TO UPDATE KNOWLEDGE BASE")
            print("=" * 60)
            print("Check the error messages above for details.")
            return False
            
    except Exception as e:
        print(f"Unexpected error: {e}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 