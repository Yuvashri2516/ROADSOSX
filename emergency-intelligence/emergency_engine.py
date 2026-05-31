"""
RoadSoS X — Emergency Intelligence Engine (Member 5: Emergency Response & Maps Lead)

Responsibilities:
  - Find nearest trauma centers, ambulance services, police stations
  - Calculate traffic-aware routes using OSRM (free, no API key)
  - Severity-based hospital recommendation
  - Returns structured emergency dispatch payload
"""

import asyncio
import httpx
import math
from dataclasses import dataclass, asdict
from typing import Optional


# ── OSRM Public Routing API (OpenStreetMap, no key needed) ──
OSRM_BASE_URL = "http://router.project-osrm.org/route/v1/driving"

# ── Overpass API for finding hospitals/police (OpenStreetMap data) ──
OVERPASS_URL = "https://overpass-api.de/api/interpreter"


@dataclass
class EmergencyService:
    name: str
    type: str              # hospital | ambulance | police
    lat: float
    lng: float
    distance_km: float
    eta_minutes: float
    phone: Optional[str] = None
    address: Optional[str] = None
    trauma_level: Optional[str] = None


def haversine(lat1, lng1, lat2, lng2) -> float:
    """Calculate straight-line distance in km between two GPS points."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlng / 2) ** 2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


async def find_nearby_services(lat: float, lng: float, radius_m: int = 5000) -> list[dict]:
    """
    Query OpenStreetMap Overpass API for nearby emergency services.
    Returns hospitals, clinics, and police stations.
    """
    query = f"""
    [out:json][timeout:25];
    (
      node["amenity"="hospital"](around:{radius_m},{lat},{lng});
      way["amenity"="hospital"](around:{radius_m},{lat},{lng});
      node["amenity"="clinic"](around:{radius_m},{lat},{lng});
      node["amenity"="police"](around:{radius_m},{lat},{lng});
    );
    out center;
    """

    services = []
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            resp = await client.post(OVERPASS_URL, data={"data": query})
            resp.raise_for_status()
            elements = resp.json().get("elements", [])

            for el in elements:
                # Get lat/lng (nodes have direct lat/lng, ways have center)
                el_lat = el.get("lat") or el.get("center", {}).get("lat")
                el_lng = el.get("lon") or el.get("center", {}).get("lon")
                if not el_lat or not el_lng:
                    continue

                tags = el.get("tags", {})
                amenity = tags.get("amenity", "unknown")

                dist_km = haversine(lat, lng, el_lat, el_lng)
                services.append({
                    "name":    tags.get("name", f"Unnamed {amenity.title()}"),
                    "type":    amenity,
                    "lat":     el_lat,
                    "lng":     el_lng,
                    "distance_km": round(dist_km, 2),
                    "phone":   tags.get("phone") or tags.get("contact:phone"),
                    "address": tags.get("addr:street"),
                })
        except Exception as e:
            print(f"[EmergencyIntel] Overpass API error: {e}")

    return sorted(services, key=lambda x: x["distance_km"])


async def get_route(src_lat, src_lng, dst_lat, dst_lng) -> dict:
    """
    Get driving route using OSRM (free, OpenStreetMap based).
    Returns distance_km, duration_minutes, geometry.
    """
    url = f"{OSRM_BASE_URL}/{src_lng},{src_lat};{dst_lng},{dst_lat}"
    params = {
        "overview": "simplified",
        "geometries": "geojson",
        "steps": "false"
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()

            if data.get("code") != "Ok":
                return {}

            route = data["routes"][0]
            return {
                "distance_km":    round(route["distance"] / 1000, 2),
                "duration_min":   round(route["duration"] / 60, 1),
                "geometry":       route["geometry"]["coordinates"],
            }
        except Exception as e:
            print(f"[EmergencyIntel] OSRM error: {e}")
            return {
                "distance_km":  haversine(src_lat, src_lng, dst_lat, dst_lng),
                "duration_min": haversine(src_lat, src_lng, dst_lat, dst_lng) * 3,
                "geometry":     []
            }


async def get_emergency_recommendation(
    lat: float,
    lng: float,
    severity: str = "critical"   # low | medium | high | critical
) -> dict:
    """
    Master function: finds the best emergency response for given
    GPS location and incident severity.

    Returns a fully structured emergency dispatch payload.
    """
    print(f"[EmergencyIntel] Searching for emergency services near ({lat:.4f}, {lng:.4f})...")

    # Search radius based on severity
    radius = {
        "critical": 10000,
        "high":      7000,
        "medium":    5000,
        "low":       3000,
    }.get(severity, 5000)

    # Find all nearby services
    services = await find_nearby_services(lat, lng, radius_m=radius)

    hospitals = [s for s in services if s["type"] in ("hospital", "clinic")]
    police    = [s for s in services if s["type"] == "police"]

    # Get routes to top 3 hospitals
    hospital_results = []
    for svc in hospitals[:3]:
        route = await get_route(lat, lng, svc["lat"], svc["lng"])
        hospital_results.append({
            **svc,
            "eta_minutes":  route.get("duration_min", svc["distance_km"] * 3),
            "distance_km":  route.get("distance_km", svc["distance_km"]),
            "route":        route.get("geometry", []),
        })

    # Sort by ETA
    hospital_results.sort(key=lambda x: x["eta_minutes"])

    # Police
    police_result = None
    if police:
        p = police[0]
        route = await get_route(lat, lng, p["lat"], p["lng"])
        police_result = {
            **p,
            "eta_minutes": route.get("duration_min", p["distance_km"] * 3),
        }

    # Severity recommendation message
    messages = {
        "critical": "🚨 CRITICAL: Dispatching ambulance to nearest trauma center immediately.",
        "high":     "⚠️ HIGH: Recommending nearest hospital. Please call for ambulance.",
        "medium":   "⚡ MEDIUM: Nearest clinic recommended. Monitor condition.",
        "low":      "ℹ️ LOW: Nearest facility provided for precautionary check.",
    }

    primary_hospital = hospital_results[0] if hospital_results else None

    payload = {
        "severity":           severity,
        "incident_lat":       lat,
        "incident_lng":       lng,
        "recommendation":     messages.get(severity, ""),
        "primary_hospital":   primary_hospital,
        "nearby_hospitals":   hospital_results,
        "nearest_police":     police_result,
        "services_found":     len(services),
    }

    print(f"[EmergencyIntel] Found {len(hospitals)} hospitals, {len(police)} police stations.")
    if primary_hospital:
        print(f"[EmergencyIntel] Best hospital: {primary_hospital['name']} — ETA {primary_hospital['eta_minutes']:.1f} min")

    return payload


# ── Standalone test ──────────────────────────────────────────
if __name__ == "__main__":
    # Test with Chennai coordinates (default AI engine GPS)
    result = asyncio.run(get_emergency_recommendation(
        lat=13.0827, lng=80.2707, severity="critical"
    ))

    import json
    print("\n── Emergency Dispatch Payload ──")
    print(json.dumps(result, indent=2))
