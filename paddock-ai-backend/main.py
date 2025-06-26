from fastapi import FastAPI
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
    from f1_api_client import get_latest_race_winner, get_driver_ranking, get_tire_strategy_analysis
    from what_if_explorer import what_if_explorer
    from historical_strategy_detective import historical_detective
except ImportError:
    from .f1_api_client import get_latest_race_winner, get_driver_ranking, get_tire_strategy_analysis
    from .what_if_explorer import what_if_explorer
    from .historical_strategy_detective import historical_detective

# Load environment variables
load_dotenv()

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
    "Search for information about Formula 1 concepts, rules, and history. Use this for questions about what something is, how it works, or historical facts."
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

tools = [
    retriever_tool, 
    get_latest_race_results_tool,
    get_driver_ranking_tool,
    analyze_tire_strategy_tool,
    what_if_analysis_tool,
    find_historical_scenarios_tool
]

# 3. Create the Agent
# Note: We are not using chat history for this agent yet, for simplicity.
# We can add it back in the next step.
prompt = ChatPromptTemplate.from_messages([
    ("system", """You are the Paddock AI, an expert F1 strategist and analyst. You have access to powerful tools for:
    
    1. F1 Knowledge Base - Historical facts, rules, and explanations
    2. Live Race Results - Current season race winners and results  
    3. Strategy Analysis - Tire strategies and performance analysis from recent races
    4. Strategic Debates - Generate debate points on F1 strategic topics
    5. Scenario Analysis - Realistic strategic scenarios for discussion
    
    When users ask questions:
    - Use the knowledge base for factual information about F1 concepts, rules, and history
    - Use race results tool for current/recent race winners
    - Use strategy tools for tactical analysis and strategic discussions
    - Use debate scenarios for complex strategic decision-making discussions
    
    Be conversational, insightful, and encourage strategic thinking. When presenting strategic analysis,
    explain the reasoning behind decisions and invite discussion of different viewpoints."""),
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

# To run this API locally:
# 1. Make sure you are in the 'paddock-ai-backend' directory.
# 2. Run the command: venv/bin/uvicorn main:app --reload 