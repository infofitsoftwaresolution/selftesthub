from pydantic_settings import BaseSettings
from typing import List, Optional
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "Quiz App"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "bc678a9427f54284ff421052bea33678067e2476acfc87c144e33d6ba4fba5ee"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        f"http://{os.getenv('EC2_PUBLIC_IP', 'localhost')}:3000",
        f"http://{os.getenv('EC2_PUBLIC_IP', 'localhost')}:8000",
    ]
    
    # Database settings
    POSTGRES_SERVER: str = "infofitscore.c7yic444gxi0.ap-south-1.rds.amazonaws.com"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "infofitsoftware"
    POSTGRES_DB: str = "postgres"

    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}/{self.POSTGRES_DB}"

    class Config:
        case_sensitive = True

settings = Settings() 