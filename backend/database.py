import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import NullPool

load_dotenv()

# 1. Define Database URL (SQLite fallback for local dev, PostgreSQL for production)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./mahadev_fastfood.db")

# 2. Create SQLAlchemy Engine
# Note: connect_args={"check_same_thread": False} is ONLY needed for SQLite
engine_kwargs = {}
if DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    engine_kwargs["poolclass"] = NullPool

engine = create_engine(DATABASE_URL, **engine_kwargs)

# 3. Create SessionLocal factory for creating database sessions per request
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. Create Base class for ORM models
Base = declarative_base()


# 5. Dependency to get DB session in FastAPI routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()