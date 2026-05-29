// Port Deno fidèle des calculs numérologie du site (site/src/data/numerology-meanings.ts).
// Seuls les calculs + les descriptions canoniques des dettes sont portés (pas les meanings longs
// chemin-de-vie/expression). Utilisé par reading-generator pour ancrer la lecture payante.

const MASTERS = new Set([11, 22, 33]);

const PYTHAGORAS_TABLE: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9,
  J: 1, K: 2, L: 3, M: 4, N: 5, O: 6, P: 7, Q: 8, R: 9,
  S: 1, T: 2, U: 3, V: 4, W: 5, X: 6, Y: 7, Z: 8,
};

function digitSum(n: number): number {
  return n.toString().split("").reduce((acc, d) => acc + parseInt(d, 10), 0);
}

export function reduceNumerology(n: number): number {
  while (n > 9 && !MASTERS.has(n)) {
    n = digitSum(n);
  }
  return n;
}

function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
}

export function calculateLifePath(day: number, month: number, year: number): { number: number; calculation: string; isMaster: boolean } {
  const reduceDay = reduceNumerology(day);
  const reduceMonth = reduceNumerology(month);
  const reduceYear = reduceNumerology(digitSum(year));
  const sum = reduceDay + reduceMonth + reduceYear;
  const final = reduceNumerology(sum);
  return {
    number: final,
    calculation: `${day} → ${reduceDay}, ${month} → ${reduceMonth}, ${year} → ${reduceYear}, somme = ${sum} → ${final}`,
    isMaster: MASTERS.has(final),
  };
}

export function calculateExpression(fullName: string): { number: number; calculation: string; isMaster: boolean; letters: string } {
  const normalized = normalizeName(fullName);
  if (!normalized) return { number: 1, calculation: "", isMaster: false, letters: "" };
  const values: number[] = [];
  for (const c of normalized) {
    if (PYTHAGORAS_TABLE[c]) values.push(PYTHAGORAS_TABLE[c]);
  }
  const sum = values.reduce((a, b) => a + b, 0);
  const final = reduceNumerology(sum);
  return {
    number: final,
    calculation: values.join(" + ") + " = " + sum + " → " + final,
    isMaster: MASTERS.has(final),
    letters: normalized,
  };
}

export type KarmicDebtInfo = {
  code: string;
  title: string;
  root: number;
  final: number;
  story: string;
  pastLife: string;
  currentChallenge: string;
  healing: string;
};

// Descriptions canoniques (portées à l'identique du site) pour ancrer la lecture.
export const KARMIC_DEBTS: Record<string, KarmicDebtInfo> = {
  "13/4": {
    code: "13/4", title: "La dette de la paresse", root: 13, final: 4,
    story: "Le 13 est le nombre de la transformation forcée. En tarot, c'est la carte de la Mort : non pas une punition, mais une mue. Dans une vie antérieure, l'âme aurait fui l'effort, cherché les raccourcis, profité du travail des autres.",
    pastLife: "Tu aurais, dans une incarnation passée, cherché la facilité et laissé les autres porter le poids de ton existence.",
    currentChallenge: "Cette vie-ci, tout ce que tu obtiens demande le double d'efforts. Les projets n'aboutissent que si tu tiens la distance. Tu as besoin d'apprendre la valeur du travail patient et régulier.",
    healing: "Embrasse le labeur quotidien. Chaque petite tâche accomplie consciencieusement paie ta dette. Pas de raccourcis, pas de triche, juste la beauté du travail bien fait.",
  },
  "14/5": {
    code: "14/5", title: "La dette de l'abus de liberté", root: 14, final: 5,
    story: "Le 14 porte la mémoire d'une liberté mal utilisée. Dans une vie antérieure, cette âme aurait abusé des plaisirs, de la nourriture, du sexe, de la jouissance, sans mesure et sans responsabilité.",
    pastLife: "Tu aurais confondu liberté et licence, plaisir et absence de limite, et causé des dommages à toi-même ou à autrui en suivant tous tes désirs.",
    currentChallenge: "Cette vie-ci, les tentations sont fréquentes et les conséquences rapides. Les addictions, les excès, les changements compulsifs te guettent. Tu dois apprendre la liberté intérieure, celle qui ne dépend pas de la consommation.",
    healing: "Trouve la liberté dans la modération, dans l'engagement choisi. Le vrai sens du 14 est : je suis libre parce que je choisis mes attaches, pas parce que je fuis toutes les attaches.",
  },
  "16/7": {
    code: "16/7", title: "La dette de l'ego spirituel", root: 16, final: 7,
    story: "Le 16 est la Tour en tarot : la structure d'ego qui s'effondre sous la foudre. Dans une vie antérieure, cette âme aurait utilisé son savoir spirituel, religieux ou intellectuel pour dominer les autres, pour se croire supérieure.",
    pastLife: "Tu aurais, dans une incarnation passée, utilisé ta connaissance pour manipuler, séduire, dominer. L'abus de position spirituelle ou religieuse.",
    currentChallenge: "Cette vie-ci, des chutes soudaines, des remises en question brutales, des écroulements d'ego. Tout ce qui est construit sur l'orgueil spirituel s'effondre pour forcer l'humilité. Tu apprends que la vraie sagesse est silencieuse.",
    healing: "Accepte les effondrements comme des purifications. Cultive l'humilité sincère, la connaissance partagée sans vanité. Fais-toi élève avant de te faire maître.",
  },
  "19/1": {
    code: "19/1", title: "La dette de l'abus de pouvoir", root: 19, final: 1,
    story: "Le 19 porte la mémoire d'un pouvoir mal exercé. Dans une vie antérieure, cette âme aurait eu une position de leader, de commandement, et l'aurait utilisée pour écraser, humilier, exploiter les autres.",
    pastLife: "Tu aurais exercé ton autorité avec cruauté, ou refusé d'assumer une position de leadership quand c'était nécessaire, abandonnant ceux qui comptaient sur toi.",
    currentChallenge: "Cette vie-ci, tu dois apprendre à diriger avec responsabilité. Tu peux te retrouver isolé, incompris dans ton leadership. On te teste : sauras-tu utiliser ton pouvoir pour élever les autres plutôt que pour les écraser ?",
    healing: "Accepte de diriger quand c'est ton rôle. Apprends le pouvoir au service, l'autorité qui élève. Sois le leader que tu aurais aimé avoir dans ta vie antérieure.",
  },
};

// Détection fidèle (port de detectKarmicDebts) : jour brut ∈ {13,14,16,19} OU chaîne de
// réduction de (jour + mois + somme-chiffres-année).
export function detectKarmicDebts(day: number, month: number, year: number): KarmicDebtInfo[] {
  const debts: KarmicDebtInfo[] = [];
  const candidates = [13, 14, 16, 19];

  if (candidates.includes(day)) {
    const key = `${day}/${reduceNumerology(day)}`;
    if (KARMIC_DEBTS[key]) debts.push(KARMIC_DEBTS[key]);
  }

  let working = day + month + digitSum(year);
  while (working > 9) {
    if (candidates.includes(working)) {
      const key = `${working}/${reduceNumerology(working)}`;
      if (KARMIC_DEBTS[key] && !debts.find((d) => d.code === key)) {
        debts.push(KARMIC_DEBTS[key]);
      }
    }
    working = digitSum(working);
  }

  return debts;
}
