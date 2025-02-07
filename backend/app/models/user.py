from datetime import datetime
from sqlalchemy import Boolean, Column, Integer, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base
from app.core.security import verify_password, get_password_hash

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=True)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Add relationship to quizzes
    quizzes = relationship("Quiz", back_populates="creator")

    # Add this to the existing relationships
    quiz_attempts = relationship("QuizAttempt", back_populates="user")

    def verify_password(self, password: str) -> bool:
        return verify_password(password, self.hashed_password)

    @staticmethod
    def get_password_hash(password: str) -> str:
        return get_password_hash(password) 