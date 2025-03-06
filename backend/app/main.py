from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(
    title="MCQ Exam API",
    description="Backend API for MCQ Exam System",
    version="1.0.0"
)

# Simplify CORS settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins temporarily for testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and include routers
from app.api.v1.api import api_router
app.include_router(api_router, prefix="/api/v1")  # Revert to original prefix

@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"Request path: {request.url.path}")
    response = await call_next(request)
    print(f"Response status: {response.status_code}")
    return response

@app.get("/")
async def root():
    return {"message": "MCQ Exam API is running"} 