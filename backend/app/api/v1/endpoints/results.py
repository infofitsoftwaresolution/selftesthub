from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.api import deps
from app.models.user import User
from app.models.quiz_attempt import QuizAttempt
from app.schemas.quiz_attempt import QuizAttemptWithDetails

router = APIRouter()


def _latest_attempt_per_student(attempts: List[QuizAttempt]) -> List[QuizAttempt]:
    latest_by_user = {}
    for attempt in attempts:
        existing = latest_by_user.get(attempt.user_id)
        if not existing:
            latest_by_user[attempt.user_id] = attempt
            continue
        existing_ts = existing.completed_at or existing.started_at
        current_ts = attempt.completed_at or attempt.started_at
        if current_ts and existing_ts and current_ts > existing_ts:
            latest_by_user[attempt.user_id] = attempt
    return sorted(
        latest_by_user.values(),
        key=lambda a: a.completed_at or a.started_at,
        reverse=True
    )

@router.get("/user", response_model=List[QuizAttemptWithDetails])
async def get_user_results(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Get all quiz results for the current user"""
    attempts = (
        db.query(QuizAttempt)
        .filter(
            QuizAttempt.user_id == current_user.id,
            QuizAttempt.is_completed.is_(True)
        )
        .order_by(QuizAttempt.completed_at.desc())
        .all()
    )
    return attempts

@router.get("/quiz/{quiz_id}", response_model=List[QuizAttemptWithDetails])
async def get_quiz_results(
    quiz_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Get all results for a specific quiz"""
    attempts = (
        db.query(QuizAttempt)
        .filter(
            QuizAttempt.quiz_id == quiz_id,
            QuizAttempt.is_completed.is_(True)
        )
        .order_by(QuizAttempt.completed_at.desc())
        .all()
    )
    return _latest_attempt_per_student(attempts)