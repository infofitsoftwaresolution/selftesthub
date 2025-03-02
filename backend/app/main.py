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

# Configure CORS - Move this before any routes
origins = [
    "http://localhost:3000",
    f"http://{os.getenv('EC2_PUBLIC_IP')}:3000",
    f"http://{os.getenv('EC2_PUBLIC_IP')}:8000",
    "http://13.233.157.162:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Content-Type", "Authorization", "Accept"],
    expose_headers=["*"]
)

# Ensure CORS is correctly configured
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost:3000"],  # Explicitly allow localhost:3000
#     allow_credentials=True,
#     allow_methods=["*"],  # Allow all HTTP methods
#     allow_headers=["*"],  # Allow all headers
# )

# Import and include routers
from app.api.v1.api import api_router
app.include_router(api_router, prefix="/api/v1")

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
    logger.info(f"Request: {request.method} {request.url}")
    response = await call_next(request)
    return response

@app.get("/")
async def root():
    return {"message": "MCQ Exam API is running"} 