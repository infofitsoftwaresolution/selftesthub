from fastapi import APIRouter, Depends
from app.api import deps
from app.models.user import User
import logging
import os

router = APIRouter()

# Configure file logger with absolute path
log_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 'logs', 'quiz.log')
os.makedirs(os.path.dirname(log_file), exist_ok=True)

logging.basicConfig(
    filename=log_file,
    level=logging.INFO,
    format='%(asctime)s - %(message)s',
    force=True
)

logger = logging.getLogger('quiz_logger')

@router.post("/")
async def log_message(
    message: dict,
    current_user: User = Depends(deps.get_current_user)
):
    try:
        logger.info(f"User {current_user.id}: {message['message']}")
        return {"status": "logged"}
    except Exception as e:
        logger.error(f"Logging error: {str(e)}")
        return {"status": "error", "message": str(e)} 