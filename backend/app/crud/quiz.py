from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.quiz import Quiz
from app.schemas.quiz import QuizCreate, QuizUpdate

def create_quiz(db: Session, quiz: QuizCreate, user_id: int) -> Quiz:
    db_quiz = Quiz(
        title=quiz.title,
        type=quiz.type,
        duration=quiz.duration,
        questions=quiz.questions,
        created_by=user_id
    )
    db.add(db_quiz)
    db.commit()
    db.refresh(db_quiz)
    return db_quiz

def get_quizzes(db: Session, skip: int = 0, limit: int = 100) -> List[Quiz]:
    return db.query(Quiz).offset(skip).limit(limit).all()

def get_quiz(db: Session, quiz_id: int) -> Optional[Quiz]:
    return db.query(Quiz).filter(Quiz.id == quiz_id).first()

def update_quiz(db: Session, quiz: Quiz, quiz_update: QuizUpdate) -> Quiz:
    for field, value in quiz_update.dict(exclude_unset=True).items():
        setattr(quiz, field, value)
    db.commit()
    db.refresh(quiz)
    return quiz

def delete_quiz(db: Session, quiz: Quiz) -> None:
    db.delete(quiz)
    db.commit() 