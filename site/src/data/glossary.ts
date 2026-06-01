// Glossaire éducatif : une entrée = une page /glossaire/<slug>.
// Chaque terme : définition claire (éducatif) + "le savais-tu ?" (amusant) + CTA
// vers l'outil pour calculer le sien ou vers l'Oracle (utile, alimente le tunnel). [2026-06-01]

export type GlossaryTerm = {
  slug: string;
  term: string;
  category: string;
  short: string;       // une ligne, pour le hub
  definition: string;  // 2-4 phrases
  funFact: string;     // "le savais-tu ?"
  toolUrl?: string;
  toolLabel?: string;
  oracleQ?: string;    // question suggérée à l'Oracle
  related?: string[];  // slugs
};

export const GLOSSARY_CATEGORIES = [
  "Astrologie",
  "Numérologie",
  "Guidance karmique",
  "Arts divinatoires",
  "Termes techniques",
];

export const GLOSSARY: GlossaryTerm[] = [
  // ───────────── Astrologie ─────────────
  {
    slug: "theme-natal", term: "Thème natal", category: "Astrologie",
    short: "La photographie du ciel à l'instant exact de ta naissance.",
    definition: "Le thème natal, aussi appelé carte du ciel ou carte natale, est la photographie exacte du ciel au moment précis de ta naissance, vu depuis ton lieu de naissance. Il situe les 10 planètes dans les 12 signes et les 12 maisons, et c'est la base de toute lecture astrologique sérieuse : une empreinte unique, comme une signature cosmique qui n'appartient qu'à toi.",
    funFact: "Deux personnes nées le même jour mais à deux heures d'intervalle peuvent avoir un ascendant différent, et donc un thème qui raconte une tout autre histoire.",
    toolUrl: "/outils/theme-natal/", toolLabel: "Calcule ton thème natal",
    oracleQ: "Que révèle mon thème natal sur ma personnalité ?",
    related: ["ascendant", "maisons-astrologiques", "aspects"],
  },
  {
    slug: "ascendant", term: "Ascendant", category: "Astrologie",
    short: "Le signe qui se levait à l'est quand tu es né(e).",
    definition: "L'ascendant est le signe du zodiaque qui se levait à l'horizon est à l'instant exact de ta naissance. Il décrit ta personnalité extérieure, ton masque social, la première impression que tu donnes. Pour le calculer, l'heure et le lieu de naissance sont indispensables, car il change de signe toutes les deux heures environ.",
    funFact: "Une erreur de 15 minutes sur ton heure de naissance peut déjà faire basculer ton ascendant dans le signe d'à côté, et changer toute l'interprétation.",
    toolUrl: "/outils/ascendant/", toolLabel: "Calcule ton ascendant",
    oracleQ: "Comment mon ascendant influence-t-il la façon dont on me perçoit ?",
    related: ["theme-natal", "maisons-astrologiques"],
  },
  {
    slug: "maisons-astrologiques", term: "Maisons astrologiques", category: "Astrologie",
    short: "Les 12 secteurs de vie de ta carte du ciel.",
    definition: "Les maisons sont les 12 secteurs de la carte du ciel, chacun gouvernant un domaine de vie : identité, finances, communication, foyer, créativité, santé, relations, transformation, voyages, carrière, amitiés, spiritualité. Une planète dans une maison vient activer et colorer ce secteur de ton existence.",
    funFact: "La maison 7, celle du couple, fait toujours face à la maison 1, celle du soi : en astrologie, l'autre est littéralement notre miroir.",
    toolUrl: "/outils/theme-natal/", toolLabel: "Vois tes maisons dans ton thème natal",
    oracleQ: "Quelle maison de mon thème est la plus active en ce moment ?",
    related: ["theme-natal", "aspects"],
  },
  {
    slug: "aspects", term: "Aspects", category: "Astrologie",
    short: "Les angles que forment les planètes entre elles.",
    definition: "Les aspects sont les angles formés entre les planètes dans un thème. Ils racontent comment les énergies dialoguent : conjonction (0°, fusion), sextile (60°, harmonie douce), carré (90°, tension créative), trigone (120°, fluidité naturelle), opposition (180°, polarité à équilibrer). Ce sont les aspects, plus que les planètes seules, qui donnent sa dynamique à un thème.",
    funFact: "Un carré, souvent vu comme difficile, est en réalité le meilleur moteur de croissance : sans un peu de friction, rien ne se met en mouvement.",
    toolUrl: "/outils/synastrie/", toolLabel: "Vois les aspects entre deux thèmes",
    oracleQ: "Quels sont les aspects les plus marquants de mon thème ?",
    related: ["theme-natal", "synastrie", "transits"],
  },
  {
    slug: "transits", term: "Transits", category: "Astrologie",
    short: "Les positions actuelles des planètes par rapport à ton thème.",
    definition: "Les transits sont les positions des planètes aujourd'hui, comparées à ton thème natal. Quand une planète vient toucher un point de ton ciel de naissance (ton Soleil, ta Lune…), elle en active le thème pour une période donnée. C'est ce qui explique pourquoi certaines semaines te portent et d'autres te bousculent.",
    funFact: "Les astrologues anticipent souvent les grands transits des mois à l'avance : savoir qu'une vague arrive permet de surfer plutôt que de subir.",
    toolUrl: "/outils/transits/", toolLabel: "Découvre tes transits du jour",
    oracleQ: "Quels transits influencent ma période actuelle ?",
    related: ["theme-natal", "retrograde", "cycle-de-saturne"],
  },
  {
    slug: "retrograde", term: "Rétrograde", category: "Astrologie",
    short: "Quand une planète semble reculer dans le ciel.",
    definition: "Une planète est dite rétrograde quand elle semble reculer dans le ciel, une illusion d'optique due aux vitesses relatives des orbites. Mercure rétrograde est le plus célèbre : il survient 3 à 4 fois par an et invite à ralentir, relire, revoir. Loin d'être une malédiction, c'est une parenthèse pour reprendre ce qui a été laissé en suspens.",
    funFact: "Le mot vient du latin retrogradus, « qui marche en arrière ». Mercure passe environ 18 % de l'année en rétrograde : c'est plus courant qu'on ne le croit.",
    toolUrl: "/outils/transits/", toolLabel: "Vois si une planète est rétrograde aujourd'hui",
    oracleQ: "Y a-t-il une planète rétrograde qui m'affecte en ce moment ?",
    related: ["transits"],
  },
  {
    slug: "synastrie", term: "Synastrie", category: "Astrologie",
    short: "La comparaison de deux thèmes pour lire un couple.",
    definition: "La synastrie superpose deux thèmes natals pour lire la dynamique d'une relation. On analyse les aspects croisés entre les planètes des deux personnes : attirances (Vénus-Mars), complicité au quotidien (Lune-Soleil), points de friction et zones de croissance. C'est la méthode la plus complète pour comprendre un couple, bien au-delà d'une comparaison de signes solaires.",
    funFact: "Une synastrie tendue ne condamne pas un couple : elle indique simplement où il y aura du travail. Et un thème trop harmonieux peut, lui, manquer de piment.",
    toolUrl: "/outils/synastrie/", toolLabel: "Calcule votre synastrie",
    oracleQ: "Quelle est la dynamique astrologique entre nous deux ?",
    related: ["aspects", "compatibilite-numerologique"],
  },
  // ───────────── Numérologie ─────────────
  {
    slug: "chemin-de-vie", term: "Chemin de vie", category: "Numérologie",
    short: "Le nombre clé qui résume ta mission de vie.",
    definition: "Le chemin de vie est le nombre le plus important en numérologie pythagoricienne. Il se calcule en additionnant tous les chiffres de ta date de naissance, réduits jusqu'à un nombre entre 1 et 9 (ou un maître nombre 11, 22, 33). Il décrit la grande trajectoire de ton existence : ton don, ton défi, ta direction.",
    funFact: "Exemple : 15/07/1998 → 1+5+0+7+1+9+9+8 = 40 → 4+0 = 4. Pythagore lui-même, dit-on, était un 7, le nombre du chercheur et du mystique.",
    toolUrl: "/outils/chemin-de-vie/", toolLabel: "Calcule ton chemin de vie",
    oracleQ: "Que révèle mon chemin de vie sur ma mission ?",
    related: ["maitres-nombres", "annee-personnelle", "nombre-d-expression"],
  },
  {
    slug: "nombre-d-expression", term: "Nombre d'expression", category: "Numérologie",
    short: "Tes talents, lus dans les lettres de ton nom.",
    definition: "Le nombre d'expression se calcule à partir de ton nom complet de naissance, selon la table de Pythagore (A=1, B=2… jusqu'à 9, puis on recommence). Il révèle tes talents naturels et ta manière d'agir dans le monde, ce que tu es venu exprimer.",
    funFact: "En numérologie, ton nom n'est pas un hasard : il vibre. Changer de nom, c'est, symboliquement, changer une partie de sa partition intérieure.",
    toolUrl: "/outils/nombre-expression/", toolLabel: "Calcule ton nombre d'expression",
    oracleQ: "Que révèle mon nombre d'expression sur mes talents ?",
    related: ["nombre-intime", "nombre-de-realisation", "table-d-inclusion"],
  },
  {
    slug: "nombre-intime", term: "Nombre intime (nombre de l'âme)", category: "Numérologie",
    short: "Tes désirs profonds, cachés dans les voyelles de ton nom.",
    definition: "Le nombre intime, ou nombre de l'âme, se calcule à partir des voyelles de ton nom. Il révèle tes désirs profonds, ce qui te motive vraiment au plus secret de toi, parfois bien différent de l'image que tu projettes.",
    funFact: "Les voyelles « respirent », les consonnes « structurent ». La numérologie lit dans les voyelles ce que ton âme chuchote, et dans les consonnes ce que le monde voit.",
    toolUrl: "/outils/nombre-expression/", toolLabel: "Calcule tes nombres du nom",
    oracleQ: "Quel est mon nombre de l'âme et que désire-t-il vraiment ?",
    related: ["nombre-d-expression", "nombre-de-realisation"],
  },
  {
    slug: "nombre-de-realisation", term: "Nombre de réalisation (personnalité)", category: "Numérologie",
    short: "L'image que tu projettes, lue dans les consonnes.",
    definition: "Le nombre de réalisation, ou nombre de personnalité, se calcule à partir des consonnes de ton nom. Il décrit l'image que tu renvoies vers l'extérieur, la première impression numérologique, ce que les autres perçoivent avant de vraiment te connaître.",
    funFact: "C'est le pendant numérologique de l'ascendant en astrologie : la façade, le masque social, ce qui se voit en premier.",
    toolUrl: "/outils/nombre-expression/", toolLabel: "Calcule tes nombres du nom",
    oracleQ: "Quelle image mon nombre de personnalité projette-t-il ?",
    related: ["nombre-d-expression", "nombre-intime", "ascendant"],
  },
  {
    slug: "annee-personnelle", term: "Année personnelle", category: "Numérologie",
    short: "Le thème numérologique de ton année en cours.",
    definition: "L'année personnelle est un nombre, de 1 à 9, qui décrit l'énergie dominante de ton année. Elle se calcule en additionnant ton jour et ton mois de naissance avec l'année en cours (et non ton année de naissance). Elle suit un cycle de 9 ans : une année 1 sème, une année 9 clôt et libère.",
    funFact: "Les grandes décisions se prennent idéalement en année 1, 5 ou 8 ; les années 2, 4 et 7 sont faites pour consolider et s'intérioriser. Connaître ton année, c'est synchroniser tes efforts avec la marée.",
    toolUrl: "/outils/annee-personnelle/", toolLabel: "Calcule ton année personnelle",
    oracleQ: "Dans quelle année personnelle suis-je et qu'est-ce que ça change ?",
    related: ["chemin-de-vie"],
  },
  {
    slug: "maitres-nombres", term: "Maîtres nombres", category: "Numérologie",
    short: "11, 22, 33 : les nombres à haute tension qu'on ne réduit pas.",
    definition: "Les maîtres nombres 11, 22 et 33 ne sont pas réduits en numérologie, car ils portent une vibration spirituelle élevée et exigeante. Le 11 est l'intuition et l'inspiration, le 22 le Maître Bâtisseur qui matérialise de grands projets, le 33 le Maître Enseignant de la compassion universelle.",
    funFact: "Porter un maître nombre, c'est un peu hériter d'une voiture de course : un potentiel immense, mais qui demande de la maîtrise avant de filer droit.",
    toolUrl: "/outils/chemin-de-vie/", toolLabel: "Vois si tu portes un maître nombre",
    oracleQ: "Ai-je un maître nombre dans mon profil et comment le vivre ?",
    related: ["chemin-de-vie", "dettes-karmiques"],
  },
  {
    slug: "dettes-karmiques", term: "Dettes karmiques", category: "Numérologie",
    short: "Des leçons d'âme inscrites dans certains nombres (13, 14, 16, 19).",
    definition: "Certains nombres intermédiaires signalent une dette karmique, une leçon laissée en suspens d'une vie antérieure : 13/4 (la paresse, leçon de travail), 14/5 (l'abus de liberté, leçon de modération), 16/7 (l'ego, leçon d'humilité), 19/1 (l'abus de pouvoir, leçon d'autonomie respectueuse). Une dette n'est pas une punition, mais une invitation à grandir.",
    funFact: "La majorité des gens ne portent aucune dette karmique. En découvrir une n'est donc pas une mauvaise nouvelle : c'est une carte précise de ce sur quoi ton âme a choisi de travailler.",
    toolUrl: "/outils/dette-karmique/", toolLabel: "Calcule ta dette karmique",
    oracleQ: "Est-ce que je porte une dette karmique, et quelle leçon porte-t-elle ?",
    related: ["maitres-nombres", "noeuds-lunaires", "chemin-de-vie"],
  },
  {
    slug: "table-d-inclusion", term: "Table d'inclusion", category: "Numérologie",
    short: "La fréquence de chaque chiffre dans ton nom révèle forces et manques.",
    definition: "La table d'inclusion analyse combien de fois chaque chiffre de 1 à 9 apparaît dans ton nom complet. Les nombres absents pointent tes leçons karmiques, ceux en excès tes forces, parfois tes obsessions. C'est une radiographie fine de ton équilibre intérieur.",
    funFact: "Un chiffre totalement absent de ton nom est appelé « karmique » : c'est souvent là que se cache ta plus grande zone d'apprentissage de cette vie.",
    toolUrl: "/outils/nombre-expression/", toolLabel: "Analyse les nombres de ton nom",
    oracleQ: "Quels nombres manquent ou dominent dans mon nom ?",
    related: ["nombre-d-expression", "dettes-karmiques"],
  },
  // ───────────── Guidance karmique ─────────────
  {
    slug: "noeuds-lunaires", term: "Nœuds lunaires", category: "Guidance karmique",
    short: "L'axe d'où tu viens (Sud) et où tu vas (Nord).",
    definition: "L'axe des nœuds lunaires trace ta direction de vie. Le Nœud Nord indique ta mission, ce vers quoi ton âme cherche à évoluer, souvent inconfortable car nouveau. Le Nœud Sud représente tes acquis des vies passées, ta zone de confort, ce que tu maîtrises déjà mais dont tu dois t'émanciper.",
    funFact: "Le Nœud Nord est rarement « facile » : c'est justement parce qu'il te met hors de ta zone de confort qu'il te fait grandir.",
    toolUrl: "/outils/theme-natal/", toolLabel: "Situe tes nœuds dans ton thème",
    oracleQ: "Que m'indiquent mes nœuds lunaires sur ma mission de vie ?",
    related: ["dettes-karmiques", "theme-natal"],
  },
  {
    slug: "cycle-de-saturne", term: "Cycle de Saturne", category: "Guidance karmique",
    short: "Le grand rendez-vous de maturité, vers 29-30 ans.",
    definition: "Saturne met environ 29,5 ans à faire le tour du zodiaque. Son premier retour, entre 27 et 30 ans, marque un grand passage vers la maturité : on fait le tri, on choisit qui l'on veut vraiment être. Le second retour, vers 56-60 ans, ouvre le seuil de la sagesse.",
    funFact: "Le « retour de Saturne » est si universel qu'il a son propre nom dans la culture pop : beaucoup de grands tournants de vie (mariages, ruptures, reconversions) tombent pile à cet âge.",
    toolUrl: "/outils/transits/", toolLabel: "Vois où en est ton Saturne",
    oracleQ: "Où en suis-je dans mon cycle de Saturne ?",
    related: ["transits", "noeuds-lunaires"],
  },
  {
    slug: "part-de-fortune", term: "Part de Fortune", category: "Guidance karmique",
    short: "Le point qui montre où tu trouves ton bonheur naturel.",
    definition: "La Part de Fortune est un point calculé (Ascendant + Lune − Soleil) qui indique où tu trouves le plus naturellement ta réalisation et ton bonheur. C'est une boussole douce : le secteur de vie où, sans forcer, les choses tendent à couler de source pour toi.",
    funFact: "C'est l'un des « points arabes », un héritage de l'astrologie médiévale arabe qui en comptait des dizaines, chacun pour un aspect précis de la vie.",
    toolUrl: "/outils/theme-natal/", toolLabel: "Calcule ton thème complet",
    oracleQ: "Où se trouve ma Part de Fortune et qu'indique-t-elle ?",
    related: ["theme-natal", "maisons-astrologiques"],
  },
  // ───────────── Arts divinatoires ─────────────
  {
    slug: "astrologue", term: "Astrologue", category: "Arts divinatoires",
    short: "Celui ou celle qui lit le ciel pour t'éclairer.",
    definition: "L'astrologue analyse les positions des planètes pour interpréter une personnalité ou repérer des tendances. Contrairement à une idée reçue, l'astrologie repose sur des calculs astronomiques précis : le talent de l'astrologue est de traduire ces données en sens, jamais en fatalité.",
    funFact: "Kepler, Galilée et Newton ont tous pratiqué l'astrologie. La frontière entre astronomie et astrologie n'a été tracée que tardivement.",
    oracleQ: "Peux-tu m'éclairer comme le ferait un astrologue, à partir de mon thème ?",
    related: ["numerologue", "guidance-spirituelle"],
  },
  {
    slug: "numerologue", term: "Numérologue", category: "Arts divinatoires",
    short: "Celui ou celle qui lit les nombres de ta vie.",
    definition: "Le numérologue analyse les nombres tirés de ta date de naissance et de ton nom pour en dégager des significations sur ta personnalité et tes cycles de vie. La numérologie pythagoricienne se veut une discipline structurée, avec des règles claires et reproductibles, héritée de Pythagore.",
    funFact: "Pour Pythagore, « tout est nombre ». Il voyait dans les mathématiques la clé de l'harmonie de l'univers, des notes de musique aux orbites des astres.",
    oracleQ: "Peux-tu lire mes nombres comme un numérologue le ferait ?",
    related: ["astrologue", "chemin-de-vie"],
  },
  {
    slug: "tarologue", term: "Tarologue / Cartomancien", category: "Arts divinatoires",
    short: "Celui ou celle qui lit les cartes pour répondre à tes questions.",
    definition: "Le tarologue, ou cartomancien, utilise un jeu de cartes (tarot de Marseille, oracles divers) pour répondre à des questions et éclairer une situation. Le tirage n'est pas une prédiction figée mais un miroir : il met en lumière ce que l'on sait déjà au fond, pour mieux décider.",
    funFact: "Le tarot de Marseille compte 78 cartes, dont 22 « arcanes majeurs » qui racontent, du Bateleur au Monde, un véritable voyage initiatique de l'âme.",
    oracleQ: "Peux-tu m'aider à y voir clair sur une question qui me préoccupe ?",
    related: ["guidance-spirituelle"],
  },
  {
    slug: "guidance-spirituelle", term: "Guidance spirituelle", category: "Arts divinatoires",
    short: "L'accompagnement par les arts divinatoires, version développement de soi.",
    definition: "La guidance spirituelle désigne l'accompagnement moderne qui s'appuie sur les arts divinatoires (astrologie, numérologie, karmique) dans une logique de développement personnel. L'objectif n'est pas de prédire, mais d'aider à se connaître, à décider, à grandir.",
    funFact: "« Les astres inclinent, mais ne déterminent pas » : cette maxime médiévale, souvent prêtée à Thomas d'Aquin, résume tout l'esprit d'une bonne guidance.",
    oracleQ: "Peux-tu me donner une guidance pour ma période actuelle ?",
    related: ["astrologue", "numerologue", "tarologue"],
  },
  // ───────────── Termes techniques ─────────────
  {
    slug: "swiss-ephemeris", term: "Swiss Ephemeris", category: "Termes techniques",
    short: "Le moteur de calcul astronomique, précis au niveau de la NASA.",
    definition: "Swiss Ephemeris est le moteur de calcul astronomique développé par Astrodienst (Zurich), utilisé par Karmastro pour tous les thèmes. Il s'appuie sur les éphémérides JPL de la NASA, avec une précision de 0,001 seconde d'arc, le même niveau que celui employé pour les trajectoires de sondes spatiales.",
    funFact: "0,001 seconde d'arc, c'est l'angle que ferait une pièce de monnaie vue à plus de 3 000 km de distance. Autant dire que tes positions planétaires sont justes.",
    oracleQ: "Tes calculs sont-ils vraiment précis ? Explique-moi.",
    related: ["ephemerides", "systeme-placidus"],
  },
  {
    slug: "ephemerides", term: "Éphémérides", category: "Termes techniques",
    short: "Les tables de positions des planètes, jour après jour.",
    definition: "Les éphémérides sont des tables qui donnent la position des planètes pour chaque instant. C'est la matière première de l'astrologie : sans elles, impossible de savoir où était le ciel à ta naissance. Swiss Ephemeris couvre une période vertigineuse, de 13 000 av. J.-C. à 17 000 ap. J.-C.",
    funFact: "Avant les ordinateurs, les astrologues calculaient à la main avec d'épais livres d'éphémérides. Un seul thème pouvait prendre des heures.",
    oracleQ: "Comment connais-tu la position des planètes à ma naissance ?",
    related: ["swiss-ephemeris"],
  },
  {
    slug: "systeme-placidus", term: "Système Placidus", category: "Termes techniques",
    short: "La méthode la plus répandue pour découper les 12 maisons.",
    definition: "Le système Placidus est la méthode de division des maisons la plus utilisée en astrologie occidentale moderne. Il produit des maisons de tailles inégales, ce qui le rend très expressif pour les latitudes tempérées. Karmastro l'applique par défaut, avec Koch, Whole Sign et Equal en options pour les profils avancés.",
    funFact: "Il porte le nom de Placidus de Titis, un moine mathématicien italien du XVIIe siècle, alors que la méthode elle-même est bien plus ancienne.",
    oracleQ: "Quel système de maisons utilises-tu pour mon thème ?",
    related: ["maisons-astrologiques", "swiss-ephemeris"],
  },
];

export function getTerm(slug: string): GlossaryTerm | undefined {
  return GLOSSARY.find((t) => t.slug === slug);
}
