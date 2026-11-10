
from sqlalchemy import Column, Integer, String, Float, Boolean, Text
from database import Base


# مدل محصولات رستوران
class Product(Base):
    __tablename__ = "products"

    # شناسه یکتای محصول
    id = Column(Integer, primary_key=True, index=True)

    # اطلاعات اصلی محصول
    name = Column(String(150), nullable=False)
    category = Column(String(100), nullable=False)

    # آدرس تصویر محصول (مسیر نسبی یا URL)
    image = Column(String(255), nullable=True)

    # نشان محصول؛ مثلاً پرفروش یا ویژه
    badge = Column(String(100), nullable=True)

    # امتیاز محصول
    rating = Column(Float, default=0)

    # قیمت پایه و قیمت در اندازه‌های مختلف
    price = Column(Integer, nullable=True)
    mini_price = Column(Integer, nullable=True)
    medium_price = Column(Integer, nullable=True)
    large_price = Column(Integer, nullable=True)

    # واحد پول
    currency = Column(String(30), default="تومان")

    # توضیحات اختیاری محصول
    description = Column(Text, nullable=True)

    # ترکیبات محصول
    # اطلاعات به شکل JSON در این ستون ذخیره می‌شوند
    ingredients = Column(Text, nullable=True)

    # اطلاعات تکمیلی محصول
    calories = Column(Integer, nullable=True)
    preparation_time = Column(Integer, nullable=True)

    # وضعیت نمایش محصول در منوی عمومی
    is_active = Column(Boolean, default=True)


# مدل دسته‌بندی محصولات
class Category(Base):
    __tablename__ = "categories"

    # شناسه یکتای دسته‌بندی
    id = Column(Integer, primary_key=True, index=True)

    # نام دسته‌بندی
    name = Column(String(100), unique=True, nullable=False)

    # آیکون دسته‌بندی
    icon = Column(String(50), nullable=True)

    # وضعیت فعال یا غیرفعال بودن دسته‌بندی
    is_active = Column(Boolean, default=True)

    # ترتیب نمایش دسته‌بندی‌ها در منو
    sort_order = Column(Integer, default=0)


# مدل تنظیمات اصلی رستوران
class RestaurantSettings(Base):
    __tablename__ = "restaurant_settings"

    # شناسه ثابت؛ تنظیمات فقط یک رکورد مرکزی دارند
    id = Column(Integer, primary_key=True, default=1)

    # اطلاعات هویتی رستوران
    restaurant_name = Column(String(150), nullable=False, default="رستوران هخامنش")
    logo = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)

    # اطلاعات تماس
    phone = Column(String(30), nullable=True)
    address = Column(Text, nullable=True)

    # اطلاعات تکمیلی
    opening_hours = Column(Text, nullable=True)
    instagram = Column(String(255), nullable=True)
    telegram = Column(String(255), nullable=True)
    website = Column(String(255), nullable=True)
 
    # لینک موقعیت مکانی رستوران در سرویس های مختلف
    google_maps_url = Column(String(500), nullable= True)
    neshan_url = Column(String(500), nullable= True)
    balad_url = Column(String(500), nullable= True)


# مدل حساب مدیر پنل مدیریت
class Admin(Base):
    __tablename__ = "admins"

    # شناسه یکتای مدیر
    id = Column(Integer, primary_key=True, index=True)

    # نام کاربری مدیر
    username = Column(String(100), unique=True, nullable=False, index=True)

    # هش رمز عبور مدیر؛ رمز خام ذخیره نمی‌شود
    password_hash = Column(String(255), nullable=False)


# مدل متادیتای سیستم و وضعیت مقداردهی اولیه دیتابیس
class SeedMetadata(Base):
    __tablename__ = "seed_metadata"

    # کلید یکتای تنظیمات سیستم
    key = Column(String(100), primary_key=True)

    # مقدار ذخیره‌شده
    value = Column(String(255), nullable=False)

    # زمان ثبت یا به‌روزرسانی
    created_at = Column(String(50), nullable=True)

