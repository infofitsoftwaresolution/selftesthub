from sqlalchemy import Column, Integer, String, ForeignKey, JSON
from app.db.base_class import Base

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    text = Column(String, nullable=False)
    options = Column(JSON, nullable=False)
    correctanswer = Column(Integer, nullable=False) 