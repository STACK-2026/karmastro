#!/usr/bin/env python3
"""Merge scripts/generated_tool_editorials.json into
site/src/data/tool-editorials.ts and inject <ToolEditorial> into every
target tool page.

Idempotent on both sides:
  - Skips locales + tools that already live in tool-editorials.ts
  - Skips pages that already import ToolEditorial

Run after densify_tool_editorials.py finishes.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path.home() / "stack-2026/karmastro"
TS_FILE = ROOT / "site/src/data/tool-editorials.ts"
GEN_FILE = ROOT / "scripts/generated_tool_editorials.json"
PAGES = ROOT / "site/src/pages"


# Maps : locale -> directory segment + 6 (path, ToolKey)
LOCALE_TOOL_PAGES = {
    "de": ("de/werkzeuge", [
        ("lebenszahl.astro",         "life-path"),
        ("ausdruckszahl.astro",      "expression-number"),
        ("personliches-jahr.astro",  "personal-year"),
        ("geburtshoroskop.astro",    "birth-chart"),
        ("aszendent.astro",          "rising-sign"),
        ("partnerhoroskop.astro",    "compatibility"),
    ]),
    "it": ("it/strumenti", [
        ("numero-del-cammino-di-vita.astro", "life-path"),
        ("numero-espressione.astro",         "expression-number"),
        ("anno-personale.astro",             "personal-year"),
        ("tema-natale.astro",                "birth-chart"),
        ("ascendente.astro",                 "rising-sign"),
        ("compatibilita.astro",              "compatibility"),
    ]),
    "es": ("es/herramientas", [
        ("camino-de-vida.astro",    "life-path"),
        ("numero-expresion.astro",  "expression-number"),
        ("ano-personal.astro",      "personal-year"),
        ("carta-natal.astro",       "birth-chart"),
        ("ascendente.astro",        "rising-sign"),
        ("compatibilidad.astro",    "compatibility"),
    ]),
    "pt": ("pt/ferramentas", [
        ("numero-do-caminho-de-vida.astro", "life-path"),
        ("numero-expressao.astro",          "expression-number"),
        ("ano-pessoal.astro",               "personal-year"),
        ("mapa-natal.astro",                "birth-chart"),
        ("ascendente.astro",                "rising-sign"),
        ("compatibilidade.astro",           "compatibility"),
    ]),
    "tr": ("tr/araclar", [
        ("yasam-yolu-sayisi.astro", "life-path"),
        ("ifade-sayisi.astro",      "expression-number"),
        ("kisisel-yil.astro",       "personal-year"),
        ("dogum-haritasi.astro",    "birth-chart"),
        ("yukselen-burc.astro",     "rising-sign"),
        ("uyumluluk.astro",         "compatibility"),
    ]),
    "pl": ("pl/narzedzia", [
        ("liczba-drogi-zycia.astro", "life-path"),
        ("liczba-ekspresji.astro",   "expression-number"),
        ("rok-osobisty.astro",       "personal-year"),
        ("horoskop-natalny.astro",   "birth-chart"),
        ("wschodzacy-znak.astro",    "rising-sign"),
        ("kompatybilnosc.astro",     "compatibility"),
    ]),
    "ru": ("ru/instrumenty", [
        ("chislo-zhiznennogo-puti.astro", "life-path"),
        ("chislo-vyrazheniya.astro",      "expression-number"),
        ("lichnyi-god.astro",             "personal-year"),
        ("natalnaya-karta.astro",         "birth-chart"),
        ("voskhodyaschiy-znak.astro",     "rising-sign"),
        ("sovmestimost.astro",            "compatibility"),
    ]),
    "ar": ("ar/adawat", [
        ("raqm-masar-al-hayat.astro", "life-path"),
        ("raqm-tabir.astro",          "expression-number"),
        ("sanat-shakhseya.astro",     "personal-year"),
        ("kharitat-mawlid.astro",     "birth-chart"),
        ("al-taaali.astro",           "rising-sign"),
        ("tawafuq-azwaj.astro",       "compatibility"),
    ]),
    "en": ("en/tools", [
        ("expression-number.astro",   "expression-number"),
        ("karmic-debt.astro",         "karmic-debt"),
        ("personal-year.astro",       "personal-year"),
    ]),
}

DIR_ATTR = {"ar": "rtl"}  # everyone else defaults to ltr


def ts_escape(s: str) -> str:
    """Turn a python string into a safe TypeScript string literal body."""
    return s.replace("\\", "\\\\").replace("`", "\\`").replace("${", "\\${")


def build_editorial_literal(locale: str, block: dict) -> str:
    """Render one TOOL_EDITORIALS entry as a TS literal using backticks,
    preserving JSON semantics and UTF-8."""
    def esc(s): return ts_escape(str(s))
    secs = ",\n        ".join(
        f"{{ title: `{esc(s.get('title',''))}`, body: `{esc(s.get('body',''))}` }}"
        for s in block["sections"] if isinstance(s, dict)
    )
    faqs = ",\n        ".join(
        f"{{ q: `{esc(f.get('q',''))}`, a: `{esc(f.get('a',''))}` }}"
        for f in block["faq"] if isinstance(f, dict)
    )
    srcs = ",\n        ".join(
        f"{{ title: `{esc(s.get('title',''))}`, url: `{esc(s.get('url',''))}` }}"
        for s in block["sources"] if isinstance(s, dict)
    )
    labels = block.get("labels", {})
    labels_literal = "undefined"
    if labels:
        labels_literal = (
            "{ "
            + ", ".join(f"{k}: `{esc(v)}`" for k, v in labels.items())
            + " }"
        )
    return (
        f"    {locale}: {{\n"
        f"      intro: `{esc(block['intro'])}`,\n"
        f"      sections: [\n"
        f"        {secs}\n"
        f"      ],\n"
        f"      faq: [\n"
        f"        {faqs}\n"
        f"      ],\n"
        f"      sources: [\n"
        f"        {srcs}\n"
        f"      ],\n"
        f"      labels: {labels_literal},\n"
        f"    }},\n"
    )


def merge_into_ts(generated: dict) -> int:
    """Insert new {locale: editorial} entries into each tool's sub-record
    inside TOOL_EDITORIALS. Returns number of new entries added."""
    text = TS_FILE.read_text()
    added = 0

    for key, item in generated.items():
        if not item.get("ok"):
            continue
        locale, tool_key = key.split(":", 1)
        block = item["block"]

        # Is this locale already present under tool_key?
        # Crude but safe check : look for `"{tool_key}": {` then a `{locale}:`
        entry_re = re.compile(
            rf'"{re.escape(tool_key)}":\s*\{{([\s\S]*?)\n  \}},?\n',
            re.MULTILINE,
        )
        m = entry_re.search(text)
        if not m:
            print(f"[warn] no existing block for tool '{tool_key}' in ts file, skipping {key}")
            continue

        inner = m.group(1)
        if re.search(rf"\b{locale}:\s*\{{", inner):
            continue  # already present

        literal = build_editorial_literal(locale, block)
        # insert before the closing `\n  },` of the tool block
        new_inner = inner + "\n" + literal
        replacement = f'"{tool_key}": {{{new_inner}\n  }},\n'
        text = text[:m.start()] + replacement + text[m.end():]
        added += 1

    TS_FILE.write_text(text)
    return added


IMPORT_FROM_PAGES_DEPTH = {
    # depth counted by number of "/" in locale path prefix from src/pages
    2: ("../../../components/ToolEditorial.astro", "../../../data/tool-editorials"),
    3: ("../../../../components/ToolEditorial.astro", "../../../../data/tool-editorials"),
}


def inject_tool_editorial(page_path: Path, tool_key: str, locale: str, dir_attr: str) -> bool:
    """Same insertion logic as the JA pilot. Returns True if modified."""
    if not page_path.exists():
        print(f"[warn] missing page: {page_path}")
        return False
    txt = page_path.read_text()
    if "ToolEditorial" in txt:
        return False

    # depth = number of folder segments between src/pages/ and the file
    rel = page_path.relative_to(PAGES)
    depth = len(rel.parts) - 1  # minus filename
    ups = "../" * (depth + 1)
    comp_imp = f"{ups}components/ToolEditorial.astro"
    data_imp = f"{ups}data/tool-editorials"
    var = f"editorial_{tool_key.replace('-', '_')}"

    fm_match = re.match(r"^---\n([\s\S]*?)\n---\n", txt)
    if not fm_match:
        print(f"[warn] no frontmatter: {page_path}")
        return False
    lines = fm_match.group(1).split("\n")
    last_import_idx = -1
    for i, ln in enumerate(lines):
        if re.match(r"^import\s", ln.rstrip()):
            last_import_idx = i
    injections = [
        f'import ToolEditorial from "{comp_imp}";',
        f'import {{ getToolEditorial }} from "{data_imp}";',
        f'const {var} = getToolEditorial("{tool_key}", "{locale}");',
    ]
    if last_import_idx == -1:
        lines = injections + [""] + lines
    else:
        lines = lines[:last_import_idx + 1] + injections + lines[last_import_idx + 1:]
    txt = txt.replace(
        fm_match.group(0),
        "---\n" + "\n".join(lines) + "\n---\n",
        1,
    )

    block = (
        f'\n    {{{var} && (\n'
        f'      <ToolEditorial\n'
        f'        intro={{{var}.intro}}\n'
        f'        sections={{{var}.sections}}\n'
        f'        faq={{{var}.faq}}\n'
        f'        sources={{{var}.sources}}\n'
        f'        labels={{{var}.labels}}\n'
        f'        dir="{dir_attr}"\n'
        f'      />\n'
        f'    )}}\n  '
    )
    idx = txt.rfind("</article>")
    if idx == -1:
        # some pages wrap in <main> instead
        idx = txt.rfind("</main>")
    if idx == -1:
        print(f"[warn] no </article> or </main>: {page_path}")
        return False
    txt = txt[:idx] + block + txt[idx:]
    page_path.write_text(txt)
    return True


def main():
    if not GEN_FILE.exists():
        sys.exit(f"[fatal] {GEN_FILE} not found. Run densify_tool_editorials.py first.")
    generated = json.loads(GEN_FILE.read_text())

    # 1. Merge into tool-editorials.ts
    added = merge_into_ts(generated)
    print(f"[ts] added {added} new locale entries into tool-editorials.ts")

    # 2. Inject into pages for every (locale, tool) combo that now has
    #    editorial data.
    injected = 0
    skipped = 0
    for locale, (subdir, tool_pages) in LOCALE_TOOL_PAGES.items():
        for filename, tool_key in tool_pages:
            key = f"{locale}:{tool_key}"
            item = generated.get(key)
            if not item or not item.get("ok"):
                # no editorial available yet for this combo , leave untouched
                continue
            path = PAGES / subdir / filename
            dir_attr = DIR_ATTR.get(locale, "ltr")
            if inject_tool_editorial(path, tool_key, locale, dir_attr):
                injected += 1
                print(f"[inject] {locale}/{filename} ← {tool_key}")
            else:
                skipped += 1

    print(f"\n[done] {injected} pages injected, {skipped} skipped (already have it or missing)")


if __name__ == "__main__":
    main()
