from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any
from pydantic import BaseModel
import random
from datetime import datetime, timedelta

from app.api import deps
from app.core.security import create_access_token, get_password_hash
from app.schemas.user import UserCreate, UserLogin, Token, UserInDB
from app.crud.user import create_user, authenticate_user
from app.core.email import send_email

router = APIRouter()

# Add these models to your schemas
class OTPRequest(BaseModel):
    full_name: str
    email: str
    password: str

class OTPVerify(BaseModel):
    email: str
    otp: str

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
    # Check if email already exists
    if create_user(db, UserCreate(email=request.email, password=request.password, full_name=request.full_name)):
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    # Generate OTP
    otp = ''.join([str(random.randint(0, 9)) for _ in range(6)])
    
    # Store OTP with expiration (10 minutes)
    otp_store[request.email] = {
        'otp': otp,
        'expires': datetime.utcnow() + timedelta(minutes=10),
        'data': request.dict()
    }
    
    # Send email
    await send_email(
        to_email=request.email,
        subject="Your Registration OTP",
        body=f"Your OTP for registration is: {otp}\nValid for 10 minutes."
    )
    
    return {"message": "OTP sent successfully"}

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