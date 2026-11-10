"""
ماژول مقداردهی اولیه و سید دیتابیس پروژه هخامنش (Database Seeder)
این ماژول به صورت کاملاً امن، یک‌باره و غیرتکرارشونده (Idempotent)
دسته‌بندی‌ها و محصولات پایه را از فایل menu.xlsx به دیتابیس اضافه می‌کند.

مکانیزم محافظت از تغییرات مدیر:
پس از یک بار اجرای موفق، نشانگر موفقیت در جدول seed_metadata ثبت می‌شود.
در دفعات بعدی (مانند ری‌استارت‌های سرور رندر)، سیدر بلافاصله متوقف می‌شود
تا محصولاتی که مدیر حذف کرده بازگردانده نشوند و تغییرات قیمت و نام بازنویسی نگردند.
در صورت بروز هرگونه خطا قبل از اتمام، نشانگر ثبت نمی‌شود تا امکان تلاش مجدد (Retry) فراهم باشد.
"""

import os
import sys
import json
import re
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Tuple, Dict, Any

from openpyxl import load_workbook
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy import create_engine

# افزودن پوشه بک‌اند به مسیرهای سیستم برای تضمین صحت ایمپورت‌ها در هر محیط اجرایی
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from database import Base
from models import Product, Category, RestaurantSettings, SeedMetadata

# پیکربندی لاگر برای گزارش‌گیری شفاف
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger("seeder")

# کلید یکتای نشانگر تکمیل مقداردهی اولیه در دیتابیس
SEED_COMPLETED_KEY = "initial_menu_seed_completed"

# مسیر پیش‌فرض فایل اکسل و شیت منو
DEFAULT_EXCEL_PATH = BASE_DIR / "menu.xlsx"
SHEET_NAME = "کل منو (جامع)"

# دسته‌بندی‌های رسمی پروژه هخامنش با آیکون و اولویت ترتیب نمایش
INITIAL_CATEGORIES = [
    {"name": "انواع برگر هخامنشی", "icon": "🍔", "sort_order": 1},
    {"name": "انواع ساندویچ ویژه هخامنشی", "icon": "👑", "sort_order": 2},
    {"name": "انواع ساندویچ هخامنشی", "icon": "🥪", "sort_order": 3},
    {"name": "ساندویچ مخلوط هخامنشی", "icon": "🌯", "sort_order": 4},
    {"name": "انواع ساندویچ تنوری هخامنشی", "icon": "🔥", "sort_order": 5},
    {"name": "انواع پیتزا هخامنشی", "icon": "🍕", "sort_order": 6},
    {"name": "انواع پیش غذا", "icon": "🍟", "sort_order": 7},
]


def is_already_seeded(db: Session) -> bool:
    """بررسی اینکه آیا مقداردهی اولیه منو قبلاً با موفقیت به پایان رسیده است یا خیر"""
    try:
        marker = db.query(SeedMetadata).filter(
            SeedMetadata.key == SEED_COMPLETED_KEY
        ).first()
        return marker is not None and marker.value == "completed"
    except Exception as e:
        logger.warning("خطا در استعلام نشانگر سید (ممکن است جدول هنوز ساخته نشده باشد): %s", e)
        return False


def mark_seed_completed(db: Session) -> None:
    """ثبت نشانگر دائمی تکمیل مقداردهی اولیه در دیتابیس"""
    now_str = datetime.now(timezone.utc).isoformat()
    marker = db.query(SeedMetadata).filter(
        SeedMetadata.key == SEED_COMPLETED_KEY
    ).first()

    if not marker:
        marker = SeedMetadata(
            key=SEED_COMPLETED_KEY,
            value="completed",
            created_at=now_str
        )
        db.add(marker)
    else:
        marker.value = "completed"
        marker.created_at = now_str

    db.commit()
    logger.info("نشانگر تکمیل مقداردهی اولیه با موفقیت در دیتابیس ذخیره شد.")


def convert_price(value: Any) -> Optional[int]:
    """تبدیل قیمت‌های درج‌شده برحسب هزار تومان در اکسل به واحد تومان"""
    if value is None or str(value).strip() in ("", "-"):
        return None
    try:
        return int(float(value) * 1000)
    except (ValueError, TypeError):
        return None


def clean_text(value: Any) -> Optional[str]:
    """پاک‌سازی مقادیر متنی و خط تیره"""
    if value is None:
        return None
    cleaned = str(value).strip()
    return None if cleaned in ("", "-") else cleaned


def parse_ingredients_from_content(content: Optional[str]) -> Tuple[Optional[str], Optional[str]]:
    """
    تجزیه ستون توضیحات اکسل:
    اگر ستون حاوی لیست ترکیبات باشد، آن را به آرایه JSON در فیلد ingredients تبدیل می‌کند
    و فیلد description را خالی (None) می‌گذارد تا با ساختار منو همخوان باشد.
    """
    if not content:
        return None, None

    raw_items = [
        item.strip()
        for item in re.split(r"[,،]", content)
        if item.strip()
    ]

    if raw_items:
        ingredients_json = json.dumps(raw_items, ensure_ascii=False)
        return ingredients_json, None

    return None, content


def seed_categories(db: Session) -> Dict[str, int]:
    """افزودن دسته‌بندی‌های اولیه بدون دستکاری دسته‌بندی‌های موجود"""
    added = 0
    skipped = 0

    for cat_data in INITIAL_CATEGORIES:
        name = cat_data["name"]
        existing = db.query(Category).filter(Category.name == name).first()
        if existing:
            skipped += 1
            logger.debug("دسته‌بندی از قبل موجود است: %s", name)
        else:
            new_cat = Category(
                name=name,
                icon=cat_data["icon"],
                is_active=True,
                sort_order=cat_data["sort_order"],
            )
            db.add(new_cat)
            added += 1
            logger.info("افزودن دسته‌بندی جدید: %s", name)

    db.flush()
    return {"added": added, "skipped": skipped}


def seed_settings(db: Session) -> Dict[str, int]:
    """تضمین وجود رکورد تنظیمات پایه رستوران"""
    existing = db.query(RestaurantSettings).filter(RestaurantSettings.id == 1).first()
    if existing:
        return {"added": 0, "skipped": 1}

    default_setting = RestaurantSettings(
        id=1,
        restaurant_name="رستوران هخامنش",
        logo=None,
        description="ارائه‌دهنده انواع برگر، پیتزا و ساندویچ‌های اصیل"
    )
    db.add(default_setting)
    db.flush()
    logger.info("رکورد تنظیمات پایه رستوران ایجاد شد.")
    return {"added": 1, "skipped": 0}


def seed_products(db: Session, excel_path: Path) -> Dict[str, int]:
    """خواندن فایل اکسل و ثبت محصولات در دیتابیس با بررسی دقیق عدم تکراری بودن"""
    if not excel_path.exists():
        logger.error("فایل اکسل در مسیر مشخص‌شده یافت نشد: %s", excel_path)
        raise FileNotFoundError(f"فایل اکسل یافت نشد: {excel_path}")

    workbook = load_workbook(excel_path, data_only=True)
    if SHEET_NAME not in workbook.sheetnames:
        workbook.close()
        logger.error("شیت '%s' در فایل اکسل یافت نشد.", SHEET_NAME)
        raise ValueError(f"شیت {SHEET_NAME} در فایل اکسل موجود نیست")

    sheet = workbook[SHEET_NAME]
    added = 0
    skipped = 0

    try:
        for row in sheet.iter_rows(min_row=2, values_only=True):
            if not row or len(row) < 3:
                continue

            category_raw = row[1] if len(row) > 1 else None
            name_raw = row[2] if len(row) > 2 else None
            desc_raw = row[3] if len(row) > 3 else None
            base_price_raw = row[4] if len(row) > 4 else None
            mini_price_raw = row[5] if len(row) > 5 else None
            medium_price_raw = row[6] if len(row) > 6 else None
            large_price_raw = row[7] if len(row) > 7 else None

            if not name_raw or not category_raw:
                continue

            name = str(name_raw).strip()
            category = str(category_raw).strip()

            existing = db.query(Product).filter(
                Product.name == name,
                Product.category == category
            ).first()

            if existing:
                skipped += 1
                logger.debug("محصول از قبل موجود است: %s [%s]", name, category)
                continue

            cleaned_content = clean_text(desc_raw)
            ingredients_json, final_desc = parse_ingredients_from_content(cleaned_content)

            product = Product(
                name=name,
                category=category,
                description=final_desc,
                ingredients=ingredients_json,
                price=convert_price(base_price_raw),
                mini_price=convert_price(mini_price_raw),
                medium_price=convert_price(medium_price_raw),
                large_price=convert_price(large_price_raw),
                currency="تومان",
                rating=0.0,
                is_active=True,
                image=None,
                badge=None,
                calories=None,
                preparation_time=None,
            )
            db.add(product)
            added += 1

        db.flush()
        logger.info("محصولات اکسل پردازش شدند. اضافه‌شده: %d | صرف‌نظرشده: %d", added, skipped)
        return {"added": added, "skipped": skipped}

    finally:
        workbook.close()


def run_seeder(
    db: Optional[Session] = None,
    excel_path: Optional[Path] = None,
    engine=None
) -> Dict[str, Any]:
    """
    نقطه ورود اصلی سیدر دیتابیس با پشتیبانی از مکانیزم محافظت در برابر بازنویسی تغییرات ادمین
    """
    logger.info("بررسی وضعیت مقداردهی اولیه دیتابیس هخامنش...")
    target_excel = excel_path or DEFAULT_EXCEL_PATH

    if engine is not None:
        active_engine = engine
    else:
        from database import engine as default_engine
        active_engine = default_engine
    Base.metadata.create_all(bind=active_engine)

    session_created_here = False
    if db is None:
        session_factory = sessionmaker(autocommit=False, autoflush=False, bind=active_engine)
        db = session_factory()
        session_created_here = True

    try:
        # ۱. بررسی اینکه آیا مقداردهی اولیه قبلاً انجام شده است
        if is_already_seeded(db):
            logger.info(
                "مقداردهی اولیه دیتابیس قبلاً با موفقیت انجام شده است. "
                "عملیات سید صرف‌نظر شد تا هیچ‌یک از تغییرات یا حذفیات مدیر بازنویسی نشود."
            )
            return {
                "status": "already_seeded",
                "message": "Initial seed already completed. Skipping.",
                "categories": {"added": 0, "skipped": 0},
                "settings": {"added": 0, "skipped": 0},
                "products": {"added": 0, "skipped": 0}
            }

        # ۲. اجرای فرآیند سید در قالب یک تراکنش یکپارچه
        logger.info("دیتابیس هنوز مقداردهی اولیه نشده است. شروع فرآیند سید...")
        cat_result = seed_categories(db)
        settings_result = seed_settings(db)
        prod_result = seed_products(db, target_excel)

        # ۳. ثبت نشانگر موفقیت در دیتابیس
        mark_seed_completed(db)

        # تثبیت نهایی تمام تغییرات
        db.commit()

        summary = {
            "categories": cat_result,
            "settings": settings_result,
            "products": prod_result,
            "status": "success"
        }

        logger.info(
            "عملیات سید اولیه با موفقیت پایان یافت و نشانگر ثبت شد. "
            "[دسته‌بندی‌ها: +%d] [محصولات: +%d]",
            cat_result["added"], prod_result["added"]
        )
        return summary

    except Exception as exc:
        db.rollback()
        logger.exception("خطا در حین فرآیند سید دیتابیس؛ تراکنش لغو شد و نشانگر ثبت نگردید: %s", exc)
        raise

    finally:
        if session_created_here:
            db.close()


if __name__ == "__main__":
    run_seeder()
