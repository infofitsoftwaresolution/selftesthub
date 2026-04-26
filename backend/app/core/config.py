from pydantic_settings import BaseSettings
from typing import List, Optional
import os
from pydantic import ConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Quiz App"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = ""  # Must be set in .env
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    # CORS Settings
    CORS_ORIGINS_RAW: str = "http://localhost:3000,https://localhost:3000,http://localhost:5173,http://selftesthub.com,https://selftesthub.com,http://www.selftesthub.com,https://www.selftesthub.com"

    # Database settings
    POSTGRES_SERVER: str = ""  # Set in .env
    POSTGRES_USER: str = ""  # Set in .env
    POSTGRES_PASSWORD: str = ""  # Set in .env
    POSTGRES_DB: str = ""  # Set in .env
    DATABASE_URL: Optional[str] = None
    DOMAIN_NAME: str = "selftesthub.com"

    # SSL certificate path for AWS RDS
    SSL_CERT_PATH: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "global-bundle.pem")

    # Email settings
    SMTP_USER: str = ""  # Set in .env
    SMTP_PASSWORD: str = ""  # Set in .env

    # Static files settings
    STATIC_FILES_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "static")

    # AWS S3 Settings
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "ap-south-1"  # Defaulting to Mumbai region like the RDS instance
    AWS_S3_BUCKET: str = ""
    
    # Basic API protection settings
    RATE_LIMIT_WINDOW_SECONDS: int = 60
    RATE_LIMIT_DEFAULT_PER_WINDOW: int = 180
    RATE_LIMIT_LOGIN_PER_WINDOW: int = 20
    RATE_LIMIT_VIDEO_SUBMIT_PER_WINDOW: int = 6
    RATE_LIMIT_QUIZ_START_PER_WINDOW: int = 40

    @property
    def CORS_ORIGINS(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS_RAW.split(",") if origin.strip()]

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.DATABASE_URL:
            self.DATABASE_URL = f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}/{self.POSTGRES_DB}"

    model_config = ConfigDict(
        case_sensitive=True,
        env_file=".env",
        extra="allow"  # This allows extra fields
    )

settings = Settings() 