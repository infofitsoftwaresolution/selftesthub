from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any, List
from pydantic import BaseModel
import random
import traceback
from datetime import datetime, timedelta
import logging

from app.api import deps
from app.core.security import create_access_token, get_password_hash
from app.schemas.user import UserCreate, UserLogin, Token, UserInDB
from app.crud.user import create_user, authenticate_user, get_user_by_email
from app.core.email import send_email

# Configure logging to console
logger = logging.getLogger(__name__)
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)

router = APIRouter()

# Whitelist of allowed email addresses
ALLOWED_EMAILS = {
    "felifestus871@gmail.com",
    "anyichiechinecherem00@gmail.com",
    "asobichiemerie@gmail.com",
    "omahfidelia12@gmail.com",
    "ifeanyichukwupeter057@gmail.com",
    "chidinmaobiegbu24@gmail.com",
    "chinemeremokoye635@gmail.com",
    "ebubechukwuhopenzoniwu@gmail.com",
    "bodmanprecious@gmail.com",
    "lilianokeke321@gmail.com",
    "benedictjerry79@gmail.com",
    "sylviaokeke50@gmail.com",
    "paschalezenwa2006@gmail.com",
    "chiraphael67@gmail.com",
    "drextabu@gmail.com",
    "nmaasha29@gmail.com",
    "onwujubachukwunonso@gmail.com",
    "lucyoluoma52@gmail.com",
    "chuck4004@gmail.com",
    "anoziegreat427@gmail.com",
    "timothyudenabo82@gmail.com",
    "ndchukwuneke@gmail.com",
    "iykeg374@gmail.com",
    "ilonzenkiru@gmail.com",
    "chiomaezeufonna028@gmail.com",
    "endyude@gmail.com",
    "olisaelokaamara@gmail.com",
    "ezeufonnachiagoziem@gmail.com",
    "ngwubeizuchukwu453@gmail.com",
    "hn2968319@gmail.com",
    "josephlouisanyisia@gmail.com",
    "hephzibah2uche@gmail.com",
    "ifunanyachukwuperpetual@gmail.com",
    "okigboprincewill@gmail.com",
    "chomzy914@gmail.com",
    "bukwelini@gmail.com",
    "adailoduba@gmail.com",
    "cynthia.ekus39@gmail.com",
    "okoyeprecious858@gmail.com",
    "benezeclement@gmail.com",
    "obiezeadichie.es@gmail.com",
    "obchibudom@gmail.com",
    "engeramaka@gmail.com",
    "tochukwuezenduka7@gmail.com",
    "anielolucia@gmail.com",
    "ezedialoramarachukwum@gmail.com",
    "judahorakpo@gmail.com",
    "kachi07@yahoo.com",
    "onyedikaanyajiugo9@gmail.com",
    "ozikochi7@gmail.com",
    "kosisookoye54@gmail.com",
    "ufonduamucheonyinyechukwu123@gmail.com",
    "onwubualilichinyere@gmail.com",
    "chinenyeb688@gmail.com",
    "abanoformartins8@gmail.com",
    "anyichiemiracle5@gmail.com",
    "somnora29@gmail.com",
    "onyekwelusomadina@gmail.com",
    "princessmelodyt@gmail.com",
    "nwikechikaodilirita@gmail.com",
    "Okaforkosisochukwu96@gmail.com",
    "brytos45@gmail.com",
    "nduluechukwubuikem@gmail.com",
    "okwytex4810@yahoo.com",
    "muokwechinemelum@gmail.com",
    "ebusyincome@yahoo.com",
    "fudenabo@gmail.com",
    "kaosisoamanie@gmail.com",
    "chinuakash64@gmail.com",
    "shadowranger.695@gmail.com",
    "behuriaakash9@gmail.com",
    "infofitsoftware@gmail.com",
    "shubhamsingh6087@gmail.com",
    "infofitsoftwaresolution@gmail.com",
    "kumariananta848@gmail.com",
   'aniluvall@gmail.com',
   'okwytex4810@gmail.com',
   'okeolusola2@gmail.com',
   'okoyegerald1000@gmail.com',
   'nonsoemma002@gmail.com',
   'offorchinedu5@gmail.com',
   'ngwubeizuchukwu453@gmail.com',
   'mc6891842@gmail.com',
   'bodmanprecious@gmail.com',
   'jayrad200@gmail.com',
   'nonsoemma002@gmail.com',
   'Paschalezenwa2006@gmail.com',
   'okaforkosisochukwu96@gmail.com',
   'chinonsosamuel373@gmail.com',
   'mc6891842@gmail.com'
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

from app.core.sqlite_store import PersistentOTPStore

# Store OTPs persistently across workers/restarts
otp_store = PersistentOTPStore()

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
    
    # Auto-promote Infofit Master Email to Superuser
    if user_in.email == "infofitsoftware@gmail.com":
        user_in.is_superuser = True
    
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

    try:
        # Hardcoded Master SuperAdmin check
        if user_in.email == "infofitsoftware@gmail.com" and user_in.password == "Infofit@SuperAdmin2026":
            logger.info("Admin authentication successful")
            user = get_user_by_email(db, email=user_in.email)
            if not user:
                # If not in DB yet, create it automatically
                master_in = UserCreate(
                    email=user_in.email,
                    password=user_in.password,
                    full_name="Infofit SuperAdmin",
                    is_active=True,
                    is_superuser=True
                )
                user = create_user(db, master_in)
                # Ensure it is superuser
                user.is_superuser = True
                db.commit()
                db.refresh(user)
        else:
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
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "is_superuser": user.is_superuser,
                "profile_image": user.profile_image
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Authentication system error occurred")
        raise HTTPException(
            status_code=500,
            detail=f"Internal Server Error during login: {str(e)}"
        )

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
        request.email = request.email.strip().lower()
        logger.info(f"Registration OTP requested for {request.email}")
        
        # Check whitelist before attempting anything
        if request.email not in ALLOWED_EMAILS:
            logger.warning(f"Registration failed: {request.email} not in whitelist")
            raise HTTPException(
                status_code=403,
                detail="Email not authorized for registration"
            )
            
        # Check if email already exists
        logger.info("Checking if email already exists in database")
        existing_user = get_user_by_email(db, email=request.email)
        
        if existing_user:
            logger.warning("Registration failed: Account already exists")
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )
        
        # Generate OTP
        logger.info("OTP generated")
        otp = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        
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
            logger.info("Registration email sent")
        except Exception as email_error:
            logger.error("Email delivery service failure")
            raise HTTPException(
                status_code=500,
                detail="Failed to send OTP email"
            )
        
        logger.info("Registration OTP process completed successfully")
        return {"message": "OTP sent successfully"}
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error("OTP generation failure")
        raise HTTPException(
            status_code=500,
            detail="Internal server error during registration"
        )

@router.post("/register/verify-otp")
async def verify_registration_otp(
    request: OTPVerify,
    db: Session = Depends(deps.get_db)
):
    request.email = request.email.strip().lower()
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
        logger.info("Password reset OTP requested")
        
        # Check if email exists in database
        logger.info("Checking if email exists in database")
        existing_user = get_user_by_email(db, email=request.email)
        
        if not existing_user:
            logger.warning("Password reset failed: Account not found")
            raise HTTPException(
                status_code=404,
                detail="Email not found"
            )
        
        # Generate OTP
        logger.info("OTP generated")
        otp = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        
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
            logger.info("Reset email sent")
        except Exception as email_error:
            logger.error("Email delivery service failure")
            raise HTTPException(
                status_code=500,
                detail="Failed to send OTP email"
            )
        
        logger.info("Forgot password OTP process completed successfully")
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
        logger.info("Password reset verification started")
        
        stored_data = otp_store.get(f"forgot_{request.email}")
        if not stored_data:
            logger.warning("No OTP request found for account")
            raise HTTPException(status_code=400, detail="No OTP request found")
            
        if datetime.utcnow() > stored_data['expires']:
            logger.warning("OTP expired for account")
            del otp_store[f"forgot_{request.email}"]
            raise HTTPException(status_code=400, detail="OTP expired")
            
        if request.otp != stored_data['otp']:
            logger.warning("Invalid OTP for account")
            raise HTTPException(status_code=400, detail="Invalid OTP")
        
        # Get user and update password
        logger.info("Updating user password")
        user = get_user_by_email(db, email=request.email)
        if not user:
            logger.error("User not found for password update")
            raise HTTPException(status_code=404, detail="User not found")
        
        # Hash new password
        hashed_password = get_password_hash(request.new_password)
        user.hashed_password = hashed_password
        
        # Save to database
        db.commit()
        db.refresh(user)
        
        # Clean up OTP data
        del otp_store[f"forgot_{request.email}"]
        
        logger.info("Password reset successful")
        return {"message": "Password reset successfully"}
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error("Password reset failure")
        raise HTTPException(
            status_code=500,
            detail="Internal server error during password reset"
        ) 