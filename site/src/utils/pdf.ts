// Shared PDF export helper for Karmastro tool results
// Dynamically imports jsPDF from esm.sh (no npm dep)
// Produces branded, multi-page PDFs with consistent layout

type PlanetData = {
  sign: string;
  symbol?: string;
  degree: number;
  minute: number;
  retrograde?: boolean;
  house?: number;
};

type PlanetsMap = Record<string, PlanetData>;

type Aspect = {
  planet_1?: string;
  planet_2?: string;
  person1_planet?: string;
  person2_planet?: string;
  transit_planet?: string;
  natal_planet?: string;
  aspect: string;
  nature: string;
  orb: number;
  exact?: boolean;
};

// ============================================================
// CORE : setup document with Karmastro branding
// ============================================================

async function createDocument() {
  const { jsPDF } = await import("https://esm.sh/jspdf@2.5.2");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Header
  doc.setFillColor(15, 10, 30);
  doc.rect(0, 0, 210, 40, "F");
  doc.setTextColor(212, 160, 23);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Karmastro", 105, 18, { align: "center" });
  doc.setFontSize(9);
  doc.setTextColor(180, 180, 180);
  doc.text(`Genere le ${new Date().toLocaleDateString("fr-FR")} - karmastro.com`, 105, 33, { align: "center" });

  return doc;
}

function addFooter(doc: any, pageCount?: number) {
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    "Calcule avec Swiss Ephemeris (precision 0.001 arcseconde, niveau NASA JPL)",
    105,
    285,
    { align: "center" }
  );
  doc.text(
    "Pour une interpretation personnalisee : karmastro.com/oracle",
    105,
    289,
    { align: "center" }
  );
}

function subtitle(doc: any, y: number, text: string) {
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(212, 160, 23);
  doc.text(text, 20, y);
  return y + 8;
}

function formatPlanet(name: string, p: PlanetData): string {
  const retro = p.retrograde ? " R" : "";
  const house = p.house ? ` (M${p.house})` : "";
  return `${name} : ${p.sign} ${p.degree}°${p.minute}'${retro}${house}`;
}

function aspectColor(aspect: string): [number, number, number] {
  switch (aspect) {
    case "Trigone":
    case "Sextile":
      return [74, 222, 128];
    case "Conjonction":
      return [212, 160, 23];
    case "Carre":
    case "Opposition":
      return [236, 72, 153];
    default:
      return [60, 60, 60];
  }
}

// ============================================================
// EXPORT 1 : theme natal PDF
// ============================================================

export async function exportThemeNatalPDF(data: any, birthInfo: { date: string; time: string; place: string }) {
  const doc = await createDocument();
  let y = 55;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text("Theme natal complet", 20, y);
  y += 7;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`Naissance : ${birthInfo.date} a ${birthInfo.time}`, 20, y);
  y += 5;
  doc.text(`Lieu : ${birthInfo.place}`, 20, y);
  y += 10;

  // Key positions
  y = subtitle(doc, y, "Positions cardinales");
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);

  if (data.ascendant) {
    doc.text(`Ascendant : ${data.ascendant.sign} ${data.ascendant.degree}°${data.ascendant.minute}'`, 25, y);
    y += 5;
  }
  if (data.midheaven) {
    doc.text(`Milieu du Ciel : ${data.midheaven.sign} ${data.midheaven.degree}°${data.midheaven.minute}'`, 25, y);
    y += 5;
  }
  y += 3;

  // Planets
  y = subtitle(doc, y, "10 planetes");
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);

  const planets: PlanetsMap = data.planets || {};
  const planetOrder = ["Soleil", "Lune", "Mercure", "Venus", "Mars", "Jupiter", "Saturne", "Uranus", "Neptune", "Pluton", "Noeud Nord"];
  for (const name of planetOrder) {
    if (planets[name]) {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(formatPlanet(name, planets[name]), 25, y);
      y += 5;
    }
  }

  y += 3;

  // Houses
  if (data.houses && typeof data.houses === "object") {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }
    y = subtitle(doc, y, "12 maisons");
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);

    for (let i = 1; i <= 12; i++) {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }
      const h = data.houses[`house_${i}`];
      if (h) {
        doc.text(`Maison ${i} : ${h.sign} ${h.degree}°${h.minute}'`, 25, y);
        y += 5;
      }
    }
  }

  y += 3;

  // Aspects
  const aspects: Aspect[] = data.aspects || [];
  if (aspects.length > 0) {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }
    y = subtitle(doc, y, `Aspects majeurs (${Math.min(aspects.length, 15)})`);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");

    for (const asp of aspects.slice(0, 15)) {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      const [r, g, b] = aspectColor(asp.aspect);
      doc.setTextColor(r, g, b);
      const line = `${asp.planet_1} ${asp.aspect} ${asp.planet_2} - orbe ${asp.orb.toFixed(2)}° (${asp.nature})${asp.exact ? " EXACT" : ""}`;
      doc.text(line, 25, y);
      y += 5;
    }
  }

  addFooter(doc);
  doc.save(`karmastro-theme-natal-${Date.now()}.pdf`);
}

// ============================================================
// EXPORT 2 : compatibilite numerologique PDF
// ============================================================

export async function exportCompatibilitePDF(
  lifeA: { number: number; calculation: string },
  lifeB: { number: number; calculation: string },
  compat: { score: number; dynamic: string; lesson: string }
) {
  const doc = await createDocument();
  let y = 55;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text("Compatibilite numerologique", 20, y);
  y += 12;

  // Two life paths
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(236, 72, 153);
  doc.text(`Personne 1 : chemin de vie ${lifeA.number}`, 20, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Calcul : ${lifeA.calculation}`, 25, y);
  y += 8;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(168, 85, 247);
  doc.text(`Personne 2 : chemin de vie ${lifeB.number}`, 20, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Calcul : ${lifeB.calculation}`, 25, y);
  y += 12;

  // Score
  doc.setFillColor(245, 230, 200);
  doc.rect(20, y - 5, 170, 25, "F");
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(212, 160, 23);
  doc.text(`Score de compatibilite : ${compat.score}/100`, 105, y + 5, { align: "center" });
  y += 30;

  // Dynamic
  y = subtitle(doc, y, "Dynamique du couple");
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  const dynamicLines = doc.splitTextToSize(compat.dynamic, 170);
  doc.text(dynamicLines, 20, y);
  y += dynamicLines.length * 5 + 8;

  // Lesson
  y = subtitle(doc, y, "Lecon karmique commune");
  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(60, 60, 60);
  const lessonLines = doc.splitTextToSize(compat.lesson, 170);
  doc.text(lessonLines, 20, y);

  addFooter(doc);
  doc.save(`karmastro-compatibilite-${Date.now()}.pdf`);
}

// ============================================================
// EXPORT 3 : synastrie astrologique PDF
// ============================================================

export async function exportSynastriePDF(
  natal1: any,
  natal2: any,
  aspects: any[],
  stats: { harmonic: number; conjunction: number; tension: number }
) {
  const doc = await createDocument();
  let y = 55;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text("Synastrie astrologique", 20, y);
  y += 12;

  // Person 1
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(236, 72, 153);
  doc.text("Personne 1", 20, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  const p1 = [
    `Soleil : ${natal1.planets.Soleil.sign} ${natal1.planets.Soleil.degree}°`,
    `Lune : ${natal1.planets.Lune.sign} ${natal1.planets.Lune.degree}°`,
    `Venus : ${natal1.planets.Venus.sign} ${natal1.planets.Venus.degree}°`,
    `Mars : ${natal1.planets.Mars.sign} ${natal1.planets.Mars.degree}°`,
    `Ascendant : ${natal1.ascendant.sign} ${natal1.ascendant.degree}°`,
  ];
  for (const line of p1) {
    doc.text(line, 25, y);
    y += 5;
  }

  y += 3;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(168, 85, 247);
  doc.text("Personne 2", 20, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  const p2 = [
    `Soleil : ${natal2.planets.Soleil.sign} ${natal2.planets.Soleil.degree}°`,
    `Lune : ${natal2.planets.Lune.sign} ${natal2.planets.Lune.degree}°`,
    `Venus : ${natal2.planets.Venus.sign} ${natal2.planets.Venus.degree}°`,
    `Mars : ${natal2.planets.Mars.sign} ${natal2.planets.Mars.degree}°`,
    `Ascendant : ${natal2.ascendant.sign} ${natal2.ascendant.degree}°`,
  ];
  for (const line of p2) {
    doc.text(line, 25, y);
    y += 5;
  }

  y += 6;
  y = subtitle(doc, y, "Dynamique du couple");
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(74, 222, 128);
  doc.text(`Aspects harmoniques : ${stats.harmonic}`, 25, y);
  y += 6;
  doc.setTextColor(212, 160, 23);
  doc.text(`Fusions (conjonctions) : ${stats.conjunction}`, 25, y);
  y += 6;
  doc.setTextColor(236, 72, 153);
  doc.text(`Tensions (carres/oppositions) : ${stats.tension}`, 25, y);
  y += 12;

  y = subtitle(doc, y, `Top ${Math.min(aspects.length, 15)} aspects majeurs`);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  for (const asp of aspects.slice(0, 15)) {
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
    const [r, g, b] = aspectColor(asp.aspect);
    doc.setTextColor(r, g, b);
    const line = `${asp.person1_planet} ${asp.aspect} ${asp.person2_planet} - orbe ${asp.orb.toFixed(2)}° (${asp.nature})`;
    doc.text(line, 25, y);
    y += 5;
  }

  addFooter(doc);
  doc.save(`karmastro-synastrie-${Date.now()}.pdf`);
}

// ============================================================
// EXPORT 4 : transits du jour PDF
// ============================================================

export async function exportTransitsPDF(data: any, birthInfo: { date: string; time: string; place: string }) {
  const doc = await createDocument();
  let y = 55;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text(`Transits du ${new Date().toLocaleDateString("fr-FR")}`, 20, y);
  y += 7;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`Pour : ${birthInfo.date} a ${birthInfo.time} - ${birthInfo.place}`, 20, y);
  y += 10;

  // Cosmic info
  const cosmic = data.cosmic || {};
  if (cosmic.moon || cosmic.sun_position) {
    y = subtitle(doc, y, "Ambiance cosmique");
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    if (cosmic.moon?.moon_sign) {
      doc.text(`Lune en ${cosmic.moon.moon_sign.sign} (${cosmic.moon.name || "?"})`, 25, y);
      y += 5;
    }
    if (cosmic.sun_position) {
      doc.text(`Soleil en ${cosmic.sun_position.sign}`, 25, y);
      y += 5;
    }
    const retros = (cosmic.retrogrades || []).map((r: any) => r.planet).join(", ");
    if (retros) {
      doc.text(`Retrogrades : ${retros}`, 25, y);
      y += 5;
    } else {
      doc.text("Aucune planete retrograde", 25, y);
      y += 5;
    }
    y += 5;
  }

  // Transits list
  const transits: Aspect[] = (data.transits || []).sort((a: any, b: any) => a.orb - b.orb);
  if (transits.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Aucun transit majeur actif aujourd'hui. Journee calme.", 20, y);
  } else {
    y = subtitle(doc, y, `Transits actifs (${transits.length})`);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");

    for (const t of transits) {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      const [r, g, b] = aspectColor(t.aspect);
      doc.setTextColor(r, g, b);
      const retro = t.exact ? " EXACT" : "";
      const line = `${t.transit_planet} ${t.aspect} ${t.natal_planet} natal - orbe ${t.orb.toFixed(2)}° (${t.nature})${retro}`;
      doc.text(line, 25, y);
      y += 5;
    }
  }

  addFooter(doc);
  doc.save(`karmastro-transits-${Date.now()}.pdf`);
}
