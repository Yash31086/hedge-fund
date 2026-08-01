from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database.session import get_db
from app.models.user import User

router = APIRouter()


@router.get("/profile")
def get_profile(current_user: User = Depends(get_current_user)) -> dict:
    return {"id": current_user.id, "full_name": current_user.full_name, "email": current_user.email, "role": current_user.role}


@router.get("/dashboard")
def dashboard(current_user: User = Depends(get_current_user)) -> dict:
    return {"message": f"Dashboard for {current_user.full_name}"}


@router.get("/portfolio")
def portfolio(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    return {"message": f"Portfolio for {current_user.full_name}"}


@router.get("/investments")
def investments(current_user: User = Depends(get_current_user)) -> dict:
    return {"message": f"Investments for {current_user.full_name}"}


@router.get("/transactions")
def transactions(current_user: User = Depends(get_current_user)) -> dict:
    return {"message": f"Transactions for {current_user.full_name}"}


@router.get("/statements")
def statements(current_user: User = Depends(get_current_user)) -> dict:
    return {"message": f"Statements for {current_user.full_name}"}
