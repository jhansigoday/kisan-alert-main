"""
satellite_monitoring.py — crop health monitoring via satellite/UAV imagery
SIMULATED — no free satellite imagery API was available to wire up in this
timeframe. Structure mirrors a real NDVI-based health score pipeline so a
real provider (Sentinel Hub, Planet, etc.) can be swapped in later with
minimal changes.
"""

import random
from datetime import datetime, timedelta


def get_field_health_report(latitude: float, longitude: float, field_id: str = "field_1") -> dict:
    """
    Returns a simulated NDVI-style vegetation health report.
    Real version would call Sentinel Hub / Planet Labs API here.
    """
    seed = int((latitude * 1000 + longitude * 1000)) % 1000
    rng = random.Random(seed)

    ndvi = round(rng.uniform(0.3, 0.85), 2)  # NDVI range: -1 to 1, healthy vegetation ~0.6-0.9

    if ndvi >= 0.7:
        health_status = "healthy"
        alert = None
    elif ndvi >= 0.5:
        health_status = "moderate stress"
        alert = "Some areas of the field show reduced vigor — consider a ground check."
    else:
        health_status = "high stress"
        alert = "⚠️ Significant vegetation stress detected. Recommend immediate field inspection."

    history = []
    base_date = datetime.now()
    for i in range(4, -1, -1):
        d = base_date - timedelta(days=i * 7)
        history.append({
            "date": d.strftime("%Y-%m-%d"),
            "ndvi": round(ndvi + rng.uniform(-0.1, 0.1), 2),
        })

    return {
        "field_id": field_id,
        "location": {"latitude": latitude, "longitude": longitude},
        "ndvi_current": ndvi,
        "health_status": health_status,
        "alert": alert,
        "ndvi_history_5weeks": history,
        "source": "SIMULATED DATA — for demo only, not a live satellite feed",
    }