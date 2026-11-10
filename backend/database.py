
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# آدرس دیتابیس
DATABASE_URL = "sqlite:///./hakhamanesh.db"

# اتصال به دیتابیس
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

# ساخت نشست برای ارتباط با دیتابیس
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# پایه ساخت جدول‌ها
Base = declarative_base()


# مدیریت اتصال دیتابیس
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
