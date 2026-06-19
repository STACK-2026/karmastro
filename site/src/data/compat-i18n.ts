// Localized GEO copy for the compatibility detail pages (answer-first TL;DR + the
// data-driven FAQ). Only the locales fully translated here are indexed + given the
// Dataset/FAQPage; everything else stays noindex with FR content. Numbers come from
// the engine, so they are language-neutral.
import type { InterpLang } from "./compatibility-matrix";

export const COMPAT_LOCALES = ["en", "es", "it", "pt", "de"] as const;
export type CompatLocale = (typeof COMPAT_LOCALES)[number];

export function isCompatLocalized(lang: string): lang is CompatLocale {
  return (COMPAT_LOCALES as readonly string[]).includes(lang);
}

export interface CompatScores {
  global: number;
  love: number;
  friendship: number;
  work: number;
  karma: number;
}

export interface CompatGeo {
  faqTitle: string;
  tldr: string;
  faq: { q: string; a: string }[];
}

export function compatGeo(
  lang: CompatLocale,
  n1: string,
  n2: string,
  s: CompatScores,
  strength0: string,
  friction0: string,
): CompatGeo {
  if (lang === "es") {
    const v = s.global >= 80 ? "una compatibilidad muy fuerte" : s.global >= 60 ? "una compatibilidad sólida" : s.global >= 40 ? "una compatibilidad moderada" : "una compatibilidad exigente";
    return {
      faqTitle: "Preguntas frecuentes",
      tldr: `${n1} y ${n2} tienen ${v} del ${s.global}% según Karmastro: ${s.love}% en el amor, ${s.friendship}% en la amistad, ${s.work}% en el trabajo y ${s.karma}% en el plano kármico. La puntuación combina la afinidad de los elementos (60%) y de las modalidades (40%).`,
      faq: [
        { q: `¿${n1} y ${n2} son compatibles?`, a: `${n1} y ${n2} obtienen un ${s.global}% de compatibilidad global en Karmastro, ${v}.${strength0 ? ` Punto fuerte principal: ${strength0}` : ""}` },
        { q: `¿Cuál es la compatibilidad amorosa entre ${n1} y ${n2}?`, a: `En el amor, ${n1} y ${n2} alcanzan un ${s.love}%. La amistad es del ${s.friendship}%, el trabajo del ${s.work}% y el karma del ${s.karma}%.` },
        { q: `¿Cuáles son los puntos de fricción entre ${n1} y ${n2}?`, a: friction0 ? `Principal punto de atención: ${friction0}` : `${n1} y ${n2} presentan pocas fricciones estructurales, pero cada pareja es única.` },
        { q: `¿Cómo calcula Karmastro la compatibilidad entre dos signos?`, a: `La puntuación combina la afinidad de los elementos (fuego, tierra, aire, agua) en un 60% y de las modalidades (cardinal, fijo, mutable) en un 40%, completada con una lectura kármica. La compatibilidad de los signos solares solo cubre alrededor del 30% de la dinámica real: una sinastría completa cruza los 10 planetas, los ascendentes y los aspectos.` },
      ],
    };
  }
  if (lang === "it") {
    const v = s.global >= 80 ? "una compatibilità molto forte" : s.global >= 60 ? "una compatibilità solida" : s.global >= 40 ? "una compatibilità moderata" : "una compatibilità impegnativa";
    return {
      faqTitle: "Domande frequenti",
      tldr: `${n1} e ${n2} hanno ${v} del ${s.global}% secondo Karmastro: ${s.love}% in amore, ${s.friendship}% in amicizia, ${s.work}% nel lavoro e ${s.karma}% sul piano karmico. Il punteggio combina l'affinità degli elementi (60%) e delle modalità (40%).`,
      faq: [
        { q: `${n1} e ${n2} sono compatibili?`, a: `${n1} e ${n2} ottengono un ${s.global}% di compatibilità globale su Karmastro, ${v}.${strength0 ? ` Punto di forza principale: ${strength0}` : ""}` },
        { q: `Qual è la compatibilità amorosa tra ${n1} e ${n2}?`, a: `In amore, ${n1} e ${n2} raggiungono il ${s.love}%. L'amicizia è al ${s.friendship}%, il lavoro al ${s.work}% e il karma al ${s.karma}%.` },
        { q: `Quali sono i punti di attrito tra ${n1} e ${n2}?`, a: friction0 ? `Principale punto di attenzione: ${friction0}` : `${n1} e ${n2} presentano poche frizioni strutturali, ma ogni coppia è unica.` },
        { q: `Come calcola Karmastro la compatibilità tra due segni?`, a: `Il punteggio combina l'affinità degli elementi (fuoco, terra, aria, acqua) per il 60% e delle modalità (cardinale, fisso, mutevole) per il 40%, completata da una lettura karmica. La compatibilità dei segni solari copre solo circa il 30% della dinamica reale: una sinastria completa incrocia i 10 pianeti, gli ascendenti e gli aspetti.` },
      ],
    };
  }
  if (lang === "pt") {
    const v = s.global >= 80 ? "uma compatibilidade muito forte" : s.global >= 60 ? "uma compatibilidade sólida" : s.global >= 40 ? "uma compatibilidade moderada" : "uma compatibilidade exigente";
    return {
      faqTitle: "Perguntas frequentes",
      tldr: `${n1} e ${n2} têm ${v} de ${s.global}% segundo a Karmastro: ${s.love}% no amor, ${s.friendship}% na amizade, ${s.work}% no trabalho e ${s.karma}% no plano cármico. A pontuação combina a afinidade dos elementos (60%) e das modalidades (40%).`,
      faq: [
        { q: `${n1} e ${n2} são compatíveis?`, a: `${n1} e ${n2} obtêm ${s.global}% de compatibilidade global na Karmastro, ${v}.${strength0 ? ` Principal ponto forte: ${strength0}` : ""}` },
        { q: `Qual é a compatibilidade amorosa entre ${n1} e ${n2}?`, a: `No amor, ${n1} e ${n2} alcançam ${s.love}%. A amizade é de ${s.friendship}%, o trabalho de ${s.work}% e o karma de ${s.karma}%.` },
        { q: `Quais são os pontos de atrito entre ${n1} e ${n2}?`, a: friction0 ? `Principal ponto de atenção: ${friction0}` : `${n1} e ${n2} apresentam poucas fricções estruturais, mas cada casal é único.` },
        { q: `Como a Karmastro calcula a compatibilidade entre dois signos?`, a: `A pontuação combina a afinidade dos elementos (fogo, terra, ar, água) em 60% e das modalidades (cardinal, fixo, mutável) em 40%, completada por uma leitura cármica. A compatibilidade dos signos solares cobre apenas cerca de 30% da dinâmica real: uma sinastria completa cruza os 10 planetas, os ascendentes e os aspectos.` },
      ],
    };
  }
  if (lang === "de") {
    const v = s.global >= 80 ? "eine sehr starke Kompatibilität" : s.global >= 60 ? "eine solide Kompatibilität" : s.global >= 40 ? "eine moderate Kompatibilität" : "eine anspruchsvolle Kompatibilität";
    return {
      faqTitle: "Häufige Fragen",
      tldr: `${n1} und ${n2} haben laut Karmastro ${v} von ${s.global}%: ${s.love}% in der Liebe, ${s.friendship}% in der Freundschaft, ${s.work}% bei der Arbeit und ${s.karma}% auf der karmischen Ebene. Der Wert kombiniert die Affinität der Elemente (60%) und der Modalitäten (40%).`,
      faq: [
        { q: `Sind ${n1} und ${n2} kompatibel?`, a: `${n1} und ${n2} erreichen auf Karmastro ${s.global}% Gesamtkompatibilität, ${v}.${strength0 ? ` Wichtigste Stärke: ${strength0}` : ""}` },
        { q: `Wie ist die Liebeskompatibilität zwischen ${n1} und ${n2}?`, a: `In der Liebe erreichen ${n1} und ${n2} ${s.love}%. Die Freundschaft liegt bei ${s.friendship}%, die Arbeit bei ${s.work}% und das Karma bei ${s.karma}%.` },
        { q: `Was sind die Reibungspunkte zwischen ${n1} und ${n2}?`, a: friction0 ? `Wichtigster Achtungspunkt: ${friction0}` : `${n1} und ${n2} zeigen wenige strukturelle Reibungen, aber jedes Paar ist einzigartig.` },
        { q: `Wie berechnet Karmastro die Kompatibilität zwischen zwei Sternzeichen?`, a: `Der Wert kombiniert die Affinität der Elemente (Feuer, Erde, Luft, Wasser) zu 60% und der Modalitäten (kardinal, fix, veränderlich) zu 40%, ergänzt durch eine karmische Deutung. Die Sonnenzeichen-Kompatibilität deckt nur etwa 30% der realen Dynamik ab: eine vollständige Synastrie kreuzt die 10 Planeten, die Aszendenten und die Aspekte.` },
      ],
    };
  }
  // en (default)
  const v = s.global >= 80 ? "a very strong compatibility" : s.global >= 60 ? "a solid compatibility" : s.global >= 40 ? "a moderate compatibility" : "a challenging compatibility";
  return {
    faqTitle: "Frequently asked questions",
    tldr: `${n1} and ${n2} have ${v} of ${s.global}% according to Karmastro: ${s.love}% in love, ${s.friendship}% in friendship, ${s.work}% at work and ${s.karma}% karmically. The score combines elemental affinity (60%) and modality affinity (40%).`,
    faq: [
      { q: `Are ${n1} and ${n2} compatible?`, a: `${n1} and ${n2} score ${s.global}% overall compatibility on Karmastro, ${v}.${strength0 ? ` Main strength: ${strength0}` : ""}` },
      { q: `What is the love compatibility between ${n1} and ${n2}?`, a: `In love, ${n1} and ${n2} reach ${s.love}%. Friendship scores ${s.friendship}%, work ${s.work}% and karma ${s.karma}%.` },
      { q: `What are the friction points between ${n1} and ${n2}?`, a: friction0 ? `Main point to watch: ${friction0}` : `${n1} and ${n2} show few structural frictions, but every couple is unique.` },
      { q: `How does Karmastro calculate compatibility between two signs?`, a: `The score combines elemental affinity (fire, earth, air, water) for 60% and modality affinity (cardinal, fixed, mutable) for 40%, completed by a karmic reading. Sun-sign compatibility only covers about 30% of the real dynamic: a full synastry crosses the 10 planets, the rising signs and the aspects.` },
    ],
  };
}
