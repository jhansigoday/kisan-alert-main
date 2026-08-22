"""Farm-risk assessment based on real weather and farmer-provided data.

This intentionally does not claim to be satellite/NDVI monitoring. A genuine
NDVI score needs field boundaries and a satellite provider account.
"""


def get_field_health_report(latitude: float, longitude: float, field_id: str = "field_1", profile=None) -> dict:
    """Return a transparent, profile-aware farm risk score using live weather."""
    profile = profile or {}
    from weather_alert import get_weather_alert

    score = 75
    factors = []
    try:
        weather = get_weather_alert(latitude, longitude)
        if weather.get("error"):
            raise RuntimeError(weather["error"])
        current = weather.get("weather", {})
        forecast = weather.get("forecast", [])
        tomorrow = forecast[1] if len(forecast) > 1 else {}
        if current.get("temp_c", 0) >= 38:
            score -= 15
            factors.append("High temperature increases crop water stress.")
        if tomorrow.get("rain_mm", 0) >= 20:
            score -= 10
            factors.append("Heavy rain may cause waterlogging or wash off sprays.")
        if weather.get("dry_spell_warning"):
            score -= 12
            factors.append("A dry spell is forecast; review irrigation scheduling.")
    except Exception:
        factors.append("Live weather was unavailable, so weather risk could not be scored.")

    try:
        ph = float(profile.get("soil_ph", 0))
        if ph and not 5.5 <= ph <= 7.5:
            score -= 8
            factors.append(f"Soil pH {ph:g} may limit nutrient availability for some crops.")
    except (TypeError, ValueError):
        pass

    water = str(profile.get("water_availability", "")).lower()
    irrigation = str(profile.get("irrigation_method", "")).lower()
    if any(value in water for value in ("low", "limited", "scarce")):
        score -= 8
        factors.append("Limited water availability raises moisture-stress risk.")
    elif any(value in irrigation for value in ("drip", "sprinkler")):
        score += 4
        factors.append("Efficient irrigation reduces water-use risk.")

    score = max(0, min(100, score))
    if score >= 80:
        status = "Low current risk"
    elif score >= 60:
        status = "Moderate risk — monitor field"
    else:
        status = "High risk — inspect field promptly"

    return {
        "field_id": field_id,
        "location": {"latitude": latitude, "longitude": longitude},
        "risk_score": score,
        "health_status": status,
        "factors": factors or ["No major weather or profile risks detected today."],
        "source": "Profile + live Open-Meteo weather risk assessment (not satellite/NDVI)",
    }
