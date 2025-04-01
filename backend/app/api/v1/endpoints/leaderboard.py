from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from sqlalchemy import func, desc

from app.api import deps
from app.models.quiz_attempt import QuizAttempt
from app.models.quiz import Quiz
from app.models.user import User
from app.schemas.leaderboard import LeaderboardEntry

router = APIRouter()

def calculate_percentile(score: float, all_scores: List[float]) -> int:
    """Calculate the percentile rank of a score."""
    if not all_scores:
        return 0
    all_scores.sort()
    position = len([s for s in all_scores if s < score])
    return int((position / len(all_scores)) * 100)

@router.get("", response_model=List[LeaderboardEntry])
@router.get("/", response_model=List[LeaderboardEntry])
def get_leaderboard(
    quiz_id: Optional[str] = Query(None, description="Filter by quiz ID"),
    time_range: str = Query("week", description="Time range: week, month, all"),
    db: Session = Depends(deps.get_db)
):
    """
    Get leaderboard data with optional quiz and time range filters
    """
    try:
        # Base query
        query = db.query(
            QuizAttempt.user_id,
            User.full_name,
            Quiz.title.label('quiz_title'),
            QuizAttempt.score,
            QuizAttempt.completed_at
        ).join(
            User, QuizAttempt.user_id == User.id
        ).join(
            Quiz, QuizAttempt.quiz_id == Quiz.id
        )

        # Apply time range filter
        now = datetime.utcnow()
        if time_range == "week":
            query = query.filter(QuizAttempt.completed_at >= now - timedelta(days=7))
        elif time_range == "month":
            query = query.filter(QuizAttempt.completed_at >= now - timedelta(days=30))

        # Apply quiz filter if specified
        if quiz_id and quiz_id != 'all':
            query = query.filter(QuizAttempt.quiz_id == quiz_id)

        # Get all attempts for percentile calculation
        attempts = query.all()
        
        # Calculate percentiles and ranks
        leaderboard_data = []
        for attempt in attempts:
            # Get all scores for this quiz
            quiz_scores = [
                a.score for a in attempts 
                if a.quiz_title == attempt.quiz_title
            ]
            
            # Calculate percentile
            percentile = calculate_percentile(attempt.score, quiz_scores)
            
            # Calculate rank
            rank = len([s for s in quiz_scores if s > attempt.score]) + 1
            
            leaderboard_data.append(LeaderboardEntry(
                user_id=attempt.user_id,
                full_name=attempt.full_name,
                score=attempt.score,
                percentile=percentile,
                quiz_title=attempt.quiz_title,
                completed_at=attempt.completed_at,
                rank=rank
            ))

        # Sort by score in descending order
        leaderboard_data.sort(key=lambda x: x.score, reverse=True)
        
        return leaderboard_data

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching leaderboard data: {str(e)}"
        ) 