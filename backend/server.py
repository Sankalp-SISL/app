from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from google.cloud import discoveryengine_v1alpha as discoveryengine
from google.oauth2 import credentials
# This is the correct library for the server-side OAuth flow
from google_auth_oauthlib.flow import Flow
import os
import logging
from pydantic import BaseModel
from typing import Optional

# --- Basic Setup ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --- Agentspace & OAuth Configuration ---
# CRITICAL: These must exactly match your OAuth Client ID configuration
GOOGLE_CLIENT_ID = "1001147206231-afs8ordgj9i3b7n9a65ka5ncamapcnf3.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET = "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" # PASTE YOUR CLIENT SECRET HERE
GOOGLE_REDIRECT_URI = "http://localhost:3000"

PROJECT_ID = "sisl-internal-playground"
LOCATION = "global"
DATA_STORE_ID = "agentspace-hr-assisstant_1753777037202"

# --- FastAPI App & Security ---
app = FastAPI()
api_router = APIRouter(prefix="/api")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# --- Pydantic Models ---
class AuthCodeRequest(BaseModel):
    code: str

class TokenResponse(BaseModel):
    access_token: str

class ChatMessage(BaseModel):
    message: str
    access_token: str

class ChatResponse(BaseModel):
    reply: str

# --- API Endpoints ---
@api_router.post("/auth/google", response_model=TokenResponse)
async def google_auth(auth_request: AuthCodeRequest):
    try:
        client_config = {
            "web": {
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [GOOGLE_REDIRECT_URI],
            }
        }

        # --- THE FINAL, CRITICAL FIX IS HERE ---
        # The scopes list now exactly matches the scopes provided by the frontend library.
        flow = Flow.from_client_config(
            client_config=client_config,
            scopes=[
                "https://www.googleapis.com/auth/cloud-platform",
                "https://www.googleapis.com/auth/userinfo.email",
                "https://www.googleapis.com/auth/userinfo.profile",
                "openid"
            ],
            redirect_uri=GOOGLE_REDIRECT_URI
        )
        # ----------------------------------------

        flow.fetch_token(code=auth_request.code)
        
        creds = flow.credentials
        return TokenResponse(access_token=creds.token)
        
    except Exception as e:
        logger.error(f"Authentication exchange error: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"Invalid authorization code or auth config error: {e}")

@api_router.post("/chat", response_model=ChatResponse)
async def chat_with_agentspace(chat_request: ChatMessage):
    try:
        user_credentials = credentials.Credentials(token=chat_request.access_token)
        client = discoveryengine.ConversationalSearchServiceClient(credentials=user_credentials)

        session_path = client.session_path(
            project=PROJECT_ID, location=LOCATION,
            data_store=DATA_STORE_ID, session="-"
        )
        
        request = discoveryengine.ConverseConversationRequest(
            name=session_path,
            query=discoveryengine.TextInput(input=chat_request.message),
        )
        
        response = client.converse_conversation(request=request)
        
        agent_reply = response.reply.text or "Could not generate a response."
        return ChatResponse(reply=agent_reply)
        
    except Exception as e:
        logger.error(f"Agentspace API error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"An error occurred in the backend: {e}")

# --- Include Router and Middleware ---
app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
