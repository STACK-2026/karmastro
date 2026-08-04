// PostHog EU — site instrumentation, consent-gated + privacy-hardened.
// Loads ONLY when the visitor granted full consent (cookie-consent=all, set by CookieBanner).
// The entire Oracle conversation DOM (#oracle-box) and the birth-data form are BLOCKED from
// session replay: we capture navigation/clicks/hesitation, NEVER the intimate consultation content.
// Contract v1 (shared with app): schema_version:1 + surface + locale + is_anon on every event.

// Key is injected at build time into a <meta name="posthog-key"> tag by BaseLayout
// (read from import.meta.env.PUBLIC_POSTHOG_KEY in the Astro frontmatter — the proven
// GA4 pattern). Reading it from the DOM keeps this module from being tree-shaken and
// avoids unreliable client-module env inlining.
function posthogKey(): string | undefined {
  const el = document.querySelector('meta[name="posthog-key"]') as HTMLMetaElement | null;
  return el?.content || undefined;
}
const POSTHOG_HOST = "https://eu.i.posthog.com";
const SCHEMA_VERSION = 1;
const SURFACE = "site" as const;

type Props = Record<string, unknown>;

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}

function currentLocale(): string {
  const seg = window.location.pathname.split("/")[1] || "";
  return /^[a-z]{2}$/.test(seg) ? seg : "fr";
}

// Common properties attached to every event (never any question/answer/birth text).
function baseProps(extra?: Props): Props {
  return {
    schema_version: SCHEMA_VERSION,
    surface: SURFACE,
    locale: currentLocale(),
    is_anon: true, // site Oracle is anonymous; the app sets is_anon:false after identify()
    ...extra,
  };
}

let loaded = false;

// Minimal official PostHog snippet loader (array stub -> real lib), pinned to EU assets.
function loadPosthogLib(key: string): void {
  if (loaded || (window as any).posthog?.__loaded) return;
  loaded = true;
  /* eslint-disable */
  (function (t: any, e: any) {
    var o: any, n: any, p: any, r: any;
    e.__SV ||
      ((window as any).posthog = e,
      (e._i = []),
      (e.init = function (i: any, s: any, a: any) {
        function g(t: any, e: any) {
          var o = e.split(".");
          2 == o.length && ((t = t[o[0]]), (e = o[1]));
          t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))); };
        }
        (p = t.createElement("script")).type = "text/javascript";
        p.crossOrigin = "anonymous";
        p.async = !0;
        p.src = s.api_host.replace(".i.posthog.com", "-assets.i.posthog.com") + "/static/array.js";
        (r = t.getElementsByTagName("script")[0]).parentNode.insertBefore(p, r);
        var u = e;
        for (
          void 0 !== a ? (u = e[a] = []) : (a = "posthog"),
            u.people = u.people || [],
            u.toString = function (t: any) { var e = "posthog"; return "posthog" !== a && (e += "." + a), t || (e += " (stub)"), e; },
            u.people.toString = function () { return u.toString(1) + ".people (stub)"; },
            o = "init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug getPageViewId".split(" "),
            n = 0;
          n < o.length;
          n++
        )
          g(u, o[n]);
        e._i.push([i, s, a]);
      }),
      (e.__SV = 1));
  })(document, (window as any).posthog || []);
  /* eslint-enable */

  (window as any).posthog.init(key, {
    api_host: POSTHOG_HOST,
    // Privacy hardening
    autocapture: false, // no automatic DOM/text capture
    capture_pageview: true, // URLs only (private Oracle query data is stripped in BaseLayout head)
    capture_pageleave: true,
    disable_surveys: true,
    person_profiles: "always",
    opt_out_capturing_by_default: false, // default-on (controller decision); explicit refusal opts out
    session_recording: {
      maskAllInputs: true, // mask every input (birth date/time/place, names, email)
      // Never record conversation/result text (tool results echo the user's birth date in the
      // calculation string, e.g. "14/04/1992 = ... = 3"). Belt-and-suspenders with blockSelector.
      maskTextSelector: "#oracle-thread, #oracle-thread *, #result, #result *",
      // Block: Oracle thread + birth form (content/PII), every tool RESULT box (#result echoes the
      // birth date/name), any element carrying birth data in an attribute, and any [data-ph-sensitive].
      // Rest of the page (send bar, starters, nav, paywall, forms) stays visible for behaviour.
      blockSelector: "#oracle-thread, #oracle-profile-form, #result, [data-oracle-profile], [data-ph-sensitive]",
    },
  });
}

// Pages fully excluded from PostHog (own/admin traffic + internal noise).
function isExcludedPage(): boolean {
  const p = window.location.pathname;
  // /admin on any locale (/admin, /fr/admin, ...) — Augustin's own traffic, never a real user.
  if (/^\/([a-z]{2}\/)?admin(\/|$)/.test(p)) return true;
  // Self opt-out: run `localStorage.setItem('kh_optout','1')` once in your browser to exclude yourself.
  try { if (localStorage.getItem("kh_optout") === "1") return true; } catch { /* ignore */ }
  return false;
}

// Explicit refusal via the cookie banner ("Essentiels uniquement" / "Refuser").
function hasOptedOut(): boolean {
  const c = getCookie("cookie-consent");
  return c === "none" || c === "essential";
}

export function initPosthog(): void {
  const key = posthogKey();
  if (!key) return; // no key configured -> no-op (safe)
  if (isExcludedPage()) return; // /admin + self opt-out: no load at all

  const start = () => {
    loadPosthogLib(key);
    const ph = (window as any).posthog;
    if (!ph) return;
    // Default-on (controller decision): capture unless the visitor explicitly refused.
    if (hasOptedOut()) {
      if (typeof ph.opt_out_capturing === "function") ph.opt_out_capturing();
    } else if (typeof ph.opt_in_capturing === "function") {
      ph.opt_in_capturing();
    }
  };

  start();

  // React to the cookie banner choice without a page reload.
  document.addEventListener("kh:consent", (e: Event) => {
    const level = (e as CustomEvent).detail;
    const ph = (window as any).posthog;
    if (!ph) return;
    if (level === "all") { if (typeof ph.opt_in_capturing === "function") ph.opt_in_capturing(); }
    else if (typeof ph.opt_out_capturing === "function") ph.opt_out_capturing();
  });
}

// Safe event helper: no-ops until PostHog is loaded & opted in. Never send content here.
export function khTrack(event: string, props?: Props): void {
  const ph = (window as any).posthog;
  if (!ph || typeof ph.capture !== "function" || !ph.has_opted_in_capturing?.()) return;
  ph.capture(event, baseProps(props));
}

// Expose a global for inline island scripts (oracle.astro, tools) to emit events.
declare global {
  interface Window {
    khTrack?: (event: string, props?: Props) => void;
  }
}
if (typeof window !== "undefined") {
  window.khTrack = khTrack;
}
