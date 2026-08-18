from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database.session import get_db
from app.models.audit_log import AuditLog
from app.models.user import User
from app.schemas.user import LoginRequest, TokenPair, UserCreate, UserOut
from app.services.auth_service import create_access_token, create_refresh_token, hash_password, verify_password
from app.services.email_service import EmailService
from app.services.otp_service import OTPService

router = APIRouter()
email_service = EmailService()


@router.post("/send-otp", response_model=dict)
async def send_otp(email: str, db: Session = Depends(get_db)) -> dict:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    otp = OTPService.generate_otp()
    OTPService.save_otp(db, email, otp)
    await email_service.send_otp(email, otp)
    return {"message": "OTP sent"}


@router.post("/verify-otp", response_model=TokenPair)
async def verify_otp(email: str, otp: str, db: Session = Depends(get_db)) -> TokenPair:
    record = OTPService.get_otp_record(db, email)
    if not record or not OTPService.verify_otp(record.otp_hash, otp):
        raise HTTPException(status_code=400, detail="Invalid OTP")
    if record.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Expired OTP")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.email_verified = True
    db.commit()
    access_token = create_access_token(user.email, user.role)
    refresh_token = create_refresh_token(user.email, user.role)
    return TokenPair(access_token=access_token, refresh_token=refresh_token)


@router.post("/login")
async def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)) -> dict:
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    db.add(AuditLog(user=user.email, ip_address=request.client.host if request.client else "unknown", device="unknown", browser="unknown", action_performed="login"))
    db.commit()
    access_token = create_access_token(user.email, user.role)
    refresh_token = create_refresh_token(user.email, user.role)
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "investor_id": user.investor_id,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role,
        },
    }


@router.post("/logout")
def logout() -> dict[str, str]:
    return {"message": "Logged out"}


@router.post("/refresh-token", response_model=TokenPair)
def refresh_token(refresh_token: str) -> TokenPair:
    from app.services.auth_service import decode_token
    payload = decode_token(refresh_token, refresh=True)
    access_token = create_access_token(payload["sub"], payload["role"])
    return TokenPair(access_token=access_token, refresh_token=refresh_token)


@router.post("/forgot-password", response_model=dict)
async def forgot_password(email: str, db: Session = Depends(get_db)) -> dict:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    otp = OTPService.generate_otp()
    OTPService.save_otp(db, email, otp)
    await email_service.send_otp(email, otp)
    return {"message": "Password reset OTP sent"}


@router.post("/register", response_model=UserOut)
def register(payload: UserCreate, db: Session = Depends(get_db)) -> UserOut:
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(full_name=payload.full_name, email=str(payload.email), password_hash=hash_password(payload.password), role="INVESTOR")
    db.add(user)
    db.commit()
    db.refresh(user)
    return UserOut(id=user.id, full_name=user.full_name, email=user.email, role=user.role, email_verified=user.email_verified)
