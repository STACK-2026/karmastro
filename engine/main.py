"""
Karmastro Engine — FastAPI microservice
Calculs astrologiques et numerologiques en temps reel.

Endpoints:
  GET  /health
  GET  /cosmic          — snapshot cosmique actuel (lune, retrogrades, soleil)
  POST /natal-chart     — theme natal complet
  POST /numerology      — profil numerologique complet
  POST /oracle-context  — contexte complet pour l'Oracle (astro + numero + cosmique)
  POST /compatibility   — synastrie entre deux personnes
  POST /transits        — transits actifs sur un theme natal
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

from numerology import full_profile as numerology_profile
from astrology import (
    natal_chart, cosmic_snapshot, moon_phase, retrogrades,
    julian_day, transit_aspects, planet_position, PLANETS, HAS_SWE,
)
from numerology import (
    life_path, personal_year, personal_month, personal_day,
    expression_number, soul_urge, karmic_debts, inclusion_table,
    pinnacles, challenges, life_cycles,
)

app = FastAPI(
    title="Karmastro Engine",
    description="Calculs astrologiques et numerologiques en temps reel",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class BirthData(BaseModel):
    name: Optional[str] = None
    year: int
    month: int
    day: int
    hour: float = 12.0  # Default noon if unknown
    latitude: float = 48.8566  # Default Paris
    longitude: float = 2.3522


class CompatibilityRequest(BaseModel):
    person1: BirthData
    person2: BirthData


@app.get("/health")
def health():
    return {
        "status": "ok",
        "swiss_ephemeris": HAS_SWE,
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.get("/cosmic")
def get_cosmic():
    """Current cosmic snapshot — moon phase, retrogrades, sun position."""
    return cosmic_snapshot()


@app.post("/natal-chart")
def get_natal_chart(data: BirthData):
    """Complete natal chart with planets, houses, aspects, dignities."""
    if not HAS_SWE:
        raise HTTPException(503, "Swiss Ephemeris not available")
    return natal_chart(data.year, data.month, data.day, data.hour, data.latitude, data.longitude)


@app.post("/numerology")
def get_numerology(data: BirthData):
    """Complete numerology profile."""
    now = datetime.utcnow()
    return numerology_profile(
        name=data.name or "",
        day=data.day, month=data.month, year=data.year,
        current_year=now.year, current_month=now.month, current_day=now.day,
    )


@app.post("/oracle-context")
def get_oracle_context(data: BirthData):
    """
    Full context for the Oracle — combines astro + numerology + cosmic.
    This is what gets injected into the Oracle's system prompt.
    """
    now = datetime.utcnow()
    jd_now = julian_day(now.year, now.month, now.day, now.hour + now.minute / 60)

    # Numerology
    lp = life_path(data.day, data.month, data.year)
    py = personal_year(data.day, data.month, now.year)
    pm = personal_month(data.day, data.month, now.year, now.month)
    pd = personal_day(data.day, data.month, now.year, now.month, now.day)
    kd = karmic_debts(data.day, data.month, data.year, data.name or "")
    incl = inclusion_table(data.name or "")
    pins = pinnacles(data.day, data.month, data.year)
    challs = challenges(data.day, data.month, data.year)
    cycles = life_cycles(data.day, data.month, data.year)

    # Astrology
    chart = None
    active_transits = []
    if HAS_SWE:
        chart = natal_chart(data.year, data.month, data.day, data.hour, data.latitude, data.longitude)
        if chart and "planets" in chart:
            active_transits = transit_aspects(chart["planets"], jd_now)

    # Cosmic
    cosmic = cosmic_snapshot()

    # Expression numbers (if name provided)
    expr = None
    su = None
    if data.name:
        expr = expression_number(data.name)
        su = soul_urge(data.name)

    return {
        "numerology": {
            "life_path": lp,
            "personal_year": py,
            "personal_month": pm,
            "personal_day": pd,
            "expression": expr,
            "soul_urge": su,
            "karmic_debts": kd,
            "inclusion": incl,
            "pinnacles": pins,
            "challenges": challs,
            "life_cycles": cycles,
        },
        "natal_chart": chart,
        "active_transits": active_transits[:10],  # Top 10 tightest
        "cosmic": cosmic,
        "age": now.year - data.year,
    }


@app.post("/compatibility")
def get_compatibility(data: CompatibilityRequest):
    """Synastry between two people."""
    if not HAS_SWE:
        raise HTTPException(503, "Swiss Ephemeris not available")

    chart1 = natal_chart(
        data.person1.year, data.person1.month, data.person1.day,
        data.person1.hour, data.person1.latitude, data.person1.longitude,
    )
    chart2 = natal_chart(
        data.person2.year, data.person2.month, data.person2.day,
        data.person2.hour, data.person2.latitude, data.person2.longitude,
    )

    if not chart1.get("planets") or not chart2.get("planets"):
        raise HTTPException(500, "Could not calculate charts")

    # Cross-aspects
    from astrology import ASPECT_DEFINITIONS
    synastry_aspects = []
    for p1_name, p1_data in chart1["planets"].items():
        for p2_name, p2_data in chart2["planets"].items():
            diff = abs(p1_data["longitude"] - p2_data["longitude"])
            if diff > 180:
                diff = 360 - diff
            for asp_name, asp_def in ASPECT_DEFINITIONS.items():
                orb = abs(diff - asp_def["angle"])
                if orb <= asp_def["orb"]:
                    synastry_aspects.append({
                        "person1_planet": p1_name,
                        "person2_planet": p2_name,
                        "aspect": asp_name,
                        "nature": asp_def["nature"],
                        "orb": round(orb, 2),
                    })

    # Numerology compatibility
    num1 = None
    num2 = None
    if data.person1.name and data.person2.name:
        num1 = life_path(data.person1.day, data.person1.month, data.person1.year)
        num2 = life_path(data.person2.day, data.person2.month, data.person2.year)

    return {
        "synastry_aspects": sorted(synastry_aspects, key=lambda a: a["orb"])[:20],
        "person1_chart": chart1,
        "person2_chart": chart2,
        "numerology": {
            "person1_life_path": num1,
            "person2_life_path": num2,
        },
    }


@app.post("/transits")
def get_transits(data: BirthData):
    """Active transits on natal chart."""
    if not HAS_SWE:
        raise HTTPException(503, "Swiss Ephemeris not available")

    chart = natal_chart(data.year, data.month, data.day, data.hour, data.latitude, data.longitude)
    if not chart.get("planets"):
        raise HTTPException(500, "Could not calculate natal chart")

    now = datetime.utcnow()
    jd_now = julian_day(now.year, now.month, now.day, now.hour + now.minute / 60)

    return {
        "natal_chart": chart,
        "transits": transit_aspects(chart["planets"], jd_now),
        "cosmic": cosmic_snapshot(),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8100)
