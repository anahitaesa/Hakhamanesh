
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import Product, Category
from security import get_current_admin


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


# دریافت آمار واقعی داشبورد مدیریت
@router.get("/stats")
def get_dashboard_stats(
    current_admin: str = Depends(get_current_admin),
    db: Session = Depends(get_db)
):

    # تعداد کل محصولات
    total_products = db.query(
        func.count(Product.id)
    ).scalar() or 0

    # تعداد محصولات فعال
    active_products = db.query(
        func.count(Product.id)
    ).filter(
        Product.is_active == True
    ).scalar() or 0

    # تعداد محصولات غیرفعال
    inactive_products = db.query(
        func.count(Product.id)
    ).filter(
        Product.is_active == False
    ).scalar() or 0

    # تعداد کل دسته‌بندی‌ها
    total_categories = db.query(
        func.count(Category.id)
    ).scalar() or 0

    # تعداد دسته‌بندی‌های فعال
    active_categories = db.query(
        func.count(Category.id)
    ).filter(
        Category.is_active == True
    ).scalar() or 0

    # شمارش محصولات به تفکیک دسته‌بندی
    category_counts = db.query(
        Product.category,
        func.count(Product.id)
    ).group_by(
        Product.category
    ).all()

    products_by_category = [
        {
            "category": category_name,
            "count": count
        }
        for category_name, count in category_counts
    ]

    return {
        "total_products": total_products,
        "active_products": active_products,
        "inactive_products": inactive_products,
        "total_categories": total_categories,
        "active_categories": active_categories,
        "products_by_category": products_by_category
    }
