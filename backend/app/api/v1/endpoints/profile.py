from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Any, Optional
import os
import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr
from app.api import deps
from app.core.security import get_password_hash, verify_password
from app.models.user import User
from app.crud.user import update_user
from app.core.config import settings

router = APIRouter()

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

@router.put("/update", response_model=dict)
async def update_profile(
    full_name: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    profile_image: Optional[UploadFile] = File(None),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Update user profile information
    """
    try:
        # Update basic info
        if full_name is not None:
            current_user.full_name = full_name
        if email is not None:
            current_user.email = email

        # Handle profile image upload
        if profile_image:
            # Create uploads directory if it doesn't exist
            upload_dir = os.path.join(settings.STATIC_FILES_DIR, "profile_images")
            os.makedirs(upload_dir, exist_ok=True)

            # Generate unique filename
            file_extension = os.path.splitext(profile_image.filename)[1]
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            file_path = os.path.join(upload_dir, unique_filename)

            # Save the file
            with open(file_path, "wb") as buffer:
                content = await profile_image.read()
                buffer.write(content)

            # Update user's profile image path
            current_user.profile_image = f"/static/profile_images/{unique_filename}"

        db.commit()
        
        # Return updated user data
        return {
            "message": "Profile updated successfully",
            "user": {
                "id": current_user.id,
                "email": current_user.email,
                "full_name": current_user.full_name,
                "profile_image": current_user.profile_image
            }
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error updating profile: {str(e)}"
        )

@router.put("/change-password", response_model=dict)
def change_password(
    current_password: str,
    new_password: str,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Change user password
    """
    if not verify_password(current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect"
        )

    current_user.hashed_password = get_password_hash(new_password)
    db.commit()

    return {"message": "Password changed successfully"} 