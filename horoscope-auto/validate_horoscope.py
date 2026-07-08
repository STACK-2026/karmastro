#!/usr/bin/env python3
"""Validate generated horoscope JSON files. Usage: python validate_horoscope.py <file...>
Exit 0 if all OK; prints [FAIL]/[OK] per file and a summary."""
import sys, json, re, os

SLUGS = ["belier","taureau","gemeaux","cancer","lion","vierge",
         "balance","scorpion","sagittaire","capricorne","verseau","poissons"]
SIGN_FR = {"belier":"Bélier","taureau":"Taureau","gemeaux":"Gémeaux","cancer":"Cancer",
           "lion":"Lion","vierge":"Vierge","balance":"Balance","scorpion":"Scorpion",
           "sagittaire":"Sagittaire","capricorne":"Capricorne","verseau":"Verseau","poissons":"Poissons"}
SIGN_EN = {"belier":"Aries","taureau":"Taurus","gemeaux":"Gemini","cancer":"Cancer",
           "lion":"Leo","vierge":"Virgo","balance":"Libra","scorpion":"Scorpio",
           "sagittaire":"Sagittarius","capricorne":"Capricorn","verseau":"Aquarius","poissons":"Pisces"}
TEXT_KEYS = ["intro","love","work","energy","intuition","color","mantra"]
REQ = set(TEXT_KEYS) | {"luckyNumber","sign","slug","date","author"}
ACC = re.compile(r"[éèêàâîôûçùœëïüÉÈÀÇ]")

def validate(path):
    errs = []
    base = os.path.basename(path)
    m = re.match(r"(\d{4}-\d{2}-\d{2})(-en)?\.json$", base)
    if not m:
        return [f"bad filename {base}"]
    date_str, en = m.group(1), bool(m.group(2))
    signmap = SIGN_EN if en else SIGN_FR
    try:
        d = json.load(open(path, encoding="utf-8"))
    except Exception as e:
        return [f"JSON parse: {e}"]
    if not isinstance(d, dict):
        return ["root not dict"]
    if set(d.keys()) != set(SLUGS):
        errs.append(f"signs mismatch: missing={set(SLUGS)-set(d.keys())} extra={set(d.keys())-set(SLUGS)}")
    for slug in SLUGS:
        if slug not in d:
            continue
        s = d[slug]
        miss = REQ - s.keys()
        if miss:
            errs.append(f"{slug}: missing keys {miss}")
            continue
        if s["slug"] != slug:
            errs.append(f"{slug}: slug={s['slug']}")
        if s["sign"] != signmap[slug]:
            errs.append(f"{slug}: sign={s['sign']} (attendu {signmap[slug]})")
        if s["date"] != date_str:
            errs.append(f"{slug}: date={s['date']} != {date_str}")
        if s["author"] != "Sibylle":
            errs.append(f"{slug}: author={s['author']}")
        ln = s["luckyNumber"]
        if not isinstance(ln, int) or not (1 <= ln <= 99):
            errs.append(f"{slug}: luckyNumber={ln}")
        for k in TEXT_KEYS:
            v = s.get(k, "")
            if not isinstance(v, str) or len(v.strip()) < (2 if k in ("color","mantra") else 30):
                errs.append(f"{slug}.{k}: too short/empty")
            if "—" in str(v) or "–" in str(v):
                errs.append(f"{slug}.{k}: em/en-dash présent")
        # accents: FR text fields must be accented (not ASCII-folded)
        if not en:
            body = " ".join(str(s.get(k, "")) for k in ("intro","love","work","energy","intuition"))
            words = max(len(re.findall(r"\w+", body)), 1)
            dens = len(ACC.findall(body)) / words * 1000
            if dens < 20:
                errs.append(f"{slug}: ACCENT_LOW ({dens:.0f}/1000) — ASCII-foldé ?")
    return errs

def main():
    files = sys.argv[1:]
    bad = 0
    for f in sorted(files):
        e = validate(f)
        if e:
            bad += 1
            print(f"[FAIL] {os.path.basename(f)}")
            for x in e[:12]:
                print("    -", x)
        else:
            print(f"[OK]   {os.path.basename(f)}")
    print(f"\n{len(files)-bad}/{len(files)} OK, {bad} FAIL")
    return 1 if bad else 0

if __name__ == "__main__":
    sys.exit(main())
