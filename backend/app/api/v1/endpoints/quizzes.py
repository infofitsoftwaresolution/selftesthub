from fastapi import APIRouter, Depends, HTTPException, status, Request, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Dict
from datetime import datetime
from app.api import deps
from app.crud import quiz as quiz_crud
from app.schemas.quiz import (
    Quiz as QuizSchema,
    QuizCreate,
    QuizUpdate,
    QuizResponse
)
from app.schemas.quiz import QuestionCreate
from pydantic import BaseModel
from app.models.quiz import Quiz as QuizModel
from app.models.user import User
from app.models.quiz_attempt import QuizAttempt
import logging

router = APIRouter()

logger = logging.getLogger(__name__)

# Add this class for request validation
class QuizSubmission(BaseModel):
    answers: Dict[str, int]


class VideoUploadInitRequest(BaseModel):
    attempt_id: int
    content_type: str = "video/webm"


class VideoUploadCompleteRequest(BaseModel):
    attempt_id: int
    s3_key: str

@router.get("/test-auth")
def test_auth(current_user: User = Depends(deps.get_current_user)):
    return {"msg": "Auth works", "user_id": current_user.id}

@router.get("/test-db")
def test_db(db: Session = Depends(deps.get_db)):
    return {"msg": "DB works"}

@router.get("/")
def read_quizzes(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(deps.get_db),
    _: User = Depends(deps.get_current_user)
) -> List[QuizSchema]:
    """Retrieve quizzes"""
    return quiz_crud.get_quizzes(db, skip=skip, limit=limit)

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
    try:
        return quiz_crud.create_quiz(db=db, quiz=quiz_in, user_id=current_user.id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/upload-file")
def upload_quiz_file(
    file: UploadFile = File(...),
    title: str = Form(...),
    duration: int = Form(30),
    type: str = Form("practice"),
    max_attempts: int = Form(1),
    is_draft: bool = Form(False),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Create quiz from uploaded JSON or XML file"""
    try:
        filename = file.filename.lower()
        if not (filename.endswith('.json') or filename.endswith('.xml')):
            raise HTTPException(status_code=400, detail="Only JSON (.json) or XML (.xml) files are allowed")
        
        file_content = file.file.read().decode('utf-8')
        questions = []
        
        if filename.endswith('.json'):
            # Parse JSON format
            import json
            try:
                data = json.loads(file_content)
            except json.JSONDecodeError as e:
                raise HTTPException(status_code=400, detail=f"Invalid JSON file: {str(e)}")
            
            # Support both {"questions": [...]} and plain [...]
            q_list = data.get("questions", data) if isinstance(data, dict) else data
            
            if not isinstance(q_list, list):
                raise HTTPException(status_code=400, detail="JSON must contain an array of questions")
            
            for i, q in enumerate(q_list):
                if not isinstance(q, dict):
                    raise HTTPException(status_code=400, detail=f"Question {i+1} is not a valid object")
                
                text = q.get("text") or q.get("question") or ""
                options = q.get("options", [])
                correct = q.get("correctAnswer") if q.get("correctAnswer") is not None else q.get("correct_answer") if q.get("correct_answer") is not None else q.get("answer", 0)
                
                if not text:
                    raise HTTPException(status_code=400, detail=f"Question {i+1} is missing 'text' field")
                if len(options) < 2:
                    raise HTTPException(status_code=400, detail=f"Question {i+1} needs at least 2 options")
                
                # Handle string answer like "a", "b", "c", "d"
                if isinstance(correct, str):
                    answer_map = {'a': 0, 'b': 1, 'c': 2, 'd': 3}
                    correct = answer_map.get(correct.lower(), 0)
                
                # Pad options to 4
                while len(options) < 4:
                    options.append("")
                
                questions.append({
                    "text": text,
                    "options": options[:4],
                    "correctAnswer": int(correct)
                })
        
        else:
            # Parse XML format
            import xml.etree.ElementTree as ET
            try:
                root = ET.fromstring(file_content)
            except ET.ParseError as e:
                raise HTTPException(status_code=400, detail=f"Invalid XML file: {str(e)}")
            
            for i, q_elem in enumerate(root.findall('.//question')):
                text = ""
                text_elem = q_elem.find('text')
                if text_elem is not None and text_elem.text:
                    text = text_elem.text.strip()
                
                if not text:
                    raise HTTPException(status_code=400, detail=f"Question {i+1} is missing <text> element")
                
                options = []
                correct = 0
                for j, opt_elem in enumerate(q_elem.findall('option')):
                    opt_text = opt_elem.text.strip() if opt_elem.text else ""
                    options.append(opt_text)
                    if opt_elem.get('correct', '').lower() in ('true', '1', 'yes'):
                        correct = j
                
                if len(options) < 2:
                    raise HTTPException(status_code=400, detail=f"Question {i+1} needs at least 2 <option> elements")
                
                while len(options) < 4:
                    options.append("")
                
                questions.append({
                    "text": text,
                    "options": options[:4],
                    "correctAnswer": correct
                })
        
        if not questions:
            raise HTTPException(status_code=400, detail="No questions found in the file")
        
        # Create the quiz using existing CRUD
        quiz_data = QuizCreate(
            title=title,
            duration=duration,
            type=type,
            is_active=True,
            questions=[QuestionCreate(**q) for q in questions],
            is_draft=is_draft,
            max_attempts=max_attempts if type == 'practice' else 1
        )
        
        quiz = quiz_crud.create_quiz(db=db, quiz=quiz_data, user_id=current_user.id)
        
        return {
            "message": f"Quiz created successfully with {len(questions)} questions",
            "quiz_id": quiz.id,
            "questions_parsed": len(questions)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"File upload error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing file: {str(e)}"
        )

import os
import aiofiles
import boto3
import uuid
import asyncio
import tempfile
import subprocess
import shutil
from botocore.exceptions import ClientError
from botocore.config import Config
from fastapi import UploadFile, File, Form
import re


def _slugify(value: str, fallback: str = "value") -> str:
    normalized = re.sub(r"[^a-zA-Z0-9]+", "-", (value or "").strip().lower()).strip("-")
    return normalized[:60] or fallback


def _build_video_s3_key(quiz: QuizModel, current_user: User, attempt_id: int) -> str:
    student_name = _slugify(
        current_user.full_name or current_user.email.split("@")[0],
        fallback=f"student-{current_user.id}"
    )
    quiz_slug = _slugify(quiz.title, fallback=f"quiz-{quiz.id}")
    unique_suffix = uuid.uuid4().hex[:10]
    return f"students/{quiz_slug}/{student_name}_attempt_{attempt_id}_{unique_suffix}.webm"


def _make_seekable_webm(input_path: str, output_path: str) -> bool:
    """
    Remux WEBM to regenerate container metadata/cues for proper seeking.
    Returns True on success; False if ffmpeg is unavailable/fails.
    """
    if shutil.which("ffmpeg") is None:
        return False
    try:
        process = subprocess.run(
            ["ffmpeg", "-y", "-i", input_path, "-c", "copy", output_path],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
            timeout=120
        )
        return process.returncode == 0 and os.path.exists(output_path) and os.path.getsize(output_path) > 0
    except Exception:
        return False


@router.post("/{quiz_id}/video-upload-url")
async def create_video_upload_url(
    quiz_id: int,
    payload: VideoUploadInitRequest,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    from app.core.config import settings
    attempt = db.query(QuizAttempt).filter(
        QuizAttempt.id == payload.attempt_id,
        QuizAttempt.quiz_id == quiz_id,
        QuizAttempt.user_id == current_user.id
    ).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")

    quiz = db.query(QuizModel).filter(QuizModel.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    if not settings.AWS_S3_BUCKET:
        raise HTTPException(status_code=500, detail="S3 bucket not configured")

    s3_key = _build_video_s3_key(quiz, current_user, payload.attempt_id)
    s3_client_args = {'region_name': settings.AWS_REGION}
    if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
        s3_client_args['aws_access_key_id'] = settings.AWS_ACCESS_KEY_ID
        s3_client_args['aws_secret_access_key'] = settings.AWS_SECRET_ACCESS_KEY

    s3_client = boto3.client(
        's3',
        config=Config(connect_timeout=30, read_timeout=180, retries={"max_attempts": 3, "mode": "standard"}),
        **s3_client_args
    )

    try:
        upload_url = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': settings.AWS_S3_BUCKET,
                'Key': s3_key,
                'ContentType': payload.content_type or 'video/webm'
            },
            ExpiresIn=900
        )
    except Exception as e:
        logger.exception("Failed to create presigned upload URL")
        raise HTTPException(status_code=500, detail=f"Could not create upload URL: {str(e)}")

    return {"upload_url": upload_url, "s3_key": s3_key}


@router.post("/{quiz_id}/complete-video-upload")
async def complete_video_upload(
    quiz_id: int,
    payload: VideoUploadCompleteRequest,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    attempt = db.query(QuizAttempt).filter(
        QuizAttempt.id == payload.attempt_id,
        QuizAttempt.quiz_id == quiz_id,
        QuizAttempt.user_id == current_user.id
    ).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")

    quiz = db.query(QuizModel).filter(QuizModel.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    quiz_slug = _slugify(quiz.title, fallback=f"quiz-{quiz.id}")
    if not payload.s3_key.startswith(f"students/{quiz_slug}/"):
        raise HTTPException(status_code=400, detail="Invalid upload key")

    attempt.video_url = f"s3://{payload.s3_key}"
    db.commit()
    return {"message": "Video upload finalized"}

@router.post("/{quiz_id}/submit-video")
async def submit_video_attempt(
    quiz_id: int,
    attempt_id: int = Form(...),
    video: UploadFile = File(...),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Upload the recorded webm video to AWS S3 and link to the quiz_attempt"""
    from app.core.config import settings
    # verify attempt belongs to user
    from app.models.quiz_attempt import QuizAttempt
    attempt = db.query(QuizAttempt).filter(QuizAttempt.id == attempt_id, QuizAttempt.user_id == current_user.id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
        
    if not settings.AWS_S3_BUCKET:
        raise HTTPException(status_code=500, detail="S3 bucket not configured")

    quiz = db.query(QuizModel).filter(QuizModel.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    safe_filename = _build_video_s3_key(quiz, current_user, attempt_id)
    
    s3_client_args = {'region_name': settings.AWS_REGION}
    if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
        s3_client_args['aws_access_key_id'] = settings.AWS_ACCESS_KEY_ID
        s3_client_args['aws_secret_access_key'] = settings.AWS_SECRET_ACCESS_KEY
        
    s3_client = boto3.client(
        's3',
        config=Config(connect_timeout=30, read_timeout=180, retries={"max_attempts": 3, "mode": "standard"}),
        **s3_client_args
    )

    temp_input_path = None
    temp_output_path = None
    upload_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_input:
            temp_input_path = temp_input.name
            video.file.seek(0)
            shutil.copyfileobj(video.file, temp_input)

        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_output:
            temp_output_path = temp_output.name

        remuxed = await asyncio.to_thread(_make_seekable_webm, temp_input_path, temp_output_path)
        upload_path = temp_output_path if remuxed else temp_input_path

        with open(upload_path, "rb") as upload_stream:
            await asyncio.to_thread(
                s3_client.upload_fileobj,
                upload_stream,
                settings.AWS_S3_BUCKET,
                safe_filename,
                ExtraArgs={'ContentType': 'video/webm'}
            )
    except Exception as e:
        logger.exception(f"Failed to upload to S3 for attempt {attempt_id}")
        raise HTTPException(status_code=500, detail=f"S3 Upload Failed: {str(e)}")
    finally:
        for path in (temp_input_path, temp_output_path):
            if path and os.path.exists(path):
                try:
                    os.remove(path)
                except Exception:
                    logger.warning(f"Could not remove temp file: {path}")
            
    # save url mapping
    video_url = f"s3://{safe_filename}"
    attempt.video_url = video_url
    db.commit()
    return {"message": "Video uploaded to S3 successfully", "video_url": video_url}

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

@router.patch("/{quiz_id}", response_model=QuizResponse)
async def update_quiz(
    quiz_id: int,
    quiz_update: QuizUpdate,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db)
):
    """
    Update a quiz.
    Only the quiz creator or an admin can update the quiz.
    """
    logger.info(f"Updating quiz {quiz_id} with data: {quiz_update.dict()}")
    
    try:
        # Get the quiz
        quiz = db.query(QuizModel).filter(QuizModel.id == quiz_id).first()
        if not quiz:
            logger.error(f"Quiz {quiz_id} not found")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Quiz not found"
            )
        
        # Check if user has permission to update
        if quiz.created_by != current_user.id and not current_user.is_superuser:
            logger.error(f"User {current_user.id} does not have permission to update quiz {quiz_id}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions to update this quiz"
            )
        
        try:
            # Update quiz fields
            update_data = quiz_update.dict(exclude_unset=True)
            logger.info(f"Update data after exclude_unset: {update_data}")
            
            # Handle questions separately to ensure proper JSON conversion
            if 'questions' in update_data:
                logger.info(f"Updating questions: {update_data['questions']}")
                try:
                    quiz.update_questions(update_data.pop('questions'))
                except ValueError as e:
                    logger.error(f"Error updating questions: {str(e)}")
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=str(e)
                    )
            
            # Handle boolean fields explicitly
            if 'is_active' in update_data:
                try:
                    is_active_value = bool(update_data.pop('is_active'))
                    logger.info(f"Setting is_active to: {is_active_value}")
                    setattr(quiz, 'is_active', is_active_value)
                except Exception as e:
                    logger.error(f"Error setting is_active: {str(e)}")
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Invalid value for is_active: {str(e)}"
                    )
            
            # Update remaining fields
            for field, value in update_data.items():
                if hasattr(quiz, field):
                    logger.info(f"Updating field {field} with value {value}")
                    try:
                        setattr(quiz, field, value)
                    except Exception as e:
                        logger.error(f"Error setting field {field}: {str(e)}")
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"Error updating field {field}: {str(e)}"
                        )
                else:
                    logger.warning(f"Field {field} not found in quiz model")
            
            try:
                db.commit()
                db.refresh(quiz)
            except Exception as e:
                logger.error(f"Database error during commit: {str(e)}")
                db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Database error: {str(e)}"
                )
            
            logger.info(f"Quiz {quiz_id} updated successfully")
            return quiz
            
        except HTTPException:
            raise
        except Exception as e:
            db.rollback()
            logger.error(f"Error updating quiz fields: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error updating quiz fields: {str(e)}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in update_quiz: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error: {str(e)}"
        )

@router.delete("/{quiz_id}", response_model=dict)
async def delete_quiz(
    quiz_id: int,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db)
):
    """
    Delete a quiz.
    Only the quiz creator or an admin can delete the quiz.
    """
    # Get the quiz
    quiz = db.query(QuizModel).filter(QuizModel.id == quiz_id).first()
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found"
        )
    
    # Check if user has permission to delete
    if quiz.created_by != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to delete this quiz"
        )
    
    try:
        # First delete all quiz attempts associated with this quiz
        db.query(QuizAttempt).filter(QuizAttempt.quiz_id == quiz_id).delete()
        
        # Then delete the quiz
        db.delete(quiz)
        db.commit()
        
        return {
            "message": "Quiz deleted successfully",
            "quiz_id": quiz_id
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting quiz: {str(e)}"
        )

@router.post("/{quiz_id}/start")
async def start_quiz(
    quiz_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Start a new quiz attempt"""
    # Check if quiz exists
    quiz = db.query(QuizModel).filter(QuizModel.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    # Check if quiz is active
    if not quiz.is_active:
        raise HTTPException(status_code=400, detail="Quiz is not active")

    # Check if user has any ongoing attempts
    ongoing_attempt = (
        db.query(QuizAttempt)
        .filter(
            QuizAttempt.quiz_id == quiz_id,
            QuizAttempt.user_id == current_user.id,
            QuizAttempt.is_completed.is_(False)
        )
        .first()
    )

    if ongoing_attempt:
        return {
            "attemptId": ongoing_attempt.id,
            "message": "Resuming existing attempt",
            "startedAt": ongoing_attempt.started_at
        }

    # Create new attempt
    new_attempt = QuizAttempt(
        quiz_id=quiz_id,
        user_id=current_user.id,
        started_at=datetime.utcnow(),
        is_completed=False,
        answers={},
        score=None
    )

    db.add(new_attempt)
    db.commit()
    db.refresh(new_attempt)

    return {
        "attemptId": new_attempt.id,
        "message": "New attempt created",
        "startedAt": new_attempt.started_at
    }

@router.post("/{quiz_id}/submit")
async def submit_quiz(
    quiz_id: int,
    submission: QuizSubmission,
    attempt_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Submit a quiz attempt"""
    try:
        # Get the quiz attempt
        attempt = (
            db.query(QuizAttempt)
            .filter(
                QuizAttempt.id == attempt_id,
                QuizAttempt.quiz_id == quiz_id,
                QuizAttempt.user_id == current_user.id,
                QuizAttempt.is_completed.is_(False)
            )
            .first()
        )

        if not attempt:
            raise HTTPException(
                status_code=404,
                detail="Quiz attempt not found or already completed"
            )

        # Get the quiz
        quiz = db.query(QuizModel).filter(QuizModel.id == quiz_id).first()
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found")

        # Calculate score
        total_questions = len(quiz.questions)
        correct_answers = 0

        for q_idx, answer in submission.answers.items():
            question_idx = int(q_idx)
            if question_idx < total_questions:
                if answer == quiz.questions[question_idx]["correctAnswer"]:
                    correct_answers += 1

        score = None if quiz.type == "video" else ((correct_answers / total_questions * 100) if total_questions > 0 else 0)

        # Update attempt
        attempt.answers = submission.answers
        attempt.score = score
        attempt.completed_at = datetime.utcnow()
        attempt.is_completed = True

        db.commit()
        db.refresh(attempt)

        return {
            "message": "Quiz submitted successfully",
            "score": score,
            "total_questions": total_questions,
            "correct_answers": correct_answers,
            "completed_at": attempt.completed_at,
            "answers": attempt.answers
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"Error submitting quiz: {str(e)}")  # Add debug logging
        raise HTTPException(
            status_code=500,
            detail=f"Error submitting quiz: {str(e)}"
        ) 