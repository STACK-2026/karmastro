# Paywall Oracle — Lecture perso comme porte d'entrée — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformer le paywall Oracle anonyme (qui aujourd'hui n'affiche ni prix ni produit et expédie le lead sur `app.karmastro.com`) en une vraie offre : une lecture personnelle one-shot (porte d'entrée à bas prix), avec Étoile montrée à côté, checkout invité depuis le site, email capturé, et instrumentation pour lire le résultat.

**Architecture :** On réutilise l'infra one-shot qui existe déjà et tourne en prod (`reading-checkout` ACTIVE v18, guest checkout email-seul, prix `READING_PRICE_ID` posé, livraison `reading-webhook` → `/lecture?token=`). Le seul vrai code neuf est côté `site/src/pages/oracle.astro` (la surface paywall) + une passe de design sur le texte de la lecture (voix Oracle, fixe-pas-mouvant, boucle ouverte vers Étoile). Rien de neuf côté Stripe/plomberie.

**Tech Stack :** Astro (SSG multilingue) + Supabase Edge Functions (Deno) + Stripe Checkout invité + Gemini (moteur `reading-generator`). Deploy = push `main` → CF Pages `karmastro-site` auto.

## Global Constraints

- **DA inchangée** sans accord Augustin (règle CLAUDE.md). On ré-habille le paywall, on ne redessine pas le site.
- **Accents FR obligatoires**, 0 tiret cadratin (— ni –). Le gate scanne `site/src/i18n` + `site/src/pages` + `app/src/pages`.
- **Multilingue** : `LOCALES` = fr (racine) + en/es/it/pt/de/ar/ja/pl/ru/tr. Le paywall doit au minimum ne pas casser les locales ; l'offre est livrée d'abord FR+EN, fallback propre ailleurs.
- **Pull before push** : `git pull --rebase` avant tout push (origin diverge sur commits CI). Si `site/package-lock.json` bloque le checkout : `git checkout -- site/package-lock.json`.
- **`READING_PRICE_ID`** = prix one-time existant (4,90€ d'après l'en-tête de `reading-checkout`). On teste avec CE prix (pas de nouveau SKU Stripe à créer, sinon on se gate sur une action manuelle). Un reprix éventuel est une décision Augustin, hors de ce plan.
- **Persona site = "oracle"** (une seule, `guide: "oracle"` en dur dans `oracle.astro`). Pas de capture de persona.

---

## DÉCISIONS CADRÉES (lues et validées avec Augustin avant rédaction — ne pas re-litiger)

**1. La porte = `chemin-de-vie` (lecture perso, date-only).** Le paywall Oracle n'a aucune donnée de naissance (conversation anonyme). `chemin-de-vie` n'exige qu'une **date** (1 champ à collecter) ; `theme-natal` exige date + heure + lieu (géocodage) = trop de friction pour une micro-conversion. Alt plus riche (`theme-natal`/`profil-complet`) notée mais non retenue pour le test.

**2. Upsell-loop — la lecture est le FIXE, Étoile est le MOUVANT (conditionne le design de la lecture).** La lecture chemin-de-vie livre de la profondeur sur le **fixe** (ta structure, gravée à la naissance, one-time par nature) et **NE livre PAS les transits / le "en ce moment" / le "ce mois-ci"** — ceux-là sont le produit d'Étoile. Elle **finit en ouvrant la boucle** vers le mouvant ("ça c'est ta carte ; là où le ciel marche dessus en ce moment, ça change tout le temps — c'est ce que l'Oracle suit avec toi au jour le jour → Étoile"). Objectif : les deux produits complémentaires, jamais substituables. Une lecture "tout sur toi en un PDF" tuerait l'upsell — INTERDIT.

**3. Voix de la lecture = voix de l'Oracle du site.** Le lead vient de parler à l'Oracle ; la lecture continue cette relation, elle ne vend pas un produit générique. (Sur le site il n'y a qu'une persona, donc pas de branchement.)

**4. Définition du SUCCÈS = signal + contact, PAS euros.** À 47 hits/14j × 3,99-4,90€, même un bon taux fait ~10-15€/mois : le one-shot NE PEUT PAS remplir la caisse à ce trafic, c'est arithmétique. Sa valeur = (a) **signal willingness-to-pay** (y a-t-il des ventes du tout ? à mesure que le volume monte, un taux se dessine), (b) **contact capturé** (emails nourrissables vers Étoile). La caisse réelle reste Étoile + rétention. Ne PAS lire "3 ventes à 4,90€" comme un échec — c'est une validation de signal.

**5. Test CONFONDU, assumé.** On change la surface (page-outil → paywall) ET l'exécution (voix Oracle, fixe-pas-mouvant, boucle ouverte) en même temps. Un succès ne prouvera pas "le moment chaud compte" ; un échec ne prouvera pas "le moment ne compte pas". On shippe la meilleure version, **on n'isole pas la variable moment**. Ne pas sur-lire.

**6. Base statistique honnête.** Les deux surfaces (page-outil, paywall) sont à **n≈0** pour ce produit. Le 0/66 des pages outils n'exclut (à 95%) qu'un taux > ~4,4% ; en dessous il ne dit rien. On ne part PAS de "le one-shot ne convertit pas" (faux).

---

## File Structure

- `site/src/pages/oracle.astro` — **MODIFIER** : `renderPaywall()` (≈ lignes 106-176) pour la variante anonyme. Aujourd'hui : email capture + CTA "Créer mon compte gratuit" → `app.karmastro.com`. Demain : email capture (gardée) + **offre lecture perso** (champ date + bouton → `reading-checkout` tool=chemin-de-vie) + **Étoile en lien secondaire** (pas à la place). Nouveaux events de tracking.
- `site/src/components/ReadingPaywallOffer.astro` — **CRÉER** (optionnel, si on veut factoriser) : bloc offre + logique checkout invité, calqué sur `ReadingPaywallCTA.astro` mais **collecte sa propre date** (pas de dépendance à un formulaire de page). Si la factorisation alourdit, inliner dans `oracle.astro`.
- `app/supabase/functions/_shared/reading-generator.ts` — **MODIFIER** : le prompt/persona de `chemin-de-vie` pour appliquer la décision #2 (fixe-pas-mouvant + boucle Étoile) et #3 (voix Oracle). Vérifier qu'aucune section "transits/ce mois-ci" ne fuit.
- `scripts/measure_paywall_offer.py` — **CRÉER** : requête Supabase (Management API) qui lit les KPIs de succès #4 (signal + contact), pour figer une baseline et re-mesurer.

**Non touché** : `reading-checkout`, `reading-webhook`, `get-reading`, `/lecture`, Stripe, les prix. Ils existent et tournent.

---

## Task 1 — Instrumentation d'abord (pour pouvoir lire n≈0)

On pose la mesure avant l'offre, sinon on ship à l'aveugle. Événements via `window.km.trackEvent` (déjà utilisé dans `oracle.astro`).

**Files:**
- Modify: `site/src/pages/oracle.astro` (dans `renderPaywall`, autour de la ligne 200 où `oracle_limit_hit`/`paywall_viewed` sont déjà émis)
- Create: `scripts/measure_paywall_offer.py`

**Interfaces:**
- Produces (nouveaux `event_name` dans `analytics_events`) :
  - `paywall_offer_view` — l'offre lecture est affichée (props: `{ tool: "chemin-de-vie", price: "READING_PRICE_ID" }`)
  - `paywall_offer_date_entered` — l'utilisateur a saisi une date (intention forte)
  - `paywall_offer_checkout_click` — clic bouton → appel `reading-checkout`
  - `paywall_etoile_click` — clic sur le lien Étoile secondaire
  - (`paywall_email_captured` existe déjà, on le garde)

- [ ] **Step 1 : Écrire `scripts/measure_paywall_offer.py`** — requête les KPIs de succès #4.

```python
#!/usr/bin/env python3
"""Baseline + re-mesure du paywall-offer karmastro. Succès = signal + contact, PAS euros."""
import json, os, subprocess, sys, urllib.request

REF = "nkjbmbdrvejemzrggxvr"
PAT = subprocess.check_output(
    ["bash", "-lc", "grep -E '^SUPABASE_PAT=' ~/stack-2026/.env.master | cut -d= -f2-"]
).decode().strip()

def q(sql):
    req = urllib.request.Request(
        f"https://api.supabase.com/v1/projects/{REF}/database/query",
        data=json.dumps({"query": sql}).encode(),
        headers={"Authorization": f"Bearer {PAT}", "Content-Type": "application/json"},
    )
    return json.load(urllib.request.urlopen(req))

DAYS = sys.argv[1] if len(sys.argv) > 1 else "14"
funnel = q(f"""
select event_name, count(*) n, count(distinct session_id) sessions
from analytics_events
where created_at > now() - interval '{DAYS} days'
  and event_name in ('paywall_viewed','paywall_offer_view','paywall_offer_date_entered',
                     'paywall_offer_checkout_click','paywall_email_captured','paywall_etoile_click')
group by event_name order by n desc;
""")
money = q("""
select (select count(*) from readings where tool_type='chemin-de-vie') as chemin_readings,
       (select count(*) from stripe_events) as stripe_events,
       (select count(*) filter (where confirmed) from newsletter_subscribers) as contacts_confirmes;
""")
print("=== FUNNEL PAYWALL-OFFER (", DAYS, "j) — SIGNAL ===")
print(json.dumps(funnel, indent=1, ensure_ascii=False))
print("=== CONTACT + SIGNAL DUR ===")
print(json.dumps(money, indent=1, ensure_ascii=False))
```

- [ ] **Step 2 : Lancer une baseline PRÉ-offre** (prouve que les events n'existent pas encore).

Run: `python3 scripts/measure_paywall_offer.py 14`
Expected: `paywall_offer_*` absents (0 lignes), `paywall_viewed` présent (~47), `contacts_confirmes` ~16. On fige ce JSON.

- [ ] **Step 3 : Émettre `paywall_offer_view`** dans `renderPaywall` (variante anon uniquement), au moment où la carte est injectée dans le DOM.

Dans `oracle.astro`, à la fin de `renderPaywall` (après `wrap.innerHTML = ...`), pour `isAnon` :

```javascript
if (isAnon) {
  try { (window as any).km?.trackEvent("paywall_offer_view", { tool: "chemin-de-vie" }); } catch {}
}
```

- [ ] **Step 4 : Commit**

```bash
cd ~/stack-2026/karmastro
git add scripts/measure_paywall_offer.py site/src/pages/oracle.astro
git commit -m "feat(karmastro): instrument paywall offer funnel (signal+contact KPIs)"
```

---

## Task 2 — L'offre lecture perso dans le paywall anonyme

Cœur du chantier. On réécrit la variante `isAnon` de `renderPaywall` : garder la capture email, remplacer "Créer mon compte gratuit → app.karmastro.com" par l'offre lecture (champ date + bouton checkout invité), et poser Étoile en lien secondaire.

**Files:**
- Modify: `site/src/pages/oracle.astro` — fonction `renderPaywall` (lignes ≈106-176), branche `isAnon`.

**Interfaces:**
- Consumes : `reading-checkout` (POST `https://nkjbmbdrvejemzrggxvr.supabase.co/functions/v1/reading-checkout`), body `{ tool: "chemin-de-vie", birthDate: "YYYY-MM-DD", locale }`, retour `{ url }` → `window.location.href = url`. (Signature confirmée dans `ReadingPaywallCTA.astro` + `reading-checkout/index.ts`.)
- Consumes : events de Task 1.

- [ ] **Step 1 : Réécrire la branche `isAnon` de `renderPaywall`.** Remplacer le bloc `benefits`/`ctaHref`/`ctaLabel`/`capture` pour l'anon par : message limite + capture email (gardée telle quelle) + **bloc offre lecture** (titre "Ta lecture personnelle du Chemin de Vie", sous-titre bénéfice, champ `<input type="date">`, bouton "Recevoir ma lecture — 4,90 €") + **lien secondaire Étoile** ("Ou l'Oracle en illimité chaque jour → Étoile", href `/abonnement/`). DA existante réutilisée (mêmes classes gradient/rounded que le bloc actuel). Copy FR d'abord ; EN via détection `document.documentElement.lang`, fallback FR pour les autres locales.

Structure du bloc offre (injecté dans `wrap.innerHTML` pour `isAnon`, à la place de `benefits`) :

```javascript
const isFr = (document.documentElement.lang || "fr").startsWith("fr");
const offer =
  '<div class="mt-2 mb-4 p-4 rounded-xl bg-white/5 border border-amber-300/20 text-center">'
  + '<p class="font-serif text-base text-white mb-1">' + (isFr ? "Ta lecture personnelle du Chemin de Vie" : "Your personal Life Path reading") + '</p>'
  + '<p class="text-xs text-white/60 mb-3">' + (isFr ? "Ce que ta date de naissance dit de ta structure profonde. Livrée à l\'écran et par email." : "What your birth date reveals about your core structure. Delivered on screen and by email.") + '</p>'
  + '<input id="km-pw-birth" type="date" required class="w-full max-w-xs mx-auto block mb-3 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm" />'
  + '<button id="km-pw-buy" type="button" class="inline-block px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-400 to-amber-300 text-[#0f0a1e] font-semibold text-sm hover:opacity-90 transition-opacity">' + (isFr ? "Recevoir ma lecture — 4,90 €" : "Get my reading — 4,90 €") + '</button>'
  + '</div>'
  + '<a href="/abonnement/" id="km-pw-etoile" class="block text-[12px] text-amber-300/80 hover:text-amber-300 underline mt-1">' + (isFr ? "Ou l\'Oracle en illimité, chaque jour → Étoile" : "Or the Oracle unlimited, every day → Etoile") + '</a>';
```

Et `benefits` (variante anon) = `offer`. Le CTA "Créer mon compte gratuit" anon est **supprimé** (remplacé par l'offre + le lien Étoile).

- [ ] **Step 2 : Câbler le bouton checkout invité.** Après injection, ajouter le handler (calqué sur `ReadingPaywallCTA.astro`) :

```javascript
const buyBtn = wrap.querySelector("#km-pw-buy") as HTMLButtonElement | null;
const birthInput = wrap.querySelector("#km-pw-birth") as HTMLInputElement | null;
if (buyBtn && birthInput) {
  birthInput.addEventListener("change", () => {
    if (birthInput.value) { try { (window as any).km?.trackEvent("paywall_offer_date_entered", {}); } catch {} }
  });
  buyBtn.addEventListener("click", async () => {
    const birthDate = birthInput.value;
    if (!birthDate) { birthInput.classList.add("ring-2","ring-amber-300"); return; }
    const original = buyBtn.textContent;
    buyBtn.disabled = true; buyBtn.textContent = "…";
    try { (window as any).km?.trackEvent("paywall_offer_checkout_click", { tool: "chemin-de-vie" }); } catch {}
    try {
      const r = await fetch("https://nkjbmbdrvejemzrggxvr.supabase.co/functions/v1/reading-checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: "chemin-de-vie", birthDate, locale: document.documentElement.lang || "fr" }),
      });
      const d = await r.json();
      if (d && d.url) { window.location.href = d.url; }
      else { throw new Error(d && d.error || "no url"); }
    } catch {
      buyBtn.disabled = false; buyBtn.textContent = original;
      birthInput.insertAdjacentHTML("afterend", '<p class="text-[11px] text-red-300 mt-1">Une erreur est survenue, réessaie.</p>');
    }
  });
}
const etoileLink = wrap.querySelector("#km-pw-etoile");
if (etoileLink) etoileLink.addEventListener("click", () => { try { (window as any).km?.trackEvent("paywall_etoile_click", {}); } catch {} });
```

- [ ] **Step 3 : Build local + gates.** Vérifier 0 tiret cadratin, accents OK, build vert.

Run: `cd ~/stack-2026/karmastro/site && npm run build`
Expected: build réussit, page `/oracle/` générée sans erreur.

- [ ] **Step 4 : Vérifier le contrat 402 en live après deploy** (le paywall n'apparaît qu'à la limite). Utiliser le harnais : 3 messages Oracle anonymes → le 3e renvoie 402 → la carte doit montrer l'offre + le champ date + le lien Étoile.

Run (après push + deploy CF success) : ouvrir `https://karmastro.com/oracle/`, envoyer 3 messages, inspecter la carte paywall.
Expected : champ date visible, bouton "Recevoir ma lecture — 4,90 €", lien Étoile. Un clic date-remplie → redirige vers `checkout.stripe.com`.

- [ ] **Step 5 : Commit**

```bash
cd ~/stack-2026/karmastro
git pull --rebase
git add site/src/pages/oracle.astro
git commit -m "feat(karmastro): paywall Oracle vend la lecture perso (porte) + Etoile en secondaire"
git push
```

---

## Task 3 — Design de la lecture : voix Oracle, fixe-pas-mouvant, boucle ouverte

**Le seul vrai morceau créatif.** DÉLÉGUÉ à un agent Sonnet (règle : Opus supervise, le lourd rédactionnel va à Sonnet ; Opus audite). L'agent modifie le prompt de `chemin-de-vie` dans `reading-generator.ts` pour appliquer les décisions #2 et #3.

**Files:**
- Modify: `app/supabase/functions/_shared/reading-generator.ts` — bloc/persona/prompt de `chemin-de-vie`.

**Consigne exacte à l'agent Sonnet (à coller telle quelle, Opus audite le diff avant deploy) :**

> Contexte : sur karmastro.com, un utilisateur vient de discuter avec l'Oracle (astro + numérologie), a tapé la limite gratuite, et achète une lecture "Chemin de Vie" à 4,90€. Tu modifies le prompt de génération de cette lecture (`chemin-de-vie`) dans `app/supabase/functions/_shared/reading-generator.ts`. Trois contraintes NON négociables :
>
> 1. **Voix de l'Oracle.** La lecture continue la conversation avec l'Oracle, elle ne vend pas un produit générique. Ton : celui de l'Oracle de Karmastro (mystique mais direct, tutoiement, français impeccablement accentué, 0 tiret cadratin). Si la persona actuelle du chemin-de-vie a un autre nom (ex. "Orion"), aligne-la sur l'Oracle.
> 2. **La lecture est le FIXE, pas le MOUVANT.** Elle livre de la profondeur sur ce qui est gravé à la naissance : la structure du chemin de vie, ce qu'il dit de qui il/elle est, ses forces/tensions de fond. Elle **NE PARLE PAS** des transits, du "en ce moment", du "ce mois-ci", de "cette année", de ce qui bouge dans le ciel. Ces sujets sont réservés à l'abonnement Étoile. Interdiction absolue de livrer du contenu "temps réel" ou "prévision".
> 3. **Elle OUVRE la boucle vers Étoile à la fin.** Le dernier paragraphe nomme explicitement que ce portrait est la carte fixe, et que là où les planètes marchent dessus en ce moment (ce qui s'active pour lui/elle cette semaine, ce mois) change tout le temps — et que c'est ce que l'Oracle suit jour après jour avec les abonnés Étoile. Ça doit donner envie du continu, sans le livrer. Pas de hard-sell, une invitation naturelle.
>
> Livrable : le diff du prompt + une lecture d'exemple générée (date de test) prouvant les 3 contraintes (voix, aucun transit, boucle finale). Ne déploie pas ; rends le diff à Opus.

- [ ] **Step 1 :** Dispatcher l'agent Sonnet avec la consigne ci-dessus.
- [ ] **Step 2 (Opus) : Auditer le diff** — vérifier : voix Oracle, **zéro** mention transits/ce-mois-ci/prévision (grep le prompt sur `transit|ce mois|en ce moment|cette semaine|prévi`), paragraphe de boucle présent, 0 tiret cadratin, accents OK.
- [ ] **Step 3 : Générer une lecture de test E2E** (date jetable) via le flux réel et lire le texte produit — confirmer les 3 contraintes sur la sortie *réelle*, pas juste le prompt.
- [ ] **Step 4 : Déployer** `reading-generator` (via la fonction qui l'importe, `reading-webhook`) :

```bash
cd ~/stack-2026/karmastro
SUPABASE_ACCESS_TOKEN=$(grep -E '^SUPABASE_PAT=' ~/stack-2026/.env.master | cut -d= -f2-) \
  npx supabase functions deploy reading-webhook --project-ref nkjbmbdrvejemzrggxvr
```

- [ ] **Step 5 : Commit**

```bash
git add app/supabase/functions/_shared/reading-generator.ts
git commit -m "feat(karmastro): lecture chemin-de-vie en voix Oracle, fixe-pas-mouvant, boucle Etoile"
```

---

## Task 4 — Baseline figée + fenêtre de mesure

**Files:** (aucun code) — exécution de `scripts/measure_paywall_offer.py` + note.

- [ ] **Step 1 : Figer la baseline post-deploy J0.**

Run: `python3 scripts/measure_paywall_offer.py 14 > ~/stack-2026/audits/karmastro_backups/paywall_offer_baseline_$(date +%Y%m%d).json`

- [ ] **Step 2 : Poser la fenêtre de re-mesure.** Re-lancer à J+14 (≈ 22/07). Lire en **signal + contact** (décision #4), jamais en euros. Question à laquelle la mesure répond : `paywall_offer_view` → `paywall_offer_checkout_click` → ventes `readings` chemin-de-vie ? Et `paywall_email_captured` monte-t-il (contact) ?

- [ ] **Step 3 : NE PAS conclure sur la variable moment** (décision #5). Si des ventes tombent : signal WTP validé, shipper. Si zéro à volume comparable au 0/66 : ça ne prouve pas "le moment ne compte pas" (test confondu) ; ça oriente vers "l'offre ou le prix", à creuser séparément.

---

## Self-Review

**Spec coverage :**
- Offre visible au paywall (prix + produit) → Task 2 ✅
- Checkout on-site sans compte → Task 2 (réutilise `reading-checkout` guest) ✅
- Email capturé → capture existante gardée + `paywall_email_captured` mesuré ✅
- One-shot porte + Étoile à côté (pas à la place) → Task 2 (lien Étoile secondaire) ✅
- Upsell-loop fixe-vs-mouvant → Task 3 (décision #2) ✅
- Voix persona (= Oracle sur le site) → Task 3 (décision #3) ✅
- Succès = signal + contact → Task 1 + Task 4 (décision #4) ✅
- Test confondu, moment non isolé → décision #5, Task 4 Step 3 ✅

**Placeholder scan :** pas de TBD/TODO. Le seul bloc "créatif" (prompt de la lecture) est délégué avec une consigne exacte + audit + preuve E2E — pas un placeholder, une frontière de responsabilité.

**Type consistency :** `reading-checkout` body `{ tool, birthDate, locale }` cohérent entre Task 2 et la signature réelle (`ReadingPaywallCTA.astro`). Events nommés identiquement entre Task 1 (définition) et Task 2 (émission).

**Risques connus non couverts (volontaire) :** (a) fuite aval compte→paiement = "inconnue, à lire au volume", pas de fix ici (décision Augustin). (b) rétention = chantier d'après. (c) reprix 4,90€→autre = décision Augustin hors plan.
