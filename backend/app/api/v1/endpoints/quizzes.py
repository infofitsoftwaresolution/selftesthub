from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
from app.api import deps
from app.crud import quiz as quiz_crud
from app.schemas.quiz import Quiz as QuizSchema
from app.schemas.quiz import QuizCreate, QuizUpdate
from app.models.quiz import Quiz as QuizModel
from app.models.user import User
import logging

router = APIRouter()

logger = logging.getLogger(__name__)

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
    return quiz_crud.create_quiz(db, quiz_in, current_user.id)

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

@router.patch("/{quiz_id}", response_model=QuizSchema)
def update_quiz(
    quiz_id: int,
    quiz_in: QuizUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> QuizSchema:
    """Update quiz"""
    quiz = quiz_crud.get_quiz(db, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    if quiz.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return quiz_crud.update_quiz(db, quiz, quiz_in)

@router.delete("/{quiz_id}")
def delete_quiz(
    quiz_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> dict:
    """Delete quiz"""
    quiz = quiz_crud.get_quiz(db, quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    if quiz.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    quiz_crud.delete_quiz(db, quiz)
    return {"message": "Quiz deleted successfully"} 