# وارد کردن ابزارهای اصلی FastAPI
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from pathlib import Path
from fastapi.staticfiles import StaticFiles

from security import initialize_admin

# وارد کردن ابزارهای دیتابیس
from database import engine, Base, SessionLocal
import models

# وارد کردن مسیرهای محصولات و ورود مدیر
from routers import products, auth, categories, settings, dashboard

# وارد کردن مسیرهای مربوط به ورود مدیر
from routers import auth
from routers import categories

# ساخت برنامه اصلی
app = FastAPI()

# مسیر اصلی پروژه بک اند
BASE_DIR = Path(__file__).resolve().parent

# پوشه اصلی ذخیره فایل‌های آپلودشده
UPLOAD_DIR = BASE_DIR / "uploads"

# پوشه ذخیره لوگوی رستوران
LOGO_UPLOAD_DIR = UPLOAD_DIR / "logos"

# پوشه ذخیره تصاویر محصولات
PRODUCT_UPLOAD_DIR = UPLOAD_DIR / "products"


# ساخت پوشه‌ها در صورت وجود نداشتن
LOGO_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
PRODUCT_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)



# در دسترس قرار دادن فایل های اپلود شده برای مرورگر
app.mount(
    "/uploads",
    StaticFiles(directory=str(UPLOAD_DIR)),
    name="uploads"
)

# دریافت آدرس فرانت‌اند از متغیر محیطی
FRONTEND_ORIGINS = os.getenv(
    "FRONTEND_ORIGINS",
    "http://localhost:5173"
)

# تبدیل آدرس‌ها به لیست
allowed_origins = [
    origin.strip()
    for origin in FRONTEND_ORIGINS.split(",")
    if origin.strip()
]

# اجازه ارتباط فرانت‌اند با بک‌اند
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ایجاد جدول‌های دیتابیس
Base.metadata.create_all(bind=engine)

# ساخت حساب اولیه مدیر در صورت خالی بودن جدول admins
db = SessionLocal()

try:
    initialize_admin(db)
finally:
    db.close()

# اتصال API محصولات
app.include_router(products.router)

# اتصال API دسته‌بندی‌ها
app.include_router(categories.router)

# فعال‌سازی مسیر ورود مدیر
app.include_router(auth.router)

app.include_router(settings.router)

app.include_router(dashboard.router)

# مسیر بررسی فعال بودن بک‌اند
@app.get("/")
def home():
    return {"message": "Hakhamanesh Backend is running!"}
