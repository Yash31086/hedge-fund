"""Seed the database with investor data from the deployed BLACKBUSER portal.

Seeds:
- Users (Yash admin, Anuj, Himanshu, Kapil Kaushik)
- Portfolios, Investments, Holdings, Charges
- Historical stock prices from Yahoo Finance
- Daily portfolio snapshots for chart data
"""

import sys
import os
from datetime import date, datetime, timedelta

# Ensure the backend directory is in the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database.session import engine, SessionLocal
from app.database.base import Base
from app.models.user import User
from app.models.portfolio import Portfolio
from app.models.investment import Investment
from app.models.charge import Charge
from app.models.holding import Holding
from app.models.stock_price import StockPrice
from app.models.daily_portfolio_snapshot import DailyPortfolioSnapshot
from app.models.audit_log import AuditLog
from app.models.otp_verification import OTPVerification
from app.services.auth_service import hash_password
from app.services.market_service import (
    fetch_stock_prices,
    get_latest_price,
    is_market_holiday,
    SYMBOL_MAP,
)


def seed():
    # Recreate all tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("[OK] Database tables created")

    db = SessionLocal()

    try:
        # -- Users --
        admin = User(
            investor_id="BB-ADMIN",
            full_name="Yash Pundeer",
            email="yashpundeer7@gmail.com",
            password_hash=hash_password("Admin@2026"),
            role="ADMIN",
            email_verified=True,
            is_active=True,
        )

        anuj = User(
            investor_id="BB-1002",
            full_name="Anuj",
            email="anni44600@gmail.com",
            password_hash=hash_password("Anuj@2026"),
            role="INVESTOR",
            email_verified=True,
            is_active=True,
        )

        himanshu = User(
            investor_id="BB-1003",
            full_name="Himanshu",
            email="hritikmishra726@gmail.com",
            password_hash=hash_password("Himanshu@2026"),
            role="INVESTOR",
            email_verified=True,
            is_active=True,
        )

        kapil = User(
            investor_id="BB-1001",
            full_name="Kapil Kaushik",
            email="kapilllkaushik09@gmail.com",
            password_hash=hash_password("Kapil@2026"),
            role="INVESTOR",
            email_verified=True,
            is_active=True,
        )

        db.add_all([admin, anuj, himanshu, kapil])
        db.commit()
        db.refresh(admin)
        db.refresh(anuj)
        db.refresh(himanshu)
        db.refresh(kapil)
        print("[OK] Users seeded")

        # -- Fetch Historical Stock Prices --
        print("  Fetching stock prices from Yahoo Finance...")
        price_start = date(2026, 4, 1)
        price_end = date.today()
        for symbol in SYMBOL_MAP:
            try:
                records = fetch_stock_prices(symbol, price_start, price_end, db)
                print(f"  [OK] {symbol}: {len(records)} price records")
            except Exception as e:
                print(f"  [FAIL] {symbol}: {e}")

        # -- Himanshu's Data (BB-1003) --
        print("  Seeding Himanshu's data...")

        h_portfolio = Portfolio(
            user_id=himanshu.id,
            total_invested=25000.0,
            current_value=30318.49,
            gross_value=30318.49,
            net_value=30114.50,
            total_profit=5318.49,
            total_return=21.27,
            total_charges=203.99,
            health_score=94,
            last_sync_at=datetime(2026, 8, 16, 9, 30, 0),
        )
        db.add(h_portfolio)

        h_inv1 = Investment(
            user_id=himanshu.id,
            investment_date=datetime(2026, 4, 20),
            invested_amount=5000.0,
            current_value=10318.49,
            current_profit=5318.49,
            return_percentage=106.37,
            description="Initial Investment",
            status="ACTIVE",
        )
        h_inv2 = Investment(
            user_id=himanshu.id,
            investment_date=datetime(2026, 8, 16),
            invested_amount=25000.0,
            current_value=30318.49,
            current_profit=5318.49,
            return_percentage=21.27,
            description="Additional Capital Deployment",
            status="ACTIVE",
        )
        db.add_all([h_inv1, h_inv2])

        h_holdings = [
            Holding(
                user_id=himanshu.id,
                symbol="NIFTY",
                display_name="NIFTY 50",
                quantity=0.551,
                avg_buy_price=22000.0,
                buy_date=datetime(2026, 8, 16),
                sector="Index",
                status="ACTIVE",
            ),
            Holding(
                user_id=himanshu.id,
                symbol="BANKNIFTY",
                display_name="BANK NIFTY",
                quantity=0.285,
                avg_buy_price=49000.0,
                buy_date=datetime(2026, 8, 16),
                sector="Index",
                status="ACTIVE",
            ),
            Holding(
                user_id=himanshu.id,
                symbol="RELIANCE",
                display_name="Reliance Industries",
                quantity=1.739,
                avg_buy_price=2440.0,
                buy_date=datetime(2026, 8, 16),
                sector="Energy",
                status="ACTIVE",
            ),
        ]
        db.add_all(h_holdings)

        h_charge = Charge(
            user_id=himanshu.id,
            brokerage=0.0,
            stt=18.36,
            exchange_charges=5.69,
            sebi_charges=0.10,
            stamp_duty=3.79,
            gst=1.05,
            platform_fee=25.0,
            aws_fee=150.0,
            total_charges=203.99,
        )
        db.add(h_charge)
        db.commit()
        print("  [OK] Himanshu data seeded")

        # -- Anuj's Data (BB-1002) --
        print("  Seeding Anuj's data...")

        a_portfolio = Portfolio(
            user_id=anuj.id,
            total_invested=25000.0,
            current_value=10487.82,
            gross_value=10487.82,
            net_value=10283.04,
            total_profit=5487.82,
            total_return=109.76,
            total_charges=204.78,
            health_score=94,
        )
        db.add(a_portfolio)

        a_inv1 = Investment(
            user_id=anuj.id,
            investment_date=datetime(2026, 4, 15),
            invested_amount=5000.0,
            current_value=10487.82,
            current_profit=5487.82,
            return_percentage=109.76,
            description="Initial Investment",
            status="ACTIVE",
        )
        a_inv2 = Investment(
            user_id=anuj.id,
            investment_date=datetime(2026, 8, 16),
            invested_amount=20000.0,
            current_value=20000.0,
            current_profit=0.0,
            return_percentage=0.0,
            description="Additional Capital Deployment",
            status="ACTIVE",
        )
        db.add_all([a_inv1, a_inv2])

        a_holdings = [
            Holding(user_id=anuj.id, symbol="NIFTY", display_name="NIFTY 50", quantity=0.12, avg_buy_price=22000.0, buy_date=datetime(2026, 4, 15), sector="Index"),
            Holding(user_id=anuj.id, symbol="BANKNIFTY", display_name="BANK NIFTY", quantity=0.06, avg_buy_price=49000.0, buy_date=datetime(2026, 4, 15), sector="Index"),
            Holding(user_id=anuj.id, symbol="RELIANCE", display_name="Reliance Industries", quantity=0.35, avg_buy_price=2440.0, buy_date=datetime(2026, 4, 15), sector="Energy"),
            # Holdings for second investment
            Holding(user_id=anuj.id, symbol="NIFTY", display_name="NIFTY 50", quantity=0.363, avg_buy_price=22000.0, buy_date=datetime(2026, 8, 16), sector="Index"),
            Holding(user_id=anuj.id, symbol="BANKNIFTY", display_name="BANK NIFTY", quantity=0.163, avg_buy_price=49000.0, buy_date=datetime(2026, 8, 16), sector="Index"),
            Holding(user_id=anuj.id, symbol="RELIANCE", display_name="Reliance Industries", quantity=1.639, avg_buy_price=2440.0, buy_date=datetime(2026, 8, 16), sector="Energy"),
        ]
        db.add_all(a_holdings)

        a_charge = Charge(
            user_id=anuj.id, brokerage=0.0, stt=18.92, exchange_charges=5.84,
            sebi_charges=0.10, stamp_duty=3.84, gst=1.08, platform_fee=25.0,
            aws_fee=150.0, total_charges=204.78,
        )
        db.add(a_charge)
        db.commit()
        print("  [OK] Anuj data seeded")

        # -- Kapil's Data (BB-1001) --
        print("  Seeding Kapil's data...")

        k_portfolio = Portfolio(
            user_id=kapil.id,
            total_invested=23000.0,
            current_value=16968.30,
            gross_value=16968.30,
            net_value=16762.70,
            total_profit=3968.30,
            total_return=30.53,
            total_charges=205.60,
            health_score=94,
        )
        db.add(k_portfolio)

        k_inv1 = Investment(
            user_id=kapil.id,
            investment_date=datetime(2026, 5, 13),
            invested_amount=5000.0,
            current_value=8236.74,
            current_profit=3236.74,
            return_percentage=64.73,
            description="Initial Investment",
            status="ACTIVE",
        )
        k_inv2 = Investment(
            user_id=kapil.id,
            investment_date=datetime(2026, 7, 13),
            invested_amount=8000.0,
            current_value=8731.56,
            current_profit=731.56,
            return_percentage=9.14,
            description="Additional Capital",
            status="ACTIVE",
        )
        k_inv3 = Investment(
            user_id=kapil.id,
            investment_date=datetime(2026, 8, 9),
            invested_amount=10000.0,
            current_value=10000.0,
            current_profit=0.0,
            return_percentage=0.0,
            description="Additional Capital Deployment",
            status="ACTIVE",
        )
        db.add_all([k_inv1, k_inv2, k_inv3])

        k_holdings = [
            Holding(user_id=kapil.id, symbol="NIFTY", display_name="NIFTY 50", quantity=0.30, avg_buy_price=22000.0, buy_date=datetime(2026, 5, 13), sector="Index"),
            Holding(user_id=kapil.id, symbol="BANKNIFTY", display_name="BANK NIFTY", quantity=0.15, avg_buy_price=49000.0, buy_date=datetime(2026, 5, 13), sector="Index"),
            Holding(user_id=kapil.id, symbol="RELIANCE", display_name="Reliance Industries", quantity=0.85, avg_buy_price=2440.0, buy_date=datetime(2026, 5, 13), sector="Energy"),
            # Holdings for third investment
            Holding(user_id=kapil.id, symbol="NIFTY", display_name="NIFTY 50", quantity=0.181, avg_buy_price=22000.0, buy_date=datetime(2026, 8, 9), sector="Index"),
            Holding(user_id=kapil.id, symbol="BANKNIFTY", display_name="BANK NIFTY", quantity=0.081, avg_buy_price=49000.0, buy_date=datetime(2026, 8, 9), sector="Index"),
            Holding(user_id=kapil.id, symbol="RELIANCE", display_name="Reliance Industries", quantity=0.819, avg_buy_price=2440.0, buy_date=datetime(2026, 8, 9), sector="Energy"),
        ]
        db.add_all(k_holdings)

        k_charge = Charge(
            user_id=kapil.id, brokerage=0.0, stt=19.28, exchange_charges=6.02,
            sebi_charges=0.11, stamp_duty=4.08, gst=1.11, platform_fee=25.0,
            aws_fee=150.0, total_charges=205.60,
        )
        db.add(k_charge)
        db.commit()
        print("  [OK] Kapil data seeded")

        # -- Generate Daily Portfolio Snapshots --
        print("  Generating portfolio snapshots...")
        investors = [
            (himanshu, 30000.0, date(2026, 4, 20)),
            (anuj, 25000.0, date(2026, 4, 15)),
            (kapil, 23000.0, date(2026, 5, 13)),
        ]

        for user_obj, invested, start in investors:
            current_date = start
            today = date.today()
            while current_date <= today:
                holiday_flag, holiday_name = is_market_holiday(current_date)

                # Calculate portfolio value for this day using stored prices
                portfolio_value = 0.0
                user_holdings = db.query(Holding).filter(Holding.user_id == user_obj.id).all()
                for h in user_holdings:
                    price_record = (
                        db.query(StockPrice)
                        .filter(
                            StockPrice.symbol == h.symbol,
                            StockPrice.date <= current_date,
                            StockPrice.is_holiday == False,
                        )
                        .order_by(StockPrice.date.desc())
                        .first()
                    )
                    if price_record:
                        portfolio_value += price_record.close * h.quantity
                    else:
                        portfolio_value += h.avg_buy_price * h.quantity

                profit = round(portfolio_value - invested, 2)
                return_pct = round((profit / invested) * 100, 2) if invested > 0 else 0.0

                snapshot = DailyPortfolioSnapshot(
                    user_id=user_obj.id,
                    date=current_date,
                    portfolio_value=round(portfolio_value, 2),
                    invested_amount=invested,
                    profit=profit,
                    return_pct=return_pct,
                    is_market_holiday=holiday_flag,
                    holiday_name=holiday_name,
                )
                db.add(snapshot)
                current_date += timedelta(days=1)

            db.commit()
            print(f"  [OK] Snapshots for {user_obj.full_name}")

        print("")
        print("[DONE] Database seeded successfully!")
        print(f"   Users: {db.query(User).count()}")
        print(f"   Portfolios: {db.query(Portfolio).count()}")
        print(f"   Investments: {db.query(Investment).count()}")
        print(f"   Holdings: {db.query(Holding).count()}")
        print(f"   Charges: {db.query(Charge).count()}")
        print(f"   Stock Prices: {db.query(StockPrice).count()}")
        print(f"   Snapshots: {db.query(DailyPortfolioSnapshot).count()}")

    except Exception as e:
        db.rollback()
        print(f"\n[ERROR] {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    seed()
