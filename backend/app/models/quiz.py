from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, JSON, DateTime, text
from sqlalchemy.orm import relationship
from app.db.base_class import Base
from datetime import datetime
from typing import List, Dict, Any

class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    type = Column(String, nullable=False)  # 'mcq' or 'test'
    duration = Column(Integer, nullable=False)  # in minutes
    questions = Column(JSON, nullable=False)
    is_active = Column(Boolean, server_default='true')
    created_at = Column(DateTime, server_default=text('now()'))
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Relationships
    creator = relationship("User", back_populates="quizzes")
    attempts = relationship("QuizAttempt", back_populates="quiz")

    def __init__(self, **kwargs):
        # Convert questions to dict if they're passed as Pydantic models
        if 'questions' in kwargs and isinstance(kwargs['questions'], list):
            kwargs['questions'] = [
                q.dict() if hasattr(q, 'dict') else q 
                for q in kwargs['questions']
            ]
        super().__init__(**kwargs) 