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


def get_market_price(crop: str, lat: float = 14.4426, lon: float = 79.9865, location: str = "") -> dict:
    """
    Fetches official AGMARKNET records through data.gov.in when a data.gov.in
    API key is configured. Never present AI-generated or random values as a
    market price.
    """
    crop_clean = crop.lower().strip()
    location_terms = _location_terms(location)
    
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
            # A small result set is enough for the dashboard and prevents the
            # official service timing out on a large nationwide response.
            "limit": 25,
            "filters[commodity]": crop_clean.title(),
        }, timeout=6)
        response.raise_for_status()
        records = response.json().get("records", [])
    except requests.Timeout:
        # Do not expose connection details to farmers.  The data.gov.in feed
        # can occasionally be slow, especially during peak traffic.
        return {
            "available": False,
            "crop": crop,
            "message": "Official mandi prices are taking longer than usual. Please try again in a few minutes.",
            "source": "AGMARKNET / data.gov.in"
        }
    except requests.RequestException:
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
                "distance_km": None,
                "state": state,
                "district": district,
                "reported_date": record.get("arrival_date") or record.get("price_date") or "",
                "match_score": match_score,
            })
        except (TypeError, ValueError):
            continue
    if not markets:
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
        "location_filter": location or "No saved location",
    }
