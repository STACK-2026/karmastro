# Karmastro — Colmater la fuite Oracle + Boucle de rétention email — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Arrêter la consommation gratuite illimitée de l'Oracle par les visiteurs anonymes, capter leur email au mur de limite, puis enrôler comptes et abonnés newsletter dans une boucle d'horoscope quotidien qui les ramène — pour transformer du trafic non-retenu/non-monétisé en revenus.

**Architecture:** Deux phases séquencées. **Phase 1 (colmater + capter)** durcit le comptage anonyme côté serveur dans l'edge function `oracle-chat` (la limite de 3 msg/jour est aujourd'hui contournable), corrige `claim-anon-session`, branche une capture email au paywall du site, et répare l'expéditeur cassé de `newsletter-subscribe`. **Phase 2 (rétention)** connecte les 30 comptes de l'app à la boucle `send-daily-horoscope` déjà active (qui n'atteint aujourd'hui que 12 abonnés newsletter), via opt-in à l'onboarding + email d'invitation unique aux comptes existants + email de bienvenue avec « aha ».

**Tech Stack:** Supabase Edge Functions (Deno/TypeScript), Postgres + pg_cron + RPC, Astro (site statique CF Pages), React/Vite (app), Resend (email), Tailwind (DA violet/or).

## Global Constraints

- **PULL BEFORE PUSH** : `git pull origin main` avant toute modif ; pour une edge function, la version DÉPLOYÉE fait foi — vérifier avant d'écraser.
- **T3 = Supabase reste** (ref `nkjbmbdrvejemzrggxvr`) — ne jamais migrer.
- **Accents FR obligatoires** sur tout contenu rédactionnel (emails, copy paywall, CTA) : é è à ê ô î û ç ù œ. Slugs/identifiants en ASCII.
- **DA inchangée** sans accord : réutiliser les tokens existants (violet `hsl(271 91% 65%)`, or `hsl(43 76% 53%)`, fonts Outfit/Figtree, composant `NewsletterCapture.astro`).
- **RGPD** : pas d'enrôlement email sans consentement explicite. Double opt-in newsletter conservé.
- **Aucun lien inter-sites du parc (PBN)**.
- **NE PAS toucher `STRIPE_WEBHOOK_SECRET`** (money-path live prouvé OK le 20/06).
- **FROM email vérifié** : `oracle@mail.karmastro.com` (sous-domaine vérifié Resend). L'apex `*@karmastro.com` est NON vérifié (Resend 403).
- Multilingue : 11 langues (fr/en/es/pt/de/it/tr/pl/ru/ja/ar). Tout email/CTA neuf doit suivre le pattern i18n existant (FR accentué ; autres langues : reprendre les clés existantes).

---

## File Structure

**Phase 1 — colmater + capter :**
- `app/supabase/functions/oracle-chat/index.ts` — durcir le comptage anonyme (sessionId obligatoire, fail-secure, backstop IP).
- `app/supabase/functions/claim-anon-session/index.ts` — fix colonne `day` → `usage_date`.
- `app/supabase/functions/newsletter-subscribe/index.ts` — fix expéditeur apex → sous-domaine vérifié.
- `site/src/pages/oracle.astro` — capture email au paywall anonyme.
- `app/supabase/migrations/<ts>_oracle_ip_backstop.sql` — colonne/index IP pour le backstop de comptage.

**Phase 2 — rétention :**
- `app/src/pages/OnboardingPage.tsx` — opt-in horoscope quotidien à l'onboarding.
- `app/supabase/functions/send-daily-horoscope/index.ts` — inclure les comptes opt-in (pas seulement newsletter_subscribers).
- `app/supabase/functions/enroll-daily-horoscope/` (nouveau) — RPC/endpoint pour enrôler un compte (signe calculé depuis birth_date).
- `app/supabase/functions/send-welcome/` (nouveau) ou réutiliser `send-email` template `welcome` — email de bienvenue avec aha.
- `scripts/reengage_existing_users.py` (nouveau) — envoi unique d'invitation opt-in aux 30 comptes existants.

---

## DÉCISIONS À VALIDER PAR AUGUSTIN (avant exécution)

1. **Nombre de messages gratuits anonymes** : garder 3/jour (défaut, préserve le aha) ou réduire à 2 ? → défaut = **3**.
2. **Modèle de consentement email quotidien** : opt-in explicite à l'onboarding (case à cocher, défaut **cochée** car bénéfice cœur) + invitation unique aux comptes existants. OK RGPD ? → défaut = **opt-in coché + invitation**.
3. **Backstop IP** : ajoute un plafond par IP (ex 6 msg/IP/jour) en plus du sessionId. Acceptable (faux positifs possibles sur IP partagées type entreprise/4G) ? → défaut = **oui, plafond généreux 6/IP/jour**.

---

# PHASE 1 — Colmater la fuite + capter l'email

### Task 1: Rendre le comptage anonyme inviolable — sessionId obligatoire côté serveur

**Files:**
- Modify: `app/supabase/functions/oracle-chat/index.ts` (destructuring ~382, appel RPC ~420-423)

**Interfaces:**
- Consumes: RPC `increment_oracle_usage(p_user_id uuid, p_session_id text)` retournant `(message_count int, unlimited bool)`.
- Produces: comportement « un anonyme sans sessionId valide reçoit 400, jamais un passe gratuit ».

**Contexte du bug :** ligne ~420, `p_session_id: userId ? null : sessionId ?? null`. Si l'appelant n'envoie pas de `sessionId` (ou `null`), les DEUX paramètres RPC sont NULL → la RPC retourne `(0, false)` → `message_count(0) > FREE_DAILY_LIMIT(3)` est faux → message livré sans incrément → Oracle gratuit infini.

- [ ] **Step 1: Vérifier la version déployée avant modif (PULL BEFORE PUSH)**

```bash
cd ~/stack-2026/karmastro && git pull origin main
# Comparer le code local au déployé (lecture seule)
grep -n "increment_oracle_usage\|FREE_DAILY_LIMIT\|sessionId" app/supabase/functions/oracle-chat/index.ts | head
```
Expected: voir la ligne `FREE_DAILY_LIMIT = 3` et l'appel RPC ~420.

- [ ] **Step 2: Test de reproduction (prouver la faille en live)**

```bash
# Appel anonyme SANS sessionId — doit aujourd'hui répondre 200 (faille)
curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  "https://nkjbmbdrvejemzrggxvr.supabase.co/functions/v1/oracle-chat" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"test"}],"guide":"oracle"}'
```
Expected (AVANT fix): `200` (ou stream) = faille confirmée. (APRÈS fix: `400`.)

- [ ] **Step 3: Ajouter la validation sessionId après le destructuring**

Après la ligne de destructuring (`const { messages, profile, guide: guideKey, userId, sessionId, ... } = await req.json();`) insérer :

```typescript
// Anti-bypass : un appel anonyme DOIT porter un sessionId non vide,
// sinon le comptage RPC reçoit (null,null) et n'incrémente jamais.
const anonSession = typeof sessionId === "string" ? sessionId.trim() : "";
if (!userId && anonSession.length < 8) {
  return new Response(
    JSON.stringify({ error: "session_required", message: "sessionId requis pour un usage anonyme." }),
    { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}
```

- [ ] **Step 4: Sécuriser l'appel RPC pour ne jamais passer un session vide**

Remplacer l'appel RPC :

```typescript
const { data: usageData, error: usageErr } = await sbCheck.rpc("increment_oracle_usage", {
  p_user_id: userId ?? null,
  p_session_id: userId ? null : (anonSession || null),
});
```

- [ ] **Step 5: Déployer la fonction**

```bash
cd ~/stack-2026/karmastro/app
npx supabase functions deploy oracle-chat --project-ref nkjbmbdrvejemzrggxvr
```
Expected: `Deployed Function oracle-chat`.

- [ ] **Step 6: Re-tester la repro (doit échouer maintenant)**

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  "https://nkjbmbdrvejemzrggxvr.supabase.co/functions/v1/oracle-chat" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"test"}],"guide":"oracle"}'
```
Expected: `400` (session_required). Faille fermée.

- [ ] **Step 7: Test de non-régression (anon AVEC sessionId fonctionne, et la limite tient)**

```bash
SID="test-$(python3 -c 'import uuid;print(uuid.uuid4())')"
for i in 1 2 3 4 5; do
  curl -s -o /dev/null -w "msg$i: %{http_code}\n" -X POST \
    "https://nkjbmbdrvejemzrggxvr.supabase.co/functions/v1/oracle-chat" \
    -H "Content-Type: application/json" \
    -d "{\"messages\":[{\"role\":\"user\",\"content\":\"q$i\"}],\"guide\":\"oracle\",\"sessionId\":\"$SID\"}"
done
```
Expected: msg1-3 = `200`, msg4-5 = `402` (paywall). Puis nettoyer la donnée de test (Step 8).

- [ ] **Step 8: Nettoyer la donnée de test**

```bash
cd ~/stack-2026 && python3 -c "
import sys; sys.path.insert(0,'scripts/intel'); from _common import mgmt_query
mgmt_query('nkjbmbdrvejemzrggxvr', \"DELETE FROM oracle_daily_usage WHERE session_id LIKE 'test-%';\")
print('cleaned')"
```

- [ ] **Step 9: Commit**

```bash
cd ~/stack-2026/karmastro
git add app/supabase/functions/oracle-chat/index.ts
git commit -m "fix(oracle): require non-empty sessionId for anon to close free-bypass"
```

---

### Task 2: Fail-secure sur erreur de comptage (ne plus laisser passer le chat si la RPC échoue)

**Files:**
- Modify: `app/supabase/functions/oracle-chat/index.ts` (catch ~462-465)

**Interfaces:**
- Consumes: résultat/erreur de `increment_oracle_usage`.
- Produces: sur erreur de comptage anonyme → 503 plutôt que message gratuit.

**Contexte :** le `catch (usageCheckErr)` actuel logue et continue (« non-blocking ») → si la RPC échoue, l'anonyme passe sans limite.

- [ ] **Step 1: Remplacer le catch non-bloquant**

```typescript
} catch (usageCheckErr) {
  console.error("Usage check error:", usageCheckErr);
  // Fail-secure pour les anonymes : pas de comptage fiable => pas de message gratuit.
  // Les utilisateurs connectés (entitlement vérifiable autrement) ne sont pas bloqués ici.
  if (!userId) {
    return new Response(
      JSON.stringify({ error: "usage_unavailable", message: "Service momentanément indisponible, réessaie dans un instant." }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
}
```

- [ ] **Step 2: Déployer**

```bash
cd ~/stack-2026/karmastro/app && npx supabase functions deploy oracle-chat --project-ref nkjbmbdrvejemzrggxvr
```
Expected: `Deployed Function oracle-chat`.

- [ ] **Step 3: Vérifier non-régression (parcours anon normal toujours 200 sur msg1)**

```bash
SID="test-$(python3 -c 'import uuid;print(uuid.uuid4())')"
curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  "https://nkjbmbdrvejemzrggxvr.supabase.co/functions/v1/oracle-chat" \
  -H "Content-Type: application/json" \
  -d "{\"messages\":[{\"role\":\"user\",\"content\":\"hi\"}],\"guide\":\"oracle\",\"sessionId\":\"$SID\"}"
# cleanup
cd ~/stack-2026 && python3 -c "import sys;sys.path.insert(0,'scripts/intel');from _common import mgmt_query;mgmt_query('nkjbmbdrvejemzrggxvr',\"DELETE FROM oracle_daily_usage WHERE session_id LIKE 'test-%';\")"
```
Expected: `200`.

- [ ] **Step 4: Commit**

```bash
cd ~/stack-2026/karmastro
git add app/supabase/functions/oracle-chat/index.ts
git commit -m "fix(oracle): fail-secure anon when usage RPC errors"
```

---

### Task 3: Corriger `claim-anon-session` (colonne `day` inexistante → `usage_date`)

**Files:**
- Modify: `app/supabase/functions/claim-anon-session/index.ts:99`

**Interfaces:**
- Consumes: table `oracle_daily_usage(session_id text, usage_date date, message_count int)`.
- Produces: au signup, le compteur anonyme du jour est repris sur le compte (pas de +3 bonus).

- [ ] **Step 1: Corriger le nom de colonne**

Remplacer `.eq("day", today)` par `.eq("usage_date", today)` dans la requête de lecture du compteur anonyme.

- [ ] **Step 2: Vérifier qu'aucune autre occurrence de `"day"` ne subsiste**

```bash
grep -n '"day"' app/supabase/functions/claim-anon-session/index.ts
```
Expected: aucune ligne.

- [ ] **Step 3: Déployer**

```bash
cd ~/stack-2026/karmastro/app && npx supabase functions deploy claim-anon-session --project-ref nkjbmbdrvejemzrggxvr
```
Expected: `Deployed Function claim-anon-session`.

- [ ] **Step 4: Commit**

```bash
cd ~/stack-2026/karmastro
git add app/supabase/functions/claim-anon-session/index.ts
git commit -m "fix(claim-anon): use usage_date column so anon counter carries to account"
```

---

### Task 4: Backstop IP — plafonner le contournement par reset localStorage

**Files:**
- Create: `app/supabase/migrations/<ts>_oracle_ip_backstop.sql`
- Modify: `app/supabase/functions/oracle-chat/index.ts` (avant le check paywall)

**Interfaces:**
- Consumes: header `x-forwarded-for` / `cf-connecting-ip`.
- Produces: un plafond `IP_DAILY_CAP = 6` messages/IP/jour pour les anonymes (au-delà → 402 paywall), indépendant du sessionId.

**Contexte :** un anonyme peut vider localStorage → nouveau sessionId → compteur remis à 0. Un plafond par IP limite l'abus sans bloquer l'usage légitime.

- [ ] **Step 1: Migration — table de comptage IP**

```sql
-- app/supabase/migrations/<ts>_oracle_ip_backstop.sql
create table if not exists public.oracle_ip_usage (
  ip text not null,
  usage_date date not null default current_date,
  message_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (ip, usage_date)
);
alter table public.oracle_ip_usage enable row level security;
-- service_role only (pas d'accès anon/auth direct)

create or replace function public.bump_oracle_ip(p_ip text)
returns integer language plpgsql security definer as $$
declare v_count integer;
begin
  if p_ip is null or length(p_ip) = 0 then return 0; end if;
  insert into public.oracle_ip_usage (ip, usage_date, message_count)
  values (p_ip, current_date, 1)
  on conflict (ip, usage_date)
  do update set message_count = public.oracle_ip_usage.message_count + 1, updated_at = now()
  returning message_count into v_count;
  return v_count;
end; $$;
```

- [ ] **Step 2: Appliquer la migration**

```bash
cd ~/stack-2026 && python3 -c "
import sys; sys.path.insert(0,'scripts/intel'); from _common import mgmt_query
sql=open('karmastro/app/supabase/migrations/<ts>_oracle_ip_backstop.sql').read()
print(mgmt_query('nkjbmbdrvejemzrggxvr', sql))"
```
Expected: pas d'erreur.

- [ ] **Step 3: Brancher le backstop dans oracle-chat (anonymes seulement)**

Après la validation sessionId (Task 1) et avant le check `message_count > FREE_DAILY_LIMIT`, pour les anonymes :

```typescript
const IP_DAILY_CAP = 6;
if (!userId) {
  const ip = (req.headers.get("cf-connecting-ip")
    || (req.headers.get("x-forwarded-for") || "").split(",")[0].trim());
  if (ip) {
    const { data: ipCount } = await sbCheck.rpc("bump_oracle_ip", { p_ip: ip });
    if (typeof ipCount === "number" && ipCount > IP_DAILY_CAP) {
      return new Response(
        JSON.stringify({ paywall: { reason: "ip_cap", is_anon: true, message: "Tu as atteint la limite quotidienne. Crée ton compte gratuit pour continuer ✨" } }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
  }
}
```

- [ ] **Step 4: Déployer**

```bash
cd ~/stack-2026/karmastro/app && npx supabase functions deploy oracle-chat --project-ref nkjbmbdrvejemzrggxvr
```
Expected: `Deployed Function oracle-chat`.

- [ ] **Step 5: Test backstop (7e message même avec sessionId neuf → 402)**

```bash
for i in $(seq 1 7); do
  SID="test-ipcap-$i-$(python3 -c 'import uuid;print(uuid.uuid4())')"
  curl -s -o /dev/null -w "call$i: %{http_code}\n" -X POST \
    "https://nkjbmbdrvejemzrggxvr.supabase.co/functions/v1/oracle-chat" \
    -H "Content-Type: application/json" \
    -d "{\"messages\":[{\"role\":\"user\",\"content\":\"q\"}],\"guide\":\"oracle\",\"sessionId\":\"$SID\"}"
done
```
Expected: les 6 premiers (sessions neuves) répondent, le 7e = `402` (ip_cap). Puis cleanup :

```bash
cd ~/stack-2026 && python3 -c "import sys;sys.path.insert(0,'scripts/intel');from _common import mgmt_query;mgmt_query('nkjbmbdrvejemzrggxvr',\"DELETE FROM oracle_daily_usage WHERE session_id LIKE 'test-%'; DELETE FROM oracle_ip_usage WHERE usage_date=current_date;\")"
```

- [ ] **Step 6: Commit**

```bash
cd ~/stack-2026/karmastro
git add app/supabase/migrations/ app/supabase/functions/oracle-chat/index.ts
git commit -m "feat(oracle): IP-based daily backstop against localStorage reset abuse"
```

---

### Task 5: Capturer l'email AU mur de limite (site)

**Files:**
- Modify: `site/src/pages/oracle.astro` (fonction `renderPaywall`, gestion du 402 ~149-159)
- Référence: `site/src/components/NewsletterCapture.astro`, endpoint `newsletter-subscribe`

**Interfaces:**
- Consumes: endpoint `POST /functions/v1/newsletter-subscribe` `{email, locale, source}`.
- Produces: au paywall anonyme, un champ email (« reçois ton horoscope chaque matin ») qui inscrit → puis pousse vers le compte.

- [ ] **Step 1: Étendre `renderPaywall` pour les anonymes avec un opt-in email**

Dans `renderPaywall`, quand `pw.is_anon`, injecter avant les CTA un bloc email (DA réutilisée : classes `glow-violet`, `rounded-2xl`, accents FR). Le bloc poste vers `newsletter-subscribe` avec `source:"oracle_limit"` et `locale` courante, affiche un succès (« Parfait ✨ Tu recevras ton horoscope chaque matin. Crée ton compte pour continuer l'Oracle. ») puis garde le CTA « Créer mon compte gratuit ».

```html
<!-- injecté dans renderPaywall si pw.is_anon -->
<form id="km-paywall-email" class="km-capture rounded-2xl glow-violet">
  <label>Reçois ton horoscope personnalisé chaque matin</label>
  <input type="email" required placeholder="ton@email.fr" />
  <button type="submit">Je reçois mon horoscope ✨</button>
  <p class="km-capture-status" hidden></p>
</form>
```

```javascript
document.getElementById('km-paywall-email')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = e.target.querySelector('input').value.trim();
  const status = e.target.querySelector('.km-capture-status');
  try {
    const r = await fetch('https://nkjbmbdrvejemzrggxvr.supabase.co/functions/v1/newsletter-subscribe', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, locale: document.documentElement.lang || 'fr', source: 'oracle_limit' }),
    });
    const d = await r.json().catch(() => ({}));
    status.hidden = false;
    status.textContent = d.success
      ? 'Parfait ✨ Vérifie ta boîte mail pour confirmer, puis crée ton compte pour continuer l’Oracle.'
      : 'Une erreur est survenue, réessaie.';
    if (d.success) { e.target.querySelector('button').disabled = true; window.km?.trackEvent('paywall_email_captured', { source: 'oracle_limit' }); }
  } catch { status.hidden = false; status.textContent = 'Une erreur est survenue, réessaie.'; }
});
```

- [ ] **Step 2: Build local du site**

```bash
cd ~/stack-2026/karmastro/site && npm run build
```
Expected: build vert (pas d'erreur Astro).

- [ ] **Step 3: Vérifier accents (garde-fou parc)**

```bash
cd ~/stack-2026 && python3 scripts/check_accents.py --site karmastro 2>/dev/null || echo "verifier manuellement oracle.astro"
grep -n "francais\|etablissement\|remunere" karmastro/site/src/pages/oracle.astro || echo "ASCII-fold: aucun"
```
Expected: aucun FR ASCII-foldé.

- [ ] **Step 4: Déployer le site (CI deploy-site actif sur karmastro)**

```bash
cd ~/stack-2026/karmastro
git add site/src/pages/oracle.astro
git commit -m "feat(oracle-site): email capture at anon paywall (source=oracle_limit)"
git push origin main
```
Expected: workflow `deploy-site` se déclenche.

- [ ] **Step 5: Vérifier live après deploy**

```bash
sleep 90
curl -s "https://karmastro.com/oracle/" -o /tmp/oracle.html -w "%{http_code}\n"
grep -c "km-paywall-email" /tmp/oracle.html
```
Expected: `200` et le bundle contient le handler (ou vérifier le JS compilé). Si le handler est inliné dans un script, vérifier la présence du listener via le source rendu.

---

### Task 6: Réparer l'expéditeur de `newsletter-subscribe` (emails de confirmation non délivrés)

**Files:**
- Modify: `app/supabase/functions/newsletter-subscribe/index.ts:18`

**Interfaces:**
- Produces: emails de confirmation envoyés depuis le sous-domaine vérifié → double opt-in fonctionne réellement.

**Contexte :** ligne 18 utilise `"Karmastro <noreply@karmastro.com>"` (apex non vérifié → Resend 403). Sans ça, la capture de Task 5 ne sert à rien : personne ne confirme.

- [ ] **Step 1: Aligner sur la variable d'env vérifiée**

Remplacer :
```typescript
const FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "Karmastro <oracle@mail.karmastro.com>";
```

- [ ] **Step 2: Déployer**

```bash
cd ~/stack-2026/karmastro/app && npx supabase functions deploy newsletter-subscribe --project-ref nkjbmbdrvejemzrggxvr
```
Expected: `Deployed Function newsletter-subscribe`.

- [ ] **Step 3: Test E2E confirmation (avec une adresse à toi)**

```bash
curl -s -X POST "https://nkjbmbdrvejemzrggxvr.supabase.co/functions/v1/newsletter-subscribe" \
  -H "Content-Type: application/json" \
  -d '{"email":"augustin.foucheres+kmtest@gmail.com","locale":"fr","source":"phase1_test"}'
```
Expected: `{"success":true,...}` ET réception de l'email de confirmation. Confirmer via le lien, vérifier `confirmed=true` :
```bash
cd ~/stack-2026 && python3 -c "import sys;sys.path.insert(0,'scripts/intel');from _common import mgmt_query;print(mgmt_query('nkjbmbdrvejemzrggxvr',\"SELECT email,confirmed FROM newsletter_subscribers WHERE source='phase1_test';\"))"
```

- [ ] **Step 4: Commit**

```bash
cd ~/stack-2026/karmastro
git add app/supabase/functions/newsletter-subscribe/index.ts
git commit -m "fix(newsletter): send confirmations from verified subdomain"
```

---

# PHASE 2 — Boucle de rétention email quotidien

### Task 7: Opt-in horoscope quotidien à l'onboarding (nouveaux comptes)

**Files:**
- Modify: `app/src/pages/OnboardingPage.tsx` (étape préférences ou reveal)
- Create: `app/supabase/functions/enroll-daily-horoscope/index.ts`
- Référence: table `newsletter_subscribers`, RPC `newsletter_subscribe`

**Interfaces:**
- Produces: à la fin de l'onboarding, si opt-in coché, le compte est inscrit dans `newsletter_subscribers` avec `sign_slug` calculé depuis `birth_date` et `email` du compte → entre dans la boucle `send-daily-horoscope`.

- [ ] **Step 1: Calcul du signe — helper réutilisable**

Créer/réutiliser une fonction `sunSignFromDate(birthDate: string): string` (ranges tropicaux standards, slugs `belier`…`poissons`). Vérifier si elle existe déjà côté app (l'onboarding calcule déjà le « Sun sign » à l'étape reveal) → réutiliser cette source plutôt que dupliquer.

```bash
grep -rn "sunSign\|sun_sign\|belier\|signFrom" app/src | head
```

- [ ] **Step 2: Edge function `enroll-daily-horoscope`**

```typescript
// app/supabase/functions/enroll-daily-horoscope/index.ts
// Input: { email, locale, sign_slug }  (appelée authentifiée depuis l'app)
// Effet: appelle la RPC newsletter_subscribe(source='onboarding_optin') → double opt-in.
```
Réutiliser le pattern d'appel RPC de `newsletter-subscribe/index.ts`. FROM vérifié.

- [ ] **Step 3: Case opt-in dans l'onboarding (DA + accents)**

À l'étape reveal/préférences, ajouter une case **cochée par défaut** : « Reçois ton horoscope personnalisé chaque matin par email ✨ ». Au `finish()`, si cochée → appel `enroll-daily-horoscope` avec `email = session user.email`, `locale`, `sign_slug`.

- [ ] **Step 4: Build app**

```bash
cd ~/stack-2026/karmastro/app && npm run build
```
Expected: build vert.

- [ ] **Step 5: Déployer la fonction + l'app**

```bash
cd ~/stack-2026/karmastro/app && npx supabase functions deploy enroll-daily-horoscope --project-ref nkjbmbdrvejemzrggxvr
cd ~/stack-2026/karmastro && git add app/ && git commit -m "feat(onboarding): opt-in daily horoscope enrollment" && git push origin main
```

- [ ] **Step 6: Test — un nouveau signup opt-in apparaît dans newsletter_subscribers**

Créer un compte test via l'app, compléter l'onboarding avec opt-in, puis :
```bash
cd ~/stack-2026 && python3 -c "import sys;sys.path.insert(0,'scripts/intel');from _common import mgmt_query;print(mgmt_query('nkjbmbdrvejemzrggxvr',\"SELECT email,sign_slug,source,confirmed FROM newsletter_subscribers WHERE source='onboarding_optin' ORDER BY created_at DESC LIMIT 3;\"))"
```
Expected: la ligne du compte test, `sign_slug` correct.

---

### Task 8: Email d'invitation unique aux 30 comptes existants (réengagement opt-in)

**Files:**
- Create: `scripts/reengage_existing_users.py`
- Référence: `app/supabase/functions/send-email` (template) ou Resend direct depuis le script

**Interfaces:**
- Produces: un email unique à chaque compte existant (avec `birth_date`) invitant à activer l'horoscope quotidien (lien d'inscription pré-rempli) → RGPD-clean (invitation, pas enrôlement forcé).

- [ ] **Step 1: Lister les destinataires (comptes avec email + birth_date, hors déjà-inscrits)**

```bash
cd ~/stack-2026 && python3 -c "
import sys; sys.path.insert(0,'scripts/intel'); from _common import mgmt_query
r=mgmt_query('nkjbmbdrvejemzrggxvr', '''
 SELECT u.email, p.first_name, p.birth_date
 FROM auth.users u JOIN profiles p ON p.user_id=u.id
 WHERE u.email IS NOT NULL AND p.birth_date IS NOT NULL
   AND u.email NOT IN (SELECT email FROM newsletter_subscribers WHERE confirmed)
''')
print(len(r),'destinataires'); [print(x['email']) for x in r]"
```
Expected: la liste (~21 max).

- [ ] **Step 2: Écrire le script d'envoi (dry-run par défaut)**

`scripts/reengage_existing_users.py` : pour chaque destinataire, email FR accentué « {prénom}, tes astres t'attendent chaque matin » + CTA « Activer mon horoscope quotidien » (lien `https://karmastro.com/newsletter/confirm`-style ou inscription pré-remplie). Resend depuis `oracle@mail.karmastro.com`. **Flag `--send` requis** ; sans lui, dry-run (imprime, n'envoie pas). Idempotence : tag `source='reengage_2026-06'`, ne renvoie pas si déjà tagué.

- [ ] **Step 3: Dry-run**

```bash
cd ~/stack-2026 && python3 scripts/reengage_existing_users.py
```
Expected: liste des emails qui SERAIENT envoyés, 0 envoi réel.

- [ ] **Step 4: Envoi réel (après validation Augustin) + vérif**

```bash
cd ~/stack-2026 && python3 scripts/reengage_existing_users.py --send
```
Expected: N envoyés, 0 échec. Vérifier `email_log`.

- [ ] **Step 5: Commit**

```bash
cd ~/stack-2026/karmastro
git add ../scripts/reengage_existing_users.py 2>/dev/null || git -C ~/stack-2026 add scripts/reengage_existing_users.py
cd ~/stack-2026 && git add scripts/reengage_existing_users.py && git commit -m "feat(retention): one-time opt-in invite to existing karmastro accounts"
```

---

### Task 9: Email de bienvenue avec « aha » (carte natale) + CTA retour

**Files:**
- Modify/Reuse: `app/supabase/functions/send-email/index.ts` (template `welcome`)
- Modify: `app/src/pages/OnboardingPage.tsx` (déclencher l'envoi au `finish()`)

**Interfaces:**
- Produces: à la complétion de l'onboarding, un email de bienvenue récap (signe solaire + chemin de vie) avec CTA « Pose ta question à l'Oracle » → ramène sur le site/app.

- [ ] **Step 1: Vérifier le template `welcome` existant**

```bash
grep -n "welcome" app/supabase/functions/send-email/index.ts
```
Expected: voir le case `welcome` (l'agent recon l'a listé). Adapter le corps : récap aha + CTA `https://karmastro.com/oracle/?q=...`.

- [ ] **Step 2: Déclencher l'email au finish() de l'onboarding**

Dans `OnboardingPage.tsx` `finish()`, après l'update profile réussi, appeler `send-email` (template `welcome`, données signe/chemin de vie).

- [ ] **Step 3: Build + déployer**

```bash
cd ~/stack-2026/karmastro/app && npm run build
npx supabase functions deploy send-email --project-ref nkjbmbdrvejemzrggxvr
cd ~/stack-2026/karmastro && git add app/ && git commit -m "feat(onboarding): welcome email with natal aha + Oracle return CTA" && git push origin main
```

- [ ] **Step 4: Test E2E (compte test → email reçu)**

Compléter un onboarding test → vérifier réception + `email_log` type `welcome`.

---

### Task 10: Vérifier que la boucle quotidienne ramène vraiment (CTA retour + couverture)

**Files:**
- Modify: `app/supabase/functions/send-daily-horoscope/index.ts` (CTA retour vers l'Oracle dans l'email HTML)

**Interfaces:**
- Produces: chaque email quotidien contient un CTA « Continue avec l'Oracle » (lien `/oracle/?q=` contextuel au signe) → réengagement → occasions de paywall.

- [ ] **Step 1: Ajouter/renforcer le CTA Oracle dans `htmlEmail`**

Dans la fonction `htmlEmail` de `send-daily-horoscope`, s'assurer qu'un bouton « Pose ta question du jour à l'Oracle » pointe vers `https://karmastro.com/oracle/?lang=<locale>&q=<question liée au signe>` (accents FR, i18n des autres langues).

- [ ] **Step 2: Dry-run de l'envoi quotidien**

```bash
curl -s -X POST "https://nkjbmbdrvejemzrggxvr.supabase.co/functions/v1/send-daily-horoscope" \
  -H "Content-Type: application/json" -d '{"dryRun":true}'
```
Expected: `{"total":N,"dryRun":true,...}` avec N ≥ 12 (et croissant après Tasks 7-8).

- [ ] **Step 3: Déployer + commit**

```bash
cd ~/stack-2026/karmastro/app && npx supabase functions deploy send-daily-horoscope --project-ref nkjbmbdrvejemzrggxvr
cd ~/stack-2026/karmastro && git add app/supabase/functions/send-daily-horoscope/index.ts
git commit -m "feat(daily): Oracle return CTA in daily horoscope email" && git push origin main
```

---

## Audit final (Task 11 — verification-before-completion)

- [ ] Re-mesurer le funnel Supabase (events 7j, paywall_viewed, paywall_email_captured, newsletter_subscribers count, oracle_daily_usage anti-bypass).
- [ ] Prouver chaque fix par une commande + sortie (pas d'assertion sans preuve) : faille fermée (400), limite tient (402 au 4e), backstop IP (402 au 7e), confirmation email reçue, opt-in onboarding enrôle, daily dryRun ≥ 12.
- [ ] Vérifier 0 accent ASCII-foldé sur tous les fichiers FR touchés.
- [ ] Vérifier builds verts (site + app) et deploys CI success + URLs live 200.
- [ ] Nettoyer toute donnée de test (oracle_daily_usage/ip_usage/newsletter_subscribers `source` de test).
- [ ] Mettre à jour la mémoire `project-karmastro-monetisation-mrr-plan-17juin` avec l'état post-chantier.

---

## Self-Review (effectuée)

- **Couverture spec :** fuite anon (Tasks 1-4), capture email (Task 5), confirmation délivrable (Task 6), rétention nouveaux (Task 7) + existants (Task 8) + bienvenue (Task 9) + boucle ramène (Task 10), audit (Task 11). ✓
- **Placeholders :** chemins exacts, commandes exactes avec sorties attendues. `<ts>` migration à remplacer par timestamp réel à l'exécution. ✓
- **Cohérence types :** `oracle_daily_usage(session_id,usage_date,message_count)`, RPC `increment_oracle_usage`/`bump_oracle_ip`, `newsletter_subscribers(email,sign_slug,source,confirmed)` cohérents entre tasks. ✓
- **Points ouverts :** 3 décisions à valider (messages gratuits, consentement, backstop IP) listées en tête.
