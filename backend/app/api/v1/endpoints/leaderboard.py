from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from sqlalchemy import func, desc
import logging

from app.api import deps
from app.models.quiz_attempt import QuizAttempt
from app.models.quiz import Quiz
from app.models.user import User
from app.schemas.leaderboard import LeaderboardEntry

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

def calculate_percentile(score: float, all_scores: List[float]) -> int:
    """Calculate the normalized percentile rank of a score."""
    if not all_scores:
        return 0
        
    below = sum(1 for s in all_scores if s < score)
    equals = sum(1 for s in all_scores if s == score)
    
    # Standard formula: (Count below + 0.5 * Count equal) / Total * 100
    percentile = ((below + (0.5 * equals)) / len(all_scores)) * 100
    return int(min(100, max(0, round(percentile))))

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
        logger.info(f"Fetching leaderboard data with quiz_id: {quiz_id}, time_range: {time_range}")
        
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
            logger.info(f"Filtering by quiz_id: {quiz_id}")
            query = query.filter(QuizAttempt.quiz_id == quiz_id)

        # Get all attempts for percentile calculation
        attempts = query.all()
        logger.info(f"Found {len(attempts)} attempts")
        
        # Calculate percentiles and ranks
        leaderboard_data = []
        for attempt in attempts:
            try:
                # Get all scores for this quiz
                quiz_scores = [
                    a.score for a in attempts 
                    if a.quiz_title == attempt.quiz_title
                ]
                
                # Calculate percentile
                percentile = calculate_percentile(attempt.score, quiz_scores)
                
                # Calculate rank
                rank = len([s for s in quiz_scores if s > attempt.score]) + 1
                
                # Convert user_id to string before creating LeaderboardEntry
                leaderboard_data.append(LeaderboardEntry(
                    user_id=str(attempt.user_id),  # Convert to string
                    full_name=attempt.full_name,
                    score=attempt.score,
                    percentile=percentile,
                    quiz_title=attempt.quiz_title,
                    completed_at=attempt.completed_at,
                    rank=rank
                ))
            except Exception as e:
                logger.error(f"Error processing attempt {attempt.user_id}: {str(e)}")
                continue

        # Sort by score in descending order
        leaderboard_data.sort(key=lambda x: x.score, reverse=True)
        logger.info(f"Returning {len(leaderboard_data)} leaderboard entries")
        
        return leaderboard_data

    except Exception as e:
        logger.error(f"Error in get_leaderboard: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching leaderboard data: {str(e)}"
        ) 