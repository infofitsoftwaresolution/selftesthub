from pydantic import BaseModel
from typing import Dict, Optional
from datetime import datetime

class QuizAttemptCreate(BaseModel):
    quiz_id: int

class QuizAttemptUpdate(BaseModel):
    answers: Dict[str, int]
    is_completed: bool = True

class QuizAttempt(BaseModel):
    id: int
    quiz_id: int
    user_id: int
    started_at: datetime
    completed_at: Optional[datetime] = None
    answers: Dict[str, int] = {}
    score: Optional[int] = None
    is_completed: bool = False

    class Config:
        from_attributes = True 