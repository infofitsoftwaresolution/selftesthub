from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Dict
from datetime import datetime
from app.api import deps
from app.crud import quiz as quiz_crud
from app.schemas.quiz import (
    Quiz as QuizSchema,
    QuizCreate,
    QuizUpdate,
    QuizResponse
)
from pydantic import BaseModel
from app.models.quiz import Quiz as QuizModel
from app.models.user import User
from app.models.quiz_attempt import QuizAttempt
import logging

router = APIRouter()

logger = logging.getLogger(__name__)

# Add this class for request validation
class QuizSubmission(BaseModel):
    answers: Dict[str, int]

@router.get("/test-auth")
def test_auth(current_user: User = Depends(deps.get_current_user)):
    return {"msg": "Auth works", "user_id": current_user.id}

@router.get("/test-db")
def test_db(db: Session = Depends(deps.get_db)):
    return {"msg": "DB works"}

@router.get("/active")
async def get_active_quizzes(
    request: Request,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    skip: int = 0,
    limit: int = 100,
):
    """Get all active quizzes."""
    # print("Starting get_active_quizzes function")
    # print("Headers:", request.headers)
    # print("Token:", request.headers.get("authorization"))
    # print("Current user:", current_user.id if current_user else "No user")
    
    try:
        quizzes = (
            db.query(QuizModel)
            .filter(QuizModel.is_active.is_(True))
            .offset(skip)
            .limit(limit)
            .all()
        )
        
        #print("Raw quizzes from DB:", [{"id": q.id, "questions": q.questions} for q in quizzes])
        
        quiz_list = []
        for quiz in quizzes:
            try:
                quiz_data = {
                    "id": quiz.id,
                    "title": quiz.title,
                    "type": quiz.type,
                    "duration": quiz.duration,
                    "is_active": quiz.is_active,
                    "created_at": quiz.created_at,
                    "created_by": quiz.created_by,
                    "questions": [
                        {
                            "text": str(q.get("text", "")),
                            "options": list(q.get("options", [])),
                            "correctAnswer": int(q.get("correctAnswer", 0))
                        }
                        for q in (quiz.questions or [])
                    ]
                }
                #print("Processed quiz data:", quiz_data)
                quiz_list.append(quiz_data)
            except Exception as e:
                print(f"Error processing quiz {quiz.id}:", str(e))
                continue
        
        return quiz_list
    except Exception as e:
        print("Error in get_active_quizzes:", str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=QuizSchema)
def create_quiz(
    quiz_in: QuizCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> QuizSchema:
    """Create new quiz"""
    try:
        return quiz_crud.create_quiz(db=db, quiz=quiz_in, user_id=current_user.id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/", response_model=List[QuizSchema])
def read_quizzes(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(deps.get_db),
    _: User = Depends(deps.get_current_user)
) -> List[QuizSchema]:
    """Retrieve quizzes"""
    return quiz_crud.get_quizzes(db, skip=skip, limit=limit)

@router.get("/{quiz_id}", response_model=QuizSchema)
def read_quiz(
    quiz_id: int,
    db: Session = Depends(deps.get_db),
    _: User = Depends(deps.get_current_user)
) -> QuizSchema:
    """Get quiz by ID"""
    try:
        quiz = quiz_crud.get_quiz(db, quiz_id)
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found")
        
        # Force print to debug
        print(f"\n\nQUIZ DURATION: {quiz.duration} minutes\n\n")
        
        if not isinstance(quiz.duration, (int, float)) or quiz.duration <= 0:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid quiz duration: {quiz.duration}"
            )
        
        return quiz
    except Exception as e:
        print(f"Error in read_quiz: {str(e)}")
        logger.error(f"Error fetching quiz: {str(e)}")
        raise

@router.patch("/{quiz_id}", response_model=QuizResponse)
async def update_quiz(
    quiz_id: int,
    quiz_update: QuizUpdate,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db)
):
    """
    Update a quiz.
    Only the quiz creator or an admin can update the quiz.
    """
    # Get the quiz
    quiz = db.query(QuizModel).filter(QuizModel.id == quiz_id).first()
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found"
        )
    
    # Check if user has permission to update
    if quiz.created_by != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to update this quiz"
        )
    
    try:
        # Update quiz fields
        for field, value in quiz_update.dict(exclude_unset=True).items():
            if hasattr(quiz, field):
                setattr(quiz, field, value)
        
        db.commit()
        db.refresh(quiz)
        
        return quiz
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating quiz: {str(e)}"
        )

@router.delete("/{quiz_id}", response_model=dict)
async def delete_quiz(
    quiz_id: int,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db)
):
    """
    Delete a quiz.
    Only the quiz creator or an admin can delete the quiz.
    """
    # Get the quiz
    quiz = db.query(QuizModel).filter(QuizModel.id == quiz_id).first()
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found"
        )
    
    # Check if user has permission to delete
    if quiz.created_by != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to delete this quiz"
        )
    
    try:
        # First delete all quiz attempts associated with this quiz
        db.query(QuizAttempt).filter(QuizAttempt.quiz_id == quiz_id).delete()
        
        # Then delete the quiz
        db.delete(quiz)
        db.commit()
        
        return {
            "message": "Quiz deleted successfully",
            "quiz_id": quiz_id
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting quiz: {str(e)}"
        )

@router.post("/{quiz_id}/start")
async def start_quiz(
    quiz_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Start a new quiz attempt"""
    # Check if quiz exists
    quiz = db.query(QuizModel).filter(QuizModel.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    # Check if quiz is active
    if not quiz.is_active:
        raise HTTPException(status_code=400, detail="Quiz is not active")

    # Check if user has any ongoing attempts
    ongoing_attempt = (
        db.query(QuizAttempt)
        .filter(
            QuizAttempt.quiz_id == quiz_id,
            QuizAttempt.user_id == current_user.id,
            QuizAttempt.is_completed.is_(False)
        )
        .first()
    )

    if ongoing_attempt:
        return {
            "attemptId": ongoing_attempt.id,
            "message": "Resuming existing attempt",
            "startedAt": ongoing_attempt.started_at
        }

    # Create new attempt
    new_attempt = QuizAttempt(
        quiz_id=quiz_id,
        user_id=current_user.id,
        started_at=datetime.utcnow(),
        is_completed=False,
        answers={},
        score=0
    )

    db.add(new_attempt)
    db.commit()
    db.refresh(new_attempt)

    return {
        "attemptId": new_attempt.id,
        "message": "New attempt created",
        "startedAt": new_attempt.started_at
    }

@router.post("/{quiz_id}/submit")
async def submit_quiz(
    quiz_id: int,
    submission: QuizSubmission,
    attempt_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Submit a quiz attempt"""
    try:
        # Get the quiz attempt
        attempt = (
            db.query(QuizAttempt)
            .filter(
                QuizAttempt.id == attempt_id,
                QuizAttempt.quiz_id == quiz_id,
                QuizAttempt.user_id == current_user.id,
                QuizAttempt.is_completed.is_(False)
            )
            .first()
        )

        if not attempt:
            raise HTTPException(
                status_code=404,
                detail="Quiz attempt not found or already completed"
            )

        # Get the quiz
        quiz = db.query(QuizModel).filter(QuizModel.id == quiz_id).first()
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found")

        # Calculate score
        total_questions = len(quiz.questions)
        correct_answers = 0

        for q_idx, answer in submission.answers.items():
            question_idx = int(q_idx)
            if question_idx < total_questions:
                if answer == quiz.questions[question_idx]["correctAnswer"]:
                    correct_answers += 1

        score = (correct_answers / total_questions * 100) if total_questions > 0 else 0

        # Update attempt
        attempt.answers = submission.answers
        attempt.score = score
        attempt.completed_at = datetime.utcnow()
        attempt.is_completed = True

        db.commit()
        db.refresh(attempt)

        return {
            "message": "Quiz submitted successfully",
            "score": score,
            "total_questions": total_questions,
            "correct_answers": correct_answers,
            "completed_at": attempt.completed_at,
            "answers": attempt.answers
        }
    except Exception as e:
        db.rollback()
        print(f"Error submitting quiz: {str(e)}")  # Add debug logging
        raise HTTPException(
            status_code=500,
            detail=f"Error submitting quiz: {str(e)}"
        ) 