from pydantic import BaseModel
from typing import Dict, Optional, List
from datetime import datetime
from .quiz import Quiz

class QuizAttemptBase(BaseModel):
    quiz_id: int
    user_id: int
    started_at: datetime
    completed_at: Optional[datetime] = None
    is_completed: bool = False
    answers: Dict[str, int] = {}
    score: float = 0.0

class QuizAttemptCreate(QuizAttemptBase):
    pass

class QuizAttempt(QuizAttemptBase):
    id: int

    class Config:
        from_attributes = True

class QuizAttemptWithDetails(QuizAttempt):
    quiz: Optional[Quiz] = None

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    id: int
    full_name: str
    email: str

    class Config:
        from_attributes = True

class QuizBase(BaseModel):
    id: int
    title: str
    duration: int

    class Config:
        from_attributes = True 