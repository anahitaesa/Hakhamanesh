
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import get_db
from models import Admin

from security import (
    verify_admin_credentials,
    create_access_token,
    get_current_admin,
    password_hasher
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# اطلاعات ورودی هنگام ورود
class LoginRequest(BaseModel):
    username: str
    password: str


# اطلاعات موردنیاز برای تغییر رمز عبور
class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)
    confirm_password: str


# ورود مدیر
@router.post("/login")
def login_admin(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    is_valid = verify_admin_credentials(
        db,
        login_data.username,
        login_data.password
    )

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="نام کاربری یا رمز عبور اشتباه است"
        )

    access_token = create_access_token(login_data.username)

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


# دریافت اطلاعات پروفایل مدیر
@router.get("/me")
def get_admin_profile(
    current_admin: Admin = Depends(get_current_admin)
):
    return {
        "id": current_admin.id,
        "username": current_admin.username
    }


# تغییر رمز عبور مدیر
@router.put("/change-password")
def change_admin_password(
    password_data: ChangePasswordRequest,
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):

    # بررسی رمز عبور فعلی
    if not password_hasher.verify(
        password_data.current_password,
        current_admin.password_hash
    ):
        raise HTTPException(
            status_code=400,
            detail="رمز عبور فعلی اشتباه است"
        )

    # بررسی تطابق رمز جدید و تکرار آن
    if password_data.new_password != password_data.confirm_password:
        raise HTTPException(
            status_code=400,
            detail="رمز عبور جدید و تکرار آن یکسان نیستند"
        )

    # جلوگیری از انتخاب رمز فعلی به عنوان رمز جدید
    if password_hasher.verify(
        password_data.new_password,
        current_admin.password_hash
    ):
        raise HTTPException(
            status_code=400,
            detail="رمز جدید باید با رمز فعلی متفاوت باشد"
        )

    # ذخیره رمز جدید
    current_admin.password_hash = password_hasher.hash(
        password_data.new_password
    )

    db.commit()

    return {
        "message": "رمز عبور با موفقیت تغییر کرد"
    }
