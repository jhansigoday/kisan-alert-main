"""
market_price.py — real-time market price intelligence by GPS location
Uses coordinates to dynamically predict closest mandis and prices.
"""

import os
import requests


def _location_terms(location: str) -> set:
    """Turn a farmer's saved village/district/state text into matchable terms."""
    return {
        part.strip().lower()
        for part in (location or "").replace(";", ",").split(",")
        if len(part.strip()) >= 3
    }


_OFFICIAL_COMMODITY_NAMES = {
    "rice": "Paddy(Dhan)(Common)",
    "paddy": "Paddy(Dhan)(Common)",
    "maize": "Maize",
    "corn": "Maize",
    "groundnut": "Groundnut",
    "cotton": "Cotton",
    "chilli": "Chilly",
    "tomato": "Tomato",
}

_INDIAN_STATES = (
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
    "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
)

# Verified historical AGMARKNET market records retained solely as an honest
# fallback for demos when the live government feed is unavailable.  They are
# intentionally dated and never labelled as live prices.
_HISTORICAL_AGMARKNET_RECORDS = {
    "andhra pradesh:paddy(dhan)(common)": [
        {"market": "Nellore", "district": "Nellore", "state": "Andhra Pradesh", "commodity": "Paddy(Dhan)(Common)", "min_price": 2369, "max_price": 2389, "modal_price": 2375, "reported_date": "2025-10-30"},
        {"market": "Atmakur(SPS)", "district": "Nellore", "state": "Andhra Pradesh", "commodity": "Paddy(Dhan)(Common)", "min_price": 2300, "max_price": 2400, "modal_price": 2320, "reported_date": "2025-10-30"},
        {"market": "Rapur", "district": "Nellore", "state": "Andhra Pradesh", "commodity": "Paddy(Dhan)(Common)", "min_price": 2370, "max_price": 2490, "modal_price": 2460, "reported_date": "2025-09-26"},
    ]
}


def _state_from_location(location: str) -> str:
    normalized = (location or "").lower()
    return next((state for state in _INDIAN_STATES if state.lower() in normalized), "")


def _historical_fallback(crop: str, location: str):
    state = _state_from_location(location)
    commodity = _OFFICIAL_COMMODITY_NAMES.get(crop.lower().strip(), crop.title())
    records = _HISTORICAL_AGMARKNET_RECORDS.get(f"{state.lower()}:{commodity.lower()}")
    if not records:
        return None
    prices = [record["modal_price"] for record in records]
    return {
        "available": True,
        "data_mode": "historical",
        "crop": crop,
        "min_price": min(prices),
        "max_price": max(prices),
        "modal_price": records[0]["modal_price"],
        "unit": "per quintal",
        "nearest_markets": records,
        "price_trend_30d": [],
        "source": "AGMARKNET / Government of India historical records",
        "message": "Latest available historical AGMARKNET records.",
    }


def get_market_price(crop: str, lat: float = 14.4426, lon: float = 79.9865, location: str = "") -> dict:
    """
    Fetches official AGMARKNET records through data.gov.in when a data.gov.in
    API key is configured. Never present AI-generated or random values as a
    market price.
    """
    crop_clean = crop.lower().strip()
    location_terms = _location_terms(location)
    official_commodity = _OFFICIAL_COMMODITY_NAMES.get(crop_clean, crop.title())
    state = _state_from_location(location)
    
    api_key = os.environ.get("DATA_GOV_API_KEY")
    if not api_key:
        fallback = _historical_fallback(crop, location)
        if fallback:
            return fallback
        return {
            "available": False,
            "crop": crop,
            "message": "Live mandi prices require a DATA_GOV_API_KEY from data.gov.in.",
            "source": "No live price feed configured"
        }

    # AGMARKNET's public daily-price resource maintained by the Ministry of
    # Agriculture. Prices are wholesale rupees per quintal.
    api_url = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"
    params = {
        "api-key": api_key,
        "format": "json",
        # A small result set is enough for the dashboard and prevents the
        # official service timing out on a large nationwide response.
        "limit": 10,
        "filters[commodity]": official_commodity,
    }
    if state:
        params["filters[state]"] = state

    try:
        response = requests.get(api_url, params=params, timeout=10)
        response.raise_for_status()
        records = response.json().get("records", [])
    except requests.Timeout:
        # Do not expose connection details to farmers.  The data.gov.in feed
        # can occasionally be slow, especially during peak traffic.
        fallback = _historical_fallback(crop, location)
        if fallback:
            return fallback
        return {
            "available": False,
            "crop": crop,
            "message": "Official mandi prices are taking longer than usual. Please try again in a few minutes.",
            "source": "AGMARKNET / data.gov.in"
        }
    except requests.RequestException:
        fallback = _historical_fallback(crop, location)
        if fallback:
            return fallback
        return {
            "available": False,
            "crop": crop,
            "message": "Official mandi prices are temporarily unavailable. Please try again shortly.",
            "source": "AGMARKNET / data.gov.in"
        }

    markets = []
    for record in records:
        try:
            state = str(record.get("state") or "").strip()
            district = str(record.get("district") or "").strip()
            market = str(record.get("market") or record.get("market_name") or "Reported mandi").strip()
            # The official feed has mandi names and administrative areas, but
            # not their coordinates. Rank local district/state records first;
            # never fabricate a distance from the farm's GPS point.
            match_score = sum(
                term in {state.lower(), district.lower(), market.lower()}
                for term in location_terms
            )
            markets.append({
                "market": market,
                "price": float(record.get("modal_price") or record.get("modal price")),
                "min_price": float(record.get("min_price") or record.get("min price")),
                "max_price": float(record.get("max_price") or record.get("max price")),
                "commodity": record.get("commodity") or official_commodity,
                "distance_km": None,
                "state": state,
                "district": district,
                "reported_date": record.get("arrival_date") or record.get("price_date") or "",
                "match_score": match_score,
            })
        except (TypeError, ValueError):
            continue
    if not markets:
        fallback = _historical_fallback(crop, location)
        if fallback:
            return fallback
        return {"available": False, "crop": crop, "message": "No current official records found for this crop.", "source": "AGMARKNET / data.gov.in"}
    markets.sort(key=lambda item: (-item["match_score"], item["market"].lower()))
    selected_markets = markets[:3]
    prices = [market["price"] for market in selected_markets]
    for market in selected_markets:
        market.pop("match_score", None)
    return {
        "available": True, "crop": crop, "min_price": min(prices), "max_price": max(prices),
        "modal_price": selected_markets[0]["price"], "unit": "per quintal", "nearest_markets": selected_markets,
        "weekly_trend": "Official historical trend not loaded", "monthly_trend": "Official historical trend not loaded",
        "price_trend_30d": [], "source": "AGMARKNET / data.gov.in official daily prices",
        "data_mode": "live",
        "location_filter": location or "No saved location",
    }
