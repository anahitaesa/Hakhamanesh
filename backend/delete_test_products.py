from database import SessionLocal
from models import Product


# اتصال به دیتابیس
db = SessionLocal()

try:
    # پیدا کردن محصولات آزمایشی با نام و دسته‌بندی دقیق
    test_products = db.query(Product).filter(
        Product.name == "پیتزا پپرونی آزمایشی",
        Product.category == "پیتزا"
    ).all()

    # نمایش تعداد محصولات پیدا شده
    print("تعداد محصولات آزمایشی پیدا شده:", len(test_products))

    # فقط در صورت پیدا شدن دقیقاً ۳ محصول، حذف انجام می‌شود
    if len(test_products) == 3:
        for product in test_products:
            db.delete(product)

        # ثبت حذف‌ها در دیتابیس
        db.commit()

        print("هر ۳ محصول آزمایشی با موفقیت حذف شدند.")

    else:
        # اگر تعداد متفاوت باشد، هیچ تغییری در دیتابیس انجام نمی‌شود
        print("تعداد محصولات با مقدار مورد انتظار برابر نیست.")
        print("هیچ محصولی حذف نشد.")

except Exception as error:
    # در صورت بروز خطا، تغییرات لغو می‌شوند
    db.rollback()
    print("خطا هنگام حذف محصولات:", error)

finally:
    # بستن اتصال دیتابیس
    db.close()