from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.quiz_attempt import QuizAttempt
from app.models.quiz import Quiz
from app.schemas.quiz_attempt import QuizAttemptCreate, QuizAttemptSubmit
from datetime import datetime

def create_quiz_attempt(db: Session, *, user_id: int, quiz_id: int) -> QuizAttempt:
    db_attempt = QuizAttempt(
        user_id=user_id,
        quiz_id=quiz_id
    )
    db.add(db_attempt)
    db.commit()
    db.refresh(db_attempt)
    return db_attempt

def get_quiz_attempt(db: Session, attempt_id: int) -> Optional[QuizAttempt]:
    return db.query(QuizAttempt).filter(QuizAttempt.id == attempt_id).first()

def submit_quiz_attempt(
    db: Session, 
    *, 
    attempt: QuizAttempt, 
    answers: dict
) -> QuizAttempt:
    # Get the quiz
    quiz = db.query(Quiz).filter(Quiz.id == attempt.quiz_id).first()
    
    # Calculate score
    correct_answers = 0
    total_questions = len(quiz.questions)
    
    for q_idx, answer in answers.items():
        if int(q_idx) < total_questions:
            if quiz.questions[int(q_idx)]['correctAnswer'] == answer:
                correct_answers += 1
    
    score = int((correct_answers / total_questions) * 100)
    
    # Update attempt
    attempt.completed_at = datetime.utcnow()
    attempt.answers = answers
    attempt.score = score
    
    db.commit()
    db.refresh(attempt)
    return attempt 