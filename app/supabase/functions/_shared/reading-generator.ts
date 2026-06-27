// Génère la lecture karmique payante : construit le prompt (déterministe, testé) puis
// appelle Claude. La lecture va AU-DELÀ du teaser gratuit : elle croise la/les dette(s)
// détectée(s) avec le chemin de vie et le nombre d'expression, personnalisée au prénom.

import { calculateLifePath, calculateExpression, reduceNumerology, detectKarmicDebts, KARMIC_DEBTS } from "./numerology.ts";

// Universal helpers (annee-personnelle).
function digitSum(n: number): number {
  return String(Math.abs(n)).split("").reduce((a, c) => a + (+c || 0), 0);
}
function personalYear(day: number, month: number, year: number): number {
  return reduceNumerology(
    reduceNumerology(day) + reduceNumerology(month) + reduceNumerology(digitSum(year)),
  );
}
// Mois personnel = réduction(année personnelle + mois calendaire courant).
function personalMonth(day: number, month: number, year: number, calMonth: number): number {
  return reduceNumerology(personalYear(day, month, year) + reduceNumerology(calMonth));
}
const MONTH_NAMES = ["", "janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

// Signe solaire tropical depuis la date (déterministe, sans heure ni lieu) — sert à
// la lecture Âme Sœur, qui n'a PAS besoin du moteur Swiss Ephemeris.
function sunSign(month: number, day: number, en: boolean): string {
  if (!Number.isFinite(month) || !Number.isFinite(day)) return en ? "unknown" : "inconnu";
  const md = month * 100 + day; // ex : 18 juillet -> 718
  let fr: string, eng: string;
  if (md >= 1222 || md <= 119) { fr = "Capricorne"; eng = "Capricorn"; }
  else if (md <= 218) { fr = "Verseau"; eng = "Aquarius"; }
  else if (md <= 320) { fr = "Poissons"; eng = "Pisces"; }
  else if (md <= 419) { fr = "Bélier"; eng = "Aries"; }
  else if (md <= 520) { fr = "Taureau"; eng = "Taurus"; }
  else if (md <= 620) { fr = "Gémeaux"; eng = "Gemini"; }
  else if (md <= 722) { fr = "Cancer"; eng = "Cancer"; }
  else if (md <= 822) { fr = "Lion"; eng = "Leo"; }
  else if (md <= 922) { fr = "Vierge"; eng = "Virgo"; }
  else if (md <= 1022) { fr = "Balance"; eng = "Libra"; }
  else if (md <= 1121) { fr = "Scorpion"; eng = "Scorpio"; }
  else { fr = "Sagittaire"; eng = "Sagittarius"; }
  return en ? eng : fr;
}

// ── Phase 2 : outils astro (dépendent du moteur Swiss Ephemeris) ──────────────
const ENGINE_URL = "http://168.119.229.20:8100";

// deno-lint-ignore no-explicit-any
function summarizeChart(chart: any): string {
  if (!chart || chart.error) return "";
  const lines: string[] = [];
  if (chart.ascendant?.sign) {
    lines.push(`Ascendant : ${chart.ascendant.sign} ${chart.ascendant.degree}°${chart.ascendant.minute ?? 0}'`);
  }
  if (chart.midheaven?.sign) lines.push(`Milieu du ciel : ${chart.midheaven.sign}`);
  const planets = chart.planets || {};
  for (const name of Object.keys(planets)) {
    const p = planets[name];
    if (!p?.sign) continue;
    lines.push(`${name} : ${p.sign} ${p.degree}°${p.retrograde ? " (rétrograde)" : ""}${p.house ? ` — maison ${p.house}` : ""}`);
  }
  return lines.join("\n");
}

// Appel moteur côté serveur pour bâtir la lecture sur de VRAIES positions (anti-invention).
// Retourne "" si le moteur échoue (le garde anti-invention du prompt prend alors le relais).
async function buildEngineSummary(input: ReadingInput): Promise<string> {
  const tool = input.tool;
  try {
    const [y, m, d] = input.birthDate.split("-").map(Number);
    const hour = timeToHour(input.birthTime);
    const lat = Number(input.latitude), lon = Number(input.longitude);
    if (tool === "synastrie") {
      const [py, pm, pd] = (input.partnerBirthDate || "").split("-").map(Number);
      const body = {
        person1: { year: y, month: m, day: d, hour, latitude: lat, longitude: lon },
        person2: {
          year: py, month: pm, day: pd, hour: timeToHour(input.partnerBirthTime),
          latitude: Number(input.partnerLatitude), longitude: Number(input.partnerLongitude),
        },
      };
      const r = await fetch(`${ENGINE_URL}/compatibility`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (!r.ok) return "";
      const dd = await r.json();
      const asp = (dd.synastry_aspects || []).slice(0, 12)
        .map((a: { person1_planet: string; person2_planet: string; aspect: string; nature: string }) =>
          `${a.person1_planet} (1) ${a.aspect} ${a.person2_planet} (2) [${a.nature}]`).join("\n");
      return [
        `THÈME DE LA PERSONNE 1 (Swiss Ephemeris) :`, summarizeChart(dd.person1_chart),
        ``, `THÈME DE LA PERSONNE 2 (Swiss Ephemeris) :`, summarizeChart(dd.person2_chart),
        ``, `ASPECTS DE SYNASTRIE (les plus serrés) :`, asp,
      ].join("\n");
    }
    // ascendant / theme-natal / transits : oracle-context (natal + transits)
    const r = await fetch(`${ENGINE_URL}/oracle-context`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year: y, month: m, day: d, hour, latitude: lat, longitude: lon }),
    });
    if (!r.ok) return "";
    const dd = await r.json();
    const parts = [`THÈME NATAL (Swiss Ephemeris, précision 0.001") :`, summarizeChart(dd.natal_chart)];
    if (tool === "transits") {
      const tr = (dd.active_transits || []).slice(0, 10)
        .map((t: { transit_planet: string; natal_planet: string; aspect: string; nature: string }) =>
          `${t.transit_planet} en transit ${t.aspect} ${t.natal_planet} natal [${t.nature}]`).join("\n");
      parts.push(``, `TRANSITS ACTIFS AUJOURD'HUI :`, tr);
      if (dd.cosmic?.moon?.name) parts.push(``, `Ciel du jour : ${dd.cosmic.moon.name}, Soleil en ${dd.cosmic.sun_position?.sign ?? "?"}.`);
    }
    return parts.join("\n");
  } catch {
    return "";
  }
}

function timeToHour(t?: string): number {
  if (!t) return 12;
  const [h, mi] = String(t).split(":").map(Number);
  return (Number.isFinite(h) ? h : 12) + (Number.isFinite(mi) ? mi / 60 : 0);
}

// Résumés canoniques EN (pour le fallback anglais — KARMIC_DEBTS source est FR).
const KARMIC_DEBTS_EN: Record<string, { title: string; pastLife: string; challenge: string; healing: string }> = {
  "13/4": { title: "The debt of laziness", pastLife: "In a past life, your soul sought shortcuts and let others carry the weight of its existence.", challenge: "This life, everything you earn demands twice the effort; projects only bear fruit if you go the distance.", healing: "Embrace patient daily work. Each task done conscientiously pays your debt — no shortcuts, just the beauty of work well done." },
  "14/5": { title: "The debt of misused freedom", pastLife: "In a past life, your soul abused pleasures and freedom without measure or responsibility.", challenge: "This life, temptations are frequent and consequences swift — excess and compulsive change lie in wait.", healing: "Find freedom in moderation and chosen commitment. True freedom isn't fleeing all ties — it's choosing them." },
  "16/7": { title: "The debt of spiritual ego", pastLife: "In a past life, your soul used its knowledge to dominate, seduce or feel superior.", challenge: "This life, sudden falls and ego collapses force humility; whatever is built on spiritual pride crumbles.", healing: "Accept collapses as purifications. Cultivate sincere humility and shared knowledge without vanity." },
  "19/1": { title: "The debt of misused power", pastLife: "In a past life, your soul wielded authority with cruelty, or abandoned those who depended on its leadership.", challenge: "This life, you must learn to lead with responsibility; you may feel isolated or misunderstood in your leadership.", healing: "Accept to lead when it's your role. Learn power in service — authority that lifts others up." },
};

// Lecture de secours composée des textes canoniques (KARMIC_DEBTS) + chemin de vie,
// servie SI l'appel Claude échoue (ex : crédit API épuisé). Le client payant reçoit
// toujours une vraie lecture cohérente à l'écran (règle "livraison écran d'abord").
export function buildFallbackReading(input: ReadingInput): string {
  // Filet générique pour les outils non-karmic (pas de dépendance debtCodes).
  if (input.tool && input.tool !== "karmic-debt") {
    const enf = input.locale !== "fr"; // filet en anglais pour toute langue ≠ fr
    const f = input.fullName.trim().split(/\s+/)[0] || (enf ? "friend" : "toi");
    return enf
      ? `${f}, here is your reading. The stars incline, they do not compel. Take a quiet moment to breathe, and let this guidance settle. Your full personalised reading is being prepared; if you are reading this, the live engine paused for a moment, but your insight is valid and yours to keep.`
      : `${f}, voici ta lecture. Les astres inclinent mais ne determinent pas. Prends un instant pour respirer et laisser cette guidance se deposer. Ta lecture personnalisee complete se prepare ; si tu lis ce message, le moteur a marque une courte pause, mais ton eclairage reste valide et il est a toi.`;
  }
  const en = input.locale === "en";
  const debtCodes = input.debtCodes || [];
  const parts = (input.birthDate || "").split("-").map(Number);
  const first = input.fullName.trim().split(/\s+/)[0] || (en ? "friend" : "toi");
  let lpLine = "";
  if (parts.length === 3 && parts.every((n) => Number.isFinite(n))) {
    const [y, m, d] = parts;
    const lp = calculateLifePath(d, m, y);
    lpLine = en
      ? `Your life path ${lp.number}${lp.isMaster ? " (master number)" : ""} colours how this memory replays today.`
      : `Ton chemin de vie ${lp.number}${lp.isMaster ? " (maître nombre)" : ""} colore la façon dont cette mémoire se rejoue aujourd'hui.`;
  }

  if (en) {
    const blocks = debtCodes.map((code) => KARMIC_DEBTS_EN[code] ? { code, ...KARMIC_DEBTS_EN[code] } : null)
      .filter(Boolean)
      .map((info) => [
        `## ${info!.code} — ${info!.title}`,
        `**The soul memory.** ${info!.pastLife}`,
        `**What it creates today.** ${info!.challenge} ${lpLine}`,
        `**The work of this lifetime.** ${info!.healing}`,
        `**Your ritual for the week.** Each evening, note one moment where the ${info!.code} pattern replayed in your day — without judging, just to see it. Awareness is the first step of repayment.`,
        `**The question to hold.** Before each important decision: "am I repeating my ${info!.code}, or choosing the path of healing?"`,
      ].join("\n\n"));
    const intro = `${first}, here is your karmic reading. Take it as a map, not a sentence: a karmic debt is an invitation to grow, never a condemnation.`;
    return [intro, ...blocks].join("\n\n");
  }

  const blocks = debtCodes
    .map((code) => KARMIC_DEBTS[code])
    .filter(Boolean)
    .map((info) => {
      return [
        `## ${info.code} — ${info.title}`,
        `**La mémoire d'âme.** ${info.story} ${info.pastLife}`,
        `**Ce que ça crée aujourd'hui.** ${info.currentChallenge} ${lpLine}`,
        `**Le travail de cette incarnation.** ${info.healing}`,
        `**Ton rituel de la semaine.** Chaque soir, note un moment où le schéma du ${info.code} s'est rejoué dans ta journée — sans te juger, juste pour le voir. La conscience est le premier pas du remboursement.`,
        `**La question à te poser.** Avant chaque décision importante : « est-ce que je répète mon ${info.code}, ou est-ce que je choisis la voie de guérison ? »`,
      ].join("\n\n");
    });
  const intro = `${first}, voici ta lecture karmique. Prends-la comme une carte, pas comme une sentence : la dette est une invitation à grandir, jamais une condamnation.`;
  return [intro, ...blocks].join("\n\n");
}

export type ReadingTool =
  | "karmic-debt" | "chemin-de-vie" | "nombre-expression"
  | "annee-personnelle" | "compatibilite" | "profil-complet"
  | "ascendant" | "theme-natal" | "transits" | "synastrie"
  | "guidance-mensuelle" | "ame-soeur";

export type ReadingInput = {
  fullName: string;
  birthDate: string; // "YYYY-MM-DD"
  locale: string;
  tool?: ReadingTool;          // défaut "karmic-debt" (compat héritée)
  debtCodes?: string[];        // karmic-debt
  partnerBirthDate?: string;   // compatibilite / synastrie "YYYY-MM-DD"
  partnerName?: string;        // compatibilite / synastrie (optionnel)
  currentYear?: number;        // annee-personnelle (défaut: année courante côté webhook)
  currentMonth?: number;       // guidance-mensuelle (1-12)
  // Outils astro (Phase 2) : heure + coordonnées déjà géocodées côté client.
  birthTime?: string;          // "HH:MM"
  latitude?: number;
  longitude?: number;
  partnerBirthTime?: string;   // synastrie
  partnerLatitude?: number;    // synastrie
  partnerLongitude?: number;   // synastrie
};

const ASTRO_TOOLS = new Set(["ascendant", "theme-natal", "transits", "synastrie"]);

// Moteur de prompt UNIVERSEL : route par input.tool. karmic-debt reste géré par
// buildKarmicDebtPrompt (zéro régression). Les autres outils numérologie partagent
// un tronc commun (persona Orion, langue, 1100-1400 mots, structure, contraintes)
// + un bloc de cadrage spécifique au tool (données calculées + angle d'interprétation).
export function buildReadingPrompt(input: ReadingInput, engineData = ""): string {
  const tool = input.tool || "karmic-debt";
  if (tool === "karmic-debt") return buildKarmicDebtPrompt(input);

  // Toute langue ≠ fr utilise le scaffold d'instructions EN, mais la SORTIE est
  // rédigée dans la langue cible (outLang). Évite qu'un acheteur DE/ES/etc. reçoive
  // une lecture en français. [2026-06-01]
  const LANG: Record<string, string> = {
    en: "ENGLISH", es: "SPANISH", it: "ITALIAN", de: "GERMAN", pt: "PORTUGUESE",
    tr: "TURKISH", ru: "RUSSIAN", pl: "POLISH", ar: "ARABIC", nl: "DUTCH",
    ja: "JAPANESE", ko: "KOREAN", zh: "CHINESE", vi: "VIETNAMESE",
  };
  const en = input.locale !== "fr";
  const outLang = LANG[input.locale] || "ENGLISH";
  const [y, m, d] = input.birthDate.split("-").map(Number);
  const hasName = input.fullName.trim().length > 0;
  const first = hasName ? input.fullName.trim().split(/\s+/)[0] : (en ? "the seeker" : "toi");

  let focus = "";
  if (tool === "ascendant") {
    focus = en
      ? `Focus: the ASCENDANT (rising sign) and how it shapes the personality, the social mask and the path. Use the EXACT positions below; never invent a position.`
      : `Focus : l'ASCENDANT (signe ascendant) et la façon dont il façonne la personnalité, le masque social et la trajectoire. Appuie-toi sur les positions EXACTES ci-dessous ; n'invente jamais une position.`;
  } else if (tool === "theme-natal") {
    focus = en
      ? `Focus: the full NATAL CHART (the sky at birth). Read the dominant signature: Sun, Moon, Ascendant, planetary emphasis by sign and house. Use the EXACT positions below; never invent.`
      : `Focus : le THÈME NATAL complet (le ciel de naissance). Lis la signature dominante : Soleil, Lune, Ascendant, accents planétaires par signe et maison. Appuie-toi sur les positions EXACTES ci-dessous ; n'invente jamais.`;
  } else if (tool === "transits") {
    focus = en
      ? `Focus: the active TRANSITS right now on the natal chart. Read what the current sky activates, the opportunities and tensions of this period. Use the EXACT transits below; never invent.`
      : `Focus : les TRANSITS actifs en ce moment sur le thème natal. Lis ce que le ciel actuel active, les opportunités et tensions de cette période. Appuie-toi sur les transits EXACTS ci-dessous ; n'invente jamais.`;
  } else if (tool === "synastrie") {
    const pname = (input.partnerName || "").trim() || (en ? "the partner" : "l'autre");
    focus = en
      ? `Focus: the SYNASTRY (astrological compatibility) between ${first} and ${pname}. Read the relational dynamic from the cross-aspects between the two charts below: attractions, frictions, growth. Use the EXACT data; never invent.`
      : `Focus : la SYNASTRIE (compatibilité astrologique) entre ${first} et ${pname}. Lis la dynamique relationnelle à partir des aspects croisés entre les deux thèmes ci-dessous : attirances, frictions, croissance. Appuie-toi sur les données EXACTES ; n'invente jamais.`;
  } else if (tool === "chemin-de-vie") {
    const lp = calculateLifePath(d, m, y);
    focus = en
      ? `Focus: the LIFE PATH. Life path number: ${lp.number}${lp.isMaster ? " (master number)" : ""} (calc: ${lp.calculation}). Read this number in depth: its gift, its shadow, its mission.`
      : `Focus : le CHEMIN DE VIE. Nombre de chemin de vie : ${lp.number}${lp.isMaster ? " (maitre nombre)" : ""} (calcul : ${lp.calculation}). Lis ce nombre en profondeur : son don, son ombre, sa mission.`;
  } else if (tool === "nombre-expression") {
    const ex = calculateExpression(input.fullName);
    focus = en
      ? `Focus: the EXPRESSION NUMBER (from the full name "${input.fullName.trim()}"). Expression number: ${ex.number}${ex.isMaster ? " (master)" : ""}. Read what this name vibration reveals about talents, the way of acting, the life direction.`
      : `Focus : le NOMBRE D'EXPRESSION (depuis le nom complet "${input.fullName.trim()}"). Nombre d'expression : ${ex.number}${ex.isMaster ? " (maitre)" : ""}. Lis ce que cette vibration du nom revele des talents, de la facon d'agir, de la direction de vie.`;
  } else if (tool === "annee-personnelle") {
    const yr = input.currentYear || y;
    const py = personalYear(d, m, yr);
    focus = en
      ? `Focus: the PERSONAL YEAR ${yr}. Personal year number: ${py}. Read the energy of this 1-year cycle: themes, opportunities, what to start or close, month-by-month tone if relevant.`
      : `Focus : l'ANNEE PERSONNELLE ${yr}. Nombre d'annee personnelle : ${py}. Lis l'energie de ce cycle d'un an : themes, opportunites, ce qu'il faut lancer ou cloturer, la couleur mois par mois si pertinent.`;
  } else if (tool === "compatibilite") {
    const lp1 = calculateLifePath(d, m, y);
    const [py2, pm2, pd2] = (input.partnerBirthDate || "").split("-").map(Number);
    const lp2 = Number.isFinite(pd2) ? calculateLifePath(pd2, pm2, py2) : null;
    const pname = (input.partnerName || "").trim() || (en ? "the partner" : "l'autre");
    focus = en
      ? `Focus: NUMEROLOGICAL COMPATIBILITY between ${first} (life path ${lp1.number}) and ${pname} (life path ${lp2 ? lp2.number : "?"}). Read the dynamic between these two life paths: natural strengths of the bond, frictions to watch, how to grow together.`
      : `Focus : COMPATIBILITE NUMEROLOGIQUE entre ${first} (chemin de vie ${lp1.number}) et ${pname} (chemin de vie ${lp2 ? lp2.number : "?"}). Lis la dynamique entre ces deux chemins de vie : forces naturelles du lien, frictions a surveiller, comment grandir ensemble.`;
  } else if (tool === "profil-complet") {
    const lp = calculateLifePath(d, m, y);
    const ex = input.fullName.trim() ? calculateExpression(input.fullName) : null;
    const yr = input.currentYear || y;
    const py = personalYear(d, m, yr);
    const debts = detectKarmicDebts(d, m, y);
    const debtList = debts.length ? debts.map((x) => `${x.code} (${x.title})`).join(", ") : (en ? "none" : "aucune");
    focus = en
      ? `Focus: the COMPLETE NUMEROLOGY PROFILE. Weave ALL of these numbers into ONE coherent, flowing portrait (not four separate blocks):
- Life path: ${lp.number}${lp.isMaster ? " (master number)" : ""} (the core mission)
- Expression number: ${ex ? ex.number + (ex.isMaster ? " (master)" : "") : "(full name not provided, focus on the others)"} (innate talents and way of acting)
- Personal year ${yr}: ${py} (the energy of the current cycle)
- Karmic debts: ${debtList}
Show how these reinforce or tension each other, what archetype emerges from their combination, what it means concretely today, and where the person is being invited to grow. This is the premium reading: deeper, longer, and synthesised.`
      : `Focus : le PROFIL NUMÉROLOGIQUE COMPLET. Tisse TOUS ces nombres en UN portrait cohérent et fluide (pas quatre blocs séparés) :
- Chemin de vie : ${lp.number}${lp.isMaster ? " (maitre nombre)" : ""} (la mission de fond)
- Nombre d'expression : ${ex ? ex.number + (ex.isMaster ? " (maitre)" : "") : "(nom complet non fourni, concentre-toi sur les autres)"} (talents innés et façon d'agir)
- Année personnelle ${yr} : ${py} (l'énergie du cycle en cours)
- Dettes karmiques : ${debtList}
Montre comment ces nombres se renforcent ou se tendent, quel archétype émerge de leur combinaison, ce que ça signifie concrètement aujourd'hui, et où la personne est invitée à grandir. C'est la lecture premium : plus profonde, plus longue, synthétisée.`;
  } else if (tool === "ame-soeur") {
    const lp1 = calculateLifePath(d, m, y);
    const [py2, pm2, pd2] = (input.partnerBirthDate || "").split("-").map(Number);
    const lp2 = Number.isFinite(pd2) ? calculateLifePath(pd2, pm2, py2) : null;
    const sun1 = sunSign(m, d, en);
    const sun2 = Number.isFinite(pm2) && Number.isFinite(pd2) ? sunSign(pm2, pd2, en) : (en ? "unknown" : "inconnu");
    const pname = (input.partnerName || "").trim() || (en ? "the partner" : "l'autre");
    focus = en
      ? `Focus: the SOULMATE reading (a karmic relationship reading) between ${first} and ${pname}. Cross TWO layers: (1) numerological compatibility, life path ${lp1.number}${lp1.isMaster ? " (master)" : ""} for ${first} and life path ${lp2 ? lp2.number : "?"}${lp2?.isMaster ? " (master)" : ""} for ${pname}; (2) the relational dynamic of their sun signs, ${sun1} (${first}) and ${sun2} (${pname}). Read the karmic bond between these two people: what draws them together, the strengths of the bond, the frictions to bring to awareness, and the soul lesson this relationship comes to teach. Use ONLY this computed data; never invent a birth time, house or full chart (these were not provided).`
      : `Focus : la lecture ÂME SŒUR (lecture de relation karmique) entre ${first} et ${pname}. Croise DEUX couches : (1) la compatibilité numérologique, chemin de vie ${lp1.number}${lp1.isMaster ? " (maitre nombre)" : ""} pour ${first} et chemin de vie ${lp2 ? lp2.number : "?"}${lp2?.isMaster ? " (maitre nombre)" : ""} pour ${pname} ; (2) la dynamique relationnelle de leurs signes solaires, ${sun1} (${first}) et ${sun2} (${pname}). Lis le lien karmique entre ces deux personnes : ce qui les attire, les forces du lien, les frictions à conscientiser, et la leçon d'âme que cette relation vient enseigner. Appuie-toi UNIQUEMENT sur ces données calculées ; n'invente jamais une heure de naissance, une maison ni un thème complet (ils n'ont pas été fournis).`;
  } else if (tool === "guidance-mensuelle") {
    const yr = input.currentYear || y;
    const cm = input.currentMonth || (m || 1);
    const py = personalYear(d, m, yr);
    const pm = personalMonth(d, m, yr, cm);
    const monthName = MONTH_NAMES[cm] || String(cm);
    focus = en
      ? `Focus: the GUIDANCE FOR THE MONTH (${monthName} ${yr}). Personal year: ${py}. Personal month: ${pm}. Read the specific energy of THIS month for the person: the theme to live, what naturally flows, what to start or let go, one concrete focus for the weeks ahead and a short ritual. Warm, forward-looking, actionable. This is a recurring monthly companion, make it feel fresh and personal for ${monthName}.`
      : `Focus : la GUIDANCE DU MOIS (${monthName} ${yr}). Année personnelle : ${py}. Mois personnel : ${pm}. Lis l'énergie spécifique de CE mois pour la personne : le thème à vivre, ce qui coule naturellement, ce qu'il faut lancer ou lâcher, un focus concret pour les semaines à venir et un court rituel. Chaleureux, tourné vers l'avant, actionnable. C'est un rendez-vous mensuel récurrent, fais-le sentir frais et personnel pour ${monthName}.`;
  }

  const isAme = tool === "ame-soeur";
  const words = tool === "profil-complet" ? "1600 to 2100" : (tool === "guidance-mensuelle" ? "450 to 650" : (isAme ? "1500 to 1900" : "1100 to 1400"));
  const motsFr = tool === "profil-complet" ? "1600 a 2100" : (tool === "guidance-mensuelle" ? "450 a 650" : (isAme ? "1500 a 1900" : "1100 a 1400"));
  const pnameH = (input.partnerName || "").trim() || (en ? "the partner" : "l'autre");
  const headEn = isAme
    ? `You are Séléné, the guide of bonds and relationships at Karmastro: a lunar voice, gentle and lucid, who speaks of the heart without sentimentality, always nuanced and tactful, never heavy, never flattering, never hollow new-age. Write a personalised couple reading entirely IN ${outLang} (every sentence, titles included), addressing ${first} directly about the relationship with ${pnameH}, about ${words} words.`
    : `You are Orion, the karmic guide of Karmastro: the voice of a born orator, eloquent and vivid, who charms through the precision and quiet music of a well-turned phrase, yet always delicate and tactful, never heavy, never flattering, never hollow new-age. Warm, lucid, grounded. Write a personalised reading entirely IN ${outLang} (every sentence, titles included), addressing the person directly, about ${words} words.`;
  const headFr = isAme
    ? `Tu es Séléné, la guide des liens et des relations de Karmastro : une voix lunaire, douce et lucide, qui parle du coeur sans mièvrerie, toujours nuancée et délicate, jamais lourde, jamais flatteuse, jamais new-age creux. Écris une lecture de couple personnalisée EN FRANCAIS, au tutoiement, en t'adressant à ${first} à propos de sa relation avec ${pnameH}, d'environ ${motsFr} mots.`
    : `Tu es Orion, le guide karmique de Karmastro : la voix d'un orateur né, éloquent et imagé, qui charme par la justesse et la musique discrète d'une phrase bien tournée, mais toujours délicat et tout en nuance, jamais lourd, jamais flatteur, jamais new-age creux. Chaleureux, lucide, incarné. Écris une lecture personnalisée EN FRANCAIS, au tutoiement, d'environ ${motsFr} mots.`;
  const structEn = isAme
    ? `Structure with markdown (##) section titles: 1) Where your two souls meet (what the crossing of your numbers and signs reveals). 2) The strengths of your bond. 3) The frictions to bring to awareness (without drama, with tenderness). 4) The karmic lesson of this relationship. 5) Your shared ritual for the week (one simple concrete gesture for the two of you within 7 days). 6) The question to hold together.`
    : `Structure with markdown (##) section titles: 1) What this reveals about you. 2) What it means concretely in your life right now. 3) The strength to lean on. 4) Your ritual for the week (one simple concrete gesture within 7 days). 5) The question to hold before important decisions.`;
  const structFr = isAme
    ? `Structure avec des titres markdown (##) : 1) La ou vos deux ames se rencontrent (ce que revele le croisement de vos nombres et de vos signes). 2) Les forces de votre lien. 3) Les frictions a conscientiser (sans dramatiser, avec tendresse). 4) La lecon karmique de cette relation. 5) Votre rituel a deux pour la semaine (un geste concret simple pour vous deux sous 7 jours). 6) La question a vous poser ensemble.`
    : `Structure avec des titres markdown (##) : 1) Ce que cela revele de toi. 2) Ce que ca signifie concretement dans ta vie en ce moment. 3) La force sur laquelle t'appuyer. 4) Ton rituel de la semaine (un geste concret simple sous 7 jours). 5) La question a te poser avant chaque decision importante.`;
  const constraintsEn = `Constraints: no medical/financial/miraculous promises; no fatalism; no unexplained jargon; favour inhabited prose over endless bullet lists. NEVER use em dash or en dash. NEVER open with an affectionate vocative ("dear heart", "my heart", "dear soul", "dear you"…) and never call the reader "heart"; enter directly into the substance. Start directly with the first section.`;
  const constraintsFr = `Contraintes : aucune promesse medicale/financiere/miraculeuse ; pas de fatalisme ; pas de jargon non explique ; prose habitee plutot que listes a puces interminables. N'utilise JAMAIS de tiret cadratin ni demi-cadratin. N'OUVRE JAMAIS par un appellatif affectueux ("cher coeur", "mon coeur", "chere ame", "cher toi"…) et n'appelle jamais le lecteur "coeur" ; entre directement dans le fond. Commence directement par la premiere section.`;

  const focusBlock = engineData ? `${focus}\n\n${engineData}` : focus;
  return (en
    ? [headEn, ``, focusBlock, ``, structEn, ``, constraintsEn]
    : [headFr, ``, focusBlock, ``, structFr, ``, constraintsFr]
  ).join("\n");
}

export function buildKarmicDebtPrompt(input: ReadingInput): string {
  const en = input.locale === "en";
  const [y, m, d] = input.birthDate.split("-").map(Number);
  const lp = calculateLifePath(d, m, y);
  const hasName = input.fullName.trim().length > 0;
  const first = hasName ? input.fullName.trim().split(/\s+/)[0] : (en ? "the seeker" : "toi");

  if (en) {
    const exprLine = hasName
      ? `Expression number (from "${input.fullName.trim()}"): ${calculateExpression(input.fullName).number}.`
      : `Full name not provided: centre the reading on the karmic debt(s) and the life path.`;
    const debtContext = (input.debtCodes || []).map((code) => {
      const info = KARMIC_DEBTS_EN[code];
      return info ? `- ${code} (${info.title}) · memory: ${info.pastLife}` : `- ${code}`;
    }).join("\n");
    return [
      `You are Orion, the karmic coach of Karmastro: warm, lucid, grounded, never anxiety-inducing or hollow new-age.`,
      `Write a personalised karmic reading IN ENGLISH, addressing the person as "you", about 1100 to 1400 words.`,
      ``,
      `Person: first name "${first}".`,
      `Detected karmic debt(s):`,
      debtContext,
      `Life path: ${lp.number}${lp.isMaster ? " (master number)" : ""}. ${exprLine}`,
      ``,
      `Structure the reading in sections with markdown (##) titles:`,
      `1) The soul memory — what this debt (or debts) say about a past life, written for ${first}.`,
      `2) What it creates in YOUR life today — concrete, tied to life path ${lp.number}.`,
      `3) The work of this lifetime — the lesson to integrate, without guilt-tripping.`,
      `4) Your ritual for the week — one simple, concrete gesture to try within 7 days.`,
      `5) The question to hold — a single pivotal question to ask before every important decision.`,
      ``,
      `Constraints: no medical, financial or miraculous-healing promises; no fatalism (a karmic debt is an invitation, never a sentence); no unexplained jargon; avoid endless bullet lists, favour inhabited prose. Start directly with the first section.`,
    ].join("\n");
  }

  const exprLine = hasName
    ? `Nombre d'expression (depuis "${input.fullName.trim()}") : ${calculateExpression(input.fullName).number}.`
    : `Nom complet non fourni : centre la lecture sur la/les dette(s) et le chemin de vie.`;
  const debtContext = (input.debtCodes || [])
    .map((code) => {
      const info = KARMIC_DEBTS[code];
      if (!info) return `- ${code}`;
      return `- ${info.code} (${info.title}) · mémoire : ${info.pastLife}`;
    })
    .join("\n");

  return [
    `Tu es Orion, coach karmique de Karmastro : voix chaleureuse, lucide, incarnée, jamais anxiogène ni new-age creux.`,
    `Écris une lecture karmique personnalisée EN FRANÇAIS, au tutoiement, d'environ 1100 à 1400 mots.`,
    ``,
    `Personne : prénom "${first}".`,
    `Dette(s) karmique(s) détectée(s) :`,
    debtContext,
    `Chemin de vie : ${lp.number}${lp.isMaster ? " (maître nombre)" : ""}. ${exprLine}`,
    ``,
    `Structure la lecture en sections avec des titres en markdown (##) :`,
    `1) La mémoire d'âme — ce que cette ou ces dette(s) racontent d'une vie passée, formulé pour ${first}.`,
    `2) Ce que ça crée aujourd'hui dans TA vie — concret, relié au chemin de vie ${lp.number}.`,
    `3) Le travail de cette incarnation — la leçon à intégrer, sans culpabilisation.`,
    `4) Ton rituel de la semaine — un geste concret, simple, à tenter dans les 7 jours.`,
    `5) La question à te poser — une seule question pivot à se poser avant chaque décision importante.`,
    ``,
    `Contraintes : pas de promesse médicale, financière ou de guérison miraculeuse ; pas de fatalisme (la dette est une invitation, jamais une sentence) ; pas de jargon non expliqué ; pas de listes à puces interminables, privilégie une prose habitée. Commence directement par la première section.`,
  ].join("\n");
}

// Génération via Gemini (tier gratuit, GOOGLE_API_KEY) — comme l'Oracle.
// Si erreur, le webhook bascule sur buildFallbackReading (filet).
export async function generateReading(input: ReadingInput): Promise<string> {
  const apiKey = Deno.env.get("GOOGLE_API_KEY");
  if (!apiKey) throw new Error("GOOGLE_API_KEY manquante");
  // Outils astro : récupère les VRAIES positions depuis le moteur Swiss Ephemeris.
  const engineData = (input.tool && ASTRO_TOOLS.has(input.tool)) ? await buildEngineSummary(input) : "";
  const model = "gemini-2.5-flash";
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: buildReadingPrompt(input, engineData) }] }],
        // gemini-2.5-flash is a "thinking" model: without a budget cap, its
        // reasoning tokens eat into maxOutputTokens and the (paid) reading gets
        // truncated mid-sentence. Cap thinking and give the answer a generous
        // floor (6144 - 1024 = 5120 tokens >> the 1100-1400 word target). [2026-05-31]
        generationConfig: {
          maxOutputTokens: 6144,
          temperature: 0.9,
          thinkingConfig: { thinkingBudget: 1024 },
        },
      }),
    },
  );
  if (!res.ok) {
    throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  const data = await res.json();
  const text = (data?.candidates?.[0]?.content?.parts ?? [])
    .map((p: { text?: string }) => p.text || "")
    .join("");
  if (!text) throw new Error("Réponse Gemini vide");
  // Standard marque Karmastro : pas de tiret cadratin/demi-cadratin.
  return text
    .replace(/\s*—\s*/g, ", ")
    .replace(/–/g, "-")
    .replace(/―/g, ", ")
    .replace(/ +([,.;:!?])/g, "$1")
    .replace(/[ \t]{2,}/g, " ");
}
