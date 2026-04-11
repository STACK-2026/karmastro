// Karmastro site tracker — vanilla JS, sends page_views + events to Supabase
// No build step, no bundler. Loaded in BaseLayout.astro via <script src="/tracker.js">
(function () {
  var SUPABASE_URL = "https://nkjbmbdrvejemzrggxvr.supabase.co";
  var SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ramJtYmRydmVqZW16cmdneHZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NzE1MjUsImV4cCI6MjA5MTM0NzUyNX0.KYc8rXIC0RPMskW6eJIE_EranUcLK6nckCAWEph-340";

  var SESSION_KEY = "km_session_id";
  var UTM_KEY = "km_utm";
  var COUNTRY_KEY = "km_country_code";

  var cachedCountry = null;
  try { cachedCountry = sessionStorage.getItem(COUNTRY_KEY) || null; } catch (e) {}

  function fetchCountry() {
    // Cloudflare Pages exposes /cdn-cgi/trace on every site, no key required.
    // Returns plain text "fl=...\nh=...\nip=...\nts=...\nloc=FR\n..."
    return fetch("/cdn-cgi/trace", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.text() : null; })
      .then(function (txt) {
        if (!txt) return null;
        var m = txt.match(/^loc=([A-Z]{2})\s*$/m);
        return m ? m[1] : null;
      })
      .catch(function () { return null; });
  }

  function getSessionId() {
    try {
      var id = sessionStorage.getItem(SESSION_KEY);
      if (!id) {
        id = ("" + Date.now() + Math.random().toString(36).slice(2, 12)).replace(/\./g, "");
        sessionStorage.setItem(SESSION_KEY, id);
      }
      return id;
    } catch (e) {
      return "no-storage-" + Date.now();
    }
  }

  function extractDomain(url) {
    if (!url) return null;
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch (e) {
      return null;
    }
  }

  function captureUtm() {
    try {
      var params = new URLSearchParams(location.search);
      var utm = {
        utm_source: params.get("utm_source"),
        utm_medium: params.get("utm_medium"),
        utm_campaign: params.get("utm_campaign"),
        utm_term: params.get("utm_term"),
        utm_content: params.get("utm_content"),
      };
      var has = false;
      for (var k in utm) if (utm[k]) { has = true; break; }
      if (has && !sessionStorage.getItem(UTM_KEY)) {
        sessionStorage.setItem(UTM_KEY, JSON.stringify(utm));
      }
    } catch (e) {}
  }

  function getStoredUtm() {
    try {
      return JSON.parse(sessionStorage.getItem(UTM_KEY) || "{}");
    } catch (e) { return {}; }
  }

  function getLocale() {
    try {
      var m = location.pathname.match(/^\/([a-z]{2})(\/|$)/);
      if (m) return m[1];
      return (navigator.language || "fr").split("-")[0];
    } catch (e) { return "fr"; }
  }

  var lastInsertId = null;
  var lastTimerStart = 0;
  var lastPath = "";

  function uuid() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    // Fallback for old browsers
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      return (c === "x" ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  function post(endpoint, body) {
    return fetch(SUPABASE_URL + "/rest/v1/" + endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_KEY,
        Authorization: "Bearer " + SUPABASE_KEY,
        Prefer: "return=minimal",
      },
      body: JSON.stringify(body),
    });
  }

  function patch(endpoint, body) {
    return fetch(SUPABASE_URL + "/rest/v1/" + endpoint, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_KEY,
        Authorization: "Bearer " + SUPABASE_KEY,
        Prefer: "return=minimal",
      },
      body: JSON.stringify(body),
      keepalive: true,
    });
  }

  function trackPageView() {
    var path = location.pathname;
    if (path === lastPath) return;

    // Flush time for previous page
    if (lastInsertId && lastTimerStart) {
      var timeMs = Date.now() - lastTimerStart;
      patch("page_views?id=eq." + lastInsertId, { time_on_page_ms: timeMs }).catch(function () {});
    }

    captureUtm();
    var utm = getStoredUtm();
    var referrer = document.referrer || null;

    // Generate client-side UUID so we can update time_on_page later without SELECT grant
    var newId = uuid();

    var payload = {
      id: newId,
      session_id: getSessionId(),
      surface: "site",
      path: path,
      title: document.title,
      referrer: referrer,
      referrer_domain: extractDomain(referrer),
      utm_source: utm.utm_source || null,
      utm_medium: utm.utm_medium || null,
      utm_campaign: utm.utm_campaign || null,
      utm_term: utm.utm_term || null,
      utm_content: utm.utm_content || null,
      user_agent: navigator.userAgent,
      screen_width: window.innerWidth,
      screen_height: window.innerHeight,
      locale: getLocale(),
      country_code: cachedCountry,
    };

    // Fire-and-forget : with Prefer: return=minimal, status 201 = success
    post("page_views", payload).catch(function () {});

    // Track locally for time_on_page update
    lastInsertId = newId;
    lastTimerStart = Date.now();
    lastPath = path;

    // If country not known yet (first pageview of session), fetch it async
    // and PATCH this row once resolved. Future pageviews will have it inline.
    if (!cachedCountry) {
      fetchCountry().then(function (cc) {
        if (!cc) return;
        cachedCountry = cc;
        try { sessionStorage.setItem(COUNTRY_KEY, cc); } catch (e) {}
        // Patch the row we just inserted
        patch("page_views?id=eq." + newId, { country_code: cc }).catch(function () {});
      });
    }
  }

  function trackEvent(name, props) {
    post("analytics_events", {
      session_id: getSessionId(),
      surface: "site",
      event_name: name,
      properties: props || {},
      path: location.pathname,
    }).catch(function () {});
  }

  // Flush time-on-page on unload
  window.addEventListener("beforeunload", function () {
    if (lastInsertId && lastTimerStart) {
      var timeMs = Date.now() - lastTimerStart;
      patch("page_views?id=eq." + lastInsertId, { time_on_page_ms: timeMs }).catch(function () {});
    }
  });

  // Also flush on visibility change (mobile Safari rarely fires beforeunload)
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden" && lastInsertId && lastTimerStart) {
      var timeMs = Date.now() - lastTimerStart;
      patch("page_views?id=eq." + lastInsertId, { time_on_page_ms: timeMs }).catch(function () {});
    }
  });

  // Cross-subdomain tier sync : read the km_user_tier cookie (set by the app)
  // and mirror it into localStorage so pages can gate premium features.
  try {
    var m = document.cookie.match(/(?:^|;\s*)km_user_tier=([^;]+)/);
    if (m && m[1]) {
      localStorage.setItem("km_user_tier", m[1]);
    }
  } catch (e) {}

  // Initial pageview
  trackPageView();

  // Expose API globally for custom events from other scripts / components
  window.km = {
    trackPageView: trackPageView,
    trackEvent: trackEvent,
    getSessionId: getSessionId,
  };
})();
