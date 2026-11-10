from sqlalchemy import inspect, text
from database import engine

# بررسی ستون‌های فعلی جدول تنظیمات
inspector = inspect(engine)

columns = [
    column["name"]
    for column in inspector.get_columns("restaurant_settings")
]

# ستون‌های جدید نقشه
new_columns = {
    "google_maps_url": "VARCHAR(500)",
    "neshan_url": "VARCHAR(500)",
    "balad_url": "VARCHAR(500)"
}

# اضافه کردن ستون‌هایی که هنوز وجود ندارند
with engine.begin() as connection:

    for column_name, column_type in new_columns.items():

        if column_name not in columns:

            connection.execute(
                text(
                    f"ALTER TABLE restaurant_settings "
                    f"ADD COLUMN {column_name} {column_type}"
                )
            )

            print(f"ستون {column_name} اضافه شد.")

        else:
            print(f"ستون {column_name} از قبل وجود دارد.")

print("به‌روزرسانی دیتابیس با موفقیت انجام شد.")