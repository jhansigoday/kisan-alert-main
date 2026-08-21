"""
feedback.py — simple feedback logging so the advisory model can improve over time.
Day 1/2 version: local JSON append. Swap for a DB later.
"""

import os
import json
from datetime import datetime

FEEDBACK_PATH = os.path.join(os.path.dirname(__file__), "feedback_log.json")


def log_feedback(query_id: str, rating: int, comment: str = "") -> dict:
    """rating: 1-5"""
    entry = {
        "query_id": query_id,
        "rating": rating,
        "comment": comment,
        "timestamp": datetime.now().isoformat(),
    }

    if os.path.exists(FEEDBACK_PATH):
        with open(FEEDBACK_PATH, "r", encoding="utf-8") as f:
            log = json.load(f)
    else:
        log = []

    log.append(entry)

    with open(FEEDBACK_PATH, "w", encoding="utf-8") as f:
        json.dump(log, f, indent=2)

    return entry