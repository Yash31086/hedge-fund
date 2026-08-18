"""Portfolio calculation service — computes holdings P&L, charges, and portfolio value."""

from datetime import date, datetime, timedelta
from typing import Any

from sqlalchemy.orm import Session

from app.models.charge import Charge
from app.models.holding import Holding
from app.models.investment import Investment
from app.models.portfolio import Portfolio
from app.models.daily_portfolio_snapshot import DailyPortfolioSnapshot
from app.models.user import User
from app.services.market_service import (
    get_latest_price,
    get_market_status,
    is_market_holiday,
    SYMBOL_DISPLAY_NAMES,
)


def calculate_charges(user_id: int, db: Session) -> dict[str, float]:
    """Get the charges breakdown for a user from the database."""
    charge = db.query(Charge).filter(Charge.user_id == user_id).first()
    if not charge:
        return {
            "brokerage": 0.0,
            "stt": 0.0,
            "exchange_charges": 0.0,
            "sebi_charges": 0.0,
            "stamp_duty": 0.0,
            "gst": 0.0,
            "platform_fee": 0.0,
            "aws_fee": 150.0,
            "total_charges": 150.0,
        }
    total = round(
        charge.brokerage
        + charge.stt
        + charge.exchange_charges
        + charge.sebi_charges
        + charge.stamp_duty
        + charge.gst
        + charge.platform_fee
        + charge.aws_fee,
        2,
    )
    return {
        "brokerage": charge.brokerage,
        "stt": charge.stt,
        "exchange_charges": charge.exchange_charges,
        "sebi_charges": charge.sebi_charges,
        "stamp_duty": charge.stamp_duty,
        "gst": charge.gst,
        "platform_fee": charge.platform_fee,
        "aws_fee": charge.aws_fee,
        "total_charges": total,
    }


def calculate_holdings_with_live_prices(user_id: int, db: Session) -> list[dict[str, Any]]:
    """Calculate current value and P&L for each holding using live prices."""
    holdings = db.query(Holding).filter(Holding.user_id == user_id, Holding.status == "ACTIVE").all()
    result = []
    for h in holdings:
        live_price = get_latest_price(h.symbol, db)
        cost_basis = round(h.avg_buy_price * h.quantity, 2)
        current_value = round(live_price * h.quantity, 2)
        pnl = round(current_value - cost_basis, 2)
        pnl_pct = round((pnl / cost_basis) * 100, 2) if cost_basis > 0 else 0.0

        result.append(
            {
                "symbol": h.symbol,
                "display_name": h.display_name or SYMBOL_DISPLAY_NAMES.get(h.symbol, h.symbol),
                "quantity": h.quantity,
                "avg_buy_price": h.avg_buy_price,
                "current_price": live_price,
                "cost_basis": cost_basis,
                "current_value": current_value,
                "pnl": pnl,
                "pnl_pct": pnl_pct,
                "sector": h.sector,
                "buy_date": h.buy_date.strftime("%d %b %Y") if h.buy_date else "",
            }
        )
    return result


def calculate_portfolio_value(user_id: int, db: Session) -> float:
    """Calculate total portfolio value from live holdings prices."""
    holdings = calculate_holdings_with_live_prices(user_id, db)
    return round(sum(h["current_value"] for h in holdings), 2)


def get_investment_history(user_id: int, db: Session) -> list[dict]:
    """Get investment history for a user."""
    investments = (
        db.query(Investment)
        .filter(Investment.user_id == user_id)
        .order_by(Investment.investment_date.asc())
        .all()
    )
    return [
        {
            "date": inv.investment_date.strftime("%d %b %Y"),
            "amount": inv.invested_amount,
            "current_value": inv.current_value,
            "profit": inv.current_profit,
            "return_pct": inv.return_percentage,
            "description": inv.description or "",
            "status": inv.status,
        }
        for inv in investments
    ]


def get_portfolio_history(user_id: int, db: Session) -> list[dict]:
    """Get daily portfolio snapshots for chart data."""
    snapshots = (
        db.query(DailyPortfolioSnapshot)
        .filter(DailyPortfolioSnapshot.user_id == user_id)
        .order_by(DailyPortfolioSnapshot.date.asc())
        .all()
    )
    return [
        {
            "date": s.date.isoformat(),
            "portfolio_value": s.portfolio_value,
            "invested_amount": s.invested_amount,
            "profit": s.profit,
            "return_pct": s.return_pct,
            "is_holiday": s.is_market_holiday,
            "holiday_name": s.holiday_name,
        }
        for s in snapshots
    ]


def build_investor_dashboard(user_id: int, db: Session) -> dict[str, Any]:
    """Assemble the complete dashboard data for an investor."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {"error": "User not found"}

    portfolio = db.query(Portfolio).filter(Portfolio.user_id == user_id).first()
    holdings_data = calculate_holdings_with_live_prices(user_id, db)
    charges = calculate_charges(user_id, db)
    history = get_investment_history(user_id, db)
    portfolio_history = get_portfolio_history(user_id, db)
    market_status = get_market_status()

    # Calculate portfolio value from live holdings
    gross_value = round(sum(h["current_value"] for h in holdings_data), 2)
    total_invested = portfolio.total_invested if portfolio else 0.0
    total_charges_amount = charges["total_charges"]
    net_value = round(gross_value - total_charges_amount, 2)
    net_profit = round(net_value - total_invested, 2)
    overall_return = round((net_profit / total_invested) * 100, 2) if total_invested > 0 else 0.0
    gross_profit = round(gross_value - total_invested, 2)
    gross_return = round((gross_profit / total_invested) * 100, 2) if total_invested > 0 else 0.0

    # Update investments current values
    investments = db.query(Investment).filter(Investment.user_id == user_id).order_by(Investment.investment_date.asc()).all()
    if investments:
        # Distribute gross value proportionally across investments
        total_inv = sum(i.invested_amount for i in investments)
        for inv in investments:
            proportion = inv.invested_amount / total_inv if total_inv > 0 else 0
            inv.current_value = round(gross_value * proportion, 2)
            inv.current_profit = round(inv.current_value - inv.invested_amount, 2)
            inv.return_percentage = round((inv.current_profit / inv.invested_amount) * 100, 2) if inv.invested_amount > 0 else 0
        db.commit()
        # Refresh history after update
        history = get_investment_history(user_id, db)

    # Portfolio allocation by sector
    allocation: dict[str, float] = {}
    for h in holdings_data:
        sector = h.get("sector", "General")
        allocation[sector] = allocation.get(sector, 0) + h["current_value"]
    total_val = sum(allocation.values())
    allocation_list = [
        {"name": k, "value": round((v / total_val) * 100, 1) if total_val > 0 else 0}
        for k, v in allocation.items()
    ]

    # Holding period
    earliest_investment = min((inv.investment_date for inv in investments), default=datetime.utcnow()) if investments else datetime.utcnow()
    days_held = (datetime.utcnow() - earliest_investment).days
    holding_period = f"{days_held} days"

    # Today's date for IST
    now_ist = datetime.utcnow() + timedelta(hours=5, minutes=30)
    today = now_ist.date()
    is_holiday_flag, holiday_name = is_market_holiday(today)

    return {
        "profile": {
            "investor_id": user.investor_id or "",
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role,
            "account_type": "Individual Investor",
            "kyc_status": "Verified",
            "account_status": "Active" if user.is_active else "Inactive",
            "risk_profile": "Aggressive",
            "portfolio_manager": "BLACKBUSER Quantitative Fund",
            "client_since": earliest_investment.strftime("%d %B %Y"),
        },
        "portfolio_summary": {
            "total_invested": total_invested,
            "gross_value": gross_value,
            "net_value": net_value,
            "gross_profit": gross_profit,
            "gross_return": gross_return,
            "net_profit": net_profit,
            "overall_return": overall_return,
            "health_score": portfolio.health_score if portfolio else 94,
            "holding_period": holding_period,
            "last_sync": portfolio.last_sync_at.strftime("%d %b %Y, %I:%M:%S %p") if portfolio and portfolio.last_sync_at else now_ist.strftime("%d %b %Y, %I:%M:%S %p"),
        },
        "holdings": holdings_data,
        "charges": charges,
        "investment_history": history,
        "portfolio_history": portfolio_history,
        "allocation": allocation_list,
        "market_status": market_status,
        "is_holiday": is_holiday_flag,
        "holiday_name": holiday_name,
        "analytics": {
            "daily": 2.1,
            "weekly": 4.4,
            "monthly": 10.6,
            "yearly": 105.66,
            "cagr": 68.3,
            "drawdown": -4.7,
            "sharpe": 1.62,
            "win_rate": 74,
        },
    }
