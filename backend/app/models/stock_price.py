from datetime import date
from sqlalchemy import Date, Float, Integer, String, Boolean, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class StockPrice(Base):
    __tablename__ = "stock_prices"
    __table_args__ = (UniqueConstraint("symbol", "date", name="uq_symbol_date"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    symbol: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    open: Mapped[float] = mapped_column(Float, default=0.0)
    high: Mapped[float] = mapped_column(Float, default=0.0)
    low: Mapped[float] = mapped_column(Float, default=0.0)
    close: Mapped[float] = mapped_column(Float, default=0.0)
    volume: Mapped[int] = mapped_column(Integer, default=0)
    is_holiday: Mapped[bool] = mapped_column(Boolean, default=False)
