from datetime import date
from sqlalchemy import Date, Float, ForeignKey, Boolean, UniqueConstraint, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class DailyPortfolioSnapshot(Base):
    __tablename__ = "daily_portfolio_snapshots"
    __table_args__ = (UniqueConstraint("user_id", "date", name="uq_user_date"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    portfolio_value: Mapped[float] = mapped_column(Float, default=0.0)
    invested_amount: Mapped[float] = mapped_column(Float, default=0.0)
    profit: Mapped[float] = mapped_column(Float, default=0.0)
    return_pct: Mapped[float] = mapped_column(Float, default=0.0)
    is_market_holiday: Mapped[bool] = mapped_column(Boolean, default=False)
    holiday_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
