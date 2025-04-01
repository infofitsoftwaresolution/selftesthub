from pydantic import BaseModel
from datetime import datetime

class LeaderboardEntry(BaseModel):
    user_id: str
    full_name: str
    score: float
    percentile: int
    quiz_title: str
    completed_at: datetime
    rank: int 