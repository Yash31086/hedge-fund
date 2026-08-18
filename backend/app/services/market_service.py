"""Market data service — fetches real stock prices from Yahoo Finance and detects NSE holidays."""

from datetime import date, datetime, timedelta
from typing import Any

import yfinance as yf
from sqlalchemy.orm import Session

from app.models.stock_price import StockPrice


# Yahoo Finance ticker mapping for Indian market
SYMBOL_MAP: dict[str, str] = {
    "NIFTY": "^NSEI",
    "BANKNIFTY": "^NSEBANK",
    "RELIANCE": "RELIANCE.NS",
}

SYMBOL_DISPLAY_NAMES: dict[str, str] = {
    "NIFTY": "NIFTY 50",
    "BANKNIFTY": "BANK NIFTY",
    "RELIANCE": "Reliance Industries",
}

# NSE Holidays 2026 (official exchange holidays)
NSE_HOLIDAYS_2026: dict[str, str] = {
    "2026-01-26": "Republic Day",
    "2026-03-10": "Maha Shivaratri",
    "2026-03-17": "Holi",
    "2026-03-31": "Id-Ul-Fitr (Ramadan Eid)",
    "2026-04-02": "Ram Navami",
    "2026-04-03": "Good Friday",
    "2026-04-14": "Dr. Ambedkar Jayanti",
    "2026-05-01": "Maharashtra Day",
    "2026-05-25": "Buddha Purnima",
    "2026-06-07": "Bakrid / Eid ul-Adha",
    "2026-07-06": "Muharram",
    "2026-08-15": "Independence Day",
    "2026-08-16": "Janmashtami",  # Observed
    "2026-09-04": "Milad-un-Nabi",
    "2026-10-02": "Mahatma Gandhi Jayanti",
    "2026-10-20": "Dussehra",
    "2026-10-21": "Dussehra Holiday",
    "2026-11-09": "Diwali (Laxmi Puja)",
    "2026-11-10": "Diwali Balipratipada",
    "2026-11-19": "Guru Nanak Jayanti",
    "2026-12-25": "Christmas",
}


def is_market_holiday(check_date: date) -> tuple[bool, str | None]:
    """Check if a given date is an NSE holiday or weekend."""
    if check_date.weekday() >= 5:  # Saturday=5, Sunday=6
        return True, "Weekend"
    date_str = check_date.strftime("%Y-%m-%d")
    if date_str in NSE_HOLIDAYS_2026:
        return True, NSE_HOLIDAYS_2026[date_str]
    return False, None


def get_market_status() -> dict[str, Any]:
    """Get current market status (LIVE / MARKET CLOSED / HOLIDAY)."""
    now = datetime.utcnow() + timedelta(hours=5, minutes=30)  # IST
    today = now.date()
    is_holiday_flag, holiday_name = is_market_holiday(today)

    if is_holiday_flag:
        return {
            "status": "HOLIDAY",
            "label": f"Market Holiday — {holiday_name}",
            "holiday_name": holiday_name,
            "timestamp": now.isoformat(),
        }

    hour, minute = now.hour, now.minute
    minutes_since_midnight = hour * 60 + minute
    market_open = 9 * 60 + 15   # 9:15 AM
    market_close = 15 * 60 + 30  # 3:30 PM

    if market_open <= minutes_since_midnight <= market_close:
        return {"status": "LIVE", "label": "Live Market", "timestamp": now.isoformat()}

    return {"status": "CLOSED", "label": "Market Closed", "timestamp": now.isoformat()}


def fetch_stock_prices(
    symbol: str, start_date: date, end_date: date, db: Session
) -> list[dict]:
    """Fetch real stock prices from Yahoo Finance and store them in the database.

    Returns the list of price records.
    """
    yf_symbol = SYMBOL_MAP.get(symbol)
    if not yf_symbol:
        return []

    ticker = yf.Ticker(yf_symbol)
    # Extend end_date by 1 day since yfinance end is exclusive
    hist = ticker.history(start=start_date.isoformat(), end=(end_date + timedelta(days=1)).isoformat())

    records: list[dict] = []
    for idx, row in hist.iterrows():
        row_date = idx.date() if hasattr(idx, "date") else idx
        existing = (
            db.query(StockPrice)
            .filter(StockPrice.symbol == symbol, StockPrice.date == row_date)
            .first()
        )
        if existing:
            existing.open = round(float(row["Open"]), 2)
            existing.high = round(float(row["High"]), 2)
            existing.low = round(float(row["Low"]), 2)
            existing.close = round(float(row["Close"]), 2)
            existing.volume = int(row.get("Volume", 0))
            existing.is_holiday = False
        else:
            price_record = StockPrice(
                symbol=symbol,
                date=row_date,
                open=round(float(row["Open"]), 2),
                high=round(float(row["High"]), 2),
                low=round(float(row["Low"]), 2),
                close=round(float(row["Close"]), 2),
                volume=int(row.get("Volume", 0)),
                is_holiday=False,
            )
            db.add(price_record)

        records.append(
            {
                "date": row_date.isoformat(),
                "open": round(float(row["Open"]), 2),
                "high": round(float(row["High"]), 2),
                "low": round(float(row["Low"]), 2),
                "close": round(float(row["Close"]), 2),
                "volume": int(row.get("Volume", 0)),
            }
        )

    db.commit()
    return records


def get_latest_price(symbol: str, db: Session) -> float:
    """Get the latest closing price for a symbol from the database."""
    record = (
        db.query(StockPrice)
        .filter(StockPrice.symbol == symbol, StockPrice.is_holiday == False)
        .order_by(StockPrice.date.desc())
        .first()
    )
    if record:
        return record.close

    # Fallback: fetch from Yahoo Finance directly
    yf_symbol = SYMBOL_MAP.get(symbol)
    if not yf_symbol:
        return 0.0
    try:
        ticker = yf.Ticker(yf_symbol)
        hist = ticker.history(period="5d")
        if not hist.empty:
            return round(float(hist["Close"].iloc[-1]), 2)
    except Exception:
        pass
    return 0.0


def get_price_history(symbol: str, db: Session, start_date: date | None = None, end_date: date | None = None) -> list[dict]:
    """Get stored price history for a symbol."""
    query = db.query(StockPrice).filter(
        StockPrice.symbol == symbol, StockPrice.is_holiday == False
    )
    if start_date:
        query = query.filter(StockPrice.date >= start_date)
    if end_date:
        query = query.filter(StockPrice.date <= end_date)

    records = query.order_by(StockPrice.date.asc()).all()
    return [
        {
            "date": r.date.isoformat(),
            "open": r.open,
            "high": r.high,
            "low": r.low,
            "close": r.close,
            "volume": r.volume,
        }
        for r in records
    ]


def refresh_all_prices(db: Session) -> None:
    """Refresh prices for all tracked symbols from Yahoo Finance."""
    end = date.today()
    start = end - timedelta(days=7)  # Last 7 days to catch any gaps
    for symbol in SYMBOL_MAP:
        try:
            fetch_stock_prices(symbol, start, end, db)
        except Exception as e:
            print(f"Error refreshing {symbol}: {e}")
