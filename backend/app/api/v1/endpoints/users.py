from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any

from app.api import deps
from app.core.security import get_password_hash
from app.crud.user import get_user, update_user
from app.models.user import User
from app.schemas.user import UserUpdate, UserInDB

router = APIRouter()

@router.get("/me", response_model=UserInDB)
def read_user_me(
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get current user.
    """
    return current_user

@router.put("/me", response_model=UserInDB)
def update_user_me(
    *,
    db: Session = Depends(deps.get_db),
    current_password: str,
    new_password: str = None,
    full_name: str = None,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Update current user.
    """
    if not current_user.verify_password(current_password):
        raise HTTPException(
            status_code=400,
            detail="Incorrect password",
        )
    
    user_in = UserUpdate(
        password=new_password if new_password else None,
        full_name=full_name if full_name else current_user.full_name,
    )
    
    user = update_user(db, db_obj=current_user, obj_in=user_in)
    return user 