from fastapi import APIRouter, Depends
from app.api.deps import get_current_admin
from app.models.user import User

router = APIRouter()


@router.get("/dashboard")
def admin_dashboard(current_admin: User = Depends(get_current_admin)) -> dict:
    return {"message": f"Admin dashboard for {current_admin.full_name}"}


@router.get("/investors")
def list_investors(current_admin: User = Depends(get_current_admin)) -> dict:
    return {"message": "Investors list"}


@router.post("/investor")
def create_investor(current_admin: User = Depends(get_current_admin)) -> dict:
    return {"message": "Investor created"}


@router.put("/investor/{investor_id}")
def update_investor(investor_id: int, current_admin: User = Depends(get_current_admin)) -> dict:
    return {"message": f"Investor {investor_id} updated"}


@router.delete("/investor/{investor_id}")
def delete_investor(investor_id: int, current_admin: User = Depends(get_current_admin)) -> dict:
    return {"message": f"Investor {investor_id} deleted"}


@router.get("/reports")
def reports(current_admin: User = Depends(get_current_admin)) -> dict:
    return {"message": "Reports"}
