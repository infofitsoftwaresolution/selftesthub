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
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    max_attempts = Column(Integer, nullable=False, default=1)
    is_draft = Column(Boolean, default=False)
    
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

    def update_questions(self, new_questions):
        """Update questions with proper validation"""
        if not isinstance(new_questions, list):
            raise ValueError("Questions must be a list")
        
        # Ensure each question has the required fields
        for q in new_questions:
            if not isinstance(q, dict):
                raise ValueError("Each question must be a dictionary")
            if 'text' not in q or 'options' not in q or 'correctAnswer' not in q:
                raise ValueError("Each question must have text, options, and correctAnswer")
            if not isinstance(q['options'], list):
                raise ValueError("Options must be a list")
            if not isinstance(q['correctAnswer'], int):
                raise ValueError("correctAnswer must be an integer")
        
        self.questions = new_questions 