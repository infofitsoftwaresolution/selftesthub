from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
import logging
import os

app = FastAPI(
    title="MCQ Exam API",
    description="Backend API for MCQ Exam System",
    version="1.0.0"
)

# Update CORS settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://selftesthub.com",
        "http://localhost:3000",
        "http://13.233.157.162:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and include routers
from app.api.v1.api import api_router
app.include_router(api_router, prefix="/v1")  # Change this to /v1 only

# Setup logging
log_file = os.path.join(os.path.dirname(__file__), 'logs', 'quiz.log')
os.makedirs(os.path.dirname(log_file), exist_ok=True)

logging.basicConfig(
    filename=log_file,
    level=logging.INFO,
    format='%(asctime)s - %(message)s'
)

logger = logging.getLogger('quiz_api')

@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"Received request: {request.method} {request.url.path}")
    print(f"Headers: {request.headers}")
    response = await call_next(request)
    print(f"Response status: {response.status_code}")
    return response

@app.get("/")
async def root():
    return {"message": "MCQ Exam API is running"} 