from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.core.config import settings
from app.core.security import verify_token
from app.crud.user import get_user
from app.models.user import User as UserModel
from app.schemas.token import TokenPayload
from app.schemas.user import UserInDB

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

def get_db() -> Generator:
    #print("Getting DB connection")
    try:
        db = SessionLocal()
        yield db
    finally:
        #print("Closing DB connection")
        db.close()

def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> UserModel:
    #print("Authenticating user with token:", token[:10] if token else None)
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except (jwt.JWTError, ValidationError) as e:
        #print("JWT validation error:", str(e))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
    
    user = db.query(UserModel).filter(UserModel.id == token_data.sub).first()
    if not user:
        #print("User not found in database")
        raise HTTPException(status_code=404, detail="User not found")
    #print("Found user:", user.id)
    return user 

async def get_current_admin_user(
    current_user: UserModel = Depends(get_current_user),
) -> UserModel:
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403,
            detail="The user doesn't have enough privileges"
        )
    return current_user 