from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import User
from app.models.quiz_attempt import QuizAttempt
from app.schemas.quiz_attempt import (
    QuizAttemptCreate,
    QuizAttempt as QuizAttemptSchema,
    QuizAttemptUpdate
)
from datetime import datetime
import logging
from app.models.quiz import Quiz

router = APIRouter()

logger = logging.getLogger(__name__)

@router.post("/", response_model=QuizAttemptSchema)
def create_quiz_attempt(
    quiz_attempt: QuizAttemptCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Start a new quiz attempt"""
    try:
        # Get the quiz to check max attempts
        quiz = db.query(Quiz).filter(Quiz.id == quiz_attempt.quiz_id).first()
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found")

        # Check if user has any ongoing attempts
        ongoing_attempt = (
            db.query(QuizAttempt)
            .filter(
                QuizAttempt.user_id == current_user.id,
                QuizAttempt.quiz_id == quiz_attempt.quiz_id,
                QuizAttempt.is_completed.is_(False)
            )
            .first()
        )
        
        if ongoing_attempt:
            print("Found ongoing attempt:", ongoing_attempt.id)
            return ongoing_attempt

        # Check if user has reached max attempts
        completed_attempts = (
            db.query(QuizAttempt)
            .filter(
                QuizAttempt.user_id == current_user.id,
                QuizAttempt.quiz_id == quiz_attempt.quiz_id,
                QuizAttempt.is_completed.is_(True)
            )
            .count()
        )

        if completed_attempts >= quiz.max_attempts:
            raise HTTPException(
                status_code=400,
                detail=f"You have reached the maximum number of attempts ({quiz.max_attempts}) for this quiz"
            )

        # Create new attempt
        new_attempt = QuizAttempt(
            quiz_id=quiz_attempt.quiz_id,
            user_id=current_user.id,
            started_at=datetime.utcnow(),
            is_completed=False  # Explicitly set to False
        )
        db.add(new_attempt)
        db.commit()
        db.refresh(new_attempt)
        
        print("Created new attempt:", new_attempt.id)
        return new_attempt
        
    except Exception as e:
        print("Error creating quiz attempt:", str(e))
        raise

@router.post("/{attempt_id}/submit", response_model=QuizAttemptSchema)
def submit_quiz_attempt(
    attempt_id: int,
    answers: QuizAttemptUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Submit quiz answers and calculate score"""
    attempt = (
        db.query(QuizAttempt)
        .filter(
            QuizAttempt.id == attempt_id,
            QuizAttempt.user_id == current_user.id
        )
        .first()
    )
    
    if not attempt:
        raise HTTPException(status_code=404, detail="Quiz attempt not found")
    
    if attempt.is_completed:
        raise HTTPException(status_code=400, detail="Quiz already submitted")

    # Calculate score
    quiz = attempt.quiz
    correct_answers = 0
    total_questions = len(quiz.questions)
    
    for q_idx, answer in answers.answers.items():
        if int(q_idx) < total_questions:
            if answer == quiz.questions[int(q_idx)]["correctAnswer"]:
                correct_answers += 1

    score = (correct_answers / total_questions) * 100 if total_questions > 0 else 0

    # Update attempt
    attempt.answers = answers.answers
    attempt.score = score
    attempt.completed_at = datetime.utcnow()
    attempt.is_completed = True
    
    db.commit()
    db.refresh(attempt)
    return attempt 

@router.get("/my-attempts", response_model=List[QuizAttemptSchema])
def get_user_attempts(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Get all quiz attempts for current user"""
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