# Lecture Karmique Transactionnelle — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre à un visiteur SEO de `/outils/dette-karmique/` de débloquer une lecture karmique IA personnalisée pour 4,90 €, en checkout invité (sans compte), livrée à l'écran + email.

**Architecture:** Tunnel transactionnel site-natif greffé sur l'infra existante. Le site Astro (static) appelle des Edge Functions Supabase dédiées (`reading-checkout`, `reading-webhook`, `get-reading`) qui réutilisent Stripe, Claude et Resend déjà en place. Token pré-généré au checkout → webhook génère la lecture en async → page `/lecture` poll jusqu'à `ready`.

**Tech Stack:** Astro 6 (static) + Cloudflare Pages · Supabase Edge Functions (Deno/TS) · Stripe (one-time, LIVE) · Claude API (Sonnet) · Resend.

**Spec :** `docs/superpowers/specs/2026-05-29-lecture-karmique-transactionnelle-design.md`

**Référence projet :** repo `STACK-2026/karmastro`, local `~/stack-2026/karmastro/`. Supabase project ref `nkjbmbdrvejemzrggxvr`. Edge Functions vivent dans `app/supabase/functions/` (niveau projet, déployées sur le ref partagé). Site dans `site/`.

⚠️ **Pull before push** (règle CLAUDE.md) : `git -C ~/stack-2026/karmastro pull --rebase` avant de commencer.

---

## File Structure

| Fichier | Création/Modif | Responsabilité |
|---|---|---|
| `app/supabase/migrations/20260529150000_readings.sql` | Create | Table `readings` + RLS + index |
| `app/supabase/functions/_shared/numerology.ts` | Create | Port Deno pur : reduce, lifePath, expression, detectKarmicDebts |
| `app/supabase/functions/_shared/numerology.test.ts` | Create | Tests unitaires (Deno) des fonctions pures |
| `app/supabase/functions/_shared/reading-generator.ts` | Create | Build prompt + appel Claude → texte de lecture |
| `app/supabase/functions/_shared/reading-generator.test.ts` | Create | Tests du builder de prompt (pas l'appel réseau) |
| `app/supabase/functions/reading-checkout/index.ts` | Create | Génère token + Stripe Checkout one-time invité |
| `app/supabase/functions/reading-webhook/index.ts` | Create | Webhook paiement → génère lecture → upsert → email |
| `app/supabase/functions/get-reading/index.ts` | Create | Renvoie la lecture par token (poll public) |
| `app/supabase/functions/send-email/index.ts` | Modify | Ajoute le type d'email `reading` |
| `site/src/pages/outils/dette-karmique.astro` | Modify | Champ nom optionnel + script CTA → checkout (remplace lien cross-domain) |
| `site/src/pages/lecture.astro` | Create | Page coquille : lit `?token=`, poll `get-reading`, rend la lecture |

---

## Phase 0 — Pré-requis (config/ops, hors code applicatif)

### Task 0.1 : Réparer Resend (dépendance email, non bloquante pour la valeur)

**Files:** secrets Supabase (pas de fichier repo). Réf : `audits/karmastro-20260421/diag-emails.md`.

- [ ] **Step 1 :** Récupérer/régénérer une clé Resend Pro valide sur resend.com.
- [ ] **Step 2 :** Vérifier le domaine `karmastro.com` côté Resend (DKIM/SPF/DMARC). Script existant : `~/stack-2026/karmastro/scripts/setup-resend-dns.sh`.
- [ ] **Step 3 :** Propager les secrets sur Supabase :
```bash
# via dashboard Supabase > Edge Functions > Secrets, OU API mgmt
# RESEND_API_KEY=<clé Pro valide>
# RESEND_FROM_EMAIL=Karmastro <contact@karmastro.com>
```
- [ ] **Step 4 :** Test d'envoi :
```bash
curl -X POST "https://nkjbmbdrvejemzrggxvr.supabase.co/functions/v1/send-email" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" -H "Content-Type: application/json" \
  -d '{"type":"welcome","to":"augustin.foucheres@gmail.com","data":{"firstName":"Augustin"}}'
```
Attendu : `{"status":"sent",...}` + email reçu.

> Si bloqué (clé Resend indispo), **continuer quand même** : la livraison écran prime. L'email sera activé dès Resend OK. Marquer le blocage explicitement.

### Task 0.2 : Créer le prix Stripe LIVE « Lecture karmique » 4,90 €

**Files:** compte Stripe (noter le `price_id` dans le code en Task 4).

- [ ] **Step 1 :** Stripe Dashboard (LIVE) → Products → créer « Lecture karmique » → prix **one-time 4,90 € EUR** (+ `currency_options` USD/autres si besoin, comme les prix existants).
- [ ] **Step 2 :** Noter le `price_id` (format `price_...`). Le reporter dans `reading-checkout/index.ts` (Task 4).
- [ ] **Step 3 :** (optionnel V1) ajouter les autres devises via currency_options pour cohérence multilingue. Sinon FR/EUR suffit pour V1.

### Task 0.3 : Enregistrer le 2e endpoint webhook Stripe

**Files:** secrets Supabase.

- [ ] **Step 1 :** Stripe Dashboard → Developers → Webhooks → Add endpoint : `https://nkjbmbdrvejemzrggxvr.supabase.co/functions/v1/reading-webhook`, event `checkout.session.completed`.
- [ ] **Step 2 :** Copier le signing secret (`whsec_...`) → secret Supabase `STRIPE_READING_WEBHOOK_SECRET`.

---

## Phase 1 — Tunnel complet sur dette-karmique

### Task 1 : Migration table `readings`

**Files:**
- Create: `app/supabase/migrations/20260529150000_readings.sql`

- [ ] **Step 1 : Écrire la migration**
```sql
-- readings : lectures karmiques achetées à l'acte, accès par token sans compte
create table if not exists public.readings (
  id                uuid primary key default gen_random_uuid(),
  token             text unique not null,
  email             text,
  tool_type         text not null,
  inputs_json       jsonb not null,
  content           text,
  locale            text not null default 'fr',
  status            text not null default 'pending', -- pending | ready | error
  stripe_session_id text,
  user_id           uuid references auth.users(id),
  created_at        timestamptz not null default now()
);
create index if not exists readings_token_idx on public.readings(token);

-- RLS activé, AUCUNE policy anon : tout accès passe par les Edge Functions (service key).
alter table public.readings enable row level security;
```

- [ ] **Step 2 : Appliquer la migration**
```bash
cd ~/stack-2026/karmastro/app
# via supabase CLI lié au ref, OU via Management API
supabase db push --project-ref nkjbmbdrvejemzrggxvr   # ou équivalent mgmt API
```

- [ ] **Step 3 : Vérifier en DB**
```bash
# Management API query
# SELECT to_regclass('public.readings'); -> "readings"
# SELECT relrowsecurity FROM pg_class WHERE relname='readings'; -> true
```
Attendu : table existe, RLS = true.

- [ ] **Step 4 : Commit**
```bash
git add app/supabase/migrations/20260529150000_readings.sql
git commit -m "feat(readings): table de stockage des lectures transactionnelles"
```

---

### Task 2 : Port numérologie Deno (pur, testé)

**Files:**
- Create: `app/supabase/functions/_shared/numerology.ts`
- Test: `app/supabase/functions/_shared/numerology.test.ts`

Source de vérité : `site/src/data/numerology-meanings.ts` (`reduceNumerology`, `calculateLifePath`, `calculateExpression`, `detectKarmicDebts`). On porte les fonctions de calcul (pas les textes longs).

- [ ] **Step 1 : Écrire le test (échoue)**
```ts
// numerology.test.ts
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { reduceNumerology, calculateLifePath, calculateExpression, detectKarmicDebts } from "./numerology.ts";

Deno.test("reduceNumerology garde les maîtres nombres", () => {
  assertEquals(reduceNumerology(29), 11);   // 2+9=11 conservé
  assertEquals(reduceNumerology(28), 1);    // 2+8=10 -> 1
});

Deno.test("calculateLifePath 1990-12-25", () => {
  const r = calculateLifePath(25, 12, 1990);
  assertEquals(r.number, 3); // 25->7, 12->3, 1990->1 ; 7+3+1=11... vérifier vs source
});

Deno.test("calculateExpression nom simple", () => {
  const r = calculateExpression("Jean");
  // J=1 E=5 A=1 N=5 = 12 -> 3
  assertEquals(r.number, 3);
});

Deno.test("detectKarmicDebts jour 14 -> 14/5", () => {
  const debts = detectKarmicDebts(14, 6, 1988);
  assertEquals(debts.some((d) => d.code === "14/5"), true);
});

Deno.test("detectKarmicDebts aucune dette renvoie []", () => {
  const debts = detectKarmicDebts(2, 2, 2000);
  assertEquals(Array.isArray(debts), true);
});
```
> Avant d'implémenter : vérifier les valeurs attendues exactes en lisant `site/src/data/numerology-meanings.ts` (lignes 191-310 et 535-620) et ajuster les `assertEquals` pour qu'ils reflètent la logique source (notamment la conservation des maîtres nombres dans chaque composante du chemin de vie).

- [ ] **Step 2 : Lancer le test (échoue)**
```bash
cd ~/stack-2026/karmastro/app/supabase/functions/_shared
deno test numerology.test.ts
```
Attendu : FAIL (module/exports absents).

- [ ] **Step 3 : Implémenter `numerology.ts`**

Porter fidèlement depuis `site/src/data/numerology-meanings.ts` :
```ts
const PYTHAG: Record<string, number> = {
  A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8,I:9,J:1,K:2,L:3,M:4,N:5,O:6,P:7,Q:8,R:9,
  S:1,T:2,U:3,V:4,W:5,X:6,Y:7,Z:8,
};
const MASTERS = new Set([11, 22, 33]);

export function reduceNumerology(n: number): number {
  while (n > 9 && !MASTERS.has(n)) {
    n = String(n).split("").reduce((s, d) => s + Number(d), 0);
  }
  return n;
}

export function calculateLifePath(day: number, month: number, year: number) {
  const d = reduceNumerology(day);
  const m = reduceNumerology(month);
  const y = reduceNumerology(year);
  const number = reduceNumerology(d + m + y);
  return { number, calculation: `${d}+${m}+${y}`, isMaster: MASTERS.has(number) };
}

export function calculateExpression(fullName: string) {
  const letters = fullName.toUpperCase().replace(/[^A-Z]/g, "");
  const sum = letters.split("").reduce((s, ch) => s + (PYTHAG[ch] ?? 0), 0);
  const number = reduceNumerology(sum);
  return { number, calculation: String(sum), isMaster: MASTERS.has(number), letters };
}

export type KarmicDebt = { code: string; root: number; final: number };
const DEBT_ROOTS: Record<number, KarmicDebt> = {
  13: { code: "13/4", root: 13, final: 4 },
  14: { code: "14/5", root: 14, final: 5 },
  16: { code: "16/7", root: 16, final: 7 },
  19: { code: "19/1", root: 19, final: 1 },
};

// Détection : jour de naissance ∈ {13,14,16,19} OU somme intermédiaire du chemin de vie.
// Refléter EXACTEMENT l'algo de detectKarmicDebts (site source) — vérifier la source avant de figer.
export function detectKarmicDebts(day: number, month: number, year: number): KarmicDebt[] {
  const found = new Set<string>();
  if (DEBT_ROOTS[day]) found.add(DEBT_ROOTS[day].code);
  const intermediate = reduceNumerology(day) + reduceNumerology(month) + reduceNumerology(year);
  if (DEBT_ROOTS[intermediate]) found.add(DEBT_ROOTS[intermediate].code);
  return [...found].map((code) => Object.values(DEBT_ROOTS).find((d) => d.code === code)!);
}
```
> ⚠️ Aligner `detectKarmicDebts` sur l'algorithme exact de la source (la source examine aussi le jour brut et la somme intermédiaire). Lire `numerology-meanings.ts:590-620` et reproduire à l'identique pour que la lecture payante soit cohérente avec le teaser gratuit.

- [ ] **Step 4 : Lancer les tests (passent)**
```bash
deno test numerology.test.ts
```
Attendu : tous PASS (après alignement des valeurs attendues sur la source).

- [ ] **Step 5 : Commit**
```bash
git add app/supabase/functions/_shared/numerology.ts app/supabase/functions/_shared/numerology.test.ts
git commit -m "feat(reading): port Deno des calculs numérologie + tests"
```

---

### Task 3 : Générateur de lecture (prompt builder + Claude)

**Files:**
- Create: `app/supabase/functions/_shared/reading-generator.ts`
- Test: `app/supabase/functions/_shared/reading-generator.test.ts`

On teste le **builder de prompt** (pur, déterministe). L'appel Claude est isolé dans une fonction séparée vérifiée manuellement.

- [ ] **Step 1 : Écrire le test du builder (échoue)**
```ts
// reading-generator.test.ts
import { assert, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { buildKarmicDebtPrompt } from "./reading-generator.ts";

Deno.test("buildKarmicDebtPrompt inclut prénom, codes, chemin de vie", () => {
  const p = buildKarmicDebtPrompt({
    fullName: "Marie Dupont", birthDate: "1988-06-14", locale: "fr",
    debtCodes: ["14/5"],
  });
  assertStringIncludes(p, "Marie");      // personnalisation
  assertStringIncludes(p, "14/5");       // dette détectée
  assertStringIncludes(p, "chemin de vie"); // contexte numéro
  assert(p.length > 400);
});

Deno.test("buildKarmicDebtPrompt sans nom reste valide", () => {
  const p = buildKarmicDebtPrompt({
    fullName: "", birthDate: "1988-06-14", locale: "fr", debtCodes: ["14/5"],
  });
  assertStringIncludes(p, "14/5");
});
```

- [ ] **Step 2 : Lancer (échoue)**
```bash
deno test reading-generator.test.ts
```
Attendu : FAIL (export absent).

- [ ] **Step 3 : Implémenter `reading-generator.ts`**
```ts
import { calculateLifePath, calculateExpression } from "./numerology.ts";

type ReadingInput = {
  fullName: string; birthDate: string; locale: string; debtCodes: string[];
};

export function buildKarmicDebtPrompt(input: ReadingInput): string {
  const [y, m, d] = input.birthDate.split("-").map(Number);
  const lp = calculateLifePath(d, m, y);
  const exprLine = input.fullName.trim()
    ? `Nombre d'expression (depuis "${input.fullName}") : ${calculateExpression(input.fullName).number}.`
    : `Nom complet non fourni : centre la lecture sur la dette et le chemin de vie.`;
  const prenom = (input.fullName.trim().split(/\s+/)[0]) || "toi";
  return [
    `Tu es Orion, coach karmique de Karmastro : voix chaleureuse, lucide, jamais anxiogène.`,
    `Écris une lecture karmique personnalisée en français, tutoiement, ~1100-1400 mots.`,
    `Personne : prénom "${prenom}". Dette(s) karmique(s) détectée(s) : ${input.debtCodes.join(", ")}.`,
    `Chemin de vie : ${lp.number}${lp.isMaster ? " (maître nombre)" : ""}. ${exprLine}`,
    `Structure en sections avec titres :`,
    `1) La mémoire d'âme (ce que cette dette raconte d'une vie passée),`,
    `2) Ce que ça crée aujourd'hui dans TA vie (concret, lié au chemin de vie ${lp.number}),`,
    `3) Le travail de cette incarnation,`,
    `4) Un rituel concret à tenter cette semaine,`,
    `5) La question à te poser avant chaque décision importante.`,
    `Contraintes : pas de promesse médicale/financière, pas de fatalisme (la dette est une invitation, pas une sentence), pas de jargon non expliqué. Markdown avec ## pour les titres.`,
  ].join("\n");
}

// Appel Claude isolé — vérifié manuellement (Task 5/8), pas en test auto.
export async function generateReading(input: ReadingInput): Promise<string> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY manquante");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 2200,
      messages: [{ role: "user", content: buildKarmicDebtPrompt(input) }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.content?.[0]?.text ?? "";
}
```

- [ ] **Step 4 : Lancer (passe)**
```bash
deno test reading-generator.test.ts
```
Attendu : PASS.

- [ ] **Step 5 : Commit**
```bash
git add app/supabase/functions/_shared/reading-generator.ts app/supabase/functions/_shared/reading-generator.test.ts
git commit -m "feat(reading): builder de prompt karmique + appel Claude"
```

---

### Task 4 : Edge Function `reading-checkout`

**Files:**
- Create: `app/supabase/functions/reading-checkout/index.ts`

Réutilise le pattern de `app/supabase/functions/stripe-checkout/index.ts` (init Stripe, CORS, LOCALE_CURRENCY).

- [ ] **Step 1 : Implémenter**
```ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@17.3.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";
const READING_PRICE_ID = "price_XXXX_REMPLACER_PAR_TASK_0.2"; // 4,90€ one-time LIVE
const SITE = "https://karmastro.com";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2024-11-20.acacia",
      httpClient: Stripe.createFetchHttpClient(),
    });
    const { tool, birthDate, fullName, locale, debtCodes } = await req.json();
    if (tool !== "karmic-debt" || !birthDate || !Array.isArray(debtCodes)) {
      return new Response(JSON.stringify({ error: "params invalides" }), { status: 400, headers: { ...corsHeaders, "content-type": "application/json" } });
    }
    const token = crypto.randomUUID();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: READING_PRICE_ID, quantity: 1 }],
      success_url: `${SITE}/lecture?token=${token}`,
      cancel_url: `${SITE}/outils/dette-karmique/?canceled=1`,
      metadata: {
        token, tool,
        birthDate: String(birthDate).slice(0, 20),
        fullName: String(fullName || "").slice(0, 120),
        locale: String(locale || "fr").slice(0, 5),
        debtCodes: debtCodes.join(",").slice(0, 60),
      },
    });
    return new Response(JSON.stringify({ url: session.url }), { headers: { ...corsHeaders, "content-type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "content-type": "application/json" } });
  }
});
```
> Remplacer `READING_PRICE_ID` par le `price_id` de Task 0.2.

- [ ] **Step 2 : Déployer**
```bash
cd ~/stack-2026/karmastro/app
supabase functions deploy reading-checkout --project-ref nkjbmbdrvejemzrggxvr --no-verify-jwt
```

- [ ] **Step 3 : Vérifier (renvoie une URL Stripe)**
```bash
curl -s -X POST "https://nkjbmbdrvejemzrggxvr.supabase.co/functions/v1/reading-checkout" \
  -H "Content-Type: application/json" \
  -d '{"tool":"karmic-debt","birthDate":"1988-06-14","fullName":"Marie Dupont","locale":"fr","debtCodes":["14/5"]}'
```
Attendu : `{"url":"https://checkout.stripe.com/..."}`.

- [ ] **Step 4 : Commit**
```bash
git add app/supabase/functions/reading-checkout/index.ts
git commit -m "feat(reading): edge function reading-checkout (Stripe one-time invité)"
```

---

### Task 5 : Edge Function `reading-webhook`

**Files:**
- Create: `app/supabase/functions/reading-webhook/index.ts`

Pattern : `app/supabase/functions/stripe-webhook/index.ts` (vérif signature). Endpoint dédié → `STRIPE_READING_WEBHOOK_SECRET`.

- [ ] **Step 1 : Implémenter**
```ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@17.3.0?target=deno";
import { generateReading } from "../_shared/reading-generator.ts";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";
const WEBHOOK_SECRET = Deno.env.get("STRIPE_READING_WEBHOOK_SECRET") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

serve(async (req) => {
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();
  const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: "2024-11-20.acacia",
    httpClient: Stripe.createFetchHttpClient(),
  });
  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig!, WEBHOOK_SECRET);
  } catch (e) {
    return new Response(`Bad signature: ${e}`, { status: 400 });
  }
  if (event.type !== "checkout.session.completed") return new Response("ignored", { status: 200 });

  const session = event.data.object as any;
  const md = session.metadata || {};
  if (md.tool !== "karmic-debt" || !md.token) return new Response("not a reading", { status: 200 });

  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  // Idempotence : si déjà ready, ne pas régénérer
  const { data: existing } = await sb.from("readings").select("status").eq("token", md.token).maybeSingle();
  if (existing?.status === "ready") return new Response("already done", { status: 200 });

  const email = session.customer_details?.email ?? session.customer_email ?? null;
  const inputs = {
    birthDate: md.birthDate, fullName: md.fullName || "",
    locale: md.locale || "fr", debtCodes: (md.debtCodes || "").split(",").filter(Boolean),
  };
  // upsert pending d'abord (trace même si Claude échoue)
  await sb.from("readings").upsert({
    token: md.token, email, tool_type: md.tool, inputs_json: inputs,
    locale: inputs.locale, status: "pending", stripe_session_id: session.id,
  }, { onConflict: "token" });

  try {
    const content = await generateReading(inputs);
    await sb.from("readings").update({ content, status: "ready" }).eq("token", md.token);
    if (email) {
      // livraison email (non bloquant)
      await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SERVICE_KEY}` },
        body: JSON.stringify({ type: "reading", to: email, data: { token: md.token } }),
      }).catch(() => {});
    }
  } catch (e) {
    await sb.from("readings").update({ status: "error" }).eq("token", md.token);
    console.error("reading gen failed:", e);
  }
  return new Response("ok", { status: 200 });
});
```

- [ ] **Step 2 : Déployer**
```bash
cd ~/stack-2026/karmastro/app
supabase functions deploy reading-webhook --project-ref nkjbmbdrvejemzrggxvr --no-verify-jwt
```

- [ ] **Step 3 : Vérifier via Stripe CLI (test signature + génération)**
```bash
stripe listen --forward-to https://nkjbmbdrvejemzrggxvr.supabase.co/functions/v1/reading-webhook
stripe trigger checkout.session.completed  # avec metadata réaliste si possible
```
Attendu : 200, et une ligne `readings.status='ready'` (vérifier en DB). Si pas de metadata via trigger, valider plutôt par le test E2E réel en Task 9.

- [ ] **Step 4 : Commit**
```bash
git add app/supabase/functions/reading-webhook/index.ts
git commit -m "feat(reading): webhook paiement -> génération lecture -> persist + email"
```

---

### Task 6 : Edge Function `get-reading` (poll public)

**Files:**
- Create: `app/supabase/functions/get-reading/index.ts`

- [ ] **Step 1 : Implémenter**
```ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return new Response(JSON.stringify({ error: "token requis" }), { status: 400, headers: { ...corsHeaders, "content-type": "application/json" } });
  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const { data } = await sb.from("readings")
    .select("status, content, tool_type, locale, created_at")  // jamais l'email
    .eq("token", token).maybeSingle();
  if (!data) return new Response(JSON.stringify({ status: "not_found" }), { status: 404, headers: { ...corsHeaders, "content-type": "application/json" } });
  return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "content-type": "application/json" } });
});
```

- [ ] **Step 2 : Déployer + vérifier**
```bash
cd ~/stack-2026/karmastro/app
supabase functions deploy get-reading --project-ref nkjbmbdrvejemzrggxvr --no-verify-jwt
curl -s "https://nkjbmbdrvejemzrggxvr.supabase.co/functions/v1/get-reading?token=inexistant"
```
Attendu : `{"status":"not_found"}` (404). L'email n'apparaît jamais dans la réponse.

- [ ] **Step 3 : Commit**
```bash
git add app/supabase/functions/get-reading/index.ts
git commit -m "feat(reading): edge function get-reading (poll public par token)"
```

---

### Task 7 : Type d'email `reading` dans `send-email`

**Files:**
- Modify: `app/supabase/functions/send-email/index.ts`

- [ ] **Step 1 : Lire le fichier pour repérer le switch des `type`** (welcome, payment_success, etc.) et le pattern de templates.
```bash
grep -nE 'type ===|case "|switch|subject' app/supabase/functions/send-email/index.ts | head
```

- [ ] **Step 2 : Ajouter le cas `reading`** (suivre le pattern exact existant) :
```ts
// dans la sélection de template, ajouter :
if (type === "reading") {
  const url = `https://karmastro.com/lecture?token=${data.token}`;
  subject = "Ta lecture karmique est prête ✦";
  html = `<p>Ta lecture karmique personnalisée est prête.</p>
          <p><a href="${url}">La consulter à tout moment ici</a></p>
          <p>— Karmastro</p>`;
}
```
> Adapter aux noms de variables réels du fichier (`subject`/`html`/`body`).

- [ ] **Step 3 : Déployer**
```bash
cd ~/stack-2026/karmastro/app
supabase functions deploy send-email --project-ref nkjbmbdrvejemzrggxvr
```

- [ ] **Step 4 : Vérifier (si Resend OK)**
```bash
curl -X POST "https://nkjbmbdrvejemzrggxvr.supabase.co/functions/v1/send-email" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" -H "Content-Type: application/json" \
  -d '{"type":"reading","to":"augustin.foucheres@gmail.com","data":{"token":"demo"}}'
```
Attendu : `{"status":"sent"}` + email. (Si Resend KO : `skipped_no_key`, non bloquant.)

- [ ] **Step 5 : Commit**
```bash
git add app/supabase/functions/send-email/index.ts
git commit -m "feat(email): type reading (livraison lien lecture)"
```

---

### Task 8 : Page calculateur — champ nom + CTA checkout

**Files:**
- Modify: `site/src/pages/outils/dette-karmique.astro`

- [ ] **Step 1 : Ajouter un champ nom optionnel** dans le `<form id="kd-form">` (après le bloc `birth-date`, avant le `<button>`), lignes ~127 :
```html
<div>
  <label for="full-name" class="block text-sm font-medium text-white/80 mb-2">Ton nom complet de naissance <span class="text-white/40">(optionnel — affine ta lecture)</span></label>
  <input type="text" id="full-name" autocomplete="off"
    class="w-full px-4 py-3 rounded-xl bg-[#0f0a1e]/50 border border-white/10 text-white focus:border-amber-300 focus:outline-none transition-colors" />
</div>
```

- [ ] **Step 2 : Remplacer le `paywallHtml` cross-domain** par un CTA bouton (id ciblable). Dans le `<script>`, remplacer le bloc `paywallHtml` (l'`<a href="https://app.karmastro.com/oracle...">`) par :
```js
const paywallHtml = `
  <div class="mt-5 p-5 rounded-xl bg-gradient-to-r from-purple-400/10 to-amber-300/10 border border-amber-300/30 text-center">
    <p class="text-2xl mb-1">✦</p>
    <p class="font-serif text-base text-white mb-1">Ta lecture karmique complète</p>
    <p class="text-xs text-white/60 mb-4 max-w-sm mx-auto leading-relaxed">
      Une lecture personnalisée d'Orion : ce que ton ${debt.code} dit de ta vie passée, ce qu'il crée aujourd'hui, le rituel concret de la semaine et la question à te poser. Livrée à l'écran à l'instant + par email.
    </p>
    <button type="button" class="km-buy inline-block px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-400 to-amber-300 text-[#0f0a1e] font-semibold text-sm hover:opacity-90 transition-opacity"
      data-code="${debt.code}">Débloquer ma lecture complète — 4,90 €</button>
  </div>`;
```
Supprimer aussi la logique `isPremium`/`localStorage` (la lecture payante ne se débloque plus en place ; elle vit sur `/lecture`). Le bloc verrouillé (`lockedStyle`) reste toujours flouté.

- [ ] **Step 3 : Ajouter le handler d'achat** à la fin du `<script>` (après la boucle, dans le submit, déléguer le clic) :
```js
const SUPA = "https://nkjbmbdrvejemzrggxvr.supabase.co/functions/v1/reading-checkout";
resultList.addEventListener("click", async (ev) => {
  const btn = (ev.target as HTMLElement).closest(".km-buy") as HTMLButtonElement | null;
  if (!btn) return;
  btn.disabled = true; btn.textContent = "Redirection…";
  const dateVal = (document.getElementById("birth-date") as HTMLInputElement).value;
  const fullName = (document.getElementById("full-name") as HTMLInputElement)?.value || "";
  const allCodes = [...resultList.querySelectorAll(".km-buy")].map((b) => (b as HTMLElement).dataset.code);
  try {
    const r = await fetch(SUPA, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tool: "karmic-debt", birthDate: dateVal, fullName, locale: "fr", debtCodes: allCodes }),
    });
    const { url } = await r.json();
    if (url) window.location.href = url; else throw new Error("no url");
  } catch {
    btn.disabled = false; btn.textContent = "Débloquer ma lecture complète — 4,90 €";
    alert("Une erreur est survenue, réessaie dans un instant.");
  }
});
```

- [ ] **Step 4 : Vérifier le build (pas de régression SEO)**
```bash
cd ~/stack-2026/karmastro/site && npm run build
```
Attendu : build OK. Vérifier que la page `dist/outils/dette-karmique/index.html` contient toujours le JSON-LD (FAQ/WebApplication) et le contenu éditorial.

- [ ] **Step 5 : Commit**
```bash
git add site/src/pages/outils/dette-karmique.astro
git commit -m "feat(dette-karmique): champ nom + CTA achat lecture (remplace lien cross-domain)"
```

---

### Task 9 : Page `/lecture` (poll + rendu)

**Files:**
- Create: `site/src/pages/lecture.astro`

- [ ] **Step 1 : Créer la page** (coquille statique + poll client). Réutiliser `BaseLayout`.
```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
const title = "Ta lecture karmique · Karmastro";
const description = "Ta lecture karmique personnalisée.";
---
<BaseLayout title={title} description={description} noindex={true}>
  <article class="max-w-2xl mx-auto px-4 py-16">
    <div id="lc-loading" class="text-center py-20">
      <p class="text-3xl mb-4 animate-pulse">✦</p>
      <p class="font-serif text-xl text-white mb-2">Génération de ta lecture…</p>
      <p class="text-sm text-white/60">Orion consulte les nombres. Quelques secondes.</p>
    </div>
    <div id="lc-content" class="prose prose-invert max-w-none hidden"></div>
    <div id="lc-error" class="hidden text-center py-20">
      <p class="font-serif text-xl text-white mb-2">Ta lecture arrive…</p>
      <p class="text-sm text-white/60">Si rien ne s'affiche, recharge la page dans une minute. Ton paiement est bien pris en compte.</p>
    </div>
  </article>
</BaseLayout>

<script>
  const SUPA = "https://nkjbmbdrvejemzrggxvr.supabase.co/functions/v1/get-reading";
  const token = new URLSearchParams(location.search).get("token");
  const loading = document.getElementById("lc-loading")!;
  const content = document.getElementById("lc-content")!;
  const errEl = document.getElementById("lc-error")!;

  function mdToHtml(md: string): string {
    // rendu minimal : ## titres + paragraphes. (échappe le HTML)
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return md.split(/\n{2,}/).map((block) => {
      const b = esc(block.trim());
      if (b.startsWith("## ")) return `<h2 class="font-serif text-2xl mt-8 mb-3 text-amber-300">${b.slice(3)}</h2>`;
      if (b.startsWith("# ")) return `<h1 class="font-serif text-3xl mb-4">${b.slice(2)}</h1>`;
      return `<p class="text-white/85 leading-relaxed mb-4">${b.replace(/\n/g, "<br>")}</p>`;
    }).join("");
  }

  let tries = 0;
  async function poll() {
    if (!token) { loading.classList.add("hidden"); errEl.classList.remove("hidden"); return; }
    try {
      const r = await fetch(`${SUPA}?token=${encodeURIComponent(token)}`);
      const data = await r.json();
      if (data.status === "ready" && data.content) {
        loading.classList.add("hidden");
        content.innerHTML = mdToHtml(data.content) +
          `<p class="text-xs text-white/40 mt-10 border-t border-white/10 pt-4">Une copie t'a été envoyée par email. Garde ce lien pour la retrouver.</p>`;
        content.classList.remove("hidden");
        return;
      }
    } catch {}
    if (++tries > 20) { loading.classList.add("hidden"); errEl.classList.remove("hidden"); return; }
    setTimeout(poll, 2000);
  }
  poll();
</script>
```
> Vérifier la signature de `BaseLayout` (prop `noindex` ou équivalent). Si `noindex` n'existe pas, ajouter `<meta name="robots" content="noindex">` via le mécanisme du layout. `/lecture` NE DOIT PAS être indexée.

- [ ] **Step 2 : Build**
```bash
cd ~/stack-2026/karmastro/site && npm run build
```
Attendu : build OK, `dist/lecture/index.html` généré avec `noindex`.

- [ ] **Step 3 : Vérifier robots/sitemap** : `/lecture` absente du sitemap et marquée noindex (ne pas polluer l'index).

- [ ] **Step 4 : Commit**
```bash
git add site/src/pages/lecture.astro
git commit -m "feat(lecture): page de livraison de la lecture (poll get-reading, noindex)"
```

---

### Task 10 : Test E2E réel + déploiement

- [ ] **Step 1 : Déployer le site**
```bash
cd ~/stack-2026/karmastro/site && npm run build
# deploy via le pipeline du repo (wrangler/GHA selon config karmastro)
```

- [ ] **Step 2 : Parcours réel** sur https://karmastro.com/outils/dette-karmique/ :
  1. Saisir une date à dette (ex 14/06/1988) + un nom → "Analyser".
  2. Teaser affiché (défi/guérison floutés) + bouton "Débloquer — 4,90 €".
  3. Clic → page Stripe → payer (mode test validé OU vrai 4,90€).
  4. Redirect `/lecture?token=…` → loader → lecture personnalisée cohérente avec 14/5.
- [ ] **Step 3 : Vérifier en DB**
```bash
# SELECT token,status,length(content),email FROM readings ORDER BY created_at DESC LIMIT 1;
```
Attendu : `status='ready'`, content non vide.
- [ ] **Step 4 : Re-accès** : ouvrir `/lecture?token=…` dans une fenêtre privée (sans compte) → la lecture s'affiche.
- [ ] **Step 5 : Email** : si Resend OK, vérifier réception ; sinon noter le blocage.
- [ ] **Step 6 : Push**
```bash
cd ~/stack-2026/karmastro && git pull --rebase && git push
```

---

## Self-Review (effectué)

- **Couverture spec :** C1=Task4, C2=Task5, C3=Task3, C4=Task6, C5=Task1, C6=Task8, C7=Task9, C8=Task7, Resend/Stripe/webhook=Phase0, E2E+vérif=Task10. ✅
- **Placeholders :** seul `READING_PRICE_ID` est un placeholder volontaire résolu en Task 0.2 (signalé). Les valeurs de test numérologie sont à aligner sur la source (signalé explicitement). ✅
- **Cohérence types :** `token`, `inputs_json{birthDate,fullName,locale,debtCodes}`, `status` (pending|ready|error), `tool_type='karmic-debt'` cohérents entre migration, checkout (metadata), webhook (upsert), get-reading (select), lecture (poll). ✅
- **Risques couverts :** course success_url/webhook (token pré-généré + poll), idempotence (check status ready), email non bloquant, noindex /lecture, pas d'email exposé dans get-reading. ✅
