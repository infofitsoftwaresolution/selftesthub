from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any, List
from pydantic import BaseModel
import random
from datetime import datetime, timedelta
import logging
import traceback

from app.api import deps
from app.core.security import create_access_token, get_password_hash
from app.schemas.user import UserCreate, UserLogin, Token, UserInDB
from app.crud.user import create_user, authenticate_user, get_user_by_email
from app.core.email import send_email

# Configure logging
logging.basicConfig(
    filename='quiz_logs.log',
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

router = APIRouter()

# Whitelist of allowed email addresses
ALLOWED_EMAILS = {
    "lordjaja77@gmail.com",
    "erprakash.24n@gmail.com",
    "kingsleyuzokwe0@gmail.com",
    "mmaduegbunamchukwunonso@gmail.com",
    "ubakaeze4real09@yahoo.com",
    "amanioamaino@gmail.com",
    "ezeadichieobinna@gmail.com",
    "infofitsoftware@gmail.com",
    "shubhamsingh6087@gmail.com"
    "infofitsoftwaresolution@gmail.com",
    "markstephens595@gmail.com",
    "gospelboy111@gmail.com",
    "iloabuchiebele@gmail.com",
    "osinafaechezona16@gmail.com",
    "johnwachuks@gmail.com",
    "mmesomaazubuike29@gmail.com",
    "chinemeremugokwe@gmail.com",
    "nwagummesoma2@gmail.com",
    "ndubuisiokoye174@gmail.com",
    "chineduvictor97@yahoo.com",
    "eberechukwuvivian77@gmail.com",
    "tochianth@gmail.com",
    "adaobijuliet30@gmail.com",
    "madukajoshua001@gmail.com",
    "okoyechukz@gmail.com",
    "fmbengineering20@gmail.com",
    "blessedsommypat@gmail.com",
    "peternonso5@gmail.com",
    "ezedubem90@gmail.com",
    "estherobiechina@gmail.com",
    "pauljosh686@gmail.com",
    "jennybright95@yahoo.com",
    "okwytex4810@yahoo.com",
    "charliemillion212@gmail.com",
    "Nnolie35@gmail.com",
    "obumlixy9@gmail.com",
    "ifeomaezeude607@gmail.com",
    "goodnessadanne1@gmail.com",
    "cynthiaemeraba23@gmail.com",
    "corneliusikechukwu713@gmail.com",
    "nwizub49@gmail.com",
    "okaforjoseph3330@gmail.com",
    "chukwueloka.akunne@gmail.com",
    "emmanuelugoguba@gmail.com",
    "stanleyogechukwu05@gmail.com",
    "nnolie25@gmail.com",
    "jovansint@yahoo.com",
    "jovansint@gmail.com",
    "ubakaeze4real09@yahoo.com",
    "ijeomabibian001@gmail.com",
    "prosperhenry45@gmail.com",
    "dishabansode1503@gmail.com",
    "azubuikemmesoma29@gmail.com"
}

# Add these models to your schemas
class OTPRequest(BaseModel):
    full_name: str
    email: str
    password: str

class OTPVerify(BaseModel):
    email: str
    otp: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ForgotPasswordVerify(BaseModel):
    email: str
    otp: str
    new_password: str

# Store OTPs temporarily (in production, use Redis or similar)
otp_store = {}

@router.post("/register", response_model=Token)
def register(
    *,
    db: Session = Depends(deps.get_db),
    user_in: UserCreate
) -> Any:
    """
    Register new user.
    """
    # Check if email is in whitelist
    if user_in.email not in ALLOWED_EMAILS:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Registration is currently restricted to authorized users only"
        )
    
    user = create_user(db, user_in)
    access_token = create_access_token(subject=user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.post("/login", response_model=Token)
def login(
    *,
    db: Session = Depends(deps.get_db),
    user_in: UserLogin
) -> Any:
    """
    OAuth2 compatible token login
    """
    # Check if email is in whitelist
    if user_in.email not in ALLOWED_EMAILS:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access is currently restricted to authorized users only"
        )

    user = authenticate_user(db, user_in.email, user_in.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(subject=user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.get("/me", response_model=UserInDB)
def read_users_me(current_user: UserInDB = Depends(deps.get_current_user)):
    """
    Get current user.
    """
    return current_user

@router.post("/register/send-otp")
async def send_registration_otp(
    request: OTPRequest,
    db: Session = Depends(deps.get_db)
):
    try:
        logger.info(f"Starting registration OTP process for email: {request.email}")
        
        # Check if email already exists
        logger.info("Checking if email already exists in database")
        existing_user = get_user_by_email(db, email=request.email)
        
        if existing_user:
            logger.warning(f"Registration failed: Email {request.email} already registered")
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )
        
        # Generate OTP
        logger.info("Generating OTP")
        otp = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        logger.info(f"Generated OTP for {request.email}")
        
        # Store OTP with expiration (10 minutes)
        logger.info("Storing OTP with expiration")
        otp_store[request.email] = {
            'otp': otp,
            'expires': datetime.utcnow() + timedelta(minutes=10),
            'data': request.dict()
        }
        
        # Send email
        logger.info("Attempting to send email")
        try:
            await send_email(
                to_email=request.email,
                subject="Your Registration OTP",
                body=f"Your OTP for registration is: {otp}\nValid for 10 minutes."
            )
            logger.info(f"Email sent successfully to {request.email}")
        except Exception as email_error:
            logger.error(f"Failed to send email: {str(email_error)}")
            logger.error(traceback.format_exc())
            raise HTTPException(
                status_code=500,
                detail="Failed to send OTP email"
            )
        
        logger.info(f"Registration OTP process completed successfully for {request.email}")
        return {"message": "OTP sent successfully"}
        
    except HTTPException as he:
        logger.error(f"HTTP Exception in send_registration_otp: {str(he)}")
        raise he
    except Exception as e:
        logger.error(f"Unexpected error in send_registration_otp: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail="Internal server error during registration"
        )

@router.post("/register/verify-otp")
async def verify_registration_otp(
    request: OTPVerify,
    db: Session = Depends(deps.get_db)
):
    stored_data = otp_store.get(request.email)
    if not stored_data:
        raise HTTPException(status_code=400, detail="No OTP request found")
        
    if datetime.utcnow() > stored_data['expires']:
        del otp_store[request.email]
        raise HTTPException(status_code=400, detail="OTP expired")
        
    if request.otp != stored_data['otp']:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    # Create user
    user_data = stored_data['data']
    user_in = UserCreate(
        email=user_data['email'],
        password=user_data['password'],
        full_name=user_data['full_name']
    )
    
    user = create_user(db, user_in)
    
    # Clean up OTP data
    del otp_store[request.email]
    
    access_token = create_access_token(subject=user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.post("/forgot-password/send-otp")
async def send_forgot_password_otp(
    request: ForgotPasswordRequest,
    db: Session = Depends(deps.get_db)
):
    try:
        logger.info(f"Starting forgot password OTP process for email: {request.email}")
        
        # Check if email exists in database
        logger.info("Checking if email exists in database")
        existing_user = get_user_by_email(db, email=request.email)
        
        if not existing_user:
            logger.warning(f"Forgot password failed: Email {request.email} not found")
            raise HTTPException(
                status_code=404,
                detail="Email not found"
            )
        
        # Generate OTP
        logger.info("Generating OTP")
        otp = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        logger.info(f"Generated OTP for {request.email}")
        
        # Store OTP with expiration (10 minutes)
        logger.info("Storing OTP with expiration")
        otp_store[f"forgot_{request.email}"] = {
            'otp': otp,
            'expires': datetime.utcnow() + timedelta(minutes=10),
            'email': request.email
        }
        
        # Send email
        logger.info("Attempting to send email")
        try:
            await send_email(
                to_email=request.email,
                subject="Password Reset OTP",
                body=f"Your OTP for password reset is: {otp}\nValid for 10 minutes.\n\nIf you didn't request this, please ignore this email."
            )
            logger.info(f"Email sent successfully to {request.email}")
        except Exception as email_error:
            logger.error(f"Failed to send email: {str(email_error)}")
            logger.error(traceback.format_exc())
            raise HTTPException(
                status_code=500,
                detail="Failed to send OTP email"
            )
        
        logger.info(f"Forgot password OTP process completed successfully for {request.email}")
        return {"message": "OTP sent successfully"}
        
    except HTTPException as he:
        logger.error(f"HTTP Exception in send_forgot_password_otp: {str(he)}")
        raise he
    except Exception as e:
        logger.error(f"Unexpected error in send_forgot_password_otp: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail="Internal server error during password reset"
        )

@router.post("/forgot-password/verify-otp")
async def verify_forgot_password_otp(
    request: ForgotPasswordVerify,
    db: Session = Depends(deps.get_db)
):
    try:
        logger.info(f"Starting forgot password OTP verification for email: {request.email}")
        
        stored_data = otp_store.get(f"forgot_{request.email}")
        if not stored_data:
            logger.warning(f"No OTP request found for email: {request.email}")
            raise HTTPException(status_code=400, detail="No OTP request found")
            
        if datetime.utcnow() > stored_data['expires']:
            logger.warning(f"OTP expired for email: {request.email}")
            del otp_store[f"forgot_{request.email}"]
            raise HTTPException(status_code=400, detail="OTP expired")
            
        if request.otp != stored_data['otp']:
            logger.warning(f"Invalid OTP for email: {request.email}")
            raise HTTPException(status_code=400, detail="Invalid OTP")
        
        # Get user and update password
        logger.info("Updating user password")
        user = get_user_by_email(db, email=request.email)
        if not user:
            logger.error(f"User not found for email: {request.email}")
            raise HTTPException(status_code=404, detail="User not found")
        
        # Hash new password
        hashed_password = get_password_hash(request.new_password)
        user.hashed_password = hashed_password
        
        # Save to database
        db.commit()
        db.refresh(user)
        
        # Clean up OTP data
        del otp_store[f"forgot_{request.email}"]
        
        logger.info(f"Password reset completed successfully for {request.email}")
        return {"message": "Password reset successfully"}
        
    except HTTPException as he:
        logger.error(f"HTTP Exception in verify_forgot_password_otp: {str(he)}")
        raise he
    except Exception as e:
        logger.error(f"Unexpected error in verify_forgot_password_otp: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail="Internal server error during password reset"
        ) 