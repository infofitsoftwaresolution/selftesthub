from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import User
from app.models.quiz_attempt import QuizAttempt
from typing import List
from statistics import mean
from app.crud.quiz_attempt import get_all_quiz_attempts
from app.schemas.quiz_attempt import QuizAttemptWithDetails
import logging
import boto3
from app.crud.quiz import get_quizzes
from app.core.config import settings

router = APIRouter()
logger = logging.getLogger('quiz_api')

def get_presigned_url(video_url: str):
    if not video_url or not video_url.startswith("s3://"):
        return video_url
    
    s3_key = video_url.replace("s3://", "")
    try:
        s3_client_args = {'region_name': settings.AWS_REGION}
        if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
            s3_client_args['aws_access_key_id'] = settings.AWS_ACCESS_KEY_ID
            s3_client_args['aws_secret_access_key'] = settings.AWS_SECRET_ACCESS_KEY
            
        s3_client = boto3.client('s3', **s3_client_args)
        
        # Generate 1-hour presigned URL
        return s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': settings.AWS_S3_BUCKET, 'Key': s3_key},
            ExpiresIn=3600 
        )
    except Exception as e:
        logger.error(f"Error generating presigned URL: {e}")
        return None

@router.get("/student-reports")
async def get_student_reports(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    # Get all students
    students = db.query(User).filter(User.is_superuser.is_(False)).all()
    
    reports = []
    for student in students:
        # Get all completed attempts for this student
        attempts = (
            db.query(QuizAttempt)
            .filter(
                QuizAttempt.user_id == student.id,
                QuizAttempt.is_completed.is_(True)
            )
            .all()
        )
        
        # Calculate average score
        scores = [attempt.score for attempt in attempts if attempt.score is not None]
        avg_score = mean(scores) if scores else 0
        
        reports.append({
            "user": {
                "id": student.id,
                "full_name": student.full_name,
                "email": student.email
            },
            "attempts": [{
                "id": attempt.id,
                "quiz": {
                    "id": attempt.quiz.id,
                    "title": attempt.quiz.title,
                    "duration": attempt.quiz.duration
                },
                "started_at": attempt.started_at,
                "completed_at": attempt.completed_at,
                "score": attempt.score,
                "video_url": get_presigned_url(attempt.video_url)
            } for attempt in attempts],
            "averageScore": avg_score
        })
    
    return reports

@router.delete("/reports/{attempt_id}")
async def delete_student_report(
    attempt_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """
    Delete a specific quiz attempt globally.
    If it possesses a video in S3, delete the S3 object.
    Only accessible by admin users.
    """
    attempt = db.query(QuizAttempt).filter(QuizAttempt.id == attempt_id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Quiz attempt not found")
        
    # Delete from S3 if video exists
    if attempt.video_url and attempt.video_url.startswith("s3://"):
        s3_key = attempt.video_url.replace("s3://", "")
        try:
            s3_client_args = {'region_name': settings.AWS_REGION}
            if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
                s3_client_args['aws_access_key_id'] = settings.AWS_ACCESS_KEY_ID
                s3_client_args['aws_secret_access_key'] = settings.AWS_SECRET_ACCESS_KEY
                
            s3_client = boto3.client('s3', **s3_client_args)
            s3_client.delete_object(Bucket=settings.AWS_S3_BUCKET, Key=s3_key)
            logger.info(f"Deleted S3 video {s3_key} for attempt {attempt_id}")
        except Exception as e:
            logger.error(f"Failed to delete video from S3 for attempt {attempt_id}: {e}")
            # Continuing to delete DB record even if S3 delete fails so admin isn't permanently blocked
            
    # Delete from Database
    db.delete(attempt)
    db.commit()
    logger.info(f"Admin {current_user.id} deleted attempt {attempt_id}")
    return {"message": "Report successfully deleted"}

@router.get("/quiz-attempts", response_model=List[QuizAttemptWithDetails])
async def get_quiz_attempts(
    quiz_id: int = None,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """
    Get all quiz attempts with user and quiz details.
    Optionally filter by quiz_id.
    Only accessible by admin users.
    """
    try:
        logger.info(f"Fetching quiz attempts for admin user {current_user.id}")
        query = db.query(QuizAttempt).filter(QuizAttempt.is_completed.is_(True))
        
        # Apply quiz filter if quiz_id is provided
        if quiz_id is not None:
            logger.info(f"Filtering attempts for quiz_id: {quiz_id}")
            query = query.filter(QuizAttempt.quiz_id == quiz_id)
        
        attempts = query.all()
        logger.info(f"Successfully fetched {len(attempts)} quiz attempts")
        return attempts
    except Exception as e:
        logger.error(f"Error fetching quiz attempts: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error while fetching quiz attempts: {str(e)}"
        )

@router.get("/quizzes")
async def get_all_quizzes(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """Get all quizzes for admin"""
    return get_quizzes(db)

@router.get("/users")
async def get_users(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """
    Get all users. Only for Master SuperAdmin.
    """
    if current_user.email != "infofitsoftware@gmail.com":
        raise HTTPException(status_code=403, detail="Only Master SuperAdmin can access user management")
    
    users = db.query(User).all()
    return [{
        "id": u.id,
        "full_name": u.full_name,
        "email": u.email,
        "is_active": u.is_active,
        "is_superuser": u.is_superuser,
        "created_at": u.created_at
    } for u in users]

from pydantic import BaseModel, Field

class ScoreUpdate(BaseModel):
    score: int = Field(..., ge=0, le=100, description="Score percentage (0-100)")

@router.patch("/reports/{attempt_id}/score")
async def update_report_score(
    attempt_id: int,
    payload: ScoreUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """
    Update the score of a specific quiz attempt.
    Only accessible by admin users. Used primarily for video interviews.
    """
    attempt = db.query(QuizAttempt).filter(QuizAttempt.id == attempt_id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Quiz attempt not found")
        
    attempt.score = payload.score
    db.commit()
    db.refresh(attempt)
    
    logger.info(f"Admin {current_user.id} updated score for attempt {attempt_id} to {payload.score}")
    return {"message": "Score updated successfully", "score": attempt.score}

class RoleUpdate(BaseModel):
    is_superuser: bool

@router.patch("/users/{user_id}/role")
async def update_user_role(
    user_id: int,
    payload: RoleUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_admin_user)
):
    """
    Promote or demote a user. Only for Master SuperAdmin.
    """
    if current_user.email != "infofitsoftware@gmail.com":
        raise HTTPException(status_code=403, detail="Only Master SuperAdmin can modify user roles")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent self-demotion of master account
    if user.email == "infofitsoftware@gmail.com" and not payload.is_superuser:
         raise HTTPException(status_code=400, detail="Cannot demote the Master SuperAdmin account")

    user.is_superuser = payload.is_superuser
    db.commit()
    db.refresh(user)
    
    return {"message": f"User {user.email} updated successfully", "is_superuser": user.is_superuser}