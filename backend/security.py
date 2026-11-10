
# ابزارهای موردنیاز برای مدیریت زمان و مسیر فایل
import os
from pathlib import Path
from datetime import datetime, timedelta, timezone

# ابزارهای احراز هویت و رمزنگاری
import jwt
from pwdlib import PasswordHash

# ابزارهای دیتابیس
from sqlalchemy.orm import Session
from database import get_db
from models import Admin

# ابزارهای امنیتی FastAPI
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# بارگذاری اطلاعات محرمانه از فایل .env
BASE_DIR = Path(__file__).resolve().parent

from dotenv import load_dotenv
load_dotenv(BASE_DIR / ".env")

# اطلاعات اولیه مدیر برای اولین راه‌اندازی
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")

# کلید محرمانه امضای توکن
SECRET_KEY = os.getenv("SECRET_KEY")

# مدت اعتبار توکن
ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
)

# بررسی تنظیمات ضروری امنیت
if not SECRET_KEY:
    raise RuntimeError("کلید SECRET_KEY در فایل .env تنظیم نشده است")

if SECRET_KEY == "CHANGE_THIS_TO_A_LONG_RANDOM_SECRET":
    raise RuntimeError("کلید SECRET_KEY باید تغییر کند")

# ابزار هش کردن رمز عبور
password_hasher = PasswordHash.recommended()

# روش دریافت توکن
bearer_scheme = HTTPBearer(auto_error=False)


# ساخت حساب اولیه مدیر در صورت خالی بودن جدول
def initialize_admin(db: Session):

    # بررسی وجود حساب مدیر
    admin = db.query(Admin).first()

    # اگر حسابی وجود دارد، اطلاعات آن را تغییر نمی‌دهیم
    if admin:
        return

    # برای ساخت حساب اولیه، اطلاعات .env الزامی است
    if not ADMIN_USERNAME or not ADMIN_PASSWORD:
        raise RuntimeError(
            "برای ساخت حساب اولیه مدیر، ADMIN_USERNAME و ADMIN_PASSWORD را در .env تنظیم کنید"
        )

    # ساخت حساب مدیر با رمز هش‌شده
    new_admin = Admin(
        username=ADMIN_USERNAME,
        password_hash=password_hasher.hash(ADMIN_PASSWORD)
    )

    db.add(new_admin)
    db.commit()


# بررسی نام کاربری و رمز عبور با اطلاعات دیتابیس
def verify_admin_credentials(
    db: Session,
    username: str,
    password: str
):

    admin = db.query(Admin).filter(
        Admin.username == username
    ).first()

    # اگر نام کاربری وجود نداشت، ورود رد می‌شود
    if not admin:
        return False

    # بررسی رمز واردشده با هش ذخیره‌شده
    return password_hasher.verify(
        password,
        admin.password_hash
    )


# ساخت توکن ورود مدیر
def create_access_token(username: str):

    expire_time = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    token_data = {
        "sub": username,
        "exp": expire_time
    }

    return jwt.encode(
        token_data,
        SECRET_KEY,
        algorithm="HS256"
    )


# بررسی اعتبار توکن برای مسیرهای مخصوص مدیر
def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db)
):

    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="برای دسترسی باید وارد حساب مدیر شوید",
            headers={"WWW-Authenticate": "Bearer"}
        )

    try:
        payload = jwt.decode(
            credentials.credentials,
            SECRET_KEY,
            algorithms=["HS256"]
        )

        username = payload.get("sub")

        if not username:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="توکن معتبر نیست"
            )

        # بررسی وجود حساب مدیر در دیتابیس
        admin = db.query(Admin).filter(
            Admin.username == username
        ).first()

        if not admin:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="حساب مدیر معتبر نیست"
            )

        return admin

    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="توکن نامعتبر یا منقضی شده است",
            headers={"WWW-Authenticate": "Bearer"}
        )
