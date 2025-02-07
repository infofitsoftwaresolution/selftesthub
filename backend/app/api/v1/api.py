from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, quizzes, quiz_attempts, admin

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(quizzes.router, prefix="/quizzes", tags=["quizzes"])
api_router.include_router(quiz_attempts.router, prefix="/quiz-attempts", tags=["quiz-attempts"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"]) 