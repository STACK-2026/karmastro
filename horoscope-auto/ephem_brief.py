#!/usr/bin/env python3
"""Compute per-day cosmic context (pyephem) matching format_cosmic_context()
of generate_gemini.py, for a date range. No API. Outputs JSON to stdout.

Usage: python ephem_brief.py 2026-07-10 2026-08-08
"""
import sys, json, math
import ephem
from datetime import date, timedelta

SIGNS_FR = ["Bélier","Taureau","Gémeaux","Cancer","Lion","Vierge",
            "Balance","Scorpion","Sagittaire","Capricorne","Verseau","Poissons"]

def ecl_lon_deg(body):
    e = ephem.Ecliptic(body)
    return math.degrees(e.lon) % 360.0

def sign_of(lon):
    idx = int(lon // 30) % 12
    within = lon % 30.0
    deg = int(within)
    minute = int(round((within - deg) * 60))
    if minute == 60:
        minute = 0; deg += 1
    return SIGNS_FR[idx], deg, minute

def moon_phase_name(sun_lon, moon_lon, illum):
    # elongation Moon - Sun, 0=new, 180=full
    elong = (moon_lon - sun_lon) % 360.0
    if elong < 15 or elong >= 345:
        return "Nouvelle Lune"
    if elong < 75:
        return "Premier croissant"
    if elong < 105:
        return "Premier Quartier"
    if elong < 165:
        return "Lune gibbeuse croissante"
    if elong < 195:
        return "Pleine Lune"
    if elong < 255:
        return "Lune gibbeuse décroissante"
    if elong < 285:
        return "Dernier Quartier"
    return "Dernier croissant"

PLANETS = [
    ("Mercure", ephem.Mercury),
    ("Vénus", ephem.Venus),
    ("Mars", ephem.Mars),
    ("Jupiter", ephem.Jupiter),
    ("Saturne", ephem.Saturn),
    ("Uranus", ephem.Uranus),
    ("Neptune", ephem.Neptune),
    ("Pluton", ephem.Pluto),
]

def retrogrades(d):
    """Compare ecliptic longitude at d 12:00 vs d+1 12:00 -> retrograde if decreasing."""
    out = []
    dt0 = ephem.Date(f"{d} 12:00:00")
    dt1 = ephem.Date(dt0 + 1)  # +1 day
    for name, ctor in PLANETS:
        b0 = ctor(dt0); l0 = ecl_lon_deg(b0)
        b1 = ctor(dt1); l1 = ecl_lon_deg(b1)
        diff = (l1 - l0 + 180) % 360 - 180  # signed shortest delta
        if diff < 0:
            sign, _, _ = sign_of(l0)
            out.append({"planet": name, "sign": sign})
    return out

def brief_for(d):
    dt = ephem.Date(f"{d} 12:00:00")
    moon = ephem.Moon(dt)
    sun = ephem.Sun(dt)
    moon_lon = ecl_lon_deg(moon)
    sun_lon = ecl_lon_deg(sun)
    illum = round(moon.moon_phase * 100, 1)
    m_sign, m_deg, m_min = sign_of(moon_lon)
    s_sign, s_deg, s_min = sign_of(sun_lon)
    phase = moon_phase_name(sun_lon, moon_lon, illum)
    retros = retrogrades(d)
    lines = [
        f"Date : {d}",
        f"Phase lunaire : {phase} ({illum}% illumination)",
        f"Lune en : {m_sign} {m_deg}°{m_min}'",
        f"Soleil en : {s_sign} {s_deg}°{s_min}'",
    ]
    if retros:
        lines.append("Rétrogrades actives : " + ", ".join(f"{r['planet']} en {r['sign']}" for r in retros))
    else:
        lines.append("Rétrogrades : aucune planète rétrograde")
    return {
        "date": d,
        "moon_sign": m_sign, "moon_deg": m_deg, "moon_min": m_min,
        "sun_sign": s_sign, "sun_deg": s_deg, "sun_min": s_min,
        "phase": phase, "illumination": illum,
        "retrogrades": retros,
        "cosmic": "\n".join(lines),
    }

def main():
    start = date.fromisoformat(sys.argv[1])
    end = date.fromisoformat(sys.argv[2])
    out = []
    d = start
    while d <= end:
        out.append(brief_for(d.isoformat()))
        d += timedelta(days=1)
    json.dump(out, sys.stdout, ensure_ascii=False, indent=1)

if __name__ == "__main__":
    main()
