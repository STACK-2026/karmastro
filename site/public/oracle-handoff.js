// One-time, same-origin bridge from a calculator result to the public Oracle.
// Private birth data stays in sessionStorage and never enters URLs or analytics.
(function (global) {
  "use strict";

  var KEY = "km_oracle_handoff";
  var LEGACY_KEY = "km_oracle_legacy_question";
  var VERSION = 1;
  var TTL_MS = 30 * 60 * 1000;
  var MAX_FUTURE_SKEW_MS = 5 * 60 * 1000;
  var SOURCE_RE = /^[a-z0-9][a-z0-9-]{1,39}$/;
  var DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  var TIME_RE = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

  function cleanText(value, maxLength) {
    if (typeof value !== "string") return "";
    return value.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
  }

  function validDate(value) {
    if (!DATE_RE.test(value)) return false;
    var parts = value.split("-").map(Number);
    var date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    return date.getUTCFullYear() === parts[0]
      && date.getUTCMonth() === parts[1] - 1
      && date.getUTCDate() === parts[2];
  }

  function normalizeProfile(input) {
    if (input == null) return undefined;
    if (typeof input !== "object" || Array.isArray(input)) return null;
    var profile = {};

    if (input.birthDate != null && input.birthDate !== "") {
      if (typeof input.birthDate !== "string" || !validDate(input.birthDate)) return null;
      profile.birthDate = input.birthDate;
    }
    if (input.birthTime != null && input.birthTime !== "") {
      if (typeof input.birthTime !== "string" || !TIME_RE.test(input.birthTime)) return null;
      profile.birthTime = input.birthTime;
    }
    if (input.birthPlace != null && input.birthPlace !== "") {
      var place = cleanText(input.birthPlace, 120);
      if (!place) return null;
      profile.birthPlace = place;
    }
    return Object.keys(profile).length ? profile : undefined;
  }

  function create(input, now) {
    if (!input || typeof input !== "object" || Array.isArray(input)) return null;
    if (typeof input.source !== "string" || !SOURCE_RE.test(input.source)) return null;

    var payload = {
      version: VERSION,
      createdAt: typeof now === "number" && Number.isFinite(now) ? now : Date.now(),
      source: input.source,
    };

    if (input.question != null && input.question !== "") {
      if (typeof input.question !== "string" || input.question.length > 500) return null;
      var question = cleanText(input.question, 500);
      if (!question) return null;
      payload.question = question;
    }

    var profile = normalizeProfile(input.profile);
    if (profile === null) return null;
    if (profile) payload.profile = profile;
    return payload;
  }

  function getStorage(options) {
    return options && options.storage ? options.storage : global.sessionStorage;
  }

  function store(input, options) {
    try {
      var now = options && typeof options.now === "number" ? options.now : Date.now();
      var payload = create(input, now);
      if (!payload) return null;
      getStorage(options).setItem(KEY, JSON.stringify(payload));
      return payload;
    } catch (error) {
      return null;
    }
  }

  function consume(options) {
    try {
      var storage = getStorage(options);
      var raw = storage.getItem(KEY);
      storage.removeItem(KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      var now = options && typeof options.now === "number" ? options.now : Date.now();
      if (!parsed || parsed.version !== VERSION || typeof parsed.createdAt !== "number") return null;
      if (parsed.createdAt > now + MAX_FUTURE_SKEW_MS || now - parsed.createdAt > TTL_MS) return null;
      return create(parsed, parsed.createdAt);
    } catch (error) {
      return null;
    }
  }

  function cleanHref(href, source, base) {
    try {
      var url = new URL(href, base || global.location.href);
      url.search = "";
      url.hash = "";
      if (typeof source === "string" && SOURCE_RE.test(source)) url.searchParams.set("src", source);
      return url.toString();
    } catch (error) {
      return "/oracle/";
    }
  }

  function consumeLegacyQuestion(options) {
    try {
      var storage = getStorage(options);
      var raw = storage.getItem(LEGACY_KEY);
      storage.removeItem(LEGACY_KEY);
      if (typeof raw !== "string" || raw.length > 500) return "";
      return cleanText(raw, 500);
    } catch (error) {
      return "";
    }
  }

  global.kmOracleHandoff = Object.freeze({
    KEY: KEY,
    LEGACY_KEY: LEGACY_KEY,
    VERSION: VERSION,
    TTL_MS: TTL_MS,
    cleanHref: cleanHref,
    create: create,
    consume: consume,
    consumeLegacyQuestion: consumeLegacyQuestion,
    store: store,
  });
})(typeof window !== "undefined" ? window : this);
