from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.services.market_service import (
    get_market_status,
    get_price_history,
    refresh_all_prices,
)
from app.services.portfolio_service import (
    build_investor_dashboard,
    calculate_holdings_with_live_prices,
    get_portfolio_history,
    get_investment_history,
    calculate_charges,
)

router = APIRouter()


@router.get("/profile")
def get_profile(current_user: User = Depends(get_current_user)) -> dict:
    return {
        "id": current_user.id,
        "investor_id": current_user.investor_id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role,
    }


@router.get("/dashboard")
def dashboard(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    # Refresh prices from Yahoo Finance on each dashboard load
    try:
        refresh_all_prices(db)
    except Exception:
        pass  # Gracefully degrade if Yahoo Finance is unreachable
    return build_investor_dashboard(current_user.id, db)


@router.get("/portfolio")
def portfolio(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    holdings = calculate_holdings_with_live_prices(current_user.id, db)
    charges = calculate_charges(current_user.id, db)
    total_value = round(sum(h["current_value"] for h in holdings), 2)
    return {"holdings": holdings, "total_value": total_value, "charges": charges}


@router.get("/holdings")
def holdings(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    data = calculate_holdings_with_live_prices(current_user.id, db)
    return {"holdings": data}


@router.get("/investments")
def investments(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    data = get_investment_history(current_user.id, db)
    return {"investments": data}


@router.get("/portfolio-history")
def portfolio_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    data = get_portfolio_history(current_user.id, db)
    return {"history": data}


@router.get("/market-status")
def market_status() -> dict:
    return get_market_status()


@router.get("/price-history/{symbol}")
def price_history(
    symbol: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    data = get_price_history(symbol, db)
    return {"symbol": symbol, "prices": data}


@router.get("/transactions")
def transactions(current_user: User = Depends(get_current_user)) -> dict:
    return {"message": f"Transactions for {current_user.full_name}"}


@router.get("/statements")
def statements(current_user: User = Depends(get_current_user)) -> dict:
    return {"message": f"Statements for {current_user.full_name}"}
