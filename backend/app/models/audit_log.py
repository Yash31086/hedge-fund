from datetime import datetime
from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user: Mapped[str] = mapped_column(String(255), nullable=False)
    login_time: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    ip_address: Mapped[str] = mapped_column(String(100), nullable=True)
    device: Mapped[str] = mapped_column(String(255), nullable=True)
    browser: Mapped[str] = mapped_column(String(255), nullable=True)
    action_performed: Mapped[str] = mapped_column(String(255), nullable=True)
