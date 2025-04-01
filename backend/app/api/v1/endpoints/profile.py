from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any
from pydantic import BaseModel, EmailStr
from app.api import deps
from app.core.security import get_password_hash, verify_password
from app.models.user import User
from app.crud.user import update_user

router = APIRouter()

class ProfileUpdate(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

@router.put("/", response_model=dict)
def update_profile(
    profile_data: ProfileUpdate,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db)
) -> Any:
    """
    Update user profile information
    """
    try:
        update_data = profile_data.dict(exclude_unset=True)
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No data provided for update"
            )
        
        updated_user = update_user(db, current_user.id, update_data)
        return {
            "message": "Profile updated successfully",
            "user": {
                "id": updated_user.id,
                "full_name": updated_user.full_name,
                "email": updated_user.email
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating profile: {str(e)}"
        )

@router.put("/password", response_model=dict)
def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(deps.get_db)
) -> Any:
    """
    Change user password
    """
    try:
        # Verify current password
        if not verify_password(password_data.current_password, current_user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Current password is incorrect"
            )
        
        # Update password
        update_data = {
            "hashed_password": get_password_hash(password_data.new_password)
        }
        update_user(db, current_user.id, update_data)
        
        return {"message": "Password updated successfully"}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error changing password: {str(e)}"
        ) 