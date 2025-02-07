from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional
from datetime import datetime

class QuestionBase(BaseModel):
    text: str = Field(..., description="Question text")
    options: List[str] = Field(..., description="List of options")
    correctAnswer: int = Field(..., description="Index of correct answer")

class QuizBase(BaseModel):
    title: str
    type: str  # 'mcq' or 'test'
    duration: int  # in minutes
    questions: List[QuestionBase]  # Changed back to QuestionBase for validation
    is_active: bool = True

    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={datetime: str}
    )

class QuizCreate(QuizBase):
    pass

class Quiz(QuizBase):
    id: int
    created_by: int
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={datetime: str}
    )

class QuizUpdate(BaseModel):
    title: Optional[str] = None
    type: Optional[str] = None
    duration: Optional[int] = None
    questions: Optional[List[QuestionBase]] = None
    is_active: Optional[bool] = None 