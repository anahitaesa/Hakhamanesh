from fastapi import UploadFile, File
from pathlib import Path
from uuid import uuid4
import xml.etree.ElementTree as ET

# ابزارهای موردنیاز FastAPI
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

# ابزار ارتباط با دیتابیس
from sqlalchemy.orm import Session

# اتصال به دیتابیس و مدل تنظیمات
from database import get_db
from models import RestaurantSettings

# بررسی هویت مدیر
from security import get_current_admin


# ساخت مسیرهای مربوط به تنظیمات رستوران
router = APIRouter(
    prefix="/settings",
    tags=["Settings"]
)


# پوشه ذخیره لوگوها
LOGO_UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads" / "logos"
LOGO_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


# آپلود لوگوی رستوران
@router.post("/logo")
async def upload_restaurant_logo(
    file: UploadFile = File(...),
    current_admin: str = Depends(get_current_admin)
):
    # بررسی پسوند فایل
    extension = Path(file.filename or "").suffix.lower()

    if extension not in [".png", ".svg"]:
        raise HTTPException(
            status_code=400,
            detail="فقط فایل PNG و SVG قابل قبول است"
        )

    # دریافت فایل با محدودیت حجم ۵ مگابایت
    content = await file.read(5 * 1024 * 1024 + 1)

    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="حجم لوگو نباید بیشتر از ۵ مگابایت باشد"
        )

    if not content:
        raise HTTPException(
            status_code=400,
            detail="فایل انتخاب‌شده خالی است"
        )

    # بررسی محتوای واقعی PNG
    if extension == ".png":
        if not content.startswith(b"\x89PNG\r\n\x1a\n"):
            raise HTTPException(
                status_code=400,
                detail="فایل PNG معتبر نیست"
            )

    # بررسی ساختار و محتوای SVG
    if extension == ".svg":
        try:
            lower_content = content.lower()

            if (
                b"<!doctype" in lower_content
                or b"<!entity" in lower_content
            ):
                raise ValueError("محتوای غیرمجاز SVG")

            root = ET.fromstring(content)

            if not root.tag.endswith("svg"):
                raise ValueError("ساختار SVG معتبر نیست")

            forbidden_tags = {
                "script", "foreignobject", "iframe",
                "object", "embed"
            }

            for element in root.iter():
                tag_name = element.tag.split("}")[-1].lower()

                if tag_name in forbidden_tags:
                    raise ValueError("عنصر غیرمجاز در SVG")

                for attr, value in element.attrib.items():
                    attr_name = attr.split("}")[-1].lower()
                    attr_value = value.strip().lower()

                    if attr_name.startswith("on"):
                        raise ValueError("رویداد اجرایی غیرمجاز")

                    if attr_name in ["href", "src"]:
                        if (
                            attr_value.startswith(("http:", "https:", "//", "data:", "javascript:"))
                        ):
                            raise ValueError("لینک خارجی غیرمجاز")

                    if "url(" in attr_value:
                        raise ValueError("ارجاع خارجی غیرمجاز")

        except Exception:
            raise HTTPException(
                status_code=400,
                detail="فایل SVG معتبر یا ایمن نیست"
            )

    # ساخت نام یکتای فایل
    filename = f"{uuid4().hex}{extension}"

    # ذخیره فایل
    file_path = LOGO_UPLOAD_DIR / filename
    file_path.write_bytes(content)

    # ارسال مسیر فایل به فرانت‌اند
    return {
        "logo": f"/uploads/logos/{filename}"
    }


# ساختار اطلاعات ورودی تنظیمات
# تمام فیلدها اختیاری هستند تا امکان ویرایش بخشی از تنظیمات وجود داشته باشد
class SettingsUpdate(BaseModel):
    restaurant_name: str | None = None
    logo: str | None = None
    description: str | None = None
    phone: str | None = None
    address: str | None = None
    opening_hours: str | None = None
    instagram: str | None = None
    telegram: str | None = None
    website: str | None = None
    google_maps_url: str | None = None
    neshan_url: str | None = None
    balad_url: str | None = None


# تبدیل اطلاعات تنظیمات به خروجی قابل ارسال به فرانت‌اند
def settings_to_dict(settings):
    return {
        "id": settings.id,
        "restaurant_name": settings.restaurant_name,
        "logo": settings.logo,
        "description": settings.description,
        "phone": settings.phone,
        "address": settings.address,
        "opening_hours": settings.opening_hours,
        "instagram": settings.instagram,
        "telegram": settings.telegram,
        "website": settings.website,
        "google_maps_url": settings.google_maps_url,
        "neshan_url": settings.neshan_url,
        "balad_url": settings.balad_url,
    }


# دریافت تنظیمات اصلی رستوران
# این مسیر عمومی است و برای منوی مشتری هم قابل استفاده است
@router.get("/")
def get_settings(db: Session = Depends(get_db)):

    settings = db.query(RestaurantSettings).filter(
        RestaurantSettings.id == 1
    ).first()

    # اگر هنوز تنظیماتی ثبت نشده باشد، رکورد اولیه ساخته می‌شود
    if settings is None:
        try:
            settings = RestaurantSettings(id=1)
            db.add(settings)
            db.commit()
            db.refresh(settings)

        except Exception:
            db.rollback()
            raise HTTPException(
                status_code=500,
                detail="خطا در دریافت تنظیمات رستوران"
            )

    return settings_to_dict(settings)


# ویرایش تنظیمات اصلی رستوران
# این مسیر فقط برای مدیر احراز هویت‌شده قابل دسترسی است
@router.put("/")
def update_settings(
    data: SettingsUpdate,
    db: Session = Depends(get_db),
    current_admin: str = Depends(get_current_admin)
):

    settings = db.query(RestaurantSettings).filter(
        RestaurantSettings.id == 1
    ).first()

    # اگر رکورد تنظیمات وجود نداشته باشد، آن را ایجاد می‌کنیم
    if settings is None:
        settings = RestaurantSettings(id=1)
        db.add(settings)

    # فقط فیلدهایی که در درخواست ارسال شده‌اند به‌روزرسانی می‌شوند
    update_data = data.dict(exclude_unset=True)

    # نام رستوران نباید خالی باشد
    if "restaurant_name" in update_data:
        if update_data["restaurant_name"] is None:
            raise HTTPException(
                status_code=400,
                detail="نام رستوران نمی‌تواند خالی باشد"
            )

        update_data["restaurant_name"] = update_data[
            "restaurant_name"
        ].strip()

        if not update_data["restaurant_name"]:
            raise HTTPException(
                status_code=400,
                detail="نام رستوران نمی‌تواند خالی باشد"
            )

    try:
        # اعمال تغییرات روی رکورد تنظیمات
        for field, value in update_data.items():
            setattr(settings, field, value)

        db.commit()
        db.refresh(settings)

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="خطا در ذخیره تنظیمات رستوران"
        )

    return {
        "message": "تنظیمات رستوران با موفقیت ذخیره شد",
        "settings": settings_to_dict(settings)
    }