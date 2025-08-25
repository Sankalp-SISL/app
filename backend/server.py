from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from google.cloud.discoveryengine_v1beta import ConversationalSearchServiceClient
from google.cloud import discoveryengine_v1beta as discoveryengine
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Agentspace Configuration
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = str(ROOT_DIR / "sisl-internal-playground-eb68e48f1725.json")
PROJECT_ID = "sisl-internal-playground"
PROJECT_NUMBER = "1001147206231"  # Project number from error logs
LOCATION = "global"
ENGINE_ID = "agentspace-hr-assisstant_1753777037202"

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

class ChatMessage(BaseModel):
    message: str
    sessionId: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str
    sessionId: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/chat", response_model=ChatResponse)
async def chat_with_agentspace(chat_request: ChatMessage):
    try:
        user_message = chat_request.message
        session_id = chat_request.sessionId
        
        # Create client to connect to Discovery Engine
        agentspace_client = ConversationalSearchServiceClient()
        
        # Define the conversation name
        if session_id:
            # Use existing conversation
            conversation_name = session_id
        else:
            # Auto session mode - creates new conversation
            conversation_name = f"projects/{PROJECT_NUMBER}/locations/{LOCATION}/collections/default_collection/dataStores/{ENGINE_ID}/conversations/-"
        
        # Create a request
        request_body = discoveryengine.ConverseConversationRequest(
            name=conversation_name,
            query=discoveryengine.TextInput(input=user_message),
        )

        # Send request and get response
        response = agentspace_client.converse_conversation(request=request_body)

        # Extract response information
        agent_reply = response.reply.summary.summary_text if response.reply.summary else "No response available"
        new_session_id = response.conversation.name

        return ChatResponse(reply=agent_reply, sessionId=new_session_id)
        
    except Exception as e:
        logger.error(f"Agentspace API error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get response from Agentspace")

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()