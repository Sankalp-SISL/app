from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from google.cloud import discoveryengine_v1alpha as discoveryengine
from google.oauth2 import credentials
# Import the flow object for the auth code exchange
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

PROJECT_ID = "sisl-internal-playground" # Using Project ID for consistency now
LOCATION = "global"
# --- THIS IS THE CORRECTED VARIABLE NAME ---
ENGINE_ID = "agentspace-hr-assisstant_1753777037202"
# ---------------------------------------------
SERVING_CONFIG_ID = "default_search"

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

        flow = Flow.from_client_config(
            client_config=client_config,
            scopes=["https://www.googleapis.com/auth/cloud-platform"],
            redirect_uri=GOOGLE_REDIRECT_URI
        )
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
        client = discoveryengine.SearchServiceClient(credentials=user_credentials)

        # Using the corrected ENGINE_ID variable name
        serving_config_path = (
            f"projects/{PROJECT_ID}/locations/{LOCATION}/"
            f"collections/default_collection/engines/{ENGINE_ID}/"
            f"servingConfigs/{SERVING_CONFIG_ID}"
        )
        
        request = discoveryengine.SearchRequest(
            serving_config=serving_config_path,
            query=chat_request.message,
            content_search_spec=discoveryengine.SearchRequest.ContentSearchSpec(
                summary_spec=discoveryengine.SearchRequest.ContentSearchSpec.SummarySpec(
                    summary_result_count=5
                )
            )
        )
        
        response = client.search(request=request)
        
        agent_reply = response.summary.summary_text or "Could not generate a summary."
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
