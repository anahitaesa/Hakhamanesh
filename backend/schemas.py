
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List


# ساختار مشترک اطلاعات محصول
class ProductBase(BaseModel):

    # نام محصول؛ اجباری و حداکثر ۱۵۰ کاراکتر
    name: str = Field(..., min_length=1, max_length=150)

    # دسته‌بندی محصول
    category: str = Field(..., min_length=1, max_length=100)

    # آدرس یا مسیر تصویر محصول
    image: Optional[str] = None

    # نشان محصول؛ مثل پرفروش یا ویژه
    badge: Optional[str] = None

    # امتیاز محصول
    rating: float = Field(default=0, ge=0, le=5)

    # قیمت پایه
    price: Optional[int] = Field(default=None, ge=0)

    # قیمت در اندازه‌های مختلف
    mini_price: Optional[int] = Field(default=None, ge=0)
    medium_price: Optional[int] = Field(default=None, ge=0)
    large_price: Optional[int] = Field(default=None, ge=0)

    # واحد پول
    currency: str = "تومان"

    # توضیحات اختیاری
    description: Optional[str] = None

    # ترکیبات به‌صورت لیست جداگانه
    ingredients: List[str] = Field(default_factory=list)

    # کالری محصول
    calories: Optional[int] = Field(default=None, ge=0)

    # زمان آماده‌سازی به دقیقه
    preparation_time: Optional[int] = Field(default=None, ge=0)

    # وضعیت نمایش محصول
    is_active: bool = True


# اطلاعات لازم برای ساخت محصول جدید
class ProductCreate(ProductBase):
    pass


# اطلاعات لازم برای ویرایش محصول
# تمام فیلدها اختیاری هستند
class ProductUpdate(BaseModel):

    name: Optional[str] = Field(default=None, min_length=1, max_length=150)
    category: Optional[str] = None
    image: Optional[str] = None
    badge: Optional[str] = None
    rating: Optional[float] = Field(default=None, ge=0, le=5)

    price: Optional[int] = Field(default=None, ge=0)
    mini_price: Optional[int] = Field(default=None, ge=0)
    medium_price: Optional[int] = Field(default=None, ge=0)
    large_price: Optional[int] = Field(default=None, ge=0)

    currency: Optional[str] = None
    description: Optional[str] = None
    ingredients: Optional[List[str]] = None

    calories: Optional[int] = Field(default=None, ge=0)
    preparation_time: Optional[int] = Field(default=None, ge=0)

    is_active: Optional[bool] = None


# ساختار اطلاعات محصول برای ارسال به فرانت‌اند
class ProductResponse(ProductBase):

    # شناسه محصول در دیتابیس
    id: int

    # اجازه خواندن اطلاعات از مدل SQLAlchemy
    model_config = ConfigDict(from_attributes=True)
