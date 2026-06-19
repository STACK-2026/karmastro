// Deterministic compatibility matrix for all 144 sign combinations.
// Scores are calculated from element + quality affinities (traditional Hellenistic + modern approach).
// Uses astrological rules, not random numbers.

export type Element = "feu" | "terre" | "air" | "eau";
export type Quality = "cardinal" | "fixe" | "mutable";

const ELEMENT_COMPAT: Record<Element, Record<Element, number>> = {
  feu:   { feu: 85, terre: 50, air: 90, eau: 40 },
  terre: { feu: 50, terre: 80, air: 45, eau: 85 },
  air:   { feu: 90, terre: 45, air: 80, eau: 55 },
  eau:   { feu: 40, terre: 85, air: 55, eau: 85 },
};

const QUALITY_COMPAT: Record<Quality, Record<Quality, number>> = {
  cardinal: { cardinal: 70, fixe: 75, mutable: 80 },
  fixe:     { cardinal: 75, fixe: 65, mutable: 70 },
  mutable:  { cardinal: 80, fixe: 70, mutable: 75 },
};

export function compatibilityScore(e1: Element, q1: Quality, e2: Element, q2: Quality): {
  global: number;
  love: number;
  friendship: number;
  work: number;
  karma: number;
  tension: number;
} {
  const elem = ELEMENT_COMPAT[e1][e2];
  const qual = QUALITY_COMPAT[q1][q2];
  const base = Math.round((elem * 0.6 + qual * 0.4));

  // Slight variations per dimension (deterministic offsets)
  return {
    global: base,
    love: Math.max(20, Math.min(100, base + (e1 === e2 ? 5 : 0) + (e1 === "eau" || e1 === "feu" ? 3 : 0))),
    friendship: Math.max(20, Math.min(100, base + (q1 === q2 ? 5 : -3) + 5)),
    work: Math.max(20, Math.min(100, base + (q1 === "cardinal" || q1 === "fixe" ? 5 : -2))),
    karma: Math.max(20, Math.min(100, base + (Math.abs(e1.length - e2.length)))),
    tension: Math.max(10, Math.min(100, 100 - base + 20)),
  };
}

// Element + quality → descriptive phrase for interpretations
export type InterpLang = "fr" | "en" | "es" | "it" | "pt" | "de";

const ELEMENT_NAMES: Record<InterpLang, Record<Element, string>> = {
  fr: { feu: "feu", terre: "terre", air: "air", eau: "eau" },
  en: { feu: "fire", terre: "earth", air: "air", eau: "water" },
  es: { feu: "fuego", terre: "tierra", air: "aire", eau: "agua" },
  it: { feu: "fuoco", terre: "terra", air: "aria", eau: "acqua" },
  pt: { feu: "fogo", terre: "terra", air: "ar", eau: "água" },
  de: { feu: "Feuer", terre: "Erde", air: "Luft", eau: "Wasser" },
};

// Language packs for the template-based interpretation. fr is byte-for-byte the
// original copy (so the 144 FR pages are unchanged); en is a full translation.
const INTERP_PACK = {
  fr: {
    sameElementStrength: (el: string) => `Vous partagez le même élément ${el}, ce qui crée une compréhension instinctive et une énergie commune qui se nourrit mutuellement.`,
    sameElementFriction: `Le revers de cette similitude : vous pouvez amplifier vos excès sans garde-fou. Deux feux brûlent plus fort ensemble, pour le meilleur et pour le pire.`,
    fireAir: (n1: string, n2: string) => `Le feu et l'air s'alimentent mutuellement. ${n1} allume, ${n2} souffle sur les braises, ensemble la flamme devient inspirante.`,
    earthWater: (n1: string, n2: string) => `La terre et l'eau se fertilisent. ${n1} structure, ${n2} adoucit, ensemble vous créez un terrain fertile pour vos projets communs.`,
    fireWater: (n1: string, n2: string) => `Le feu et l'eau s'annulent si la communication lâche. ${n1} veut agir vite, ${n2} ressent profondément. Sans respect mutuel du rythme, la vapeur.`,
    earthAir: (n1: string, n2: string) => `La terre et l'air ne se comprennent pas sans effort. ${n1} pense concret, ${n2} pense abstrait. Le pont se construit par la patience.`,
    cardinalStrength: `Vous êtes tous les deux des initiateurs. Ensemble, vous lancez des projets ambitieux que les autres n'oseraient pas.`,
    cardinalFriction: `Deux cardinaux, deux chefs. Qui décide ? La lutte de pouvoir latente doit être nommée pour éviter les impasses.`,
    fixeStrength: `Votre loyauté commune crée une forteresse. Une fois engagés, vous ne lâchez pas.`,
    fixeFriction: `Deux signes fixes, deux murs. Quand vous n'êtes pas d'accord, personne ne bouge. Flexibilité à cultiver.`,
    mutableStrength: `Votre flexibilité commune permet de s'adapter à tout. Rien ne vous arrête durablement.`,
    mutableFriction: `Deux mutables peuvent manquer de structure. Qui tient le cap quand les vents tournent ? Un des deux doit choisir un ancrage.`,
    guidance: (n1: string, n2: string) => `La compatibilité entre ${n1} et ${n2} n'est pas une fatalité, c'est un point de départ. L'astrologie révèle les tendances, la conscience transforme les dynamiques. Un thème natal complet (avec Lune, Vénus, Mars et ascendants) affinera cette lecture à 85% de précision, contre 30% pour les signes solaires seuls.`,
    fallbackStrength: (n1: string, n2: string) => `${n1} et ${n2} forment une combinaison à construire consciemment. Les différences sont des opportunités d'apprentissage mutuel.`,
    fallbackFriction: `Aucun axe de friction majeur. Restez vigilants sur les micro-tensions du quotidien qui peuvent s'accumuler silencieusement.`,
  },
  en: {
    sameElementStrength: (el: string) => `You share the same element, ${el}, which creates an instinctive understanding and a shared energy that feeds itself.`,
    sameElementFriction: `The flip side of this similarity: you can amplify each other's excesses with no safety net. Two fires burn hotter together, for better and for worse.`,
    fireAir: (n1: string, n2: string) => `Fire and air feed each other. ${n1} ignites, ${n2} fans the embers, and together the flame becomes inspiring.`,
    earthWater: (n1: string, n2: string) => `Earth and water enrich each other. ${n1} provides structure, ${n2} softens, and together you create fertile ground for shared projects.`,
    fireWater: (n1: string, n2: string) => `Fire and water cancel each other out when communication slips. ${n1} wants to act fast, ${n2} feels deeply. Without mutual respect for each other's pace, it all turns to steam.`,
    earthAir: (n1: string, n2: string) => `Earth and air don't understand each other without effort. ${n1} thinks in concrete terms, ${n2} thinks in the abstract. The bridge is built with patience.`,
    cardinalStrength: `You are both initiators. Together, you launch ambitious projects that others wouldn't dare to start.`,
    cardinalFriction: `Two cardinal signs, two leaders. Who decides? The latent power struggle must be named to avoid deadlock.`,
    fixeStrength: `Your shared loyalty builds a fortress. Once committed, you don't let go.`,
    fixeFriction: `Two fixed signs, two walls. When you disagree, no one budges. Flexibility is something to cultivate.`,
    mutableStrength: `Your shared flexibility lets you adapt to anything. Nothing stops you for long.`,
    mutableFriction: `Two mutable signs can lack structure. Who holds the course when the winds shift? One of you needs to choose an anchor.`,
    guidance: (n1: string, n2: string) => `The compatibility between ${n1} and ${n2} is not a fate, it's a starting point. Astrology reveals tendencies; awareness transforms the dynamic. A full birth chart (with Moon, Venus, Mars and rising signs) refines this reading to 85% accuracy, versus 30% for sun signs alone.`,
    fallbackStrength: (n1: string, n2: string) => `${n1} and ${n2} form a combination to build consciously. The differences are opportunities for mutual learning.`,
    fallbackFriction: `No major axis of friction. Stay mindful of the small day-to-day tensions that can quietly add up.`,
  },
  es: {
    sameElementStrength: (el: string) => `Compartís el mismo elemento, ${el}, lo que crea una comprensión instintiva y una energía común que se alimenta a sí misma.`,
    sameElementFriction: `La otra cara de esta similitud: podéis amplificar vuestros excesos sin freno. Dos fuegos arden con más fuerza juntos, para bien y para mal.`,
    fireAir: (n1: string, n2: string) => `El fuego y el aire se alimentan mutuamente. ${n1} enciende, ${n2} aviva las brasas, y juntos la llama se vuelve inspiradora.`,
    earthWater: (n1: string, n2: string) => `La tierra y el agua se fertilizan. ${n1} aporta estructura, ${n2} suaviza, y juntos creáis un terreno fértil para vuestros proyectos comunes.`,
    fireWater: (n1: string, n2: string) => `El fuego y el agua se anulan cuando falla la comunicación. ${n1} quiere actuar rápido, ${n2} siente profundamente. Sin respeto mutuo por el ritmo de cada uno, todo se evapora.`,
    earthAir: (n1: string, n2: string) => `La tierra y el aire no se entienden sin esfuerzo. ${n1} piensa en lo concreto, ${n2} piensa en lo abstracto. El puente se construye con paciencia.`,
    cardinalStrength: `Ambos sois iniciadores. Juntos, lanzáis proyectos ambiciosos que otros no se atreverían a empezar.`,
    cardinalFriction: `Dos signos cardinales, dos líderes. ¿Quién decide? La lucha de poder latente debe nombrarse para evitar el bloqueo.`,
    fixeStrength: `Vuestra lealtad común construye una fortaleza. Una vez comprometidos, no soltáis.`,
    fixeFriction: `Dos signos fijos, dos muros. Cuando no estáis de acuerdo, nadie se mueve. Hay que cultivar la flexibilidad.`,
    mutableStrength: `Vuestra flexibilidad común os permite adaptaros a todo. Nada os detiene por mucho tiempo.`,
    mutableFriction: `Dos signos mutables pueden carecer de estructura. ¿Quién mantiene el rumbo cuando cambian los vientos? Uno de los dos debe elegir un ancla.`,
    guidance: (n1: string, n2: string) => `La compatibilidad entre ${n1} y ${n2} no es un destino, es un punto de partida. La astrología revela tendencias; la conciencia transforma la dinámica. Una carta natal completa (con Luna, Venus, Marte y ascendentes) afina esta lectura hasta un 85% de precisión, frente al 30% de los signos solares por sí solos.`,
    fallbackStrength: (n1: string, n2: string) => `${n1} y ${n2} forman una combinación que hay que construir conscientemente. Las diferencias son oportunidades de aprendizaje mutuo.`,
    fallbackFriction: `Ningún eje de fricción importante. Permaneced atentos a las pequeñas tensiones cotidianas que pueden acumularse en silencio.`,
  },
  it: {
    sameElementStrength: (el: string) => `Condividete lo stesso elemento, ${el}, il che crea una comprensione istintiva e un'energia comune che si autoalimenta.`,
    sameElementFriction: `Il rovescio di questa somiglianza: potete amplificare i vostri eccessi senza freni. Due fuochi bruciano più forte insieme, nel bene e nel male.`,
    fireAir: (n1: string, n2: string) => `Il fuoco e l'aria si alimentano a vicenda. ${n1} accende, ${n2} soffia sulla brace, e insieme la fiamma diventa ispiratrice.`,
    earthWater: (n1: string, n2: string) => `La terra e l'acqua si fertilizzano. ${n1} dà struttura, ${n2} addolcisce, e insieme create un terreno fertile per i vostri progetti comuni.`,
    fireWater: (n1: string, n2: string) => `Il fuoco e l'acqua si annullano quando la comunicazione viene meno. ${n1} vuole agire in fretta, ${n2} sente in profondità. Senza rispetto reciproco dei tempi, tutto si trasforma in vapore.`,
    earthAir: (n1: string, n2: string) => `La terra e l'aria non si capiscono senza sforzo. ${n1} pensa in modo concreto, ${n2} pensa in modo astratto. Il ponte si costruisce con la pazienza.`,
    cardinalStrength: `Siete entrambi degli iniziatori. Insieme, lanciate progetti ambiziosi che altri non oserebbero iniziare.`,
    cardinalFriction: `Due segni cardinali, due capi. Chi decide? La lotta di potere latente va nominata per evitare lo stallo.`,
    fixeStrength: `La vostra lealtà comune costruisce una fortezza. Una volta impegnati, non mollate.`,
    fixeFriction: `Due segni fissi, due muri. Quando non siete d'accordo, nessuno si muove. La flessibilità è da coltivare.`,
    mutableStrength: `La vostra flessibilità comune vi permette di adattarvi a tutto. Niente vi ferma a lungo.`,
    mutableFriction: `Due segni mutevoli possono mancare di struttura. Chi tiene la rotta quando cambiano i venti? Uno dei due deve scegliere un'àncora.`,
    guidance: (n1: string, n2: string) => `La compatibilità tra ${n1} e ${n2} non è un destino, è un punto di partenza. L'astrologia rivela le tendenze; la consapevolezza trasforma la dinamica. Un tema natale completo (con Luna, Venere, Marte e ascendenti) affina questa lettura fino all'85% di precisione, contro il 30% dei soli segni solari.`,
    fallbackStrength: (n1: string, n2: string) => `${n1} e ${n2} formano una combinazione da costruire consapevolmente. Le differenze sono opportunità di apprendimento reciproco.`,
    fallbackFriction: `Nessun asse di attrito importante. Restate attenti alle piccole tensioni quotidiane che possono accumularsi in silenzio.`,
  },
  pt: {
    sameElementStrength: (el: string) => `Vocês compartilham o mesmo elemento, ${el}, o que cria uma compreensão instintiva e uma energia comum que se alimenta a si mesma.`,
    sameElementFriction: `O reverso dessa semelhança: vocês podem amplificar os próprios excessos sem freios. Dois fogos queimam com mais força juntos, para o bem e para o mal.`,
    fireAir: (n1: string, n2: string) => `O fogo e o ar se alimentam mutuamente. ${n1} acende, ${n2} sopra as brasas, e juntos a chama se torna inspiradora.`,
    earthWater: (n1: string, n2: string) => `A terra e a água se fertilizam. ${n1} dá estrutura, ${n2} suaviza, e juntos vocês criam um terreno fértil para os projetos em comum.`,
    fireWater: (n1: string, n2: string) => `O fogo e a água se anulam quando a comunicação falha. ${n1} quer agir rápido, ${n2} sente profundamente. Sem respeito mútuo pelo ritmo de cada um, tudo vira vapor.`,
    earthAir: (n1: string, n2: string) => `A terra e o ar não se entendem sem esforço. ${n1} pensa no concreto, ${n2} pensa no abstrato. A ponte se constrói com paciência.`,
    cardinalStrength: `Vocês dois são iniciadores. Juntos, lançam projetos ambiciosos que outros não ousariam começar.`,
    cardinalFriction: `Dois signos cardinais, dois líderes. Quem decide? A luta de poder latente precisa ser nomeada para evitar o impasse.`,
    fixeStrength: `A lealdade comum de vocês constrói uma fortaleza. Uma vez comprometidos, vocês não largam.`,
    fixeFriction: `Dois signos fixos, dois muros. Quando vocês discordam, ninguém se move. A flexibilidade precisa ser cultivada.`,
    mutableStrength: `A flexibilidade comum de vocês permite se adaptar a tudo. Nada os detém por muito tempo.`,
    mutableFriction: `Dois signos mutáveis podem carecer de estrutura. Quem mantém o rumo quando os ventos mudam? Um dos dois precisa escolher uma âncora.`,
    guidance: (n1: string, n2: string) => `A compatibilidade entre ${n1} e ${n2} não é um destino, é um ponto de partida. A astrologia revela tendências; a consciência transforma a dinâmica. Um mapa astral completo (com Lua, Vênus, Marte e ascendentes) refina esta leitura para 85% de precisão, contra 30% apenas com os signos solares.`,
    fallbackStrength: (n1: string, n2: string) => `${n1} e ${n2} formam uma combinação a construir conscientemente. As diferenças são oportunidades de aprendizado mútuo.`,
    fallbackFriction: `Nenhum eixo de atrito importante. Fiquem atentos às pequenas tensões do dia a dia que podem se acumular silenciosamente.`,
  },
  de: {
    sameElementStrength: (el: string) => `Ihr teilt dasselbe Element, ${el}, was ein instinktives Verständnis und eine gemeinsame Energie schafft, die sich selbst nährt.`,
    sameElementFriction: `Die Kehrseite dieser Ähnlichkeit: Ihr könnt eure Exzesse ohne Sicherung verstärken. Zwei Feuer brennen zusammen heißer, im Guten wie im Schlechten.`,
    fireAir: (n1: string, n2: string) => `Feuer und Luft nähren einander. ${n1} entzündet, ${n2} facht die Glut an, und zusammen wird die Flamme inspirierend.`,
    earthWater: (n1: string, n2: string) => `Erde und Wasser befruchten einander. ${n1} gibt Struktur, ${n2} mildert, und zusammen schafft ihr einen fruchtbaren Boden für gemeinsame Projekte.`,
    fireWater: (n1: string, n2: string) => `Feuer und Wasser heben sich auf, wenn die Kommunikation nachlässt. ${n1} will schnell handeln, ${n2} fühlt tief. Ohne gegenseitigen Respekt für das Tempo des anderen wird alles zu Dampf.`,
    earthAir: (n1: string, n2: string) => `Erde und Luft verstehen sich nicht ohne Mühe. ${n1} denkt konkret, ${n2} denkt abstrakt. Die Brücke entsteht durch Geduld.`,
    cardinalStrength: `Ihr seid beide Initiatoren. Gemeinsam startet ihr ehrgeizige Projekte, die andere sich nicht trauen würden.`,
    cardinalFriction: `Zwei Kardinalzeichen, zwei Anführer. Wer entscheidet? Der latente Machtkampf muss benannt werden, um Blockaden zu vermeiden.`,
    fixeStrength: `Eure gemeinsame Loyalität baut eine Festung. Einmal gebunden, lasst ihr nicht los.`,
    fixeFriction: `Zwei feste Zeichen, zwei Mauern. Wenn ihr uneinig seid, bewegt sich niemand. Flexibilität will gepflegt werden.`,
    mutableStrength: `Eure gemeinsame Flexibilität lässt euch an alles anpassen. Nichts hält euch lange auf.`,
    mutableFriction: `Zwei veränderlichen Zeichen kann es an Struktur fehlen. Wer hält den Kurs, wenn die Winde drehen? Einer von beiden muss einen Anker wählen.`,
    guidance: (n1: string, n2: string) => `Die Kompatibilität zwischen ${n1} und ${n2} ist kein Schicksal, sondern ein Ausgangspunkt. Die Astrologie zeigt Tendenzen; das Bewusstsein verwandelt die Dynamik. Ein vollständiges Geburtshoroskop (mit Mond, Venus, Mars und Aszendenten) verfeinert diese Deutung auf 85% Genauigkeit, gegenüber 30% bei den Sonnenzeichen allein.`,
    fallbackStrength: (n1: string, n2: string) => `${n1} und ${n2} bilden eine Kombination, die bewusst aufgebaut werden will. Die Unterschiede sind Gelegenheiten zum gegenseitigen Lernen.`,
    fallbackFriction: `Keine größere Reibungsachse. Bleibt achtsam gegenüber den kleinen alltäglichen Spannungen, die sich leise ansammeln können.`,
  },
} as const;

export function compatibilityInterpretation(
  name1: string,
  e1: Element,
  q1: Quality,
  name2: string,
  e2: Element,
  q2: Quality,
  lang: InterpLang = "fr"
): { strengths: string[]; frictions: string[]; guidance: string } {
  const P = INTERP_PACK[lang];
  const EL = ELEMENT_NAMES[lang];
  const strengths: string[] = [];
  const frictions: string[] = [];

  // Element-based insights
  if (e1 === e2) {
    strengths.push(P.sameElementStrength(EL[e1]));
    frictions.push(P.sameElementFriction);
  } else if ((e1 === "feu" && e2 === "air") || (e1 === "air" && e2 === "feu")) {
    strengths.push(P.fireAir(name1, name2));
  } else if ((e1 === "terre" && e2 === "eau") || (e1 === "eau" && e2 === "terre")) {
    strengths.push(P.earthWater(name1, name2));
  } else if ((e1 === "feu" && e2 === "eau") || (e1 === "eau" && e2 === "feu")) {
    frictions.push(P.fireWater(name1, name2));
  } else if ((e1 === "terre" && e2 === "air") || (e1 === "air" && e2 === "terre")) {
    frictions.push(P.earthAir(name1, name2));
  }

  // Quality-based insights
  if (q1 === q2 && q1 === "cardinal") {
    strengths.push(P.cardinalStrength);
    frictions.push(P.cardinalFriction);
  }
  if (q1 === q2 && q1 === "fixe") {
    strengths.push(P.fixeStrength);
    frictions.push(P.fixeFriction);
  }
  if (q1 === q2 && q1 === "mutable") {
    strengths.push(P.mutableStrength);
    frictions.push(P.mutableFriction);
  }

  return {
    strengths: strengths.length > 0 ? strengths : [P.fallbackStrength(name1, name2)],
    frictions: frictions.length > 0 ? frictions : [P.fallbackFriction],
    guidance: P.guidance(name1, name2),
  };
}
