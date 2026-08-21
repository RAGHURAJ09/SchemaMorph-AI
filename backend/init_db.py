import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from app.models.database import Base

# Load environment variables (ensure this picks up DATABASE_URL)
load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://postgres:postgres@localhost:5432/postgres"
)

def init_db():
    print(f"Attempting to connect to database at: {DATABASE_URL}")
    print("Creating tables...")
    
    # Create the engine
    engine = create_engine(DATABASE_URL)
    
    try:
        # Create all tables defined in Base.metadata
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully!")
    except Exception as e:
        print(f"❌ Failed to create tables: {e}")
        print("\nMake sure your DATABASE_URL in .env is correct and the database server is running.")

if __name__ == "__main__":
    init_db()
