"""
Location Tools — geocoding and distance utilities.

Mock implementation.  Replace with Google Maps / Nominatim / PostGIS later.
"""

from __future__ import annotations

import logging
import math
from typing import Optional

logger = logging.getLogger(__name__)


async def reverse_geocode(
    latitude: float, longitude: float
) -> Optional[str]:
    """Convert coordinates to a human-readable address.

    Replace with: Google Maps Geocoding API / Nominatim.
    """
    logger.info(
        "reverse_geocode called for lat=%s, lon=%s", latitude, longitude
    )
    # Mock: return a plausible address
    return f"Near ({latitude:.4f}, {longitude:.4f}), Municipal Ward 12"


def calculate_distance(
    lat1: float, lon1: float, lat2: float, lon2: float
) -> float:
    """Return the Haversine distance in kilometres between two points."""
    R = 6371.0  # Earth radius in km
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(d_lon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c
