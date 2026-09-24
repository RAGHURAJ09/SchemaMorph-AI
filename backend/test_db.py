import sys
from app.api.dependencies import SessionLocal, engine, Base
from app.models.database import User

try:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    user = User(email="testdb@example.com", password_hash="hash")
    db.add(user)
    db.commit()
    print("Success")
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
