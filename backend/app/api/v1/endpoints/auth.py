from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any

from app.api import deps
from app.core.security import create_access_token
from app.schemas.user import UserCreate, UserLogin, Token, User
from app.crud.user import create_user, authenticate_user

router = APIRouter()

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

@router.get("/me", response_model=User)
def get_current_user(
    current_user: User = Depends(deps.get_current_user)
) -> User:
    """
    Get current user.
    """
    return current_user 