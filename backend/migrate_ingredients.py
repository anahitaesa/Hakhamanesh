
import sqlite3
import json
import re
from pathlib import Path
from openpyxl import load_workbook


# مسیر پوشه‌ای که این فایل داخل آن قرار دارد
BASE_DIR = Path(__file__).resolve().parent

# مسیر دیتابیس و فایل اکسل
DB_PATH = BASE_DIR / "hakhamanesh.db"
EXCEL_PATH = BASE_DIR / "menu.xlsx"

# نام شیت اکسل که اطلاعات محصولات داخل آن قرار دارد
SHEET_NAME = "کل منو (جامع)"


# این تابع مقادیر خالی را یکدست می‌کند
def clean(value):
    if value is None:
        return None

    value = str(value).strip()

    if value in ("", "-"):
        return None

    return value


def main():

    # باز کردن فایل اکسل و خواندن اطلاعات ذخیره‌شده در سلول‌ها
    workbook = load_workbook(EXCEL_PATH, data_only=True)

    # انتخاب شیت محصولات
    sheet = workbook[SHEET_NAME]

    # اتصال به دیتابیس
    conn = sqlite3.connect(DB_PATH)

    # امکان دسترسی به ستون‌های دیتابیس با نام آن‌ها
    conn.row_factory = sqlite3.Row

    # لیست تغییراتی که قرار است انجام شوند
    updates = []

    # ذخیره خطاهای احتمالی برای جلوگیری از انتقال اشتباه
    errors = []

    try:

        # خواندن ردیف‌های اکسل از ردیف دوم
        # چون ردیف اول معمولاً عنوان ستون‌هاست
        for row in sheet.iter_rows(min_row=2, values_only=True):

            # دریافت ستون‌های موردنیاز اکسل
            _, category, name, content, *_ = row

            # رد کردن ردیف‌های ناقص
            if not name or not category:
                continue

            # یکدست کردن نام و دسته‌بندی محصول
            name = str(name).strip()
            category = str(category).strip()

            # دریافت ترکیبات محصول
            content = clean(content)

            # پیدا کردن محصول در دیتابیس
            # تطبیق هم‌زمان نام و دسته‌بندی برای جلوگیری از اشتباه
            products = conn.execute(
                """
                SELECT id, name, category, description, ingredients
                FROM products
                WHERE name = ? AND category = ?
                """,
                (name, category)
            ).fetchall()

            # اگر محصول دقیقاً یک مورد نبود، انتقال متوقف می‌شود
            if len(products) != 1:
                errors.append(f"محصول نامشخص یا تکراری: {name}")
                continue

            # دریافت اطلاعات محصول
            product = products[0]

            # اگر اکسل ترکیبات نداشت، از این محصول عبور کن
            if not content:
                continue

            # اگر ترکیبات قبلاً ثبت شده‌اند، آن‌ها را تغییر نده
            if product["ingredients"]:
                continue

            # بررسی می‌کنیم اطلاعات اکسل با توضیحات فعلی دیتابیس یکسان باشد
            if product["description"] != content:
                errors.append(f"عدم تطابق اطلاعات: {name}")
                continue

            # جدا کردن ترکیبات با استفاده از ویرگول فارسی یا انگلیسی
            ingredients = [
                item.strip()
                for item in re.split(r"[,،]", content)
                if item.strip()
            ]

            # آماده کردن اطلاعات برای انتقال به دیتابیس
            # ترکیبات به شکل JSON ذخیره می‌شوند
            updates.append((
                json.dumps(ingredients, ensure_ascii=False),
                product["id"]
            ))

        # نمایش نتیجه بررسی اولیه
        print("تعداد ترکیبات قابل انتقال:", len(updates))
        print("تعداد خطاها:", len(errors))

        # نمایش خطاهای احتمالی
        for error in errors:
            print("خطا:", error)

        # اگر حتی یک خطا وجود داشته باشد، انتقال انجام نمی‌شود
        if errors:
            print("انتقال انجام نشد؛ ابتدا خطاها را بررسی کن.")
            return

        # در اجرای اولیه فقط بررسی انجام می‌شود
        # هیچ تغییری در دیتابیس ایجاد نخواهد شد
        import sys

        if "--apply" not in sys.argv:
            print("حالت بررسی: دیتابیس تغییری نکرد.")
            print("برای اعمال تغییرات باید --apply وارد شود.")
            return

        # شروع تراکنش دیتابیس
        conn.execute("BEGIN")

        # انتقال ترکیبات به فیلد مستقل
        # توضیحات قبلی پاک می‌شود، چون در این محصولات
        # توضیحات در واقع همان ترکیبات بوده است
        conn.executemany(
            """
            UPDATE products
            SET ingredients = ?, description = NULL
            WHERE id = ? AND ingredients IS NULL
            """,
            updates
        )

        # ثبت نهایی تغییرات
        conn.commit()

        print("انتقال ترکیبات با موفقیت انجام شد.")

    except Exception:

        # در صورت بروز خطا، تغییرات ثبت‌نشده لغو می‌شوند
        conn.rollback()

        raise

    finally:

        # بستن اتصال دیتابیس و فایل اکسل
        conn.close()
        workbook.close()


# اجرای برنامه فقط زمانی که این فایل مستقیماً اجرا شود
if __name__ == "__main__":
    main()
