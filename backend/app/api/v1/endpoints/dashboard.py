from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.api import deps
from app.models.user import User
from app.models.quiz import Quiz
from app.models.quiz_attempt import QuizAttempt

router = APIRouter()


@router.get("/stats")
async def get_dashboard_stats(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
):
    """
    Return dashboard statistics based on the current user's role.
    - Students get their personal quiz stats.
    - Admins get platform-level teaching stats.
    - SuperAdmin gets full platform overview.
    """

    is_superadmin = current_user.email == "infofitsoftware@gmail.com"
    is_admin = current_user.is_superuser

    # ── SuperAdmin stats ──────────────────────────────────────────────
    if is_superadmin:
        total_users = db.query(func.count(User.id)).scalar() or 0
        total_admins = (
            db.query(func.count(User.id))
            .filter(User.is_superuser.is_(True))
            .scalar()
            or 0
        )
        total_quizzes = db.query(func.count(Quiz.id)).scalar() or 0
        total_attempts = (
            db.query(func.count(QuizAttempt.id))
            .filter(QuizAttempt.is_completed.is_(True))
            .scalar()
            or 0
        )

        return {
            "role": "superadmin",
            "total_users": total_users,
            "total_admins": total_admins,
            "total_quizzes": total_quizzes,
            "total_attempts": total_attempts,
        }

    # ── Admin stats ───────────────────────────────────────────────────
    if is_admin:
        total_students = (
            db.query(func.count(User.id))
            .filter(User.is_superuser.is_(False))
            .scalar()
            or 0
        )
        active_quizzes = (
            db.query(func.count(Quiz.id))
            .filter(Quiz.is_active.is_(True))
            .scalar()
            or 0
        )
        avg_score = (
            db.query(func.avg(QuizAttempt.score))
            .filter(QuizAttempt.is_completed.is_(True))
            .scalar()
        )

        return {
            "role": "admin",
            "total_students": total_students,
            "active_quizzes": active_quizzes,
            "avg_performance": round(avg_score, 1) if avg_score else 0,
        }

    # ── Student stats ─────────────────────────────────────────────────
    completed_count = (
        db.query(func.count(QuizAttempt.id))
        .filter(
            QuizAttempt.user_id == current_user.id,
            QuizAttempt.is_completed.is_(True),
        )
        .scalar()
        or 0
    )
    best_score = (
        db.query(func.max(QuizAttempt.score))
        .filter(
            QuizAttempt.user_id == current_user.id,
            QuizAttempt.is_completed.is_(True),
        )
        .scalar()
    )
    avg_score = (
        db.query(func.avg(QuizAttempt.score))
        .filter(
            QuizAttempt.user_id == current_user.id,
            QuizAttempt.is_completed.is_(True),
        )
        .scalar()
    )

    # Calculate average time in minutes
    avg_time_seconds = (
        db.query(
            func.avg(
                func.extract("epoch", QuizAttempt.completed_at)
                - func.extract("epoch", QuizAttempt.started_at)
            )
        )
        .filter(
            QuizAttempt.user_id == current_user.id,
            QuizAttempt.is_completed.is_(True),
            QuizAttempt.completed_at.isnot(None),
        )
        .scalar()
    )
    avg_time_minutes = round(avg_time_seconds / 60, 1) if avg_time_seconds else 0

    return {
        "role": "student",
        "completed_quizzes": completed_count,
        "best_score": round(best_score, 1) if best_score else 0,
        "avg_time_minutes": avg_time_minutes,
        "accuracy": round(avg_score, 1) if avg_score else 0,
    }
