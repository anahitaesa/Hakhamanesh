
from pathlib import Path
from openpyxl import load_workbook
from database import SessionLocal
from models import Product


# مسیر فایل اکسل منو
EXCEL_FILE = Path(__file__).with_name("menu.xlsx")

# نام شیت اصلی اکسل
SHEET_NAME = "کل منو (جامع)"


def convert_price(value):
    # قیمت‌های اکسل برحسب هزار تومان هستند
    # برای تبدیل به تومان، عدد را در ۱۰۰۰ ضرب می‌کنیم
    if value is None or value == "":
        return None

    return int(float(value) * 1000)


def import_products():
    # خواندن اطلاعات اکسل با مقادیر محاسبه‌شده سلول‌ها
    workbook = load_workbook(EXCEL_FILE, data_only=True)
    sheet = workbook[SHEET_NAME]

    # اتصال به دیتابیس
    db = SessionLocal()

    added_count = 0
    skipped_count = 0

    try:
        # شروع خواندن اطلاعات از ردیف دوم، چون ردیف اول عنوان ستون‌هاست
        for row in sheet.iter_rows(min_row=2, values_only=True):

            # دریافت اطلاعات هر محصول از ستون‌های اکسل
            (
                row_number,
                category,
                name,
                description,
                base_price,
                mini_price,
                medium_price,
                large_price,
            ) = row

            # رد کردن ردیف‌های ناقص
            if not name or not category:
                continue

            # یکسان‌سازی نام و دسته‌بندی برای بررسی تکراری نبودن
            clean_name = str(name).strip()
            clean_category = str(category).strip()

            # بررسی وجود محصول با همین نام و دسته‌بندی در دیتابیس
            existing_product = db.query(Product).filter(
                Product.name == clean_name,
                Product.category == clean_category
            ).first()

            # اگر محصول قبلاً وجود داشته باشد، آن را دوباره اضافه نمی‌کنیم
            if existing_product:
                skipped_count += 1
                continue

            # تبدیل توضیحات خالی یا خط تیره به مقدار خالی
            clean_description = (
                str(description).strip()
                if description and str(description).strip() != "-"
                else None
            )

            # تبدیل قیمت‌ها از هزار تومان به تومان
            converted_base_price = convert_price(base_price)
            converted_mini_price = convert_price(mini_price)
            converted_medium_price = convert_price(medium_price)
            converted_large_price = convert_price(large_price)

            # ساخت محصول با اطلاعات دقیق اکسل
            product = Product(
                name=clean_name,
                category=clean_category,
                description=clean_description,

                # قیمت تک‌سایز؛ برای محصولات سایزدار خالی می‌ماند
                price=converted_base_price,

                # قیمت اندازه‌ها فقط برای محصولاتی که در اکسل دارند
                mini_price=converted_mini_price,
                medium_price=converted_medium_price,
                large_price=converted_large_price,

                # مقدارهای پیش‌فرض فنی برای فیلدهای خارج از اکسل
                currency="تومان",
                rating=0,
                is_active=True,
                image=None,
                badge=None,
                ingredients=None,
                calories=None,
                preparation_time=None,
            )

            # افزودن محصول به دیتابیس
            db.add(product)
            added_count += 1

        # ذخیره محصولات جدید در دیتابیس
        db.commit()

        print("ورود اطلاعات با موفقیت انجام شد.")
        print("محصولات اضافه‌شده:", added_count)
        print("محصولات تکراری ردشده:", skipped_count)

        # نمایش یک نمونه قیمت برای بررسی تبدیل
        print("نمونه تبدیل قیمت: 250 هزار تومان = 250,000 تومان")

    except Exception as error:
        # در صورت بروز خطا، تغییرات ذخیره‌نشده لغو می‌شوند
        db.rollback()
        print("خطا هنگام ورود اطلاعات:", error)

    finally:
        # بستن اتصال دیتابیس و فایل اکسل
        db.close()
        workbook.close()


# اجرای تابع اصلی هنگام اجرای مستقیم فایل
if __name__ == "__main__":
    import_products()
