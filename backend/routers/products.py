from fastapi import APIRouter, Depends, HTTPException, UploadFile, File

# ابزارهای موردنیاز FastAPI
from fastapi import APIRouter, Depends, HTTPException

# ابزار ارتباط با دیتابیس
from sqlalchemy.orm import Session

# ابزار تبدیل اطلاعات به JSON و برعکس
import json

from pathlib import Path
from uuid import uuid4

# اتصال به دیتابیس و مدل محصول
from database import get_db
from models import Product

# بررسی هویت مدیر
from security import get_current_admin

# Schemaهای اعتبارسنجی محصول
from schemas import ProductCreate, ProductUpdate, ProductResponse


# ساخت مسیرهای مربوط به محصولات
router = APIRouter(
    prefix="/products",
    tags=["Products"]
)

# پوشه ذخیره تصاویر محصولات
PRODUCT_UPLOAD_DIR = (
    Path(__file__).resolve().parent.parent
    / "uploads"
    / "products"
)

# ساخت پوشه در صورت وجود نداشتن
PRODUCT_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)



# تبدیل اطلاعات محصول از دیتابیس به خروجی قابل ارسال
def product_to_response(product):
    # دریافت ترکیبات ذخیره‌شده در دیتابیس
    try:
        ingredients = json.loads(product.ingredients or "[]")
    except (json.JSONDecodeError, TypeError):
        ingredients = []

    # ساخت خروجی محصول
    return {
        "id": product.id,
        "name": product.name,
        "category": product.category,
        "image": product.image,
        "badge": product.badge,
        "rating": product.rating,
        "price": product.price,
        "mini_price": product.mini_price,
        "medium_price": product.medium_price,
        "large_price": product.large_price,
        "currency": product.currency,
        "description": product.description,
        "ingredients": ingredients,
        "calories": product.calories,
        "preparation_time": product.preparation_time,
        "is_active": product.is_active
    }

# حذف امن فایل تصویر قبلی محصول
def remove_product_image_file(image_path):
    if not image_path:
        return

    try:
        filename = Path(image_path).name

        file_path = (
            PRODUCT_UPLOAD_DIR / filename
        ).resolve()

        upload_dir = PRODUCT_UPLOAD_DIR.resolve()

        # اطمینان از اینکه فایل داخل پوشه تصاویر محصولات است
        if file_path.parent == upload_dir and file_path.is_file():
            file_path.unlink()

    except Exception:
        pass


# آپلود تصویر محصول
@router.post("/{product_id}/image")
async def upload_product_image(
    product_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_admin: str = Depends(get_current_admin)
):

    # پیدا کردن محصول
    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="محصول پیدا نشد"
        )

    # بررسی پسوند فایل
    extension = Path(file.filename or "").suffix.lower()

    allowed_extensions = [".png", ".jpg", ".jpeg", ".webp"]

    if extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="فرمت تصویر باید PNG، JPG، JPEG یا WEBP باشد"
        )

    # دریافت فایل با محدودیت ۵ مگابایت
    content = await file.read(5 * 1024 * 1024 + 1)

    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="حجم تصویر نباید بیشتر از ۵ مگابایت باشد"
        )

    if not content:
        raise HTTPException(
            status_code=400,
            detail="فایل انتخاب‌شده خالی است"
        )

    # بررسی محتوای واقعی تصویر
    valid_image = False

    if extension == ".png":
        valid_image = content.startswith(b"\x89PNG\r\n\x1a\n")

    elif extension in [".jpg", ".jpeg"]:
        valid_image = content.startswith(b"\xff\xd8\xff")

    elif extension == ".webp":
        valid_image = (
            content.startswith(b"RIFF")
            and content[8:12] == b"WEBP"
        )

    if not valid_image:
        raise HTTPException(
            status_code=400,
            detail="محتوای فایل با فرمت تصویر انتخاب‌شده مطابقت ندارد"
        )

    # ساخت نام یکتای فایل
    filename = f"{uuid4().hex}{extension}"

    # مسیر ذخیره تصویر
    file_path = PRODUCT_UPLOAD_DIR / filename

    # ذخیره فایل روی سرور
    try:
        file_path.write_bytes(content)

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="خطا در ذخیره تصویر محصول"
        )

    # نگهداری مسیر تصویر قبلی
    old_image = product.image

    # ثبت مسیر تصویر جدید در دیتابیس
    product.image = f"/uploads/products/{filename}"

    try:
        db.commit()
        db.refresh(product)

    except Exception:
        db.rollback()

        # حذف فایل جدید در صورت شکست ذخیره دیتابیس
        if file_path.exists():
            file_path.unlink()

        raise HTTPException(
            status_code=500,
            detail="خطا در ثبت تصویر محصول"
        )

    # حذف تصویر قبلی پس از ثبت موفق تصویر جدید
    if old_image != product.image:
        remove_product_image_file(old_image)

    return {
        "message": "تصویر محصول با موفقیت آپلود شد",
        "image": product.image,
        "product": product_to_response(product)
    }


# دریافت لیست محصولات
# این مسیر برای نمایش منوی عمومی است و ورود مدیر نمی‌خواهد
@router.get("/", response_model=list[ProductResponse])
def get_products(db: Session = Depends(get_db)):

    # دریافت تمام محصولات
    products = db.query(Product).all()

    # تبدیل ترکیبات هر محصول به لیست
    return [product_to_response(p) for p in products]


# دریافت اطلاعات یک محصول
@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    db: Session = Depends(get_db)
):

    # جستجوی محصول با شناسه
    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    # اگر محصول وجود نداشت
    if product is None:
        raise HTTPException(
            status_code=404,
            detail="محصول پیدا نشد"
        )

    return product_to_response(product)


# افزودن محصول جدید
# فقط مدیر احراز هویت‌شده اجازه استفاده دارد
@router.post("/", response_model=ProductResponse)
def create_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db),
    current_admin: str = Depends(get_current_admin)
):

    # تبدیل اطلاعات دریافتی به دیکشنری
    data = product_data.model_dump()

    # تبدیل لیست ترکیبات به متن JSON برای دیتابیس
    data["ingredients"] = json.dumps(
        data["ingredients"],
        ensure_ascii=False
    )

    # ساخت محصول جدید
    new_product = Product(**data)

    try:
        # افزودن محصول به دیتابیس
        db.add(new_product)

        # ذخیره تغییرات
        db.commit()

        # دریافت اطلاعات ذخیره‌شده
        db.refresh(new_product)

    except Exception:
        # لغو تغییرات در صورت بروز خطا
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="خطا در ثبت محصول"
        )

    return product_to_response(new_product)


# ویرایش اطلاعات محصول
@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product_data: ProductUpdate,
    db: Session = Depends(get_db),
    current_admin: str = Depends(get_current_admin)
):

    # پیدا کردن محصول
    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    # بررسی وجود محصول
    if product is None:
        raise HTTPException(
            status_code=404,
            detail="محصول پیدا نشد"
        )

    # فقط فیلدهایی که در درخواست ارسال شده‌اند تغییر می‌کنند
    data = product_data.model_dump(exclude_unset=True)

    # تبدیل ترکیبات به JSON در صورت ارسال
    if "ingredients" in data and data["ingredients"] is not None:
        data["ingredients"] = json.dumps(
            data["ingredients"],
            ensure_ascii=False
        )

    try:
        # اعمال تغییرات
        for key, value in data.items():
            setattr(product, key, value)

        # ذخیره تغییرات
        db.commit()

        # دریافت اطلاعات به‌روزشده
        db.refresh(product)

    except Exception:
        # لغو تغییرات در صورت بروز خطا
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="خطا در ویرایش محصول"
        )

    return product_to_response(product)


# حذف محصول
# فقط مدیر اجازه حذف دارد
@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_admin: str = Depends(get_current_admin)
):

    # پیدا کردن محصول
    product = db.query(Product).filter(
        Product.id == product_id
    ).first()

    # بررسی وجود محصول
    if product is None:
        raise HTTPException(
            status_code=404,
            detail="محصول پیدا نشد"
        )

    try:
        # حذف محصول
        db.delete(product)

        # ثبت حذف در دیتابیس
        db.commit()

    except Exception:
        # لغو عملیات در صورت خطا
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="خطا در حذف محصول"
        )

    return {
        "message": "محصول با موفقیت حذف شد"
    }
