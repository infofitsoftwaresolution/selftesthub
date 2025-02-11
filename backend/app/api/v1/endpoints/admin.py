from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import User
from app.models.quiz_attempt import QuizAttempt
from typing import List
from statistics import mean
from app.crud.quiz_attempt import get_all_quiz_attempts
from app.schemas.quiz_attempt import QuizAttemptWithDetails

router = APIRouter()

@router.get("/student-reports")
async def get_student_reports(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    # Get all students
    students = db.query(User).filter(User.is_superuser.is_(False)).all()
    
    reports = []
    for student in students:
        # Get all completed attempts for this student
        attempts = (
            db.query(QuizAttempt)
            .filter(
                QuizAttempt.user_id == student.id,
                QuizAttempt.is_completed.is_(True)
            )
            .all()
        )
        
        # Calculate average score
        scores = [attempt.score for attempt in attempts if attempt.score is not None]
        avg_score = mean(scores) if scores else 0
        
        reports.append({
            "user": {
                "id": student.id,
                "full_name": student.full_name,
                "email": student.email
            },
            "attempts": [{
                "id": attempt.id,
                "quiz": {
                    "id": attempt.quiz.id,
                    "title": attempt.quiz.title,
                    "duration": attempt.quiz.duration
                },
                "started_at": attempt.started_at,
                "completed_at": attempt.completed_at,
                "score": attempt.score
            } for attempt in attempts],
            "averageScore": avg_score
        })
    
    return reports

@router.get("/quiz-attempts", response_model=List[QuizAttemptWithDetails])
async def get_quiz_attempts(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """
    Get all quiz attempts with user and quiz details.
    Only accessible by admin users.
    """
    attempts = get_all_quiz_attempts(db)
    return attempts 