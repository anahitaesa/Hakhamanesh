# وارد کردن کتابخانه اتصال به دیتابیس SQLite
import sqlite3

# اتصال به دیتابیس پروژه
db = sqlite3.connect("hakhamanesh.db")

try:
    # شروع تراکنش برای جلوگیری از ثبت تغییرات ناقص
    db.execute("BEGIN TRANSACTION")

    # ساخت جدول جدید با همان ستون‌ها، اما با قیمت اختیاری
    db.execute("""
        CREATE TABLE products_new (
            id INTEGER NOT NULL,
            name VARCHAR(150) NOT NULL,
            image VARCHAR(255),
            badge VARCHAR(100),
            rating FLOAT,
            price INTEGER,
            currency VARCHAR(30),
            description TEXT,
            category VARCHAR(100) NOT NULL,
            is_active BOOLEAN,
            ingredients TEXT,
            calories INTEGER,
            preparation_time INTEGER,
            mini_price INTEGER,
            medium_price INTEGER,
            large_price INTEGER,
            PRIMARY KEY (id)
        )
    """)

    # انتقال تمام اطلاعات جدول قبلی به جدول جدید
    db.execute("""
        INSERT INTO products_new
        SELECT
            id, name, image, badge, rating, price, currency,
            description, category, is_active, ingredients,
            calories, preparation_time, mini_price,
            medium_price, large_price
        FROM products
    """)

    # حذف جدول قبلی پس از انتقال موفق اطلاعات
    db.execute("DROP TABLE products")

    # جایگزینی جدول جدید با نام اصلی
    db.execute("ALTER TABLE products_new RENAME TO products")

    # بازسازی ایندکس قبلی شناسه محصولات
    db.execute("""
        CREATE INDEX ix_products_id ON products (id)
    """)

    # ثبت نهایی تغییرات
    db.commit()

    print("ساختار دیتابیس با موفقیت اصلاح شد.")

except Exception as error:
    # در صورت بروز خطا، تمام تغییرات این تراکنش لغو می‌شوند
    db.rollback()
    print("خطا در اصلاح دیتابیس:", error)

finally:
    # بستن اتصال دیتابیس
    db.close()