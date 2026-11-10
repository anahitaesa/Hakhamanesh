
# ابزارهای موردنیاز FastAPI
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

# ابزار ارتباط با دیتابیس
from sqlalchemy.orm import Session

# اتصال به دیتابیس و مدل دسته‌بندی
from database import get_db
from models import Category, Product

# بررسی هویت مدیر
from security import get_current_admin


# ساخت مسیرهای مربوط به دسته‌بندی‌ها
router = APIRouter(
    prefix="/categories",
    tags=["Categories"]
)


# ساختار اطلاعات ورودی دسته‌بندی
class CategoryCreate(BaseModel):
    name: str
    icon: str | None = None
    sort_order: int = 0


# دریافت اطلاعات تمام دسته‌بندی‌های فعال
@router.get("/")
def get_categories(db: Session = Depends(get_db)):

    categories = db.query(Category).filter(
        Category.is_active == True
    ).order_by(Category.sort_order.asc()).all()

    return [
        {
            "id": category.id,
            "name": category.name,
            "icon": category.icon,
            "is_active": category.is_active,
            "sort_order": category.sort_order
        }
        for category in categories
    ]


# افزودن دسته‌بندی جدید
@router.post("/")
def create_category(
    data: CategoryCreate,
    db: Session = Depends(get_db),
    current_admin: str = Depends(get_current_admin)
):

    name = data.name.strip()

    if not name:
        raise HTTPException(
            status_code=400,
            detail="نام دسته‌بندی نمی‌تواند خالی باشد"
        )

    existing = db.query(Category).filter(
        Category.name == name
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="این دسته‌بندی قبلاً ثبت شده است"
        )

    new_category = Category(
        name=name,
        icon=data.icon,
        sort_order=data.sort_order
    )

    try:
        db.add(new_category)
        db.commit()
        db.refresh(new_category)

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="خطا در ثبت دسته‌بندی"
        )

    return {
        "id": new_category.id,
        "name": new_category.name,
        "icon": new_category.icon,
        "is_active": new_category.is_active,
        "sort_order": new_category.sort_order
    }


# ویرایش دسته‌بندی
@router.put("/{category_id}")
def update_category(
    category_id: int,
    data: CategoryCreate,
    db: Session = Depends(get_db),
    current_admin: str = Depends(get_current_admin)
):

    category = db.query(Category).filter(
        Category.id == category_id
    ).first()

    if category is None:
        raise HTTPException(
            status_code=404,
            detail="دسته‌بندی پیدا نشد"
        )

    name = data.name.strip()

    if not name:
        raise HTTPException(
            status_code=400,
            detail="نام دسته‌بندی نمی‌تواند خالی باشد"
        )

    existing = db.query(Category).filter(
        Category.name == name,
        Category.id != category_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="این نام قبلاً برای دسته‌بندی دیگری ثبت شده است"
        )

    old_name = category.name

    try:
        # به‌روزرسانی نام دسته‌بندی در محصولات مرتبط
        db.query(Product).filter(
            Product.category == old_name
        ).update(
            {Product.category: name},
            synchronize_session=False
        )

        category.name = name
        category.icon = data.icon
        category.sort_order = data.sort_order

        db.commit()
        db.refresh(category)

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="خطا در ویرایش دسته‌بندی"
        )

    return {
        "id": category.id,
        "name": category.name,
        "icon": category.icon,
        "is_active": category.is_active,
        "sort_order": category.sort_order
    }


# حذف دسته‌بندی
@router.delete("/{category_id}")
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_admin: str = Depends(get_current_admin)
):

    category = db.query(Category).filter(
        Category.id == category_id
    ).first()

    if category is None:
        raise HTTPException(
            status_code=404,
            detail="دسته‌بندی پیدا نشد"
        )

    used = db.query(Product).filter(
        Product.category == category.name
    ).first()

    if used:
        raise HTTPException(
            status_code=400,
            detail="این دسته‌بندی دارای محصول است و قابل حذف نیست"
        )

    try:
        db.delete(category)
        db.commit()

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="خطا در حذف دسته‌بندی"
        )

    return {"message": "دسته‌بندی با موفقیت حذف شد"}
