"""
market_price.py — real-time market price intelligence by GPS location
Uses coordinates to dynamically predict closest mandis and prices.
"""

import os
import json
import requests

_FALLBACK_MARKETS = {
    "rice": {
        "crop": "Rice (Paddy)",
        "available": True,
        "min_price": 2150,
        "max_price": 2350,
        "modal_price": 2250,
        "yesterday_price": 2240,
        "unit": "per quintal",
        "weekly_trend": "+1.2% (Rising)",
        "monthly_trend": "+3.8% (Rising)",
        "nearest_markets": [
            {"market": "Nellore Mandi", "price": 2250, "distance_km": 4.5},
            {"market": "Kavali Mandi", "price": 2210, "distance_km": 12.0},
            {"market": "Guntur Mandi", "price": 2320, "distance_km": 45.0}
        ],
        "highest_paying_market": "Guntur Mandi (₹2,320)",
        "lowest_paying_market": "Kavali Mandi (₹2,210)"
    }
}


def get_market_price(crop: str, lat: float = 14.4426, lon: float = 79.9865) -> dict:
    """
    Fetches official AGMARKNET records through data.gov.in when a data.gov.in
    API key is configured. Never present AI-generated or random values as a
    market price.
    """
    crop_clean = crop.lower().strip()
    
    api_key = os.environ.get("DATA_GOV_API_KEY")
    if not api_key:
        return {
            "available": False,
            "crop": crop,
            "message": "Live mandi prices require a DATA_GOV_API_KEY from data.gov.in.",
            "source": "No live price feed configured"
        }

    # AGMARKNET's public daily-price resource maintained by the Ministry of
    # Agriculture. Prices are wholesale rupees per quintal.
    api_url = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"
    try:
        response = requests.get(api_url, params={
            "api-key": api_key,
            "format": "json",
            "limit": 100,
            "filters[commodity]": crop_clean.title(),
        }, timeout=12)
        response.raise_for_status()
        records = response.json().get("records", [])
    except Exception as e:
        return {"available": False, "crop": crop, "message": f"Official mandi feed unavailable: {e}", "source": "AGMARKNET / data.gov.in"}

    markets = []
    for record in records[:3]:
        try:
            markets.append({
                "market": record.get("market") or record.get("market_name") or "Reported mandi",
                "price": float(record.get("modal_price") or record.get("modal price")),
                "distance_km": None,
            })
        except (TypeError, ValueError):
            continue
    if not markets:
        return {"available": False, "crop": crop, "message": "No current official records found for this crop.", "source": "AGMARKNET / data.gov.in"}
    prices = [market["price"] for market in markets]
    return {
        "available": True, "crop": crop, "min_price": min(prices), "max_price": max(prices),
        "modal_price": markets[0]["price"], "unit": "per quintal", "nearest_markets": markets,
        "weekly_trend": "Official historical trend not loaded", "monthly_trend": "Official historical trend not loaded",
        "price_trend_30d": [], "source": "AGMARKNET / data.gov.in official daily prices"
    }
