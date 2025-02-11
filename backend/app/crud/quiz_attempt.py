from sqlalchemy.orm import Session, joinedload
from app.models.quiz_attempt import QuizAttempt

def get_all_quiz_attempts(db: Session):
    """
    Get all quiz attempts with user and quiz details
    """
    return db.query(QuizAttempt)\
        .options(
            joinedload(QuizAttempt.user),
            joinedload(QuizAttempt.quiz)
        )\
        .all() 