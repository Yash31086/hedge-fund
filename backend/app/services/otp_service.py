import hashlib
import random
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models.otp_verification import OTPVerification


class OTPService:
    @staticmethod
    def generate_otp() -> str:
        return f"{random.randint(100000, 999999)}"

    @staticmethod
    def hash_otp(otp: str) -> str:
        return hashlib.sha256(otp.encode()).hexdigest()

    @staticmethod
    def verify_otp(stored_hash: str, otp: str) -> bool:
        return OTPService.hash_otp(otp) == stored_hash

    @staticmethod
    def save_otp(db: Session, email: str, otp: str) -> None:
        hashed = OTPService.hash_otp(otp)
        expires_at = datetime.utcnow() + timedelta(minutes=5)
        record = db.query(OTPVerification).filter(OTPVerification.email == email).first()
        if record:
            record.otp_hash = hashed
            record.expires_at = expires_at
            record.attempts = 0
        else:
            db.add(OTPVerification(email=email, otp_hash=hashed, expires_at=expires_at))
        db.commit()

    @staticmethod
    def get_otp_record(db: Session, email: str) -> OTPVerification | None:
        return db.query(OTPVerification).filter(OTPVerification.email == email).first()
