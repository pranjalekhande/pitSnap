from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List
import os
from dotenv import load_dotenv

from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.tools.retriever import create_retriever_tool
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_pinecone import PineconeVectorStore
from langchain.tools import tool

# Import our F1 tools
try:
    from f1_api_client import get_latest_race_winner, get_driver_ranking, get_tire_strategy_analysis, get_championship_standings, get_next_race_info
    from what_if_explorer import what_if_explorer
    from historical_strategy_detective import historical_detective
    from f1_service import F1DataService
except ImportError:
    from .f1_api_client import get_latest_race_winner, get_driver_ranking, get_tire_strategy_analysis, get_championship_standings, get_next_race_info
    from .what_if_explorer import what_if_explorer
    from .historical_strategy_detective import historical_detective
    from .f1_service import F1DataService

# Load environment variables
load_dotenv()

# Initialize F1 Data Service
f1_service = F1DataService()

# --- LangChain Agent Setup ---

# 1. Initialize models and vector store
llm = ChatOpenAI(model="gpt-4", temperature=0)
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
vectorstore = PineconeVectorStore.from_existing_index(
    index_name=os.getenv("PINECONE_INDEX_NAME"),
    embedding=embeddings
)
retriever = vectorstore.as_retriever()

# 2. Create the tools for the agent
# Tool 1: The knowledge base retriever
retriever_tool = create_retriever_tool(
    retriever,
    "f1_knowledge_base",
    "PRIMARY TOOL - Search the loaded F1 knowledge base first for ANY F1 question. Contains latest championship standings, recent race results, driver information, tire strategies, and F1 rules. Always try this tool FIRST before using any other tools."
)

# Tool 2: The live F1 API client
@tool
def get_latest_race_results_tool():
    """
    Fetches the winner of the most recent F1 race. Use this tool for any questions
    about who won the latest or most recent Grand Prix.
    """
    return get_latest_race_winner()

# Tool 3: Driver Rankings Tool
@tool
def get_driver_ranking_tool(driver_name: str):
    """
    Gets current championship ranking for a specific F1 driver. Use when users ask
    about driver standings, points, or championship positions.
    """
    return get_driver_ranking(driver_name)

# Tool 4: Tire Strategy Analysis Tool
@tool
def analyze_tire_strategy_tool():
    """
    Analyzes tire strategies from the most recent F1 race. Use this tool when users
    ask about tire strategies, pit stop strategies, or want to understand strategic
    decisions from recent races.
    """
    return get_tire_strategy_analysis()

# Tool 5: What-If Explorer Tool
@tool
def what_if_analysis_tool(scenario: str):
    """
    Analyzes what-if strategic scenarios. Use when users ask questions like 
    "What if Hamilton had pitted earlier?" or want to explore alternative strategies.
    """
    return what_if_explorer.analyze_what_if_scenario(scenario)

# Tool 6: Historical Strategy Detective Tool
@tool
def find_historical_scenarios_tool(situation: str):
    """
    Finds similar strategic situations from F1 history. Use when users want to know
    about past strategic decisions, learn from history, or compare current situations
    to historical examples.
    """
    return historical_detective.find_similar_scenarios(situation)

# Tool 7: Championship Standings Tool
@tool
def get_championship_standings_tool():
    """
    Gets current F1 championship standings (top 6 drivers). Use when users ask
    about current standings, championship positions, or points tables.
    """
    return get_championship_standings()

# Tool 8: Next Race Information Tool  
@tool
def get_next_race_info_tool():
    """
    Gets information about the next upcoming F1 race. Use when users ask
    about upcoming races, next GP, or race schedule information.
    """
    return get_next_race_info()

# Tool 9: Current F1 Web Search Tool
@tool 
def search_current_f1_data_tool(query: str):
    """
    Searches the web for the most current F1 information when API data might be outdated.
    Use this when users ask about very recent races, current season results, or latest championship standings.
    Best for queries like: "latest F1 race results", "current championship standings 2025", "recent F1 news"
    """
    import requests
    import json
    
    # This is a placeholder - in a real implementation, you'd want to use a proper web search API
    # For now, we'll return guidance for when web search should be used
    return f"For the most current F1 data about '{query}', I should search the web. Current API data may be from 2024 season. Please check official F1 sources for latest 2025 championship standings and race results."

tools = [
    retriever_tool, 
    get_latest_race_results_tool,
    get_driver_ranking_tool,
    analyze_tire_strategy_tool,
    what_if_analysis_tool,
    find_historical_scenarios_tool,
    get_championship_standings_tool,
    get_next_race_info_tool,
    search_current_f1_data_tool
]

# 3. Create the Agent
# Note: We are not using chat history for this agent yet, for simplicity.
# We can add it back in the next step.
prompt = ChatPromptTemplate.from_messages([
    ("system", """You are the Paddock AI, an expert F1 strategist and analyst. You have access to multiple information sources with a specific priority order:

    **TOOL PRIORITY ORDER (USE IN THIS EXACT SEQUENCE):**
    1. **F1 Knowledge Base (Pinecone RAG)** - ALWAYS TRY FIRST - Contains latest F1 data, current standings, recent race results
    2. **F1 API Tools** - Use if knowledge base doesn't have the answer - Live race data, driver rankings, tire strategies  
    3. **Web Search** - Use only if APIs fail - Most current web data
    4. **No Answer** - If all sources fail, admit you don't know

    **AVAILABLE TOOLS:**
    • f1_knowledge_base - Latest loaded F1 data (championship standings, race results, strategies)
    • get_latest_race_results_tool - Recent race winners
    • get_driver_ranking_tool - Driver championship positions  
    • analyze_tire_strategy_tool - Pit stop and tire strategies
    • get_championship_standings_tool - Current season standings
    • get_next_race_info_tool - Upcoming race information
    • what_if_analysis_tool - Strategic scenario analysis
    • find_historical_scenarios_tool - Historical strategy examples
    • search_current_f1_data_tool - Web search for latest data

    **RESPONSE REQUIREMENTS:**
    - Keep responses COMPLETE and CONCISE (2-4 key points maximum)
    - Use bullet points for clarity  
    - Maximum 100 words - NEVER cut off mid-sentence
    - ALWAYS finish your complete thought before stopping
    - Always mention which source provided the information
    - **F1 TERMINOLOGY**: Distinguish between "race winner" (won latest GP) and "championship leader" (most points)

    **WORKFLOW:**
    1. Try f1_knowledge_base FIRST for any F1 question
    2. If knowledge base lacks info, use relevant F1 API tools
    3. If APIs fail, use web search as last resort
    4. If everything fails, clearly state "I don't have current information on this topic"

    Be conversational, insightful, and encourage strategic thinking."""),
    ("user", "{input}"),
    MessagesPlaceholder(variable_name="agent_scratchpad"),
])

agent = create_openai_tools_agent(llm, tools, prompt)
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=False)


# --- FastAPI App ---
app = FastAPI(
    title="Paddock AI API",
    description="API for an F1 assistant that can use tools to answer questions.",
    version="0.3.0"
)

# Add CORS middleware to allow Expo app to access the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

# Data Models (simplified for now)
class QuestionRequest(BaseModel):
    question: str

class AnswerResponse(BaseModel):
    answer: str

# API Endpoints
@app.get("/")
def read_root():
    return {"status": "Paddock AI API is running"}

@app.post("/ask", response_model=AnswerResponse)
def ask_question(request: QuestionRequest):
    """
    Endpoint to ask a question. The AI will decide which tool to use
    to find the best answer.
    """
    print(f"Received question: {request.question}")
    
    result = agent_executor.invoke({"input": request.question})
    
    print(f"Generated answer: {result['output']}")
    return {"answer": result['output']}

@app.post("/update-knowledge-base")
def update_knowledge_base():
    """
    Endpoint to update the F1 knowledge base with current data.
    This fetches fresh F1 data and stores it in Pinecone.
    """
    try:
        from knowledge_base_pipeline import update_f1_knowledge_base
        
        print("Starting knowledge base update...")
        success = update_f1_knowledge_base()
        
        if success:
            return {
                "status": "success",
                "message": "F1 knowledge base updated successfully with current data",
                "updated_data": [
                    "2025 Championship Standings",
                    "Latest Race Results",
                    "Current Tire Strategy Analysis"
                ]
            }
        else:
            return {
                "status": "error", 
                "message": "Failed to update knowledge base",
                "details": "Check server logs for error details"
            }
            
    except Exception as e:
        print(f"Error updating knowledge base: {e}")
        return {
            "status": "error",
            "message": f"Exception occurred: {str(e)}"
        }

# F1 Data Endpoints for Pit Wall
@app.get("/f1/schedule")
def get_f1_schedule():
    """
    Get the 2025 F1 race schedule
    """
    try:
        return f1_service.get_2025_schedule()
    except Exception as e:
        return {"error": f"Failed to fetch F1 schedule: {str(e)}"}

@app.get("/f1/schedule-with-timing")
def get_schedule_with_timing():
    """
    Get enhanced F1 schedule with precise timing, live session detection, and cache TTL recommendations
    """
    try:
        return {
            "schedule": f1_service.get_schedule_with_timing(),
            "timestamp": f1_service._get_current_utc_time().isoformat()
        }
    except Exception as e:
        return {"error": f"Failed to fetch schedule with timing: {str(e)}"}

@app.get("/f1/current-race-info")
def get_current_race_info():
    """
    Get current race information with live session detection
    """
    try:
        return f1_service.get_current_race_info()
    except Exception as e:
        return {"error": f"Failed to fetch current race info: {str(e)}"}

@app.get("/f1/next-race-info")
def get_next_race_info():
    """
    Get next race information with precise countdown and session timing
    """
    try:
        return f1_service.get_next_race_info()
    except Exception as e:
        return {"error": f"Failed to fetch next race info: {str(e)}"}

@app.get("/f1/next-race")
def get_next_race():
    """
    Get information about the next upcoming F1 race
    """
    try:
        return f1_service.get_next_race()
    except Exception as e:
        return {"error": f"Failed to fetch next race: {str(e)}"}

@app.get("/f1/latest-results")
def get_latest_results():
    """
    Get results from the most recent completed F1 race
    """
    try:
        return f1_service.get_latest_race_results()
    except Exception as e:
        return {"error": f"Failed to fetch latest results: {str(e)}"}

@app.get("/f1/standings")
def get_standings():
    """
    Get current F1 driver standings
    """
    try:
        return f1_service.get_current_standings()
    except Exception as e:
        return {"error": f"Failed to fetch standings: {str(e)}"}

@app.get("/f1/championship-leader")
def get_championship_leader():
    """
    Get current F1 championship leader (different from race winner)
    """
    try:
        fallback = f1_service._get_fallback_data()
        leader_data = fallback["data"]["championship_leader"]
        standings_data = fallback["data"]["championship_standings"]
        
        return {
            "championship_leader": leader_data["driver"],
            "team": leader_data["team"], 
            "points": leader_data["points"],
            "lead_margin": leader_data["lead_over_second"],
            "latest_race_winner": fallback["data"]["latest_race"]["race_winner"],
            "note": "Championship leader (most points) is different from latest race winner"
        }
    except Exception as e:
        return {"error": f"Failed to fetch championship leader: {str(e)}"}

@app.get("/f1/pit-wall-data")
def get_pit_wall_data():
    """
    Get combined data for the Pit Wall screen with enhanced timing
    """
    try:
        # Get all the data needed for Pit Wall in one request
        schedule = f1_service.get_schedule_with_timing()
        next_race = f1_service.get_next_race_info()
        current_race = f1_service.get_current_race_info()
        latest_results = f1_service.get_latest_race_results()
        
        return {
            "schedule": schedule,
            "next_race": next_race,
            "current_race": current_race,
            "latest_results": latest_results,
            "timestamp": f1_service._get_current_utc_time().isoformat()
        }
    except Exception as e:
        return {"error": f"Failed to fetch pit wall data: {str(e)}"}

@app.get("/f1/basic-data")
def get_basic_f1_data():
    """
    Get basic F1 data for instant UI responses (optimized for performance)
    """
    try:
        return f1_service.get_basic_f1_data()
    except Exception as e:
        return {"error": f"Failed to fetch basic F1 data: {str(e)}"}

@app.post("/ask-standings", response_model=AnswerResponse)
def ask_standings_quick(request: QuestionRequest):
    """
    Fast endpoint for F1 standings and rankings using direct OpenAI web search.
    Bypasses RAG pipeline for speed on current data queries.
    """
    print(f"Received standings query: {request.question}")
    
    try:
        # Direct OpenAI call with web search for current standings
        response = fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {os.getenv("OPENAI_API_KEY")}',
            },
            json: {
                'model': 'gpt-4',
                'messages': [
                    {
                        'role': 'system',
                        'content': '''You are an F1 expert providing current championship standings and driver rankings. 

IMPORTANT: Search the web for the most current 2025 F1 data. Focus on:
- Current championship standings (driver positions and points)
- Latest race winners and results
- Driver rankings and team positions

Provide concise, accurate information in this format:
• **Championship Leader**: [Driver] ([Team]) - [Points] points
• **Top 3**: List the top 3 drivers with teams and points
• **Latest Winner**: [Driver] won [Race Name]

Keep response under 100 words and always mention this is current 2025 data.'''
                    },
                    {
                        'role': 'user',
                        'content': f'Current F1 standings and rankings: {request.question}'
                    }
                ],
                'max_tokens': 200,
                'temperature': 0.1,  # Low temperature for factual accuracy
            }
        })
        
        if response.status_code == 200:
            data = response.json()
            answer = data['choices'][0]['message']['content']
            print(f"Generated quick standings answer: {answer}")
            return {"answer": answer}
        else:
            print(f"OpenAI API error: {response.status_code}")
            # Fallback to existing RAG system
            result = agent_executor.invoke({"input": request.question})
            return {"answer": result['output']}
            
    except Exception as e:
        print(f"Error in quick standings endpoint: {e}")
        # Fallback to existing RAG system
        result = agent_executor.invoke({"input": request.question})
        return {"answer": result['output']}

# To run this API locally:
# 1. Make sure you are in the 'paddock-ai-backend' directory.
# 2. Run the command: venv/bin/uvicorn main:app --reload 