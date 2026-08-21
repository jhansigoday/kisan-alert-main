"""
weather_alert.py — real weather + dry-spell detection
Uses Open-Meteo (free, no API key required): https://open-meteo.com
Supports English and Telugu translations for weather metrics.
"""

import requests
from datetime import datetime

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

_COND_TRANSLATIONS = {
    "te": {
        "Sunny": "ఎండగా ఉంది",
        "Partly Cloudy": "పాక్షికంగా మేఘావృతం",
        "Foggy": "పొగమంచు",
        "Light Drizzle": "తేలికపాటి జల్లులు",
        "Rainy": "వర్షం",
        "Thunderstorm": "ఉరుములతో కూడిన వర్షం",
        "Cloudy": "మేఘావృతం"
    }
}

_SUGGESTION_TRANSLATIONS = {
    "te": {
        "Avoid applying chemical fertilizers or sprays as they will wash off.": "రసాయన ఎరువులు లేదా మందులు పిచికారీ చేయడం నివారించండి, ఎందుకంటే అవి కొట్టుకుపోతాయి.",
        "Ensure all field drainage channels are cleared to prevent root waterlogging.": "పంట వేర్లలో నీరు నిల్వ ఉండకుండా చూసుకోవడానికి డ్రైనేజీ కాలువలను శుభ్రం చేయండి.",
        "Moderate rain expected tomorrow. You can delay irrigation scheduling.": "రేపు సాధారణ వర్షం వచ్చే అవకాశం ఉంది. నీటి తడులు వేయడం వాయిదా వేసుకోవచ్చు.",
        "Water crops in early morning cycles to prevent soil cracking and heat shock.": "నేల పగుళ్లు మరియు వేడి దెబ్బను నివారించడానికి పంటలకు తెల్లవారుజామున నీరు పెట్టండి.",
        "Drip irrigation cycles are recommended today to conserve groundwater.": "భూగర్భ జలాలను పొదుపు చేయడానికి డ్రిప్ పద్ధతిలో నీరు పెట్టడం మంచిది.",
        "Weather conditions are favorable. Maintain normal weeding and field protection.": "వాతావరణ परिस्थितियों అనుకూలంగా ఉన్నాయి. సాధారణ కలుపు తీత మరియు పంట రక్షణ చర్యలు కొనసాగించండి.",
        "Verify internet connectivity to reload current weather forecast alerts.": "ప్రస్తుత వాతావరణ హెచ్చరికలను లోడ్ చేయడానికి ఇంటర్నెట్ కనెక్షన్‌ను సరిచూసుకోండి."
    }
}


def wmo_to_condition_info(code: int) -> dict:
    """Maps WMO weather code to standard condition name and FontAwesome icon class."""
    if code is None:
        return {"name": "Sunny", "icon": "fa-sun"}
    if code == 0:
        return {"name": "Sunny", "icon": "fa-sun"}
    elif code in [1, 2, 3]:
        return {"name": "Partly Cloudy", "icon": "fa-cloud-sun"}
    elif code in [45, 48]:
        return {"name": "Foggy", "icon": "fa-smog"}
    elif code in [51, 53, 55]:
        return {"name": "Light Drizzle", "icon": "fa-cloud-rain"}
    elif code in [61, 63, 65, 80, 81, 82]:
        return {"name": "Rainy", "icon": "fa-cloud-showers-heavy"}
    elif code in [95, 96, 99]:
        return {"name": "Thunderstorm", "icon": "fa-cloud-bolt"}
    return {"name": "Cloudy", "icon": "fa-cloud"}


def get_weather_alert(latitude: float, longitude: float, lang: str = "en") -> dict:
    """
    Fetches weather forecasts (current + 5-day daily forecast) using coords.
    Translates response if lang == 'te'.
    """
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,pressure_msl,visibility",
        "daily": "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max",
        "timezone": "auto",
    }

    try:
        response = requests.get(OPEN_METEO_URL, params=params, timeout=12)
        response.raise_for_status()
        data = response.json()
    except Exception as e:
        print("Error fetching Open-Meteo weather:", e)
        fallback_msg = "Verify internet connectivity to reload current weather forecast alerts."
        if lang == "te":
            fallback_msg = _SUGGESTION_TRANSLATIONS["te"].get(fallback_msg, fallback_msg)
        return {
            "error": f"Weather service offline: {str(e)}",
            "weather": {
                "temp_c": 29,
                "feels_like": 31,
                "humidity": 65,
                "wind_speed": 12,
                "wind_direction": 180,
                "pressure": 1010,
                "visibility": 10000,
                "condition": "ఎండగా ఉంది" if lang == "te" else "Sunny",
                "icon": "fa-cloud-sun",
                "uv_index": 5,
                "sunrise": "05:40",
                "sunset": "18:35",
                "rain_prob": 10
            },
            "forecast": [],
            "alerts": [],
            "suggestions": [fallback_msg]
        }

    # 1. Parse Current Weather
    current = data.get("current", {})
    daily = data.get("daily", {})
    
    cond_info = wmo_to_condition_info(current.get("weather_code", 0))
    rain_probs = daily.get("precipitation_probability_max", [])
    
    cond_name = cond_info["name"]
    if lang == "te":
        cond_name = _COND_TRANSLATIONS["te"].get(cond_name, cond_name)

    weather_summary = {
        "temp_c": current.get("temperature_2m", 29),
        "feels_like": current.get("apparent_temperature", 31),
        "humidity": current.get("relative_humidity_2m", 65),
        "wind_speed": current.get("wind_speed_10m", 12),
        "wind_direction": current.get("wind_direction_10m", 180),
        "pressure": current.get("pressure_msl", 1012),
        "visibility": current.get("visibility", 10000),
        "condition": cond_name,
        "icon": cond_info["icon"],
        "rain_prob": rain_probs[0] if rain_probs else 0
    }

    # 2. Parse Daily 5-day Forecast
    dates = daily.get("time", [])
    rain = daily.get("precipitation_sum", [])
    tmax = daily.get("temperature_2m_max", [])
    tmin = daily.get("temperature_2m_min", [])
    weather_codes = daily.get("weather_code", [])
    sunrise_times = daily.get("sunrise", [])
    sunset_times = daily.get("sunset", [])
    uv_max = daily.get("uv_index_max", [])

    # Set UV index and sun times
    weather_summary["uv_index"] = uv_max[0] if uv_max else 5
    weather_summary["sunrise"] = sunrise_times[0][-5:] if sunrise_times else "05:40"
    weather_summary["sunset"] = sunset_times[0][-5:] if sunset_times else "18:35"

    forecast = []
    for i in range(min(7, len(dates))):
        c_info = wmo_to_condition_info(weather_codes[i] if i < len(weather_codes) else 0)
        c_name = c_info["name"]
        if lang == "te":
            c_name = _COND_TRANSLATIONS["te"].get(c_name, c_name)
        forecast.append({
            "date": dates[i],
            "rain_mm": rain[i] if i < len(rain) else 0,
            "rain_prob": rain_probs[i] if i < len(rain_probs) else 0,
            "temp_max_c": tmax[i] if i < len(tmax) else 32,
            "temp_min_c": tmin[i] if i < len(tmin) else 24,
            "condition": c_name,
            "icon": c_info["icon"]
        })

    # 3. Analyze warnings
    alerts = []
    suggestions = []

    dry_days = sum(1 for r in rain[:7] if r < 1.0)
    dry_spell_warning = dry_days >= 5
    
    tomorrow_rain = rain[1] if len(rain) > 1 else 0
    tomorrow_tmax = tmax[1] if len(tmax) > 1 else 30

    if tomorrow_rain > 20:
        alert_msg = f"Heavy Rainfall forecasted tomorrow ({tomorrow_rain}mm)."
        if lang == "te":
            alert_msg = f"రేపు భారీ వర్షం పడే అవకాశం ఉంది ({tomorrow_rain}mm)."
        alerts.append({
            "type": "HEAVY_RAIN",
            "message": alert_msg,
            "severity": "HIGH"
        })
        
        sug1 = "Avoid applying chemical fertilizers or sprays as they will wash off."
        sug2 = "Ensure all field drainage channels are cleared to prevent root waterlogging."
        if lang == "te":
            sug1 = _SUGGESTION_TRANSLATIONS["te"].get(sug1, sug1)
            sug2 = _SUGGESTION_TRANSLATIONS["te"].get(sug2, sug2)
        suggestions.append(sug1)
        suggestions.append(sug2)

    elif tomorrow_rain > 5:
        sug = "Moderate rain expected tomorrow. You can delay irrigation scheduling."
        if lang == "te":
            sug = _SUGGESTION_TRANSLATIONS["te"].get(sug, sug)
        suggestions.append(sug)

    if tomorrow_tmax > 38:
        alert_msg = f"Extreme heat wave: temperatures will reach {tomorrow_tmax}°C."
        if lang == "te":
            alert_msg = f"తీవ్రమైన ఎండ వేడిమి: ఉష్ణోగ్రతలు {tomorrow_tmax}°C కి చేరుకుంటాయి."
        alerts.append({
            "type": "EXTREME_HEAT",
            "message": alert_msg,
            "severity": "HIGH"
        })
        sug = "Water crops in early morning cycles to prevent soil cracking and heat shock."
        if lang == "te":
            sug = _SUGGESTION_TRANSLATIONS["te"].get(sug, sug)
        suggestions.append(sug)

    if dry_spell_warning:
        alert_msg = "Dry-spell risk: very little precipitation forecasted this week."
        if lang == "te":
            alert_msg = "పొడి వాతావరణం ప్రమాదం: ఈ వారం చాలా తక్కువ వర్షపాతం నమోదయ్యే అవకాశం ఉంది."
        alerts.append({
            "type": "DRY_SPELL",
            "message": alert_msg,
            "severity": "MEDIUM"
        })
        sug = "Drip irrigation cycles are recommended today to conserve groundwater."
        if lang == "te":
            sug = _SUGGESTION_TRANSLATIONS["te"].get(sug, sug)
        suggestions.append(sug)

    if not suggestions:
        sug = "Weather conditions are favorable. Maintain normal weeding and field protection."
        if lang == "te":
            sug = _SUGGESTION_TRANSLATIONS["te"].get(sug, sug)
        suggestions.append(sug)

    return {
        "location": {"latitude": latitude, "longitude": longitude},
        "weather": weather_summary,
        "forecast": forecast,
        "dry_days_next_week": dry_days,
        "dry_spell_warning": dry_spell_warning,
        "alerts": alerts,
        "suggestions": suggestions,
        "source": "Open-Meteo (live API)"
    }