from app.database.session import engine
from app.database.base import Base
import app.models.user
import app.models.portfolio
import app.models.investment
import app.models.charge
import app.models.audit_log
import app.models.otp_verification
import app.models.stock_price
import app.models.holding
import app.models.daily_portfolio_snapshot

def init_db():
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

if __name__ == "__main__":
    init_db()
