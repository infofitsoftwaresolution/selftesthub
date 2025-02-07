from sqlalchemy import Column, Integer, ForeignKey, DateTime, JSON, Boolean
from sqlalchemy.orm import relationship
from app.db.base_class import Base
from datetime import datetime

class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    answers = Column(JSON, default={})
    score = Column(Integer, nullable=True)
    is_completed = Column(Boolean, default=False)

    # Relationships
    quiz = relationship("Quiz", back_populates="attempts")
    user = relationship("User", back_populates="quiz_attempts") 