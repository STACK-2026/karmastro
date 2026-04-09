"""
Numerology engine — Pythagorean system
All calculations are deterministic and verifiable.
"""

PYTHAGOREAN = {
    'a': 1, 'b': 2, 'c': 3, 'd': 4, 'e': 5, 'f': 6, 'g': 7, 'h': 8, 'i': 9,
    'j': 1, 'k': 2, 'l': 3, 'm': 4, 'n': 5, 'o': 6, 'p': 7, 'q': 8, 'r': 9,
    's': 1, 't': 2, 'u': 3, 'v': 4, 'w': 5, 'x': 6, 'y': 7, 'z': 8,
}

VOWELS = set("aeiouy")
MASTER_NUMBERS = {11, 22, 33}


def reduce(n: int, keep_masters: bool = True) -> int:
    """Theosophic reduction. Preserves master numbers 11, 22, 33."""
    while n > 9:
        if keep_masters and n in MASTER_NUMBERS:
            return n
        n = sum(int(d) for d in str(n))
    return n


def life_path(day: int, month: int, year: int) -> dict:
    """Chemin de vie — the most important number."""
    d = reduce(day)
    m = reduce(month)
    y = reduce(sum(int(c) for c in str(year)))
    raw = d + m + y
    result = reduce(raw)
    return {
        "number": result,
        "calculation": f"{day} -> {d}, {month} -> {m}, {year} -> {y}, sum = {raw} -> {result}",
        "is_master": result in MASTER_NUMBERS,
    }


def expression_number(name: str) -> dict:
    """Nombre d'expression — from full name."""
    letters = [(c, PYTHAGOREAN[c]) for c in name.lower() if c in PYTHAGOREAN]
    total = sum(v for _, v in letters)
    result = reduce(total)
    return {
        "number": result,
        "calculation": f"{''.join(c for c, _ in letters)} = {' + '.join(str(v) for _, v in letters)} = {total} -> {result}",
        "is_master": result in MASTER_NUMBERS,
    }


def soul_urge(name: str) -> dict:
    """Nombre intime (voyelles) — desires of the soul."""
    letters = [(c, PYTHAGOREAN[c]) for c in name.lower() if c in PYTHAGOREAN and c in VOWELS]
    total = sum(v for _, v in letters)
    result = reduce(total)
    return {
        "number": result,
        "vowels": "".join(c for c, _ in letters),
        "calculation": f"{' + '.join(str(v) for _, v in letters)} = {total} -> {result}",
    }


def personality_number(name: str) -> dict:
    """Nombre de realisation (consonnes) — outer personality."""
    letters = [(c, PYTHAGOREAN[c]) for c in name.lower() if c in PYTHAGOREAN and c not in VOWELS]
    total = sum(v for _, v in letters)
    result = reduce(total)
    return {
        "number": result,
        "consonants": "".join(c for c, _ in letters),
        "calculation": f"{' + '.join(str(v) for _, v in letters)} = {total} -> {result}",
    }


def birthday_number(day: int) -> dict:
    """Nombre du jour de naissance — natural talents."""
    result = reduce(day)
    return {"number": result, "raw_day": day}


def personal_year(day: int, month: int, current_year: int) -> int:
    return reduce(reduce(day) + reduce(month) + reduce(sum(int(c) for c in str(current_year))))


def personal_month(day: int, month: int, current_year: int, current_month: int) -> int:
    return reduce(personal_year(day, month, current_year) + current_month)


def personal_day(day: int, month: int, current_year: int, current_month: int, current_day: int) -> int:
    return reduce(personal_month(day, month, current_year, current_month) + current_day)


def inclusion_table(name: str) -> dict:
    """Table d'inclusion — frequency of each number 1-9 in the name."""
    table = {i: 0 for i in range(1, 10)}
    for c in name.lower():
        if c in PYTHAGOREAN:
            table[PYTHAGOREAN[c]] += 1
    missing = [n for n, count in table.items() if count == 0]
    excess = [n for n, count in table.items() if count >= 4]
    return {
        "table": table,
        "missing_numbers": missing,
        "excess_numbers": excess,
        "karmic_lessons": missing,
    }


def karmic_debts(day: int, month: int, year: int, name: str) -> list[dict]:
    """Detect karmic debts (13/4, 14/5, 16/7, 19/1) in all calculations."""
    debts = []
    debt_meanings = {
        13: "Paresse dans les vies anterieures - lecon de travail et discipline",
        14: "Abus de liberte - lecon de moderation et responsabilite",
        16: "Ego destructeur - lecon d'humilite et renaissance",
        19: "Abus de pouvoir - lecon d'autonomie sans ecraser les autres",
    }

    # Check in life path intermediate
    raw_lp = reduce(day) + reduce(month) + reduce(sum(int(c) for c in str(year)))
    if raw_lp in debt_meanings:
        debts.append({"number": raw_lp, "source": "chemin de vie", "meaning": debt_meanings[raw_lp]})

    # Check in expression intermediate
    total_expr = sum(PYTHAGOREAN.get(c, 0) for c in name.lower() if c in PYTHAGOREAN)
    if total_expr in debt_meanings:
        debts.append({"number": total_expr, "source": "expression", "meaning": debt_meanings[total_expr]})

    # Check in day
    if day in debt_meanings:
        debts.append({"number": day, "source": "jour de naissance", "meaning": debt_meanings[day]})

    return debts


def life_cycles(day: int, month: int, year: int) -> list[dict]:
    """3 cycles de vie (jeunesse, maturite, sagesse)."""
    lp = life_path(day, month, year)["number"]
    transition_1 = 36 - lp
    transition_2 = transition_1 + 9

    return [
        {"cycle": "Jeunesse", "number": reduce(month), "ages": f"0 - {transition_1}"},
        {"cycle": "Maturite", "number": reduce(day), "ages": f"{transition_1} - {transition_2}"},
        {"cycle": "Sagesse", "number": reduce(sum(int(c) for c in str(year))), "ages": f"{transition_2}+"},
    ]


def pinnacles(day: int, month: int, year: int) -> list[dict]:
    """4 pinnacles (sommets de vie)."""
    d = reduce(day)
    m = reduce(month)
    y = reduce(sum(int(c) for c in str(year)))
    lp = life_path(day, month, year)["number"]
    t1 = 36 - lp

    return [
        {"pinnacle": 1, "number": reduce(d + m), "ages": f"0 - {t1}"},
        {"pinnacle": 2, "number": reduce(d + y), "ages": f"{t1} - {t1 + 9}"},
        {"pinnacle": 3, "number": reduce(reduce(d + m) + reduce(d + y)), "ages": f"{t1 + 9} - {t1 + 18}"},
        {"pinnacle": 4, "number": reduce(m + y), "ages": f"{t1 + 18}+"},
    ]


def challenges(day: int, month: int, year: int) -> list[dict]:
    """4 defis de vie."""
    d = reduce(day)
    m = reduce(month)
    y = reduce(sum(int(c) for c in str(year)))

    c1 = abs(d - m)
    c2 = abs(d - y)
    c3 = abs(c1 - c2)
    c4 = abs(m - y)

    return [
        {"challenge": 1, "number": c1},
        {"challenge": 2, "number": c2},
        {"challenge": 3, "number": c3},
        {"challenge": 4, "number": c4},
    ]


def full_profile(name: str, day: int, month: int, year: int, current_year: int, current_month: int, current_day: int) -> dict:
    """Complete numerology profile."""
    return {
        "life_path": life_path(day, month, year),
        "expression": expression_number(name),
        "soul_urge": soul_urge(name),
        "personality": personality_number(name),
        "birthday": birthday_number(day),
        "personal_year": personal_year(day, month, current_year),
        "personal_month": personal_month(day, month, current_year, current_month),
        "personal_day": personal_day(day, month, current_year, current_month, current_day),
        "inclusion": inclusion_table(name),
        "karmic_debts": karmic_debts(day, month, year, name),
        "life_cycles": life_cycles(day, month, year),
        "pinnacles": pinnacles(day, month, year),
        "challenges": challenges(day, month, year),
    }
