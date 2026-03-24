from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.v1.api import api_router
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine
import os

app = FastAPI(
    title="Quiz API",
    openapi_url="/api/v1/openapi.json",
    docs_url="/api/v1/docs",
    redoc_url="/api/v1/redoc",
)

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin) for origin in settings.CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create static directories if they don't exist
static_dir = os.path.join(settings.STATIC_FILES_DIR, "profile_images")
videos_dir = os.path.join(settings.STATIC_FILES_DIR, "videos")
os.makedirs(static_dir, exist_ok=True)
os.makedirs(videos_dir, exist_ok=True)

# Mount static files directory
app.mount("/static", StaticFiles(directory=settings.STATIC_FILES_DIR), name="static")

# Include API router with prefix
app.include_router(api_router, prefix="/api/v1")

@app.on_event("startup")
def on_startup():
    if settings.DATABASE_URL and settings.DATABASE_URL.startswith("sqlite"):
        print("Initializing SQLite database tables...")
        Base.metadata.create_all(bind=engine)

@app.middleware("http")
async def log_requests(request, call_next):
    print(f"Incoming request: {request.method} {request.url.path}")
    response = await call_next(request)
    print(f"Response status: {response.status_code}")
    return response

@app.get("/")
async def root():
    return {"message": "API is running"} 