# Lecture payante multi-outils — Phase 1 (numérologie) — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use `- [ ]`.

**Goal:** Rendre la lecture payante 4,90€ disponible sur les 4 outils numérologie à trafic (chemin-de-vie, nombre-expression, annee-personnelle, compatibilite) + supprimer le cul-de-sac « aucune dette », via un moteur de génération universel.

**Architecture:** Backend tool-agnostique (whitelist) ; un `buildReadingPrompt(input)` universel route par `input.tool` (karmic-debt reste un cas, zéro régression) ; frontend = pattern teaser/blur/CTA réutilisé par page avec données spécifiques.

**Tech Stack:** Supabase Edge Functions (Deno/TS), Stripe Checkout invité, Gemini 2.5-flash (thinking borné), Astro (pages outils, JS client).

---

## File structure
- Modifier `app/supabase/functions/_shared/reading-generator.ts` — `ReadingInput` étendu, `buildReadingPrompt` universel, `generateReading` inchangé d'appel, fallback générique.
- Modifier `app/supabase/functions/reading-checkout/index.ts` — whitelist tools + metadata générique.
- Modifier `app/supabase/functions/reading-webhook/index.ts` — routage par tool.
- Modifier `site/src/pages/outils/{chemin-de-vie,nombre-expression,annee-personnelle,compatibilite}.astro` — teaser/CTA.
- Modifier `site/src/pages/outils/dette-karmique.astro` — fix no-debt.
- Test : `app/supabase/functions/_shared/reading-generator.test.ts` (Deno).

---

### Task 1: Moteur de lecture universel (`reading-generator.ts`)

**Files:** Modify `app/supabase/functions/_shared/reading-generator.ts` ; Test `app/supabase/functions/_shared/reading-generator.test.ts`

- [ ] **Step 1** — Étendre `ReadingInput` (garde la compat karmic) :
```ts
export type ReadingTool =
  | "karmic-debt" | "chemin-de-vie" | "nombre-expression"
  | "annee-personnelle" | "compatibilite";

export type ReadingInput = {
  fullName: string;
  birthDate: string; // "YYYY-MM-DD"
  locale: string;
  tool: ReadingTool;
  debtCodes?: string[];        // karmic-debt
  partnerBirthDate?: string;   // compatibilite "YYYY-MM-DD"
  partnerName?: string;        // compatibilite (optionnel)
  currentYear?: number;        // annee-personnelle (défaut: année courante côté webhook)
};
```

- [ ] **Step 2** — Helper digit-sum + personal year (en haut du fichier, après les imports) :
```ts
function digitSum(n: number): number {
  return String(Math.abs(n)).split("").reduce((a, c) => a + (+c || 0), 0);
}
function personalYear(day: number, month: number, year: number): number {
  return reduceNumerology(
    reduceNumerology(day) + reduceNumerology(month) + reduceNumerology(digitSum(year)),
  );
}
```
Importer `reduceNumerology` : `import { calculateLifePath, calculateExpression, reduceNumerology, KARMIC_DEBTS } from "./numerology.ts";`

- [ ] **Step 3** — Ajouter `buildReadingPrompt(input)` universel. Tronc commun (persona Orion, langue, 1100-1400 mots, contraintes, structure 5 sections) + bloc de cadrage par tool. Pour `karmic-debt`, déléguer à `buildKarmicDebtPrompt` (inchangé).
```ts
export function buildReadingPrompt(input: ReadingInput): string {
  if (input.tool === "karmic-debt") return buildKarmicDebtPrompt(input);
  const en = input.locale === "en";
  const [y, m, d] = input.birthDate.split("-").map(Number);
  const hasName = input.fullName.trim().length > 0;
  const first = hasName ? input.fullName.trim().split(/\s+/)[0] : (en ? "the seeker" : "toi");

  // Bloc de cadrage spécifique au tool (données calculées + angle d'interprétation).
  let focus = "";
  if (input.tool === "chemin-de-vie") {
    const lp = calculateLifePath(d, m, y);
    focus = en
      ? `Focus: the LIFE PATH. Life path number: ${lp.number}${lp.isMaster ? " (master number)" : ""} (calc: ${lp.calculation}). Read this number in depth: its gift, its shadow, its mission.`
      : `Focus : le CHEMIN DE VIE. Nombre de chemin de vie : ${lp.number}${lp.isMaster ? " (maître nombre)" : ""} (calcul : ${lp.calculation}). Lis ce nombre en profondeur : son don, son ombre, sa mission.`;
  } else if (input.tool === "nombre-expression") {
    const ex = calculateExpression(input.fullName);
    focus = en
      ? `Focus: the EXPRESSION NUMBER (from the full name "${input.fullName.trim()}"). Expression number: ${ex.number}${ex.isMaster ? " (master)" : ""}. Read what this name vibration reveals about talents, the way of acting, the life direction.`
      : `Focus : le NOMBRE D'EXPRESSION (depuis le nom complet "${input.fullName.trim()}"). Nombre d'expression : ${ex.number}${ex.isMaster ? " (maître)" : ""}. Lis ce que cette vibration du nom révèle des talents, de la façon d'agir, de la direction de vie.`;
  } else if (input.tool === "annee-personnelle") {
    const yr = input.currentYear || y;
    const py = personalYear(d, m, yr);
    focus = en
      ? `Focus: the PERSONAL YEAR ${yr}. Personal year number: ${py}. Read the energy of this 1-year cycle: themes, opportunities, what to start or close, month-by-month tone if relevant.`
      : `Focus : l'ANNÉE PERSONNELLE ${yr}. Nombre d'année personnelle : ${py}. Lis l'énergie de ce cycle d'un an : thèmes, opportunités, ce qu'il faut lancer ou clôturer, la couleur mois par mois si pertinent.`;
  } else if (input.tool === "compatibilite") {
    const lp1 = calculateLifePath(d, m, y);
    const [py2, pm2, pd2] = (input.partnerBirthDate || "").split("-").map(Number);
    const lp2 = Number.isFinite(pd2) ? calculateLifePath(pd2, pm2, py2) : null;
    const pname = (input.partnerName || "").trim() || (en ? "the partner" : "l'autre");
    focus = en
      ? `Focus: NUMEROLOGICAL COMPATIBILITY between ${first} (life path ${lp1.number}) and ${pname} (life path ${lp2 ? lp2.number : "?"}). Read the dynamic between these two life paths: natural strengths of the bond, frictions to watch, how to grow together.`
      : `Focus : COMPATIBILITÉ NUMÉROLOGIQUE entre ${first} (chemin de vie ${lp1.number}) et ${pname} (chemin de vie ${lp2 ? lp2.number : "?"}). Lis la dynamique entre ces deux chemins de vie : forces naturelles du lien, frictions à surveiller, comment grandir ensemble.`;
  }

  const headEn = `You are Orion, the karmic coach of Karmastro: warm, lucid, grounded, never anxiety-inducing or hollow new-age. Write a personalised reading IN ENGLISH, addressing the person as "you", about 1100 to 1400 words.`;
  const headFr = `Tu es Orion, coach karmique de Karmastro : voix chaleureuse, lucide, incarnée, jamais anxiogène ni new-age creux. Écris une lecture personnalisée EN FRANÇAIS, au tutoiement, d'environ 1100 à 1400 mots.`;
  const structEn = `Structure with markdown (##) section titles: 1) What this reveals about you. 2) What it means concretely in your life right now. 3) The strength to lean on. 4) Your ritual for the week (one simple concrete gesture within 7 days). 5) The question to hold before important decisions.`;
  const structFr = `Structure avec des titres markdown (##) : 1) Ce que cela révèle de toi. 2) Ce que ça signifie concrètement dans ta vie en ce moment. 3) La force sur laquelle t'appuyer. 4) Ton rituel de la semaine (un geste concret simple sous 7 jours). 5) La question à te poser avant chaque décision importante.`;
  const constraintsEn = `Constraints: no medical/financial/miraculous promises; no fatalism; no unexplained jargon; favour inhabited prose over endless bullet lists. NEVER use em dash or en dash. Start directly with the first section.`;
  const constraintsFr = `Contraintes : aucune promesse médicale/financière/miraculeuse ; pas de fatalisme ; pas de jargon non expliqué ; prose habitée plutôt que listes à puces interminables. N'utilise JAMAIS de tiret cadratin ni demi-cadratin. Commence directement par la première section.`;

  return (en
    ? [headEn, ``, focus, ``, structEn, ``, constraintsEn]
    : [headFr, ``, focus, ``, structFr, ``, constraintsFr]
  ).join("\n");
}
```

- [ ] **Step 4** — `generateReading` appelle `buildReadingPrompt(input)` au lieu de `buildKarmicDebtPrompt(input)` (ligne ~148). Une seule substitution.

- [ ] **Step 5** — `buildFallbackReading` générique : si `input.tool !== "karmic-debt"`, renvoyer un filet court basé sur le focus (pas de dépendance debtCodes). Ajouter en tête de la fonction :
```ts
  if (input.tool && input.tool !== "karmic-debt") {
    const enf = input.locale === "en";
    const f = input.fullName.trim().split(/\s+/)[0] || (enf ? "friend" : "toi");
    return enf
      ? `${f}, here is your reading. The stars incline, they do not compel. Take a quiet moment to breathe, and let this guidance settle. Your full personalised reading is being prepared; if you are reading this, the live engine paused for a moment, but your insight is valid and yours to keep.`
      : `${f}, voici ta lecture. Les astres inclinent mais ne déterminent pas. Prends un instant pour respirer et laisser cette guidance se déposer. Ta lecture personnalisée complète se prépare ; si tu lis ce message, le moteur a marqué une courte pause, mais ton éclairage reste valide et il est à toi.`;
  }
```

- [ ] **Step 6** — Tests Deno (`reading-generator.test.ts`), ajouter/compléter :
```ts
Deno.test("buildReadingPrompt routes karmic-debt to legacy builder", () => {
  const p = buildReadingPrompt({ tool: "karmic-debt", fullName: "Augustin", birthDate: "1990-03-14", locale: "fr", debtCodes: ["13/4"] });
  if (!p.includes("Dette(s) karmique(s)")) throw new Error("karmic route cassée");
});
Deno.test("buildReadingPrompt chemin-de-vie includes life path number", () => {
  const p = buildReadingPrompt({ tool: "chemin-de-vie", fullName: "Augustin", birthDate: "1990-03-14", locale: "fr" });
  if (!p.includes("CHEMIN DE VIE")) throw new Error("focus chemin-de-vie absent");
});
Deno.test("buildReadingPrompt compatibilite includes both paths", () => {
  const p = buildReadingPrompt({ tool: "compatibilite", fullName: "Augustin", birthDate: "1990-03-14", partnerBirthDate: "1992-07-21", locale: "fr" });
  if (!p.includes("COMPATIBILITÉ")) throw new Error("focus compatibilite absent");
});
Deno.test("buildReadingPrompt forbids em dash literal in scaffold", () => {
  const p = buildReadingPrompt({ tool: "annee-personnelle", fullName: "Lea", birthDate: "1990-03-14", locale: "fr" });
  if (p.includes("—")) throw new Error("em dash dans le prompt");
});
```

- [ ] **Step 7** — Run: `~/.deno/bin/deno test app/supabase/functions/_shared/reading-generator.test.ts` → tous PASS. Puis `~/.deno/bin/deno check` des 3 fonctions. Commit.

---

### Task 2: `reading-checkout` tool-agnostique

**Files:** Modify `app/supabase/functions/reading-checkout/index.ts`

- [ ] **Step 1** — Whitelist + validation générique. Remplacer le bloc `const { tool, ... }` (lignes 39-42) :
```ts
    const READING_TOOLS = new Set([
      "karmic-debt", "chemin-de-vie", "nombre-expression", "annee-personnelle", "compatibilite",
    ]);
    const body = await req.json();
    const { tool, birthDate, fullName, locale, debtCodes, partnerBirthDate, partnerName } = body;
    if (!READING_TOOLS.has(tool) || !birthDate) {
      return json({ error: "params invalides" }, 400);
    }
    if (tool === "karmic-debt" && (!Array.isArray(debtCodes) || debtCodes.length === 0)) {
      return json({ error: "debtCodes requis pour karmic-debt" }, 400);
    }
    if (tool === "compatibilite" && !partnerBirthDate) {
      return json({ error: "partnerBirthDate requis pour compatibilite" }, 400);
    }
```

- [ ] **Step 2** — cancel_url dynamique par outil + metadata générique (remplacer lignes 50-59) :
```ts
      success_url: `${SITE}/lecture/?token=${token}${langParam}`,
      cancel_url: `${SITE}/outils/${tool === "karmic-debt" ? "dette-karmique" : tool}/?canceled=1`,
      metadata: {
        token,
        tool,
        birthDate: String(birthDate).slice(0, 20),
        fullName: String(fullName || "").slice(0, 120),
        locale: String(locale || "fr").slice(0, 5),
        debtCodes: Array.isArray(debtCodes) ? debtCodes.join(",").slice(0, 60) : "",
        partnerBirthDate: String(partnerBirthDate || "").slice(0, 20),
        partnerName: String(partnerName || "").slice(0, 120),
      },
```
Note : `/outils/${tool}` colle pour chemin-de-vie/nombre-expression/annee-personnelle/compatibilite (slugs identiques au tool).

- [ ] **Step 3** — `~/.deno/bin/deno check reading-checkout/index.ts`. Commit.

---

### Task 3: `reading-webhook` routage par tool

**Files:** Modify `app/supabase/functions/reading-webhook/index.ts`

- [ ] **Step 1** — Remplacer le garde `if (md.tool !== "karmic-debt" || !md.token)` (ligne ~43) :
```ts
  const READING_TOOLS = new Set(["karmic-debt","chemin-de-vie","nombre-expression","annee-personnelle","compatibilite"]);
  if (!READING_TOOLS.has(md.tool) || !md.token) {
```

- [ ] **Step 2** — Construire `inputs` complet pour `generateReading`. Là où `inputs` est assemblé (autour de la lecture des metadata), garantir la présence des nouveaux champs :
```ts
  const inputs = {
    tool: md.tool,
    fullName: md.fullName || "",
    birthDate: md.birthDate || "",
    locale: md.locale || "fr",
    debtCodes: (md.debtCodes ? String(md.debtCodes).split(",").filter(Boolean) : []),
    partnerBirthDate: md.partnerBirthDate || "",
    partnerName: md.partnerName || "",
    currentYear: new Date().getUTCFullYear(),
  };
```
(adapter au nom de variable existant ; conserver `tool_type: md.tool` et `inputs_json: inputs`.)

- [ ] **Step 3** — `~/.deno/bin/deno check reading-webhook/index.ts`. Commit. Déployer les 3 fonctions (Task 9 regroupe le déploiement).

---

### Task 4: Frontend — pattern teaser/CTA (recette) appliqué à `chemin-de-vie`

**Files:** Modify `site/src/pages/outils/chemin-de-vie.astro`

Le pattern (copié fidèlement de dette-karmique) : après l'affichage du résultat gratuit, (a) flouter une couche profonde, (b) injecter un bloc CTA, (c) brancher un handler checkout.

- [ ] **Step 1** — Dans le `<script>`, après le rendu du résultat (qualités/défis/mission déjà remplis), flouter la couche « mission » + ajouter le bloc CTA. Ajouter ce HTML (adapter les IDs existants) sous le résultat :
```html
<div id="reading-cta" class="mt-5 p-5 rounded-xl bg-gradient-to-r from-purple-400/10 to-amber-300/10 border border-amber-300/30 text-center">
  <p class="text-2xl mb-1">✦</p>
  <p class="font-serif text-base text-white mb-1">Ta lecture de chemin de vie complète</p>
  <p class="text-xs text-white/60 mb-4 max-w-sm mx-auto leading-relaxed">
    Une lecture personnalisée d'Orion (1100-1400 mots) : le don et l'ombre de ton chemin de vie, ce qu'il crée aujourd'hui, ton rituel de la semaine et la question à te poser. Livrée à l'écran + par email.
  </p>
  <button type="button" id="km-buy" class="inline-block px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-400 to-amber-300 text-[#0f0a1e] font-semibold text-sm hover:opacity-90 transition-opacity">
    Débloquer ma lecture complète - 4,90 €
  </button>
</div>
```
Et appliquer le flou sur le conteneur « mission » : `el.setAttribute("style","filter: blur(7px); opacity:0.55; user-select:none; pointer-events:none;")`.

- [ ] **Step 2** — Handler checkout (fidèle à dette-karmique), à la fin du `<script>` :
```ts
const CHECKOUT_URL = "https://nkjbmbdrvejemzrggxvr.supabase.co/functions/v1/reading-checkout";
document.getElementById("reading-cta")?.addEventListener("click", async (ev) => {
  const btn = (ev.target as HTMLElement).closest("#km-buy") as HTMLButtonElement | null;
  if (!btn) return;
  btn.disabled = true; const original = btn.textContent; btn.textContent = "Redirection…";
  const birthDate = (document.getElementById("birth-date") as HTMLInputElement).value;
  try {
    const r = await fetch(CHECKOUT_URL, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tool: "chemin-de-vie", birthDate, locale: "fr" }),
    });
    const data = await r.json();
    if (data?.url) { window.location.href = data.url; } else { throw new Error(data?.error || "no url"); }
  } catch { btn.disabled = false; btn.textContent = original; alert("Une erreur est survenue, réessaie dans un instant."); }
});
```

- [ ] **Step 3** — `cd site && npx astro check` (ou build partiel). Commit.

---

### Task 5: `nombre-expression.astro`
**Files:** Modify `site/src/pages/outils/nombre-expression.astro`
- [ ] Même recette que Task 4. CTA titre « Ta lecture du nombre d'expression complète ». Le checkout body : `{ tool: "nombre-expression", birthDate, fullName, locale: "fr" }` où `fullName` vient du champ nom de la page (cet outil exige le nom). Champ date requis aussi (id `birth-date` si présent ; sinon n'envoyer que fullName + birthDate du champ existant). Commit.

### Task 6: `annee-personnelle.astro`
**Files:** Modify `site/src/pages/outils/annee-personnelle.astro`
- [ ] Même recette. CTA « Ta lecture d'année personnelle complète ». Checkout body : `{ tool: "annee-personnelle", birthDate, locale: "fr" }`. Commit.

### Task 7: `compatibilite.astro`
**Files:** Modify `site/src/pages/outils/compatibilite.astro`
- [ ] Même recette, mais 2 dates. CTA « Ta lecture de compatibilité complète ». Checkout body : `{ tool: "compatibilite", birthDate: date1, partnerBirthDate: date2, locale: "fr" }` (mapper les 2 champs date existants). Commit.

---

### Task 8: Fix cul-de-sac « aucune dette » (`dette-karmique.astro`)

**Files:** Modify `site/src/pages/outils/dette-karmique.astro:297-298`

- [ ] **Step 1** — Quand `debts.length === 0`, au lieu d'afficher seulement `resultNone`, injecter une offre chemin-de-vie. Remplacer le bloc `if (debts.length === 0) { resultNone.classList.remove("hidden"); }` par : garder `resultNone` visible MAIS ajouter sous lui un bloc CTA identique à Task 4 avec `tool: "chemin-de-vie"` (réutilise birth-date déjà saisi). Texte : « Tu ne portes aucune dette karmique - c'est une bonne nouvelle. Découvre plutôt ce que ton chemin de vie révèle : » + bouton 4,90€.
- [ ] **Step 2** — Le handler `.km-buy` existant route déjà sur reading-checkout avec `tool:"karmic-debt"`. Ajouter une branche : si le bouton porte `data-tool="chemin-de-vie"`, envoyer `{tool:"chemin-de-vie", birthDate, locale:"fr"}`. Commit.

---

### Task 9: Déploiement + vérification live

- [ ] **Step 1** — Type-check : `~/.deno/bin/deno check` des 3 fonctions → exit 0.
- [ ] **Step 2** — Deploy : `SUPABASE_ACCESS_TOKEN=$SUPABASE_PAT npx supabase@latest functions deploy reading-checkout reading-webhook --project-ref nkjbmbdrvejemzrggxvr` (oracle-chat déjà fait ; reading-webhook embarque reading-generator).
- [ ] **Step 3** — Vérif checkout par tool (doit renvoyer une URL `cs_live`/checkout) :
```bash
for t in chemin-de-vie nombre-expression annee-personnelle; do
  curl -s -X POST https://nkjbmbdrvejemzrggxvr.supabase.co/functions/v1/reading-checkout \
   -H "Content-Type: application/json" \
   -d "{\"tool\":\"$t\",\"birthDate\":\"1990-03-14\",\"fullName\":\"Augustin\",\"locale\":\"fr\"}" -w " [$t]\n"
done
curl -s -X POST .../reading-checkout -d '{"tool":"compatibilite","birthDate":"1990-03-14","partnerBirthDate":"1992-07-21","locale":"fr"}'
```
Attendu : chaque réponse contient `"url":"https://...stripe..."`. Un tool hors whitelist → 400.
- [ ] **Step 4** — Vérif génération par tool via appel Gemini direct avec `buildReadingPrompt` (finishReason STOP, ≥1000 mots, 0 tiret cadratin).
- [ ] **Step 5** — Build Astro : `cd site && npm run build` → exit 0, pas de page cassée.
- [ ] **Step 6** — Commit + push main → CF Pages deploy. Vérifier 200 sur les 4 pages outils + le CTA présent dans le HTML rendu.
- [ ] **Step 7** — Audit final (verification-before-completion) : preuves fraîches pour chaque critère du spec.

---

## Self-review
- Couverture spec : checkout whitelist (T2), webhook routing (T3), generator universel (T1), teaser/CTA 4 outils (T4-7), no-debt fix (T8), vérif (T9). ✓
- Pas de placeholder : code réel fourni pour le backend ; recette frontend complète en T4, deltas explicites T5-7. ✓
- Cohérence types : `ReadingInput.tool` + `partnerBirthDate`/`partnerName`/`currentYear` utilisés identiquement en T1/T2/T3. ✓
- Régression karmic-debt : `buildReadingPrompt` délègue à `buildKarmicDebtPrompt` ; checkout/webhook gardent le cas. ✓
