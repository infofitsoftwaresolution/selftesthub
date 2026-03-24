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
    video_url: Optional[str] = None

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

class QuizAttemptWithDetails(BaseModel):
    id: int
    user: UserBase
    quiz: QuizBase
    started_at: datetime
    completed_at: Optional[datetime]
    score: Optional[float]
    answers: Optional[Dict[str, int]]
    video_url: Optional[str]

    class Config:
        orm_mode = True 