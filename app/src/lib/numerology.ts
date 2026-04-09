// Pythagorean numerology calculation engine

const PYTHAGOREAN_TABLE: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9,
  J: 1, K: 2, L: 3, M: 4, N: 5, O: 6, P: 7, Q: 8, R: 9,
  S: 1, T: 2, U: 3, V: 4, W: 5, X: 6, Y: 7, Z: 8,
};

const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);

export function reduceToSingle(n: number, keepMasters = true): number {
  while (n > 9) {
    if (keepMasters && (n === 11 || n === 22 || n === 33)) return n;
    n = String(n).split('').reduce((sum, d) => sum + parseInt(d), 0);
  }
  return n;
}

export function reduceToSingleWithIntermediate(n: number): { reduced: number; intermediate: number } {
  const intermediate = n;
  return { reduced: reduceToSingle(n), intermediate };
}

export function lifePathNumber(day: number, month: number, year: number): { number: number; intermediate: number } {
  const d = reduceToSingle(day);
  const m = reduceToSingle(month);
  const y = reduceToSingle(String(year).split('').reduce((s, c) => s + parseInt(c), 0));
  const total = d + m + y;
  return { number: reduceToSingle(total), intermediate: total };
}

function letterSum(name: string, filter?: (char: string) => boolean): number {
  return name
    .toUpperCase()
    .split('')
    .filter(c => PYTHAGOREAN_TABLE[c] && (!filter || filter(c)))
    .reduce((sum, c) => sum + PYTHAGOREAN_TABLE[c], 0);
}

export function expressionNumber(fullName: string): { number: number; intermediate: number } {
  const total = letterSum(fullName);
  return { number: reduceToSingle(total), intermediate: total };
}

export function soulUrgeNumber(fullName: string): { number: number; intermediate: number } {
  const total = letterSum(fullName, c => VOWELS.has(c));
  return { number: reduceToSingle(total), intermediate: total };
}

export function personalityNumber(fullName: string): { number: number; intermediate: number } {
  const total = letterSum(fullName, c => !VOWELS.has(c));
  return { number: reduceToSingle(total), intermediate: total };
}

export function birthdayNumber(day: number): number {
  return reduceToSingle(day);
}

export function personalYear(day: number, month: number, currentYear: number): number {
  const sum = reduceToSingle(day) + reduceToSingle(month) + reduceToSingle(
    String(currentYear).split('').reduce((s, c) => s + parseInt(c), 0)
  );
  return reduceToSingle(sum);
}

export function personalMonth(persYear: number, currentMonth: number): number {
  return reduceToSingle(persYear + currentMonth);
}

export function personalDay(persYear: number, currentMonth: number, currentDay: number): number {
  return reduceToSingle(persYear + currentMonth + currentDay);
}

export function inclusionTable(fullName: string): Record<number, number> {
  const table: Record<number, number> = {};
  for (let i = 1; i <= 9; i++) table[i] = 0;
  fullName.toUpperCase().split('').forEach(c => {
    const val = PYTHAGOREAN_TABLE[c];
    if (val) table[val]++;
  });
  return table;
}

export function karmicDebts(intermediateNumbers: number[]): number[] {
  const KARMIC = [13, 14, 16, 19];
  return intermediateNumbers.filter(n => KARMIC.includes(n));
}

export function lifeCycles(day: number, month: number, year: number): { cycle: number; period: string; number: number }[] {
  return [
    { cycle: 1, period: "0 – 28 ans", number: reduceToSingle(month) },
    { cycle: 2, period: "28 – 56 ans", number: reduceToSingle(day) },
    { cycle: 3, period: "56+ ans", number: reduceToSingle(String(year).split('').reduce((s, c) => s + parseInt(c), 0)) },
  ];
}

export function pinnacles(day: number, month: number, year: number): { pinnacle: number; period: string; number: number }[] {
  const d = reduceToSingle(day);
  const m = reduceToSingle(month);
  const y = reduceToSingle(String(year).split('').reduce((s, c) => s + parseInt(c), 0));
  const lp = lifePathNumber(day, month, year).number;
  const endFirst = 36 - (lp > 9 ? reduceToSingle(lp, false) : lp);

  return [
    { pinnacle: 1, period: `0 – ${endFirst} ans`, number: reduceToSingle(d + m) },
    { pinnacle: 2, period: `${endFirst} – ${endFirst + 9} ans`, number: reduceToSingle(d + y) },
    { pinnacle: 3, period: `${endFirst + 9} – ${endFirst + 18} ans`, number: reduceToSingle(reduceToSingle(d + m) + reduceToSingle(d + y)) },
    { pinnacle: 4, period: `${endFirst + 18}+ ans`, number: reduceToSingle(m + y) },
  ];
}

export function challenges(day: number, month: number, year: number): { challenge: number; number: number }[] {
  const d = reduceToSingle(day);
  const m = reduceToSingle(month);
  const y = reduceToSingle(String(year).split('').reduce((s, c) => s + parseInt(c), 0));

  const c1 = Math.abs(d - m);
  const c2 = Math.abs(d - y);
  const c3 = Math.abs(c1 - c2);
  const c4 = Math.abs(m - y);

  return [
    { challenge: 1, number: reduceToSingle(c1, false) },
    { challenge: 2, number: reduceToSingle(c2, false) },
    { challenge: 3, number: reduceToSingle(c3, false) },
    { challenge: 4, number: reduceToSingle(c4, false) },
  ];
}

export function getZodiacSign(day: number, month: number): { sign: string; symbol: string; element: string } {
  const signs = [
    { sign: "Capricorne", symbol: "♑", element: "Terre", start: [1, 1], end: [1, 19] },
    { sign: "Verseau", symbol: "♒", element: "Air", start: [1, 20], end: [2, 18] },
    { sign: "Poissons", symbol: "♓", element: "Eau", start: [2, 19], end: [3, 20] },
    { sign: "Bélier", symbol: "♈", element: "Feu", start: [3, 21], end: [4, 19] },
    { sign: "Taureau", symbol: "♉", element: "Terre", start: [4, 20], end: [5, 20] },
    { sign: "Gémeaux", symbol: "♊", element: "Air", start: [5, 21], end: [6, 20] },
    { sign: "Cancer", symbol: "♋", element: "Eau", start: [6, 21], end: [7, 22] },
    { sign: "Lion", symbol: "♌", element: "Feu", start: [7, 23], end: [8, 22] },
    { sign: "Vierge", symbol: "♍", element: "Terre", start: [8, 23], end: [9, 22] },
    { sign: "Balance", symbol: "♎", element: "Air", start: [9, 23], end: [10, 22] },
    { sign: "Scorpion", symbol: "♏", element: "Eau", start: [10, 23], end: [11, 21] },
    { sign: "Sagittaire", symbol: "♐", element: "Feu", start: [11, 22], end: [12, 21] },
    { sign: "Capricorne", symbol: "♑", element: "Terre", start: [12, 22], end: [12, 31] },
  ];

  for (const s of signs) {
    const afterStart = month > s.start[0] || (month === s.start[0] && day >= s.start[1]);
    const beforeEnd = month < s.end[0] || (month === s.end[0] && day <= s.end[1]);
    if (afterStart && beforeEnd) return { sign: s.sign, symbol: s.symbol, element: s.element };
  }
  return { sign: "Capricorne", symbol: "♑", element: "Terre" };
}

// Get moon phase for a given date (simplified)
export function getMoonPhase(date: Date): { phase: string; emoji: string; illumination: number } {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // Simplified moon phase calculation
  let c = 0, e = 0, jd = 0, b = 0;
  if (month < 3) { year; c = year - 1; e = month + 12; } else { c = year; e = month; }
  jd = Math.floor(365.25 * (c + 4716)) + Math.floor(30.6001 * (e + 1)) + day - 1524.5;
  const daysSinceNew = (jd - 2451550.1) % 29.530588853;
  const normalised = daysSinceNew / 29.530588853;
  const phaseIndex = Math.floor(normalised * 8) % 8;
  
  const phases = [
    { phase: "Nouvelle Lune", emoji: "🌑", illumination: 0 },
    { phase: "Premier croissant", emoji: "🌒", illumination: 15 },
    { phase: "Premier quartier", emoji: "🌓", illumination: 35 },
    { phase: "Gibbeuse croissante", emoji: "🌔", illumination: 65 },
    { phase: "Pleine Lune", emoji: "🌕", illumination: 100 },
    { phase: "Gibbeuse décroissante", emoji: "🌖", illumination: 75 },
    { phase: "Dernier quartier", emoji: "🌗", illumination: 45 },
    { phase: "Dernier croissant", emoji: "🌘", illumination: 10 },
  ];
  
  return phases[phaseIndex];
}

// Number color mapping for calendar
export function getNumberColor(num: number): string {
  const colors: Record<number, string> = {
    1: "text-karmique-fire",
    2: "text-karmique-blue",
    3: "text-karmique-gold",
    4: "text-karmique-earth",
    5: "text-karmique-air",
    6: "text-karmique-violet",
    7: "text-karmique-water",
    8: "text-karmique-gold",
    9: "text-karmique-fire",
  };
  return colors[num] || "text-foreground";
}

// Number keywords
export function getNumberKeyword(num: number): string {
  const keywords: Record<number, string> = {
    1: "Nouveau départ",
    2: "Coopération",
    3: "Créativité",
    4: "Fondations",
    5: "Changement",
    6: "Responsabilité",
    7: "Introspection",
    8: "Pouvoir",
    9: "Achèvement",
    11: "Intuition",
    22: "Maître bâtisseur",
    33: "Maître enseignant",
  };
  return keywords[num] || "";
}
