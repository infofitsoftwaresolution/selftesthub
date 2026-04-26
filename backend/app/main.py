from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from app.api.v1.api import api_router
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine
import os
import time
from collections import defaultdict, deque

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

request_buckets = defaultdict(deque)


def _resolve_rate_limit(path: str):
    if path.endswith("/auth/login"):
        return settings.RATE_LIMIT_LOGIN_PER_WINDOW
    if path.endswith("/submit-video"):
        return settings.RATE_LIMIT_VIDEO_SUBMIT_PER_WINDOW
    if path.endswith("/start"):
        return settings.RATE_LIMIT_QUIZ_START_PER_WINDOW
    return settings.RATE_LIMIT_DEFAULT_PER_WINDOW


@app.middleware("http")
async def protect_and_log_requests(request: Request, call_next):
    print(f"Incoming request: {request.method} {request.url.path}")
    if request.url.path.startswith("/api/"):
        now = time.time()
        window = settings.RATE_LIMIT_WINDOW_SECONDS
        limit = _resolve_rate_limit(request.url.path)
        client_ip = request.client.host if request.client else "unknown"
        bucket_key = f"{client_ip}:{request.method}:{request.url.path}"
        bucket = request_buckets[bucket_key]

        while bucket and now - bucket[0] > window:
            bucket.popleft()

        if len(bucket) >= limit:
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Too many requests. Please wait and try again.",
                    "retry_after_seconds": window
                }
            )

        bucket.append(now)

    response = await call_next(request)
    print(f"Response status: {response.status_code}")
    return response

@app.get("/")
async def root():
    return {"message": "API is running"} 