# from fastapi import APIRouter
# from app.api.v1.endpoints import auth, quizzes, results, users, admin, profile, leaderboard

# api_router = APIRouter()

# api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
# api_router.include_router(quizzes.router, prefix="/quizzes", tags=["quizzes"])
# api_router.include_router(results.router, prefix="/results", tags=["results"])
# api_router.include_router(users.router, prefix="/users", tags=["users"])
# api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
# api_router.include_router(profile.router, prefix="/profile", tags=["profile"])
# api_router.include_router(leaderboard.router, prefix="/leaderboard", tags=["leaderboard"]) 

from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, quizzes, quiz_attempts, admin, results,profile, leaderboard

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(quizzes.router, prefix="/quizzes", tags=["quizzes"])
api_router.include_router(quiz_attempts.router, prefix="/quiz-attempts", tags=["quiz-attempts"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(results.router, prefix="/results", tags=["results"]) 
api_router.include_router(profile.router, prefix="/profile", tags=["profile"])
api_router.include_router(leaderboard.router, prefix="/leaderboard", tags=["leaderboard"]) 