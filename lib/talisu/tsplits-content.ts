/**
 * TSPLITS™ – from Vision to Implementation (Arun's "TSPLITS-Presentation",
 * 4 pages, Oct 2026). Same order and structure as the PDF so the page reads
 * as a sales pitch. Print artefacts (header line, page footers) are dropped.
 *
 * Inline markup (rendered by components/talisu/TsplitsRichText.tsx):
 *   **bold**   _italic_   {{phrase}} → reader prompt, rendered "(phrase)" in
 *   styled italics (the PDF's rhetorical "[ fill in the blank ]").
 *
 * Talispros is CAD-only: every price is shown in CAD.
 */

export type TsplitsListItem = {
  text: string;
  /** Lettered (a, b, c…) sub-list. */
  sub?: string[];
};

export type TsplitsSection = {
  id: string;
  /** Section number as shown ("1"…"10"); omitted for unnumbered sections. */
  number?: string;
  heading: string;
  /** Paragraphs before the list. */
  before?: string[];
  list?: TsplitsListItem[];
  /** Bulleted list instead of numbered. */
  bullets?: boolean;
  /** Paragraphs after the list. */
  after?: string[];
  /** Highlighted closing statement. */
  callout?: string;
};

export type TsplitsStructureRow = {
  id: string;
  name: string;
  abbr?: string;
  plain: string;
  fits: string[];
};

export type TsplitsContent = {
  title: string;
  standsFor: string;
  whyTalisman: string;
  whySplits: string;
  approach: { heading: string; body: string };
  quote: { lead: string; name: string; body: string };
  structures: {
    heading: string;
    columns: { structure: string; plain: string; fits: string };
    rows: TsplitsStructureRow[];
    footnote: string;
  };
  sections: TsplitsSection[];
  cta: { heading: string; button: string; body: string; signoff: string };
};

export const TSPLITS_PATH = "/talisu/tsplits";

export const TSPLITS_EN: TsplitsContent = {
  title: "TSPLITS™ – from Vision to Implementation",
  standsFor:
    "TSPLITS™ stands for **T**alisman **S**imple **P**roject **L**ead & **I**nput **T**racking **S**ystem",
  whyTalisman: "Why **Talisman**? We strive to be your good luck charms.",
  whySplits: "Why **SPLITS**? Because we share.",
  approach: {
    heading: "The Approach",
    body: "Most development plans don’t fail because the idea is wrong. They stall because projects are shaped wrong for people, who are most likely to help bring them about. Our “Talismen” help you match your vision to the transaction structure that fits it best, then put it in front of the greatest number of people most likely to support your objectives.",
  },
  quote: {
    lead: "In my own words:",
    name: "Webster M., Chief Projects Analyst",
    body: "“I spend my days working with people who have a vision, but are unsure of how to transition it from idea to project or opportunity. I love such challenges. While I cannot say I am successful 100% of the time, I charge no fees, nor do I require long term commitments. You have nothing to lose giving me a try.”",
  },
  structures: {
    heading: "Four ways to structure for success*",
    columns: { structure: "Structure", plain: "In plain words", fits: "When it fits" },
    rows: [
      {
        id: "conventional",
        name: "Conventional",
        plain:
          "Basically, payment in full, cash or financing. Title and usage rights change hands at closing.",
        fits: ["For buyers ready to commit to objects, projects and opportunities."],
      },
      {
        id: "lease-to-own",
        name: "Lease-to-Own",
        abbr: "(LTO)",
        plain:
          "Buyers put money down and pay the balance in instalments. Requires lease-to-own agreements drawn up by lawyers to define usage rights prior to title changing hands when the last instalment was paid.",
        fits: [
          "Best for buyers, who would rather not go through banks.",
          "Best for sellers, who would rather disguise their selling price.",
        ],
      },
      {
        id: "fractionalization",
        name: "Fractionalization",
        plain:
          "A single entity divided into clearly defined legal units, each with its own usage rights and share of the upside.",
        fits: ["Best for investors, whose primary goal is not 100% ownership (i.e.: condos)."],
      },
      {
        id: "tokenization",
        name: "Tokenization",
        plain:
          "An ownership interest, whole or fractional, recorded as a transferable digital asset.",
        fits: ["Best for raising a lot of capital while keeping stakes clear and auditable."],
      },
    ],
    footnote: "* Success NOT guaranteed, just made more likely on a case by case basis.",
  },
  sections: [
    {
      id: "how-we-work",
      number: "1",
      heading: "How we work together",
      list: [
        {
          text: "**You share your vision:** tell us about the opportunities you see for each qualifying listing, and what you or your clients might like to achieve there (a ‘back of a napkin’ rough outline is fine).",
        },
        {
          text: "**We suggest the best structure** for your goal, and then scale it for the long term by applying conventional, lease-to-own, fractionalized or tokenized transaction options. There is no obligation, ever.",
        },
        {
          text: "**You go to market and decide** whether working with us is right for you. If it is, you register a TSPLITS™ account and a PIN (Point Of Interest Node). The account and your PIN(s) are not free, but our service is.",
        },
        {
          text: "**You deliver** for your clients above and beyond. Who among your competitors can point towards this level of competence, choice and service…?",
        },
      ],
    },
    {
      id: "levels",
      number: "2",
      heading: "Levels of Participation",
      before: [
        "**There are 45 markets in the USA and Canada**, each supporting five levels of participation:",
      ],
      list: [
        { text: "Market Partners: a corporate equivalent, top of the TSPLITS™ pyramid, but localized." },
        {
          text: "Root Account Partners: typically brokers or team leaders – local Root Mapsites are assigned to them.",
        },
        {
          text: "Derivative Account Partners: real estate professionals – they populate local Root Mapsites.",
        },
        {
          text: "For Sale By Owner Sellers (FSBO): they wish to advertise anonymously, thus remain market adjacent.",
        },
        {
          text: "Adpro Account Partners: typically referral partners or co-promoters building their own industry adjacent platforms for exposure or profit.",
        },
      ],
      after: [
        "Market Partners benefit from Root Account business activities based upon SPLITS, as do Root Account Partners, who benefit from Derivative Account business activities based upon SPLITS.",
        "Derivative, FSBO and Adpro Account Partners realize substantial advertising savings, exercising greater control over their external messaging and by gaining the ability to make their marketing initiatives revenue producing.",
      ],
    },
    {
      id: "market-partners",
      number: "3",
      heading: "Market Partners – what you get and why it matters",
      before: [
        "**You are assigned one semi-exclusive TSPLITS™ market. Semi-exclusive means there is no direct competition, but neighbouring markets may place PINs – Point Of Interest Nodes – that represent objects, projects or opportunities they legally have under contract from time to time.**",
      ],
      list: [
        {
          text: "_Feature:_ you build your own semi-exclusive market and work it under SPLITS30 terms.",
        },
        {
          text: "_Benefit:_ we provide the technology, including shopping carts, administration, Mapsites and eBook generators and – optionally, once you have reached a certain size – in-house online TV.",
        },
      ],
    },
    {
      id: "root-account-partners",
      number: "4",
      heading: "Root Account Partners – what you get and why it matters",
      before: ["**You operate your own Mapsite within a TSPLITS™ market.**"],
      list: [
        {
          text: "_Feature:_ Mapsites are map-based websites maintained by Derivative Account Partners and licensed by you under SPLITS30 terms. Your Mapsites show all PINs placed and you charge for monthly access and per PIN.",
        },
        {
          text: "_Benefit:_ SPLITS30 terms mean you charge for annual and monthly registration, plus weekly for PIN placement to ensure that listings get removed quickly when no longer active.",
        },
      ],
    },
    {
      id: "derivative-account-partners",
      number: "5",
      heading: "Derivative Account Partners – what you get and why it matters",
      before: [
        "**Each Derivative Account Partner may place and promote up to 100 PINs on the Root Account Mapsites to which they are licensed.**",
      ],
      list: [
        {
          text: "_Feature:_ Mapsite PINs are infinitely less expensive than outside advertising, yet they can become online destinations. Functionally, PINs open in flags with links to two URL redirections, a dedicated eBook and a link to an in-house online TalisTV™ channel. PINs apply upwards pressure on typical real estate reward structures.",
        },
        {
          text: "_Benefit #1:_ TSPLITS™ syndication distributes PINs to an ever increasing directory of classifieds sites that can contribute actionable buyer and seller leads NOT originating from industry platforms.",
        },
        {
          text: "_Benefit #2:_ TSPLITS™ syndication can make non-licensed administrative positions revenue producing by “selling” PIN placement to referral partners and/or co-promoters as part of their weekly tasks.",
        },
        {
          text: "_Benefit #3:_ TSPLITS™ syndication can apply upwards pressure on reward metrics over time by establishing service floors: “_…stay above an arbitrary value for fees and term to be in. Stay below it and miss out…_”.",
        },
      ],
      callout:
        "We project that point 5.4 alone will pay for your TSPLITS™ account many times over, annually, and that the ancillary benefits derived from it will move you up-market, generating word-of-mouth at rates not previously experienced in your real estate business. We think we will be a valued process partner going forward.",
    },
    {
      id: "ancillary-benefits",
      heading: "Ancillary Benefits",
      before: [
        "Many of the best real estate listings – Multifamily Housing, including Hotels, Motels, Campgrounds and Lodges, Retail Centres, Office Properties, Mixed-Use Developments – are not given freely. They must be earned in ways that do not relate to what the industry provides. Some buyers and sellers want to be visible, others want to avoid identification at all costs. How do you do that given standard industry platforms and content rules?",
        "Enter Mapsites. Root Account Partners get one Mapsite with their account, and Derivative Account Partners publish to that account. However, both Root and Derivative Account Partners have the ability to add FSBO and Adpro Mapsites, either represented by a PIN on the Root Account Mapsite, or not. And, FSBO and Adpro Mapsites have complete flexibility whether or not real estate fees become due upon success. Mapsites exist industry adjacent, meaning they can be completely responsive to buyer and seller needs. Hence…",
      ],
    },
    {
      id: "private-adpro-account-partners",
      number: "6",
      heading: "Private and Adpro Account Partners – what you get and why it matters",
      before: ["**Single PINs on dedicated Mapsites.**"],
      list: [
        {
          text: "_Feature:_ a dedicated Mapsite that can be as revealing, or concealing, as you choose it to be.",
        },
        {
          text: "_Benefit:_ the ability to become the centre of your own opportunity – no distractions or sidetracks.",
        },
      ],
    },
    {
      id: "adoption-process",
      number: "7",
      heading: "A typical TSPLITS™ Adoption Process for Real Estate",
      before: ["**Core Business Analysis Approach.**"],
      list: [
        {
          text: "A Broker or Team Leader looks at all of their listings. There is at least one that might benefit from project or development value added.",
        },
        {
          text: "Is it worth it to incur the expense of a TSPLITS™ account: brokerage annual **$1,000 CAD**; agent annual **$200 CAD**; brokerage and agent monthly **$100 CAD**; Listing PIN **$7 CAD weekly** (a dollar per day).",
        },
        {
          text: "How many agents are there in the brokerage? How many will participate? Do you want all to participate, or would you prefer to establish a merit system, where only the top “X” participate?",
        },
        { text: "How many PINs would they each place, on average?" },
        {
          text: "Can expenses be mitigated by…",
          sub: [
            "Listings won? – Probably; no competitor has an industry adjacent Mapsite to reach more prospects.",
            "Transactions closed? – Probably; more immersive presentations often lead to better sales, quicker.",
            "Higher fees and/or longer terms? – Of course; service floors basically guarantee that.",
            "Increased renewal rates? – Of course; no competitor can also market industry adjacent.",
          ],
        },
      ],
      callout:
        "Service floor calculations: how many agents are there in the brokerage, and how much is each willing to budget for an in-house online advertising tool? Will it cover the brokerage and team expense under SPLITS30, or will custom pricing be necessary? Is it realistic?",
    },
    {
      id: "value-added",
      number: "8",
      heading: "Value Added",
      before: ["**Differentiation Tools**"],
      list: [
        {
          text: "**Talis eBook (TEB):** turn PDFs, such as brochures, surveys or feature sheets, into page-turning eBooks on your own online bookshelf. Prospects can explore the whole story in one sitting, and share it.",
        },
        {
          text: "**Talis Television (TTV – an optional extra):** we act as your production team, turning your photos, audio and video footage into virtual open houses, virtual walk-throughs and infomercials, with or without hosts and/or co-hosts. This puts the brokerage’s or team’s external communication on another level: you can literally schedule for when your local audience pays attention and expand your programming to beyond just real estate – has there ever been a better relationship marketing tool under brokerage or team control?",
        },
        {
          text: "**Mapsites make geographic, demographic and psychographic boundaries meaningless:**",
          sub: [
            "_Geographic:_ you are licensed wherever you are licensed, but you vacation in {{your favourite destination}}, or you plan to move to {{your next hometown}} soon. You already know your way around there, and you have a surrogate with whom to work. So – why not do TSPLITS™ deals there and advertise them here?",
            "_Demographic:_ you live wherever you live, and your office is located wherever it is located. However, you know about the {{your specialty}} industry and that market is somewhere else where you are licensed. So – why not place your home PIN in that area and become more visible to that level of clientele?",
            "_Psychographic:_ you succeed at real estate, but it does not define you. In your heart you are {{a golfer, a sailor, an artist…}}, and you have most fun working with prospects that also are {{golfers, sailors, artists…}}. So – why not drop your home PIN in that area and become more visible to that level of clientele?",
          ],
        },
        {
          text: "**TalisBOT™:** our TalisBOT™ assistant answers common questions, and its “Share a Project Vision” form lets you describe your object, project or opportunity without first registering. It allows you to start “the conversation” at no cost to you.",
        },
        {
          text: "**Fulfilment team:** once a plan takes shape, Webster and his team work out the practical side: which structure, what it takes to deliver, such as supply options, including supply side access to modular structures and financing – you can actively contribute to your client’s good idea.",
        },
      ],
    },
    {
      id: "faq",
      number: "9",
      heading: "Frequently Asked Questions",
      list: [
        {
          text: "**Do Mapsites replace MLS®, or traditional listing sites?** No. They can work alongside them to reach people otherwise often missed.",
        },
        {
          text: "**Is TSPLITS™ a real estate brokerage?** No. It is a marketing and project development entity. Your transactions are handled by professionals you choose.",
        },
        { text: "**Do you take a cut of the sale?** No. We charge no referral fees." },
        {
          text: "**Is there a long-term commitment?** No. Let your account lapse and the service stops – no further obligation.",
        },
        {
          text: "**Can you promise a sale?** No. Nobody honestly can. What we promise is a professional, lasting presence and a team that helps you shape a deal to which people can agree.",
        },
      ],
    },
    {
      id: "legend",
      number: "10",
      heading: "Legend",
      bullets: true,
      list: [
        { text: "**Mapsite:** a map-based marketing site." },
        { text: "**PIN:** a marker on a map that opens links when clicked." },
        { text: "**TEB:** Talis eBook, a page-turning eBook made from your PDF." },
        {
          text: "**TVA:** a listing analysis, review of which deal structure and investor class suits a property (if any).",
        },
        {
          text: "**TTV:** TalisTV™, video production and online broadcasting (this is an optional extra that will be made available in late 2026 or early 2027).",
        },
        {
          text: "**MLS®:** Multiple Listing Service, the trademarks MLS® and Multiple Listing Service® are owned by The Canadian Real Estate Association (CREA) and identify the quality of services provided by real estate professionals who are members of CREA.",
        },
      ],
    },
  ],
  cta: {
    heading: "Got a Listing that merits a plan? Let’s talk.",
    button: "Share a Project Vision",
    body: "Choose “Share a Project Vision” – no registration needed. An analyst will get back to you.",
    signoff: "Webster M. · Projects Analyst",
  },
};

export const TSPLITS_DE: TsplitsContent = {
  title: "TSPLITS™ – von der Vision zur Umsetzung",
  standsFor:
    "TSPLITS™ steht für **T**alisman **S**imple **P**roject **L**ead & **I**nput **T**racking **S**ystem – ein einfaches System, das Projekt-Leads und Eingaben erfasst und verfolgt",
  whyTalisman: "Warum **Talisman**? Wir möchten Ihr Glücksbringer sein.",
  whySplits: "Warum **SPLITS**? Weil wir teilen.",
  approach: {
    heading: "Der Ansatz",
    body: "Die meisten Entwicklungspläne scheitern nicht an einer falschen Idee. Sie geraten ins Stocken, weil Projekte nicht passend für die Menschen gestaltet sind, die am ehesten helfen würden, sie zu verwirklichen. Unsere „Talismen“ helfen Ihnen, Ihre Vision mit der Transaktionsstruktur zusammenzubringen, die am besten zu ihr passt, und sie dann möglichst vielen Menschen vorzustellen, die Ihre Ziele am ehesten unterstützen.",
  },
  quote: {
    lead: "In meinen eigenen Worten:",
    name: "Webster M., leitender Projektanalyst",
    body: "„Ich arbeite jeden Tag mit Menschen, die eine Vision haben, aber nicht sicher sind, wie sie aus der Idee ein Projekt oder eine Chance machen. Solche Herausforderungen liebe ich. Ich kann nicht behaupten, dass ich in 100 % der Fälle erfolgreich bin, aber ich verlange keine Gebühren und keine langfristigen Verpflichtungen. Sie haben nichts zu verlieren, wenn Sie es mit mir versuchen.“",
  },
  structures: {
    heading: "Vier Wege zu einer erfolgreichen Struktur*",
    columns: { structure: "Struktur", plain: "Einfach erklärt", fits: "Wann sie passt" },
    rows: [
      {
        id: "conventional",
        name: "Konventionell",
        plain:
          "Im Grunde Zahlung in voller Höhe, bar oder finanziert. Eigentum und Nutzungsrechte gehen beim Abschluss über.",
        fits: ["Für Käufer, die bereit sind, sich auf Objekte, Projekte und Chancen festzulegen."],
      },
      {
        id: "lease-to-own",
        name: "Mietkauf",
        abbr: "(LTO)",
        plain:
          "Käufer leisten eine Anzahlung und zahlen den Rest in Raten. Dafür braucht es von Anwälten aufgesetzte Mietkaufverträge, die die Nutzungsrechte regeln, bis das Eigentum mit der letzten Rate übergeht.",
        fits: [
          "Ideal für Käufer, die lieber nicht über Banken gehen.",
          "Ideal für Verkäufer, die ihren Verkaufspreis lieber nicht offenlegen.",
        ],
      },
      {
        id: "fractionalization",
        name: "Fraktionalisierung",
        plain:
          "Eine einzelne Einheit, aufgeteilt in klar definierte rechtliche Anteile, jeder mit eigenen Nutzungsrechten und eigenem Anteil am Wertzuwachs.",
        fits: [
          "Ideal für Investoren, deren vorrangiges Ziel nicht 100 % Eigentum ist (z. B. Eigentumswohnungen).",
        ],
      },
      {
        id: "tokenization",
        name: "Tokenisierung",
        plain:
          "Ein Eigentumsanteil, ganz oder anteilig, erfasst als übertragbarer digitaler Vermögenswert.",
        fits: ["Ideal, um viel Kapital zu beschaffen und die Anteile dennoch klar und prüfbar zu halten."],
      },
    ],
    footnote: "* Erfolg wird NICHT garantiert, sondern im Einzelfall nur wahrscheinlicher gemacht.",
  },
  sections: [
    {
      id: "how-we-work",
      number: "1",
      heading: "So arbeiten wir zusammen",
      list: [
        {
          text: "**Sie teilen Ihre Vision:** Erzählen Sie uns, welche Chancen Sie bei jedem geeigneten Listing sehen und was Sie oder Ihre Kunden dort erreichen möchten (eine grobe Skizze „auf der Serviette“ genügt).",
        },
        {
          text: "**Wir schlagen die beste Struktur** für Ihr Ziel vor und skalieren sie dann langfristig mit konventionellen, Mietkauf-, fraktionalisierten oder tokenisierten Transaktionsoptionen. Eine Verpflichtung gibt es nie.",
        },
        {
          text: "**Sie gehen an den Markt und entscheiden,** ob die Zusammenarbeit mit uns das Richtige für Sie ist. Wenn ja, registrieren Sie ein TSPLITS™-Konto und einen PIN (Point Of Interest Node). Das Konto und Ihre PINs sind nicht kostenlos, unser Service aber schon.",
        },
        {
          text: "**Sie liefern** für Ihre Kunden weit mehr als erwartet. Wer unter Ihren Mitbewerbern kann auf dieses Maß an Kompetenz, Auswahl und Service verweisen …?",
        },
      ],
    },
    {
      id: "levels",
      number: "2",
      heading: "Stufen der Teilnahme",
      before: [
        "**Es gibt 45 Märkte in den USA und Kanada**, jeder mit fünf Stufen der Teilnahme:",
      ],
      list: [
        {
          text: "Market Partners: das Pendant zu einer Unternehmenszentrale, an der Spitze der TSPLITS™-Pyramide, aber lokal verankert.",
        },
        {
          text: "Root Account Partners: in der Regel Makler oder Teamleiter – ihnen werden die lokalen Root Mapsites zugewiesen.",
        },
        {
          text: "Derivative Account Partners: Immobilienprofis – sie füllen die lokalen Root Mapsites mit Inhalten.",
        },
        {
          text: "Privatverkäufer (FSBO, For Sale By Owner): Sie möchten anonym werben und bleiben daher marktnah.",
        },
        {
          text: "Adpro Account Partners: in der Regel Empfehlungspartner oder Co-Promoter, die eigene branchennahe Plattformen für Sichtbarkeit oder Gewinn aufbauen.",
        },
      ],
      after: [
        "Market Partners profitieren auf Basis von SPLITS von den Geschäftsaktivitäten der Root Accounts – ebenso wie Root Account Partners auf Basis von SPLITS von den Geschäftsaktivitäten der Derivative Accounts profitieren.",
        "Derivative, FSBO und Adpro Account Partners sparen erheblich bei der Werbung, behalten mehr Kontrolle über ihre externe Kommunikation und können ihre Marketinginitiativen umsatzwirksam machen.",
      ],
    },
    {
      id: "market-partners",
      number: "3",
      heading: "Market Partners – was Sie bekommen und warum es zählt",
      before: [
        "**Ihnen wird ein halbexklusiver TSPLITS™-Markt zugewiesen. Halbexklusiv bedeutet: kein direkter Wettbewerb, doch benachbarte Märkte dürfen PINs – Point Of Interest Nodes – platzieren, die Objekte, Projekte oder Chancen darstellen, die sie jeweils rechtmäßig unter Vertrag haben.**",
      ],
      list: [
        {
          text: "_Merkmal:_ Sie bauen Ihren eigenen halbexklusiven Markt auf und bearbeiten ihn zu SPLITS30-Konditionen.",
        },
        {
          text: "_Nutzen:_ Wir stellen die Technik bereit, darunter Warenkörbe, Verwaltung, Mapsites und eBook-Generatoren und – optional, sobald Sie eine gewisse Größe erreicht haben – hauseigenes Online-TV.",
        },
      ],
    },
    {
      id: "root-account-partners",
      number: "4",
      heading: "Root Account Partners – was Sie bekommen und warum es zählt",
      before: ["**Sie betreiben Ihre eigene Mapsite innerhalb eines TSPLITS™-Marktes.**"],
      list: [
        {
          text: "_Merkmal:_ Mapsites sind kartenbasierte Websites, die von Derivative Account Partners gepflegt und von Ihnen zu SPLITS30-Konditionen lizenziert werden. Ihre Mapsites zeigen alle platzierten PINs, und Sie berechnen den monatlichen Zugang sowie jeden einzelnen PIN.",
        },
        {
          text: "_Nutzen:_ SPLITS30-Konditionen bedeuten, dass Sie jährliche und monatliche Registrierungsgebühren sowie wöchentliche Gebühren für die PIN-Platzierung berechnen – so werden Listings schnell entfernt, sobald sie nicht mehr aktiv sind.",
        },
      ],
    },
    {
      id: "derivative-account-partners",
      number: "5",
      heading: "Derivative Account Partners – was Sie bekommen und warum es zählt",
      before: [
        "**Jeder Derivative Account Partner darf bis zu 100 PINs auf den Root-Account-Mapsites platzieren und bewerben, für die er lizenziert ist.**",
      ],
      list: [
        {
          text: "_Merkmal:_ Mapsite-PINs sind unvergleichlich günstiger als externe Werbung und können dennoch zu echten Online-Zielen werden. Funktional öffnen sich PINs als Fähnchen mit Links zu zwei URL-Weiterleitungen, einem eigenen eBook und einem hauseigenen TalisTV™-Onlinekanal. PINs erzeugen Aufwärtsdruck auf die üblichen Vergütungsstrukturen im Immobiliengeschäft.",
        },
        {
          text: "_Nutzen Nr. 1:_ Die TSPLITS™-Syndizierung verteilt PINs an ein stetig wachsendes Verzeichnis von Kleinanzeigenportalen, die verwertbare Käufer- und Verkäufer-Leads liefern können, die NICHT von Branchenplattformen stammen.",
        },
        {
          text: "_Nutzen Nr. 2:_ Die TSPLITS™-Syndizierung kann nicht lizenzierte Verwaltungsstellen umsatzwirksam machen, indem diese im Rahmen ihrer wöchentlichen Aufgaben PIN-Platzierungen an Empfehlungspartner und/oder Co-Promoter „verkaufen“.",
        },
        {
          text: "_Nutzen Nr. 3:_ Die TSPLITS™-Syndizierung kann mit der Zeit Aufwärtsdruck auf die Vergütungskennzahlen erzeugen, indem sie Service-Untergrenzen festlegt: „_… bleiben Sie über einem festgelegten Wert für Gebühren und Laufzeit, um dabei zu sein. Bleiben Sie darunter, gehen Sie leer aus …_“.",
        },
      ],
      callout:
        "Wir gehen davon aus, dass sich Ihr TSPLITS™-Konto allein durch Punkt 5.4 jedes Jahr um ein Vielfaches bezahlt macht und dass der daraus entstehende Zusatznutzen Sie in ein höheres Marktsegment bringt – mit einer Mundpropaganda, wie Sie sie in Ihrem Immobiliengeschäft noch nicht erlebt haben. Wir sind überzeugt, dass wir künftig ein geschätzter Prozesspartner sein werden.",
    },
    {
      id: "ancillary-benefits",
      heading: "Zusatznutzen",
      before: [
        "Viele der besten Immobilien-Listings – Mehrfamilienhäuser einschließlich Hotels, Motels, Campingplätzen und Lodges, Einkaufszentren, Büroimmobilien, gemischt genutzte Projekte – werden nicht einfach vergeben. Man muss sie sich auf eine Weise verdienen, die mit dem Angebot der Branche nichts zu tun hat. Manche Käufer und Verkäufer wollen sichtbar sein, andere wollen um jeden Preis unerkannt bleiben. Wie gelingt das mit den üblichen Branchenplattformen und ihren Inhaltsregeln?",
        "Hier kommen Mapsites ins Spiel. Root Account Partners erhalten mit ihrem Konto eine Mapsite, und Derivative Account Partners veröffentlichen in diesem Konto. Sowohl Root als auch Derivative Account Partners können jedoch FSBO- und Adpro-Mapsites hinzufügen – mit oder ohne PIN auf der Root-Account-Mapsite. Und FSBO- und Adpro-Mapsites sind völlig frei darin, ob im Erfolgsfall Maklergebühren anfallen oder nicht. Mapsites existieren branchennah und können daher voll und ganz auf die Bedürfnisse von Käufern und Verkäufern eingehen. Deshalb …",
      ],
    },
    {
      id: "private-adpro-account-partners",
      number: "6",
      heading: "Private und Adpro Account Partners – was Sie bekommen und warum es zählt",
      before: ["**Einzelne PINs auf eigenen Mapsites.**"],
      list: [
        {
          text: "_Merkmal:_ eine eigene Mapsite, die so viel preisgibt oder verbirgt, wie Sie möchten.",
        },
        {
          text: "_Nutzen:_ die Möglichkeit, zum Mittelpunkt Ihrer eigenen Chance zu werden – ohne Ablenkungen oder Umwege.",
        },
      ],
    },
    {
      id: "adoption-process",
      number: "7",
      heading: "Ein typischer TSPLITS™-Einführungsprozess für Immobilien",
      before: ["**Ansatz der Kerngeschäftsanalyse.**"],
      list: [
        {
          text: "Ein Makler oder Teamleiter sieht sich alle seine Listings an. Mindestens eines davon könnte von einem Mehrwert durch Projekt- oder Entwicklungsarbeit profitieren.",
        },
        {
          text: "Lohnen sich die Kosten eines TSPLITS™-Kontos: Maklerbüro jährlich **1.000 CAD**; Agent jährlich **200 CAD**; Maklerbüro und Agent monatlich **100 CAD**; Listing-PIN **7 CAD pro Woche** (ein Dollar pro Tag).",
        },
        {
          text: "Wie viele Agenten hat das Maklerbüro? Wie viele werden mitmachen? Sollen alle teilnehmen, oder möchten Sie lieber ein Leistungssystem einführen, bei dem nur die besten „X“ teilnehmen?",
        },
        { text: "Wie viele PINs würde jeder im Durchschnitt platzieren?" },
        {
          text: "Lassen sich die Kosten ausgleichen durch …",
          sub: [
            "Gewonnene Listings? – Wahrscheinlich; kein Mitbewerber hat eine branchennahe Mapsite, um mehr Interessenten zu erreichen.",
            "Abgeschlossene Transaktionen? – Wahrscheinlich; eindrucksvollere Präsentationen führen oft zu besseren und schnelleren Verkäufen.",
            "Höhere Gebühren und/oder längere Laufzeiten? – Natürlich; Service-Untergrenzen garantieren das im Grunde.",
            "Höhere Verlängerungsquoten? – Natürlich; kein Mitbewerber kann zusätzlich branchennah vermarkten.",
          ],
        },
      ],
      callout:
        "Berechnung der Service-Untergrenzen: Wie viele Agenten hat das Maklerbüro, und wie viel ist jeder bereit, für ein hauseigenes Online-Werbetool einzuplanen? Deckt das die Kosten von Maklerbüro und Team unter SPLITS30, oder ist eine individuelle Preisgestaltung nötig? Ist das realistisch?",
    },
    {
      id: "value-added",
      number: "8",
      heading: "Mehrwert",
      before: ["**Werkzeuge zur Differenzierung**"],
      list: [
        {
          text: "**Talis eBook (TEB):** Verwandeln Sie PDFs wie Broschüren, Gutachten oder Exposés in blätterbare eBooks in Ihrem eigenen Online-Bücherregal. Interessenten können die ganze Geschichte in einem Zug erkunden und sie teilen.",
        },
        {
          text: "**Talis Television (TTV – ein optionales Extra):** Wir sind Ihr Produktionsteam und machen aus Ihren Fotos, Audio- und Videoaufnahmen virtuelle Besichtigungen, virtuelle Rundgänge und Infomercials, mit oder ohne Moderatoren und/oder Co-Moderatoren. Das hebt die externe Kommunikation des Maklerbüros oder Teams auf eine neue Ebene: Sie können Ihr Programm buchstäblich auf die Zeiten legen, in denen Ihr lokales Publikum zuschaut, und es über Immobilien hinaus erweitern – gab es je ein besseres Werkzeug für Beziehungsmarketing unter der Kontrolle des Maklerbüros oder Teams?",
        },
        {
          text: "**Mapsites machen geografische, demografische und psychografische Grenzen bedeutungslos:**",
          sub: [
            "_Geografisch:_ Sie sind dort lizenziert, wo Sie lizenziert sind, aber Sie machen Urlaub in {{Ihr Lieblingsreiseziel}} oder wollen bald nach {{Ihr künftiger Wohnort}} ziehen. Sie kennen sich dort bereits aus und haben vor Ort einen Vertreter, mit dem Sie zusammenarbeiten können. Warum also nicht dort TSPLITS™-Deals abschließen und sie hier bewerben?",
            "_Demografisch:_ Sie wohnen, wo Sie wohnen, und Ihr Büro liegt, wo es liegt. Sie kennen sich jedoch in der Branche {{Ihr Spezialgebiet}} aus, und dieser Markt liegt woanders, wo Sie ebenfalls lizenziert sind. Warum also nicht Ihren Heimat-PIN in dieser Gegend platzieren und für diese Klientel sichtbarer werden?",
            "_Psychografisch:_ Sie sind im Immobiliengeschäft erfolgreich, aber es definiert Sie nicht. Im Herzen sind Sie {{Golfer, Segler, Künstler …}}, und am meisten Spaß macht Ihnen die Arbeit mit Interessenten, die ebenfalls {{Golfer, Segler, Künstler …}} sind. Warum also nicht Ihren Heimat-PIN in dieser Gegend setzen und für diese Klientel sichtbarer werden?",
          ],
        },
        {
          text: "**TalisBOT™:** Unser TalisBOT™-Assistent beantwortet häufige Fragen, und mit seinem Formular „Projektvision teilen“ beschreiben Sie Ihr Objekt, Projekt oder Ihre Chance, ohne sich vorher zu registrieren. So beginnen Sie „das Gespräch“ – ohne Kosten für Sie.",
        },
        {
          text: "**Fulfilment-Team:** Sobald ein Plan Gestalt annimmt, kümmern sich Webster und sein Team um die praktische Seite: welche Struktur, was zur Umsetzung nötig ist, etwa Bezugsoptionen einschließlich Zugang zu modularen Bauten und Finanzierung auf der Angebotsseite – so können Sie aktiv zur guten Idee Ihres Kunden beitragen.",
        },
      ],
    },
    {
      id: "faq",
      number: "9",
      heading: "Häufig gestellte Fragen",
      list: [
        {
          text: "**Ersetzen Mapsites MLS® oder klassische Immobilienportale?** Nein. Sie können parallel dazu arbeiten, um Menschen zu erreichen, die sonst oft übersehen werden.",
        },
        {
          text: "**Ist TSPLITS™ ein Maklerunternehmen?** Nein. Es ist ein Marketing- und Projektentwicklungsunternehmen. Ihre Transaktionen werden von Fachleuten Ihrer Wahl abgewickelt.",
        },
        { text: "**Erhalten Sie einen Anteil am Verkauf?** Nein. Wir berechnen keine Vermittlungsgebühren." },
        {
          text: "**Gibt es eine langfristige Bindung?** Nein. Lassen Sie Ihr Konto auslaufen, endet der Service – ohne weitere Verpflichtung.",
        },
        {
          text: "**Können Sie einen Verkauf versprechen?** Nein. Das kann ehrlicherweise niemand. Was wir versprechen, ist eine professionelle, dauerhafte Präsenz und ein Team, das Ihnen hilft, einen Deal zu gestalten, dem alle Beteiligten zustimmen können.",
        },
      ],
    },
    {
      id: "legend",
      number: "10",
      heading: "Legende",
      bullets: true,
      list: [
        { text: "**Mapsite:** eine kartenbasierte Marketing-Website." },
        { text: "**PIN:** eine Markierung auf einer Karte, die beim Anklicken Links öffnet." },
        { text: "**TEB:** Talis eBook, ein blätterbares eBook, erstellt aus Ihrem PDF." },
        {
          text: "**TVA:** eine Listing-Analyse – die Prüfung, welche Deal-Struktur und welche Investorenklasse zu einer Immobilie passt (falls überhaupt).",
        },
        {
          text: "**TTV:** TalisTV™, Videoproduktion und Online-Ausstrahlung (ein optionales Extra, das Ende 2026 oder Anfang 2027 verfügbar wird).",
        },
        {
          text: "**MLS®:** Multiple Listing Service; die Marken MLS® und Multiple Listing Service® gehören der Canadian Real Estate Association (CREA) und kennzeichnen die Qualität der Dienstleistungen von Immobilienfachleuten, die Mitglied der CREA sind.",
        },
      ],
    },
  ],
  cta: {
    heading: "Haben Sie ein Listing, das einen Plan verdient? Lassen Sie uns reden.",
    button: "Projektvision teilen",
    body: "Wählen Sie „Projektvision teilen“ – ganz ohne Registrierung. Ein Analyst meldet sich bei Ihnen.",
    signoff: "Webster M. · Projektanalyst",
  },
};
