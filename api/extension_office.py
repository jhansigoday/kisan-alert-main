"""
extension_office.py — nearest agricultural extension office lookup
MOCK DATA — real office directories (Rythu Seva Kendra / KVK) aren't available
via a fast free API. Structure is real; swap with a real government dataset
(data.gov.in has some KVK listings) once the team has time to integrate it.
"""

import math

_OFFICES = [
    {"name": "Rythu Seva Kendra, Visakhapatnam Rural", "district": "Visakhapatnam",
     "latitude": 17.7231, "longitude": 83.3013, "phone": "+91-891-2345678"},
    {"name": "Krishi Vigyan Kendra, Anakapalle", "district": "Anakapalle",
     "latitude": 17.6910, "longitude": 82.9995, "phone": "+91-891-2987654"},
    {"name": "Rythu Seva Kendra, Vizianagaram", "district": "Vizianagaram",
     "latitude": 18.1067, "longitude": 83.4116, "phone": "+91-892-2456789"},
    {"name": "Krishi Vigyan Kendra, Srikakulam", "district": "Srikakulam",
     "latitude": 18.2949, "longitude": 83.8938, "phone": "+91-894-2234567"},
]


def _haversine_km(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    return R * 2 * math.asin(math.sqrt(a))


def find_nearest_office(latitude: float, longitude: float) -> dict:
    scored = []
    for office in _OFFICES:
        dist = _haversine_km(latitude, longitude, office["latitude"], office["longitude"])
        scored.append({**office, "distance_km": round(dist, 1)})
    scored.sort(key=lambda x: x["distance_km"])
    return {
        "nearest_office": scored[0],
        "source": "MOCK DATA — sample offices for demo, swap with real KVK/data.gov.in directory later",
    }