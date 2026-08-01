from sqlalchemy import Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class Charge(Base):
    __tablename__ = "charges"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    brokerage: Mapped[float] = mapped_column(Float, default=0.0)
    stt: Mapped[float] = mapped_column(Float, default=0.0)
    exchange_charges: Mapped[float] = mapped_column(Float, default=0.0)
    sebi_charges: Mapped[float] = mapped_column(Float, default=0.0)
    stamp_duty: Mapped[float] = mapped_column(Float, default=0.0)
    gst: Mapped[float] = mapped_column(Float, default=0.0)
    platform_fee: Mapped[float] = mapped_column(Float, default=0.0)
    aws_fee: Mapped[float] = mapped_column(Float, default=0.0)
    total_charges: Mapped[float] = mapped_column(Float, default=0.0)
