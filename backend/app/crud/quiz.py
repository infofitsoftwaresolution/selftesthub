from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from app.models.quiz import Quiz as QuizModel
from app.models.question import Question as QuestionModel
from app.schemas.quiz import QuizCreate, QuizUpdate

def create_quiz(db: Session, quiz: QuizCreate, user_id: int) -> QuizModel:
    # Create quiz with questions as JSON (keeping existing behavior)
    db_quiz = QuizModel(
        title=quiz.title,
        duration=quiz.duration,
        type=quiz.type,
        is_active=quiz.is_active,
        is_draft=getattr(quiz, 'is_draft', False),
        max_attempts=getattr(quiz, 'max_attempts', 1),
        created_by=user_id,
        questions=[{
            'text': q.text,
            'options': q.options,
            'correctAnswer': q.correctAnswer
        } for q in quiz.questions]
    )
    
    db.add(db_quiz)
    db.commit()
    db.refresh(db_quiz)
    return db_quiz

def get_quizzes(db: Session, skip: int = 0, limit: int = 100) -> List[QuizModel]:
    return db.query(QuizModel)\
        .offset(skip)\
        .limit(limit)\
        .all()

def get_quiz(db: Session, quiz_id: int) -> Optional[QuizModel]:
    return db.query(QuizModel)\
        .filter(QuizModel.id == quiz_id)\
        .first()

def update_quiz(db: Session, quiz: QuizModel, quiz_update: QuizUpdate) -> QuizModel:
    # Update basic quiz fields
    for field, value in quiz_update.dict(exclude_unset=True).items():
        if field != 'questions':  # Handle questions separately
            setattr(quiz, field, value)
    
    db.commit()
    db.refresh(quiz)
    return quiz

def delete_quiz(db: Session, quiz: QuizModel) -> None:
    # The cascade will handle deleting related questions
    db.delete(quiz)
    db.commit() 