from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class QuestionBase(BaseModel):
    text: str
    options: List[str]
    correctAnswer: int  # Keep camelCase for API consistency

class QuestionCreate(QuestionBase):
    pass

class Question(QuestionBase):
    id: int
    quiz_id: int

    class Config:
        from_attributes = True

class QuizBase(BaseModel):
    title: str
    duration: int
    type: str
    is_active: bool = True

class QuizCreate(QuizBase):
    questions: List[QuestionCreate]
    is_draft: bool = False
    max_attempts: int = 1

class QuizUpdate(BaseModel):
    title: Optional[str] = None
    duration: Optional[int] = None
    type: Optional[str] = None
    is_active: Optional[bool] = None
    is_draft: Optional[bool] = None
    max_attempts: Optional[int] = None
    questions: Optional[List[dict]] = None

class Quiz(QuizBase):
    id: int
    created_by: int
    created_at: datetime
    is_draft: Optional[bool] = False
    max_attempts: Optional[int] = 1
    questions: List[dict]  # Keep as dict for JSON compatibility

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

# Add this new class for response
class QuizResponse(Quiz):
    """Response model for quiz operations"""
    pass 