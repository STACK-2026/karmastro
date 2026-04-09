// Demo profile: Léa Moreau, née le 14 avril 1992 à 15h30 à Lyon

export const demoProfile = {
  firstName: "Léa",
  lastName: "Moreau",
  birthDate: new Date(1992, 3, 14),
  birthTime: "15:30",
  birthPlace: "Lyon, France",
  knowsBirthTime: true,
  gender: "elle",
  interests: ["Amour & Relations", "Développement personnel", "Créativité", "Spiritualité & Éveil"],
  level: "intermédiaire" as const,

  // Astrology (mocked)
  astrology: {
    sunSign: { sign: "Bélier", symbol: "♈", element: "Feu", degrees: "24°18'" },
    moonSign: { sign: "Poissons", symbol: "♓", element: "Eau", degrees: "12°45'" },
    ascendant: { sign: "Vierge", symbol: "♍", element: "Terre", degrees: "8°33'" },
    planets: [
      { name: "Soleil", symbol: "☉", sign: "Bélier", house: 8, degrees: "24°18'", interpretation: "Transformation profonde de l'identité. Vous êtes attirée par les mystères et les processus de renaissance." },
      { name: "Lune", symbol: "☽", sign: "Poissons", house: 7, degrees: "12°45'", interpretation: "Émotionnellement intuitive dans les relations. Besoin de connexion spirituelle avec le partenaire." },
      { name: "Mercure", symbol: "☿", sign: "Bélier", house: 8, degrees: "10°22'", interpretation: "Pensée directe et investigatrice. Communication franche sur les sujets profonds." },
      { name: "Vénus", symbol: "♀", sign: "Poissons", house: 7, degrees: "28°05'", interpretation: "Amour inconditionnel et romantisme idéaliste. Attraction pour les âmes sensibles et artistiques." },
      { name: "Mars", symbol: "♂", sign: "Verseau", house: 6, degrees: "5°40'", interpretation: "Énergie dirigée vers l'innovation au travail. Méthodes non-conventionnelles." },
      { name: "Jupiter", symbol: "♃", sign: "Vierge", house: 1, degrees: "18°12'", interpretation: "Expansion à travers le service et l'analyse. Chance dans les domaines de la santé et du bien-être." },
      { name: "Saturne", symbol: "♄", sign: "Verseau", house: 6, degrees: "18°30'", interpretation: "Discipline dans le travail quotidien. Leçons de structure dans l'innovation." },
      { name: "Uranus", symbol: "♅", sign: "Capricorne", house: 5, degrees: "16°44'", interpretation: "Créativité originale et non-conventionnelle. Surprises dans les domaines de l'amour." },
      { name: "Neptune", symbol: "♆", sign: "Capricorne", house: 5, degrees: "18°02'", interpretation: "Rêves créatifs puissants. Inspiration artistique profonde mais risque d'illusions amoureuses." },
      { name: "Pluton", symbol: "♇", sign: "Scorpion", house: 3, degrees: "22°10'", interpretation: "Transformation par la communication. Paroles puissantes qui touchent les profondeurs." },
      { name: "Nœud Nord", symbol: "☊", sign: "Cancer", house: 10, degrees: "2°15'", interpretation: "Leçon karmique : construire un foyer intérieur dans la vie publique. Nourrir tout en accomplissant." },
      { name: "Nœud Sud", symbol: "☋", sign: "Capricorne", house: 4, degrees: "2°15'", interpretation: "Tendance passée : contrôle et rigidité dans la sphère intime. Lâcher prise sur l'ambition solitaire." },
      { name: "Chiron", symbol: "⚷", sign: "Lion", house: 12, degrees: "14°08'", interpretation: "Blessure liée à l'expression de soi et la reconnaissance. Guérison à travers la spiritualité et la création." },
    ],
    aspects: [
      { planet1: "Soleil", planet2: "Lune", type: "sextile", orb: "2°33'", nature: "harmonique", interpretation: "Harmonie entre identité et émotions." },
      { planet1: "Vénus", planet2: "Neptune", type: "sextile", orb: "1°03'", nature: "harmonique", interpretation: "Amour idéalisé et inspiration artistique." },
      { planet1: "Mars", planet2: "Saturne", type: "conjonction", orb: "0°10'", nature: "tension", interpretation: "Énergie disciplinée mais parfois frustrée." },
      { planet1: "Lune", planet2: "Vénus", type: "conjonction", orb: "4°20'", nature: "harmonique", interpretation: "Sensibilité émotionnelle profonde, don pour les arts." },
      { planet1: "Soleil", planet2: "Pluton", type: "opposition", orb: "2°08'", nature: "tension", interpretation: "Besoin intense de transformation. Pouvoir personnel à maîtriser." },
      { planet1: "Jupiter", planet2: "Chiron", type: "trigone", orb: "4°04'", nature: "harmonique", interpretation: "Capacité à transformer les blessures en sagesse partagée." },
    ],
    houses: [
      { house: 1, sign: "Vierge", description: "Apparence analytique et réservée. Image de compétence et de service." },
      { house: 2, sign: "Balance", description: "Valeurs d'harmonie et d'esthétique. Revenus par les partenariats." },
      { house: 3, sign: "Scorpion", description: "Communication intense et profonde. Relation transformative avec les proches." },
      { house: 4, sign: "Sagittaire", description: "Foyer philosophique et multiculturel. Racines dans l'aventure." },
      { house: 5, sign: "Capricorne", description: "Créativité structurée et ambitieuse. Amours matures." },
      { house: 6, sign: "Verseau", description: "Routine de travail innovante. Santé par les méthodes alternatives." },
      { house: 7, sign: "Poissons", description: "Partenaires spirituels et sensibles. Relations empathiques." },
      { house: 8, sign: "Bélier", description: "Transformation par l'action. Approche directe des crises." },
      { house: 9, sign: "Taureau", description: "Philosophie de vie ancrée et sensorielle. Voyages pour le plaisir." },
      { house: 10, sign: "Gémeaux", description: "Carrière polyvalente et communicative. Réputation intellectuelle." },
      { house: 11, sign: "Cancer", description: "Amitiés nourricières. Projets collectifs avec une touche maternelle." },
      { house: 12, sign: "Lion", description: "Vie intérieure créative et dramatique. Spiritualité expressive." },
    ],
  },

  // Numerology (calculated)
  numerology: {
    lifePath: { number: 3, intermediate: 30, label: "Le Créatif" },
    expression: { number: 7, intermediate: 34, label: "Le Chercheur" },
    soulUrge: { number: 11, intermediate: 11, label: "L'Intuitif (Maître nombre)" },
    personality: { number: 5, intermediate: 23, label: "L'Aventurier" },
    birthday: 5,
    personalYear2026: 6,
    karmicDebts: [],
    northNode: { sign: "Cancer", house: 10, lesson: "Construire un foyer intérieur dans la vie publique" },
  },
};

// Daily messages (last 7 days)
export const dailyMessages = [
  {
    date: "2026-04-08",
    moonSign: "Gémeaux",
    moonPhase: "Gibbeuse croissante 🌔",
    retrograde: "Mercure ☿℞",
    personalDay: 9,
    personalMonth: 1,
    personalYear: 6,
    energies: { amour: 7, travail: 5, sante: 8, spiritualite: 9, finances: 6 },
    message: `Aujourd'hui est un jour personnel 9, celui de l'achèvement et du lâcher-prise, dans votre mois personnel 1 de nouveau départ et votre année personnelle 6 de responsabilités familiales. Un paradoxe riche : vous devez terminer quelque chose pour mieux commencer.

La Lune en Gémeaux ♊ active votre maison 10  -  votre image publique est sous les projecteurs. C'est un excellent moment pour finaliser une présentation, conclure un projet professionnel ou avoir une conversation importante avec un supérieur. Votre Mercure natal en Bélier, malgré la rétrograde en cours, vous donne une clarté mentale surprenante aujourd'hui.

En amour, votre Vénus natale en Poissons reçoit un trigone de Neptune  -  les connexions spirituelles sont puissantes. Si vous êtes en couple, partagez un moment de vulnérabilité avec votre partenaire. Célibataire ? Restez attentive aux signes : une rencontre pourrait avoir une dimension karmique.

Votre chemin de vie 3 vous rappelle d'utiliser votre créativité pour communiquer ce qui se termine. Écrivez, dessinez, exprimez. Le 9 vous demande de donner plutôt que de retenir.

Conseil karmique : votre Nœud Nord en Cancer maison 10 vous invite à apporter de la douceur dans le monde professionnel. Aujourd'hui, soyez celle qui nourrit plutôt que celle qui contrôle.`,
    doList: [
      { text: "Finaliser un projet en cours", why: "Le jour 9 est celui de l'achèvement  -  l'énergie cosmique favorise les conclusions, pas les débuts. Boucler un dossier aujourd'hui libère de l'espace pour le renouveau de demain." },
      { text: "Avoir une conversation importante", why: "La Lune en Gémeaux active votre maison 10 (image publique) et votre Mercure natal en Bélier vous donne une clarté directe malgré la rétrograde. Le timing est aligné pour dire ce qui compte." },
      { text: "Pratiquer le lâcher-prise", why: "Le 9 est le nombre de la fin de cycle. Retenir ce qui est terminé crée un blocage énergétique. Votre Nœud Nord en Cancer vous rappelle : nourrir, c'est aussi savoir laisser partir.", isPremium: true },
    ],
    dontList: [
      { text: "Commencer de nouveaux projets", why: "Le jour 9 ferme un cycle  -  lancer quelque chose maintenant manque de l'élan nécessaire. Attendez le jour 1 (dans 2 jours) pour planter de nouvelles graines." },
      { text: "Achats importants sous Mercure ℞", why: "Mercure rétrograde brouille les contrats et la communication. Les achats majeurs faits sous ☿℞ ont statistiquement plus de retours et de regrets. Patience jusqu'au 19 avril." },
      { text: "Forcer une décision collective", why: "Le carré Mercure ℞ / Mars natal crée des malentendus au travail. Pousser un consensus aujourd'hui risque de créer des tensions durables. Laissez décanter.", isPremium: true },
    ],
    transits: [
      { text: "Lune ♊ trigone Vénus natale ♓", effect: "émotions harmonieuses", interpretation: "Connexion fluide entre mental et cœur. Vos mots touchent juste aujourd'hui, surtout dans les échanges amoureux." },
      { text: "Mercure ℞ carré Mars natal ♒", effect: "tension communicative", interpretation: "Risque de paroles trop directes ou de malentendus techniques. Relisez avant d'envoyer.", isPremium: true },
      { text: "Jupiter transit sextile Soleil natal ♈", effect: "opportunité de croissance", interpretation: "Une porte s'ouvre dans le domaine professionnel. Jupiter amplifie votre confiance et attire la chance  -  soyez réceptive.", isPremium: true },
    ],
    luckyNumbers: [9, 3, 22],
    cosmicTip: "Écrivez une lettre de gratitude à quelqu'un que vous allez laisser partir  -  symboliquement ou littéralement. Le 9 + Vénus-Neptune transforme le lâcher-prise en acte d'amour.",
    affirmation: "Je libère avec grâce ce qui ne me sert plus, et j'accueille avec confiance ce qui vient.",
  },
  {
    date: "2026-04-07",
    moonSign: "Gémeaux",
    moonPhase: "Premier quartier 🌓",
    retrograde: "Mercure ☿℞",
    personalDay: 8,
    personalMonth: 1,
    personalYear: 6,
    energies: { amour: 6, travail: 8, sante: 7, spiritualite: 6, finances: 9 },
    message: `Jour personnel 8  -  le nombre du pouvoir, de l'ambition et de la manifestation matérielle. Dans votre année 6, cela parle de responsabilités financières liées à la famille ou au foyer. La Lune en Gémeaux continue d'illuminer votre maison 10 de la carrière.

C'est un jour idéal pour les négociations, les décisions financières et les questions d'autorité. Votre nombre d'expression 7 (Le Chercheur) vous donne un avantage : vous analysez avant d'agir. Utilisez cette qualité.

Mercure rétrograde invite à la prudence dans les communications écrites  -  relisez vos emails deux fois. Mais ne laissez pas cette rétrograde vous paralyser : votre Mars natal en Verseau vous pousse à l'innovation même dans la contrainte.`,
    doList: [
      { text: "Négociations financières", why: "Le 8 est le nombre du pouvoir matériel. Combiné à votre année 6, c'est le moment de poser des bases financières pour votre foyer." },
      { text: "Décisions de carrière", why: "La Lune en Gémeaux illumine votre maison 10  -  votre réputation professionnelle brille. Votre expression 7 vous donne un avantage analytique." },
    ],
    dontList: [
      { text: "Signer sans relire", why: "Mercure rétrograde rend les contrats piégeux. L'énergie du 8 pousse à aller vite  -  résistez à cette impulsion." },
      { text: "Ignorer les détails", why: "Le 8 demande de la rigueur. Votre ascendant Vierge renforce ce message : la réussite est dans les détails aujourd'hui." },
    ],
    transits: [
      { text: "Lune ♊ sextile Mars natal ♒", effect: "énergie mentale productive", interpretation: "Votre esprit est vif et innovant. Idéal pour résoudre des problèmes complexes." },
      { text: "Saturne transit conjoint Saturne natal", effect: "période de maturité", interpretation: "Retour de Saturne : un passage initiatique vers plus de responsabilité et d'authenticité.", isPremium: true },
    ],
  },
  {
    date: "2026-04-06",
    moonSign: "Taureau",
    moonPhase: "Premier quartier 🌓",
    retrograde: "Mercure ☿℞",
    personalDay: 7,
    personalMonth: 1,
    personalYear: 6,
    energies: { amour: 5, travail: 4, sante: 8, spiritualite: 10, finances: 5 },
    message: `Jour personnel 7  -  votre nombre d'expression ! C'est votre jour de connexion profonde avec vous-même. La Lune en Taureau ♉ dans votre maison 9 crée un besoin d'ancrage philosophique. Méditez, lisez, contemplez.

Le 7 est le nombre du chercheur, de l'introspection et de la quête spirituelle. C'est un jour où les réponses viennent de l'intérieur plutôt que de l'extérieur. Votre nombre intime 11 amplifie cette dimension mystique  -  vous pourriez avoir des intuitions particulièrement fortes.

Moins propice aux interactions sociales et aux décisions pratiques. Réservez-vous des moments de solitude. La nature serait un excellent allié aujourd'hui.`,
    doList: [
      { text: "Méditation et introspection", why: "Le 7 est VOTRE nombre d'expression  -  c'est votre fréquence naturelle. L'introspection est votre superpower aujourd'hui." },
      { text: "Lecture et étude", why: "Lune en Taureau maison 9 + jour 7 = absorption intellectuelle optimale. Votre esprit est une éponge." },
    ],
    dontList: [
      { text: "Événements sociaux intenses", why: "Le 7 a besoin de solitude pour fonctionner. Forcer la socialisation épuise votre batterie émotionnelle." },
      { text: "Décisions hâtives", why: "Le 7 analyse avant d'agir. Couplé à Vénus carré Pluton, les émotions sont intenses  -  ne décidez pas sous pression." },
    ],
    transits: [
      { text: "Lune ♉ trigone Neptune natal ♑", effect: "intuition renforcée", interpretation: "Votre antenne spirituelle est au maximum. Les rêves de cette nuit portent des messages." },
      { text: "Vénus transit carré Pluton natal ♏", effect: "intensité émotionnelle", interpretation: "Désirs profonds remontant à la surface. Ne fuyez pas  -  observez.", isPremium: true },
    ],
  },
  {
    date: "2026-04-05",
    moonSign: "Taureau",
    moonPhase: "Premier croissant 🌒",
    retrograde: "Mercure ☿℞",
    personalDay: 6,
    personalMonth: 1,
    personalYear: 6,
    energies: { amour: 9, travail: 6, sante: 7, spiritualite: 7, finances: 7 },
    message: `Double 6 aujourd'hui ! Jour personnel 6 dans une année personnelle 6. Le nombre de l'amour, de la famille, de la responsabilité et de la beauté. La Lune en Taureau active votre maison 9  -  élargissez votre vision de l'amour.

C'est un jour exceptionnel pour les questions de cœur. Si vous avez un conflit familial à résoudre, c'est LE moment. Votre Vénus natale en Poissons vous donne une compassion naturelle qui sera particulièrement efficace aujourd'hui.

Créativité au rendez-vous avec votre chemin de vie 3. Cuisinez quelque chose de beau, décorez votre espace, offrez un cadeau. Le 6 vibre avec l'harmonie esthétique.`,
    doList: [
      { text: "Résoudre un conflit familial", why: "Double 6 = double dose d'énergie d'amour et de responsabilité familiale. L'univers vous donne le pouvoir de guérir aujourd'hui." },
      { text: "Actes de beauté et d'amour", why: "Votre Vénus en Poissons + Lune Taureau = sensualité et esthétique au maximum. Créez du beau." },
    ],
    dontList: [
      { text: "Négliger les proches", why: "Le 6 punit l'indifférence émotionnelle. Ignorer un appel ou un message aujourd'hui aura des conséquences disproportionnées." },
      { text: "Être trop perfectionniste", why: "Le piège du 6 : vouloir que tout soit parfait. L'amour est dans l'imperfection  -  votre ascendant Vierge doit lâcher prise." },
    ],
    transits: [
      { text: "Lune ♉ conjonction Uranus natal ♑", effect: "surprise agréable en amour", interpretation: "Un événement inattendu bouleverse positivement votre vie sentimentale." },
      { text: "Soleil transit trigone Jupiter natal ♍", effect: "expansion bienveillante", interpretation: "Jour de chance douce. Ce que vous donnez vous revient amplifié.", isPremium: true },
    ],
  },
  {
    date: "2026-04-04",
    moonSign: "Bélier",
    moonPhase: "Premier croissant 🌒",
    retrograde: "Mercure ☿℞",
    personalDay: 5,
    personalMonth: 1,
    personalYear: 6,
    energies: { amour: 6, travail: 7, sante: 6, spiritualite: 5, finances: 5 },
    message: `Jour personnel 5  -  changement, liberté, mouvement ! Parfait pour briser la routine. La Lune en Bélier ♈ rejoint votre Soleil natal  -  une injection d'énergie pure. Vous vous sentez vivante et prête à agir.

Attention cependant avec Mercure rétrograde : le 5 vous pousse à bouger vite, mais ☿℞ vous demande de réfléchir. Trouvez l'équilibre : explorez de nouvelles idées mais ne signez rien d'important.

Votre nombre de personnalité 5 est en résonance aujourd'hui  -  vous dégagez une aura d'aventure et de magnétisme. Les rencontres sont favorisées, même si elles restent superficielles.`,
    doList: [
      { text: "Explorer de nouvelles idées", why: "Le 5 est le nombre du changement. La Lune conjointe à votre Soleil natal injecte de l'énergie pure  -  canalisez-la en exploration." },
      { text: "Sortir de la routine", why: "Votre personnalité 5 vibre en résonance  -  vous dégagez un magnétisme d'aventure. Les rencontres sont favorisées." },
    ],
    dontList: [
      { text: "Signer des contrats", why: "5 + Mercure ℞ = combo dangereux pour les engagements. Le 5 veut la liberté, ☿℞ brouille les termes. Double raison d'attendre." },
      { text: "Prendre des engagements définitifs", why: "L'énergie du 5 est volatile  -  ce qui semble parfait aujourd'hui peut sembler étouffant demain. Testez avant de vous engager." },
    ],
    transits: [
      { text: "Lune ♈ conjonction Soleil natal", effect: "regain d'énergie vitale", interpretation: "Votre batterie est rechargée à 100%. Énergie physique et mentale au top." },
      { text: "Mars transit sextile Jupiter natal ♍", effect: "action confiante", interpretation: "Le courage rencontre la chance. Initiative favorable, surtout en matière de santé ou de travail.", isPremium: true },
    ],
  },
  {
    date: "2026-04-03",
    moonSign: "Bélier",
    moonPhase: "Nouvelle Lune 🌑",
    retrograde: "Mercure ☿℞",
    personalDay: 4,
    personalMonth: 1,
    personalYear: 6,
    energies: { amour: 4, travail: 9, sante: 7, spiritualite: 6, finances: 8 },
    message: `Nouvelle Lune en Bélier  -  un moment de renouveau puissant dans votre maison 8. C'est le début d'un nouveau cycle de transformation. Posez vos intentions de renaissance.

Jour personnel 4 : travail, structure, fondations. Combinez l'énergie de la Nouvelle Lune (nouveaux départs) avec la discipline du 4. C'est le moment de planifier un projet important, d'organiser vos finances ou de créer un cadre solide pour les semaines à venir.

Votre Saturne natal en Verseau soutient cette énergie  -  vous avez la capacité de structurer l'innovation. Ne craignez pas la rigueur aujourd'hui.`,
    doList: [
      { text: "Poser des intentions pour le nouveau cycle", why: "Nouvelle Lune en Bélier dans votre maison 8  -  c'est un portail de renaissance. Vos intentions plantées maintenant germent pendant 6 mois." },
      { text: "Planifier et structurer", why: "Le jour 4 est le bâtisseur. Combiné à la Nouvelle Lune, vous posez les fondations de votre prochaine transformation." },
    ],
    dontList: [
      { text: "Improviser", why: "Le 4 déteste le chaos. Aujourd'hui, la structure EST la magie. Votre Saturne natal soutient cette discipline." },
      { text: "Ignorer les détails pratiques", why: "La Nouvelle Lune demande de la précision dans les intentions. Plus c'est spécifique, plus c'est puissant." },
    ],
    transits: [
      { text: "Nouvelle Lune en Bélier maison 8", effect: "renaissance", interpretation: "Portail de transformation majeur. Ce que vous décidez de changer MAINTENANT porte des fruits jusqu'en octobre." },
      { text: "Soleil-Lune trigone Saturne natal ♒", effect: "discipline inspirée", interpretation: "Rare alignement entre renouveau et structure. L'univers vous dit : rêvez grand, planifiez serré.", isPremium: true },
    ],
  },
  {
    date: "2026-04-02",
    moonSign: "Poissons",
    moonPhase: "Dernier croissant 🌘",
    retrograde: "Mercure ☿℞",
    personalDay: 3,
    personalMonth: 1,
    personalYear: 6,
    energies: { amour: 8, travail: 4, sante: 6, spiritualite: 8, finances: 4 },
    message: `Jour personnel 3  -  votre chemin de vie ! La créativité coule naturellement aujourd'hui. La Lune en Poissons ♓ rejoint votre Lune natale  -  émotions amplifiées, intuition décuplée, sensibilité artistique au maximum.

C'est un jour pour créer, exprimer, communiquer. Écrivez ce texte que vous reportez, appelez cet ami que vous n'avez pas vu, partagez votre vision. Le 3 est le nombre de la joie et de l'expression  -  ne retenez rien.

La Lune sur votre Lune natale peut aussi apporter une vague de nostalgie ou de mélancolie. Accueillez-la, elle nourrit votre art. Votre Chiron en Lion maison 12 vous rappelle que vos blessures sont votre plus grande source de créativité.`,
    doList: [
      { text: "Créer, écrire, dessiner", why: "Le jour 3 EST votre chemin de vie  -  c'est VOTRE jour. La créativité coule sans effort. Tout ce que vous créez porte votre signature vibratoire." },
      { text: "Contacter des proches", why: "La Lune sur votre Lune natale amplifie le besoin de connexion émotionnelle. Partagez votre art, vos pensées, votre amour." },
    ],
    dontList: [
      { text: "Rester isolée", why: "Le 3 est social et expressif. L'isolation coupe le flux créatif. Même un appel de 5 minutes suffit à réactiver l'énergie." },
      { text: "Ignorer vos émotions", why: "Lune conjointe Lune natale = vague émotionnelle puissante. Refouler maintenant crée un barrage qui explosera plus tard. Accueillez." },
    ],
    transits: [
      { text: "Lune ♓ conjonction Lune natale", effect: "retour émotionnel", interpretation: "Cycle lunaire personnel complet. Les émotions de ce mois se cristallisent  -  accueillez-les sans jugement." },
      { text: "Lune ♓ conjonction Vénus natale", effect: "moment d'amour pur", interpretation: "Rare alignement de tendresse. Ce que vous ressentez est authentique et profond. Exprimez-le.", isPremium: true },
    ],
  },
];

// Oracle conversations
export const oracleConversations = [
  {
    id: "conv1",
    title: "Mon timing de carrière",
    messages: [
      { role: "user" as const, content: "Est-ce le bon moment pour lancer mon entreprise créative ?" },
      { role: "assistant" as const, content: `Léa, votre question est particulièrement pertinente en ce moment. Regardons ce que les étoiles et les nombres nous disent.

**Votre année personnelle 6** met l'accent sur les responsabilités et la famille  -  ce n'est pas l'énergie la plus entrepreneuriale, mais elle est excellente pour construire quelque chose qui sert les autres avec amour.

**Votre chemin de vie 3 (Le Créatif)** + **expression 7 (Le Chercheur)** = vous êtes faite pour une entreprise qui mêle créativité et profondeur intellectuelle. C'est dans votre ADN vibratoire.

**Les transits actuels :** Jupiter en transit dans votre maison 1 cette année apporte une expansion personnelle. C'est un signal positif. MAIS Mercure rétrograde en ce moment  -  attendez la fin de la rétrograde (19 avril) pour signer quoi que ce soit de formel.

**Mon conseil :** Utilisez avril pour planifier et préparer. Votre mois personnel 1 (nouveau départ) est le signe que l'univers vous pousse vers le lancement. Le timing optimal serait fin avril/début mai, quand Mercure sera direct ET que vous serez dans votre mois personnel 2 (partenariats).

Les astres inclinent, mais ne déterminent pas. Votre intention et votre préparation sont les vrais moteurs. ✨` },
    ],
  },
  {
    id: "conv2",
    title: "Ma relation karmique",
    messages: [
      { role: "user" as const, content: "Ma relation avec Thomas semble très intense. Est-ce une connexion karmique ?" },
      { role: "assistant" as const, content: `L'intensité que vous décrivez est souvent le signe d'une connexion karmique. Regardons cela de plus près.

**Votre Nœud Nord en Cancer maison 10** indique que votre leçon karmique dans cette vie est d'apprendre à nourrir et protéger tout en accomplissant dans le monde. Si Thomas active cette partie de vous  -  s'il vous pousse à être plus vulnérable dans votre ambition  -  c'est un signe fort.

**Votre Vénus en Poissons** conjointe à votre Lune crée une signature amoureuse profondément empathique et presque fusionnelle. Vous absorbez les émotions de l'autre. C'est à la fois votre plus beau cadeau et votre plus grand défi.

**L'opposition Soleil-Pluton dans votre thème** indique des relations transformatrices. Vous attirez naturellement des connexions puissantes qui vous transforment  -  parfois douloureusement. C'est le travail de Pluton : mourir et renaître.

Pour confirmer la dimension karmique, j'aurais besoin de la date de naissance de Thomas pour analyser les aspects croisés (synastrie). Mais ce que vous décrivez  -  l'intensité, le sentiment de reconnaissance  -  correspond à une signature karmique.

Rappelez-vous : une connexion karmique n'est pas toujours destinée à durer éternellement. Parfois, elle vient pour vous apprendre une leçon spécifique. La question n'est pas "Est-ce karmique ?" mais "Qu'est-ce que cette relation m'apprend ?" 🌙` },
    ],
  },
  {
    id: "conv3",
    title: "Heures miroirs",
    messages: [
      { role: "user" as const, content: "Je vois 22:22 partout depuis une semaine. Qu'est-ce que ça signifie ?" },
      { role: "assistant" as const, content: `22:22 est l'une des heures miroirs les plus puissantes. Ce n'est pas un hasard que vous la voyiez maintenant.

**Le 22 est un Maître Nombre**  -  le Maître Bâtisseur. Il vibre à une fréquence élevée de manifestation concrète de grands projets. C'est l'architecte spirituel qui transforme les rêves en réalité.

**Pour vous, Léa, c'est particulièrement significatif :** votre nombre intime est 11 (un autre Maître Nombre), ce qui signifie que vous êtes naturellement réceptive aux messages des Maîtres Nombres. Quand le 22 apparaît, c'est comme si l'univers disait : "Tu as l'intuition (11), maintenant CONSTRUIS (22)."

**Dans votre contexte actuel :** vous êtes en année personnelle 6 et mois personnel 1. Le 22 vous invite à poser les fondations d'un projet qui sert les autres (6) et qui commence maintenant (1). C'est un signal d'alignement.

**Que faire :**
- Notez ce à quoi vous pensez exactement quand vous voyez 22:22
- Le 22 demande de l'action, pas juste de la contemplation
- Méditez sur ce que vous voulez construire de durable

Le message est clair : vous êtes soutenue pour concrétiser quelque chose de grand. Les fondations sont solides, faites confiance. ✨` },
    ],
  },
];

// Compatibility profiles
export const compatibilityProfiles = [
  {
    id: "compat1",
    name: "Thomas Dubois",
    type: "amour" as const,
    birthDate: new Date(1990, 7, 22),
    birthTime: "08:15",
    birthPlace: "Marseille, France",
    sunSign: { sign: "Lion", symbol: "♌" },
    moonSign: { sign: "Cancer", symbol: "♋" },
    lifePath: 5,
    scores: { global: 78, emotion: 85, communication: 72, passion: 88, valeurs: 65, karma: 82 },
    strengths: [
      "Sa Lune Cancer nourrit votre Nœud Nord Cancer  -  il active votre leçon karmique",
      "Vos Vénus (Poissons) et sa Lune (Cancer) : connexion émotionnelle d'eau profonde",
      "Son chemin de vie 5 + votre 3 = duo créatif et dynamique",
    ],
    frictions: [
      "Son Soleil Lion peut éclipser votre expression  -  besoin d'espace pour votre créativité",
      "Chemin de vie 5 (liberté) vs votre année 6 (responsabilité)  -  timing décalé",
      "Sa nature fixe (Lion) vs votre impulsivité (Bélier)  -  luttes de volonté possibles",
    ],
    karmicGuidance: "Cette relation porte une signature karmique forte  -  sa Lune Cancer conjointe à votre Nœud Nord indique que vous vous êtes déjà rencontrés. Il est ici pour vous apprendre à recevoir l'amour sans contrôler. La leçon est la vulnérabilité.",
  },
  {
    id: "compat2",
    name: "Claire Martin",
    type: "ami" as const,
    birthDate: new Date(1993, 0, 15),
    birthTime: null,
    birthPlace: "Paris, France",
    sunSign: { sign: "Capricorne", symbol: "♑" },
    moonSign: { sign: "Gémeaux", symbol: "♊" },
    lifePath: 7,
    scores: { global: 85, emotion: 72, communication: 90, passion: 68, valeurs: 88, karma: 92 },
    strengths: [
      "Double 7 en présence (son chemin + votre expression)  -  connexion intellectuelle profonde",
      "Son Capricorne stabilise votre Bélier  -  amitié ancrée",
      "Sa Lune Gémeaux stimule votre maison 10  -  elle vous pousse professionnellement",
    ],
    frictions: [
      "Deux chercheurs (7+7) peuvent s'enfermer dans l'analyse  -  pensez à agir ensemble",
      "Son pragmatisme Capricorne peut freiner votre enthousiasme Bélier",
    ],
    karmicGuidance: "Une amitié de vies passées. Le lien 7-7 indique un compagnonnage d'apprentissage  -  vous avez probablement été des étudiants ou des chercheurs ensemble. Cette fois, la leçon est de partager vos découvertes avec le monde, pas seulement entre vous.",
  },
];

// Calendar data for April 2026
export function generateAprilCalendar() {
  const days = [];
  for (let d = 1; d <= 30; d++) {
    const date = new Date(2026, 3, d);
    const pDay = (6 + 4 + d) % 9 || 9; // Simplified personal day for demo
    days.push({
      day: d,
      date: date.toISOString().split('T')[0],
      personalDay: pDay,
      dayOfWeek: date.getDay(),
    });
  }
  return days;
}
