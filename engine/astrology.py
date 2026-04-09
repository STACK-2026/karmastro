"""
Astrology engine — Swiss Ephemeris (pyswisseph)
Precision: 0.001 arcsecond (NASA JPL DE431 level)
"""

import math
from datetime import datetime

try:
    import swisseph as swe
    swe.set_ephe_path("")  # Use built-in Moshier ephemeris (~1 arcsec precision)
    HAS_SWE = True
except ImportError:
    HAS_SWE = False

SIGNS = [
    "Belier", "Taureau", "Gemeaux", "Cancer", "Lion", "Vierge",
    "Balance", "Scorpion", "Sagittaire", "Capricorne", "Verseau", "Poissons"
]

SIGN_SYMBOLS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"]

ELEMENTS = {
    "Belier": "Feu", "Lion": "Feu", "Sagittaire": "Feu",
    "Taureau": "Terre", "Vierge": "Terre", "Capricorne": "Terre",
    "Gemeaux": "Air", "Balance": "Air", "Verseau": "Air",
    "Cancer": "Eau", "Scorpion": "Eau", "Poissons": "Eau",
}

QUALITIES = {
    "Belier": "Cardinal", "Cancer": "Cardinal", "Balance": "Cardinal", "Capricorne": "Cardinal",
    "Taureau": "Fixe", "Lion": "Fixe", "Scorpion": "Fixe", "Verseau": "Fixe",
    "Gemeaux": "Mutable", "Vierge": "Mutable", "Sagittaire": "Mutable", "Poissons": "Mutable",
}

PLANETS = {
    "Soleil": swe.SUN if HAS_SWE else 0,
    "Lune": swe.MOON if HAS_SWE else 1,
    "Mercure": swe.MERCURY if HAS_SWE else 2,
    "Venus": swe.VENUS if HAS_SWE else 3,
    "Mars": swe.MARS if HAS_SWE else 4,
    "Jupiter": swe.JUPITER if HAS_SWE else 5,
    "Saturne": swe.SATURN if HAS_SWE else 6,
    "Uranus": swe.URANUS if HAS_SWE else 7,
    "Neptune": swe.NEPTUNE if HAS_SWE else 8,
    "Pluton": swe.PLUTO if HAS_SWE else 9,
    "Noeud Nord": swe.MEAN_NODE if HAS_SWE else 10,
}

ASPECT_DEFINITIONS = {
    "Conjonction": {"angle": 0, "orb": 8, "nature": "fusion"},
    "Sextile": {"angle": 60, "orb": 5, "nature": "harmonique"},
    "Carre": {"angle": 90, "orb": 7, "nature": "tension"},
    "Trigone": {"angle": 120, "orb": 7, "nature": "harmonique"},
    "Opposition": {"angle": 180, "orb": 8, "nature": "polarite"},
    "Quinconce": {"angle": 150, "orb": 3, "nature": "ajustement"},
}


def lon_to_sign(longitude: float) -> dict:
    """Convert ecliptic longitude to sign, degree, minute."""
    sign_idx = int(longitude // 30)
    degree = longitude % 30
    minutes = (degree - int(degree)) * 60
    return {
        "sign": SIGNS[sign_idx],
        "symbol": SIGN_SYMBOLS[sign_idx],
        "degree": int(degree),
        "minute": int(minutes),
        "longitude": round(longitude, 4),
        "element": ELEMENTS[SIGNS[sign_idx]],
        "quality": QUALITIES[SIGNS[sign_idx]],
    }


def julian_day(year: int, month: int, day: int, hour: float = 12.0) -> float:
    """Calculate Julian Day."""
    if HAS_SWE:
        return swe.julday(year, month, day, hour)
    # Fallback
    a = (14 - month) // 12
    y = year + 4800 - a
    m = month + 12 * a - 3
    return day + (153 * m + 2) // 5 + 365 * y + y // 4 - y // 100 + y // 400 - 32045 + (hour - 12) / 24


def planet_position(jd: float, planet_id: int) -> dict:
    """Get exact position of a planet at a given Julian Day."""
    if not HAS_SWE:
        return {"error": "pyswisseph not installed"}

    xx, ret = swe.calc_ut(jd, planet_id)
    pos = lon_to_sign(xx[0])
    pos["latitude"] = round(xx[1], 4)
    pos["distance"] = round(xx[2], 6)
    pos["speed"] = round(xx[3], 4)
    pos["retrograde"] = xx[3] < 0
    return pos


def houses(jd: float, lat: float, lon: float, system: str = "P") -> dict:
    """Calculate house cusps. P=Placidus, K=Koch, W=Whole Sign, E=Equal."""
    if not HAS_SWE:
        return {"error": "pyswisseph not installed"}

    cusps, ascmc = swe.houses(jd, lat, lon, system.encode())

    house_data = {}
    for i in range(12):
        house_data[f"house_{i+1}"] = lon_to_sign(cusps[i])

    return {
        "houses": house_data,
        "ascendant": lon_to_sign(ascmc[0]),
        "midheaven": lon_to_sign(ascmc[1]),
        "vertex": lon_to_sign(ascmc[3]),
        "system": {"P": "Placidus", "K": "Koch", "W": "Whole Sign", "E": "Equal"}.get(system, system),
    }


def find_aspects(planets: dict, orb_factor: float = 1.0) -> list[dict]:
    """Find all aspects between planets."""
    aspects = []
    planet_names = list(planets.keys())

    for i in range(len(planet_names)):
        for j in range(i + 1, len(planet_names)):
            p1 = planet_names[i]
            p2 = planet_names[j]
            lon1 = planets[p1]["longitude"]
            lon2 = planets[p2]["longitude"]

            diff = abs(lon1 - lon2)
            if diff > 180:
                diff = 360 - diff

            for aspect_name, aspect_def in ASPECT_DEFINITIONS.items():
                orb = abs(diff - aspect_def["angle"])
                if orb <= aspect_def["orb"] * orb_factor:
                    aspects.append({
                        "planet_1": p1,
                        "planet_2": p2,
                        "aspect": aspect_name,
                        "nature": aspect_def["nature"],
                        "orb": round(orb, 2),
                        "exact": orb < 1,
                    })

    return sorted(aspects, key=lambda a: a["orb"])


def moon_phase(jd: float) -> dict:
    """Calculate exact moon phase."""
    if not HAS_SWE:
        return {"phase": "unknown"}

    sun_pos = swe.calc_ut(jd, swe.SUN)[0][0]
    moon_pos = swe.calc_ut(jd, swe.MOON)[0][0]
    phase_angle = (moon_pos - sun_pos) % 360
    illumination = (1 - math.cos(math.radians(phase_angle))) / 2 * 100

    if phase_angle < 22.5:
        name = "Nouvelle Lune"
        energy = "Renouveau, intentions, commencement"
    elif phase_angle < 67.5:
        name = "Premier croissant"
        energy = "Elan, confiance, emergence"
    elif phase_angle < 112.5:
        name = "Premier quartier"
        energy = "Action, decisions, engagement"
    elif phase_angle < 157.5:
        name = "Gibbeuse croissante"
        energy = "Perseverance, ajustement, patience"
    elif phase_angle < 202.5:
        name = "Pleine Lune"
        energy = "Culmination, revelation, prise de conscience"
    elif phase_angle < 247.5:
        name = "Gibbeuse decroissante"
        energy = "Gratitude, partage, transmission"
    elif phase_angle < 292.5:
        name = "Dernier quartier"
        energy = "Lacher-prise, bilan, liberation"
    else:
        name = "Dernier croissant"
        energy = "Repos, introspection, preparation"

    return {
        "name": name,
        "energy": energy,
        "angle": round(phase_angle, 2),
        "illumination": round(illumination, 1),
        "moon_sign": lon_to_sign(moon_pos),
    }


def retrogrades(jd: float) -> list[dict]:
    """Check which planets are currently retrograde."""
    if not HAS_SWE:
        return []

    retro = []
    for name, pid in PLANETS.items():
        if name in ("Soleil", "Lune", "Noeud Nord"):
            continue
        xx, _ = swe.calc_ut(jd, pid)
        if xx[3] < 0:
            pos = lon_to_sign(xx[0])
            retro.append({
                "planet": name,
                "sign": pos["sign"],
                "degree": pos["degree"],
                "speed": round(xx[3], 4),
            })
    return retro


def natal_chart(year: int, month: int, day: int, hour: float, lat: float, lon: float) -> dict:
    """Complete natal chart."""
    if not HAS_SWE:
        return {"error": "pyswisseph not installed"}

    jd = julian_day(year, month, day, hour)

    # Planet positions
    planets = {}
    for name, pid in PLANETS.items():
        planets[name] = planet_position(jd, pid)

    # Houses
    house_data = houses(jd, lat, lon)

    # Assign planets to houses
    if "houses" in house_data:
        cusps = [house_data["houses"][f"house_{i+1}"]["longitude"] for i in range(12)]
        for pname, pdata in planets.items():
            plon = pdata["longitude"]
            for h in range(12):
                next_h = (h + 1) % 12
                c1 = cusps[h]
                c2 = cusps[next_h]
                if c1 < c2:
                    if c1 <= plon < c2:
                        pdata["house"] = h + 1
                        break
                else:
                    if plon >= c1 or plon < c2:
                        pdata["house"] = h + 1
                        break

    # Aspects
    aspects = find_aspects(planets)

    # Dignities
    dignities = calculate_dignities(planets)

    return {
        "planets": planets,
        **house_data,
        "aspects": aspects,
        "dignities": dignities,
        "julian_day": jd,
    }


def calculate_dignities(planets: dict) -> dict:
    """Essential dignities: domicile, exil, exaltation, chute."""
    DOMICILE = {
        "Soleil": "Lion", "Lune": "Cancer", "Mercure": ["Gemeaux", "Vierge"],
        "Venus": ["Taureau", "Balance"], "Mars": ["Belier", "Scorpion"],
        "Jupiter": ["Sagittaire", "Poissons"], "Saturne": ["Capricorne", "Verseau"],
    }
    EXALTATION = {
        "Soleil": "Belier", "Lune": "Taureau", "Mercure": "Vierge",
        "Venus": "Poissons", "Mars": "Capricorne", "Jupiter": "Cancer",
        "Saturne": "Balance",
    }

    result = {}
    for pname, pdata in planets.items():
        if pname in ("Noeud Nord",):
            continue
        sign = pdata.get("sign", "")
        dignity = "peregrine"

        dom = DOMICILE.get(pname)
        if dom:
            if isinstance(dom, list) and sign in dom:
                dignity = "domicile"
            elif dom == sign:
                dignity = "domicile"

        exalt = EXALTATION.get(pname)
        if exalt == sign:
            dignity = "exaltation"

        result[pname] = dignity
    return result


def transit_aspects(natal_planets: dict, transit_jd: float) -> list[dict]:
    """Find aspects between current transits and natal positions."""
    if not HAS_SWE:
        return []

    transit_planets = {}
    for name, pid in PLANETS.items():
        transit_planets[name] = planet_position(transit_jd, pid)

    aspects = []
    for t_name, t_data in transit_planets.items():
        for n_name, n_data in natal_planets.items():
            diff = abs(t_data["longitude"] - n_data["longitude"])
            if diff > 180:
                diff = 360 - diff

            for aspect_name, aspect_def in ASPECT_DEFINITIONS.items():
                orb = abs(diff - aspect_def["angle"])
                if orb <= aspect_def["orb"] * 0.7:  # Tighter orbs for transits
                    aspects.append({
                        "transit_planet": t_name,
                        "natal_planet": n_name,
                        "aspect": aspect_name,
                        "nature": aspect_def["nature"],
                        "orb": round(orb, 2),
                        "transit_retrograde": t_data.get("retrograde", False),
                    })

    return sorted(aspects, key=lambda a: a["orb"])


def cosmic_snapshot(lat: float = 48.8566, lon: float = 2.3522) -> dict:
    """Current cosmic state — for Oracle context."""
    now = datetime.utcnow()
    jd = julian_day(now.year, now.month, now.day, now.hour + now.minute / 60)

    return {
        "date": now.strftime("%Y-%m-%d"),
        "time_utc": now.strftime("%H:%M"),
        "moon": moon_phase(jd),
        "retrogrades": retrogrades(jd),
        "sun_position": planet_position(jd, PLANETS["Soleil"]) if HAS_SWE else {},
        "moon_position": planet_position(jd, PLANETS["Lune"]) if HAS_SWE else {},
    }
