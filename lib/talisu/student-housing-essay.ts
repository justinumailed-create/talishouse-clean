/**
 * Student Housing tokenization essay (3rd tab in the /talisu FAQ essay rail).
 * EN + DE bodies live here (outside the i18n dictionaries, like the Bare Land
 * and Hospitality essays). Illustrative amounts are example figures in CAD.
 */
import type { Locale } from "@/lib/i18n/config";

export type StudentHousingBlock =
  | { type: "p"; text: string }
  | { type: "bullets"; items: readonly string[] }
  | { type: "steps"; items: readonly { title: string; text: string }[] }
  | { type: "note"; text: string }
  | { type: "ownership" }
  | { type: "structures" }
  | { type: "example" }
  | { type: "risks" }
  | { type: "cards"; items: readonly { title: string; text: string }[] };

export type StudentHousingSection = {
  id: string;
  title: string;
  blocks: readonly StudentHousingBlock[];
};

export type StudentHousingEssay = {
  kicker: string;
  title: string;
  subtitle: string;
  disclaimer: string;
  print: string;
  intro: readonly string[];
  ownership: {
    layers: readonly { title: string; text: string }[];
    arrows: readonly string[];
    slices: readonly { label: string; pct: number; text: string }[];
    note: string;
  };
  structures: readonly { letter: string; title: string; text: string; bestFor: string }[];
  structuresNote: string;
  bestForLabel: string;
  example: {
    caption: string;
    headers: readonly [string, string];
    rows: readonly (readonly [string, string])[];
    note: string;
  };
  risks: {
    caption: string;
    headers: readonly [string, string];
    rows: readonly (readonly [string, string])[];
  };
  sections: readonly StudentHousingSection[];
};

const EN: StudentHousingEssay = {
  kicker: "Tokenization",
  title: "Tokenizing an LLC that owns student housing",
  subtitle:
    "How digital tokens can divide the economic ownership of a student-housing investment — while the LLC keeps owning the building.",
  disclaimer: "General information, not legal advice.",
  print: "Print essay",
  intro: [
    "Tokenization is a way to divide the economic ownership of a student-housing investment into digital units, called tokens. Instead of selling the entire property or finding one buyer for the entire business, an owner can potentially sell smaller interests to multiple investors while retaining some ownership and arranging for someone else to manage the property.",
    "The key distinction is that tokenizing an LLC does not necessarily mean tokenizing the real estate itself. It usually means digitizing ownership interests in the LLC that owns or operates the student-housing property.",
  ],
  ownership: {
    layers: [
      { title: "Student housing property", text: "Building, land, leases and rental income" },
      { title: "Property-owning LLC", text: "Holds the property, subject to its financing and legal structure" },
    ],
    arrows: ["Legal ownership", "LLC membership interests represented digitally"],
    slices: [
      { label: "Founder", pct: 40, text: "Retained interest" },
      { label: "Investors", pct: 50, text: "Investor interests" },
      { label: "Manager", pct: 10, text: "Illustrative interest" },
    ],
    note: "Illustrative allocation only. The manager's 10% could be earned, purchased, or structured differently; the founder's 40% and investors' 50% need not reflect voting control or distribution rights.",
  },
  structures: [
    {
      letter: "A",
      title: "Equity tokens — ownership",
      text: "Investors buy membership interests in the property-owning LLC. They may receive a share of rental profits and appreciation when the property is sold, subject to the operating agreement, debt obligations, and distribution priorities.",
      bestFor: "An owner who wants to raise equity while retaining a stake in the property.",
    },
    {
      letter: "B",
      title: "Debt tokens — lending",
      text: "Investors lend money to the LLC through a properly structured debt instrument. The tokens represent the loan or associated rights, with interest and repayment terms defined in the documents.",
      bestFor: "An owner who wants financing without giving up as much equity. The loan may be secured or unsecured, depending on the structure.",
    },
    {
      letter: "C",
      title: "Preferred equity or a hybrid",
      text: "Investors receive a negotiated priority return or distribution preference, potentially followed by a share of additional profits. The founder may retain ordinary equity and management control.",
      bestFor: "A retiring owner who wants to monetize some value but preserve a role in the transition, or a new operator who needs a tailored capital structure.",
    },
  ],
  structuresNote:
    "These are financial and legal structures, not merely different token designs. A token that represents an investment in an LLC will generally need to be assessed under the securities laws of the relevant jurisdiction.",
  bestForLabel: "Best suited to:",
  example: {
    caption: "Illustrative figures (example amounts in CAD)",
    headers: ["Item", "Illustrative amount"],
    rows: [
      ["Property market value", "CA$10,000,000"],
      ["Outstanding mortgage", "CA$4,000,000"],
      ["Estimated equity value", "CA$6,000,000"],
      ["New equity offered to investors", "CA$2,000,000"],
      ["Equity retained by founder, before other adjustments", "CA$4,000,000"],
    ],
    note: "These figures assume the property is valued at market value, with no other liabilities, transaction costs, or adjustments. The CA$6 million is the estimated equity value, not the gross property value.",
  },
  risks: {
    caption: "Main risks",
    headers: ["Risk", "What to establish before issuing tokens"],
    rows: [
      ["Mortgage restrictions", "Whether the lender permits new investors, transfers of LLC interests, or changes in control"],
      ["Securities compliance", "Which offering exemptions, disclosures, investor qualifications, and resale restrictions apply"],
      ["Tax consequences", "Whether investors receive pass-through tax allocations, distributions, or other tax reporting obligations"],
      ["Investor liquidity", "Whether secondary transfers are permitted and whether a compliant trading venue actually exists"],
      ["Governance", "Who controls admissions, budgets, refinancing, renovations, sales, and distributions"],
      ["Valuation and exit", "How the property and investor interests will be valued, and how investors can exit"],
      ["Technology and custody", "Who controls the token registry, wallet access, and recovery if keys are lost or the platform fails"],
    ],
  },
  sections: [
    {
      id: "sh-structure",
      title: "1. How the structure works",
      blocks: [
        { type: "p", text: "Imagine you own a student-housing property with 100 beds near a university. The building is owned by an LLC, which collects rent, pays expenses, maintains the property, and distributes profits to its owners." },
        { type: "ownership" },
        { type: "p", text: "In this example, the LLC continues to own the building. The digital tokens represent defined membership interests or economic rights in the LLC, depending on the legal documents. The tokens are recorded on a blockchain, while the operating agreement and applicable law determine who legally owns the interests and what those interests entitle their holders to receive." },
      ],
    },
    {
      id: "sh-tokens",
      title: "2. What would the tokens represent?",
      blocks: [
        { type: "p", text: "There are three common structures for a student-housing project." },
        { type: "structures" },
      ],
    },
    {
      id: "sh-example",
      title: "3. A worked example: raising capital from student-housing investors",
      blocks: [
        { type: "p", text: "Suppose the student-housing property has the following characteristics:" },
        { type: "example" },
        { type: "p", text: "The owner could issue investor interests worth CA$2 million in exchange for new capital. If the transaction is structured as a primary equity issuance at a CA$6 million pre-money equity valuation, the post-money equity value would be CA$8 million." },
        {
          type: "bullets",
          items: [
            "Founder: 75% of the equity after the raise.",
            "New investors collectively: 25%.",
            "Tokens: a digital representation of the interests specified in the LLC documents.",
          ],
        },
        { type: "p", text: "For example, the investor portion could be divided into 2,000 tokens priced at CA$1,000 each. Each token would represent 0.0125% of the post-money equity, assuming all tokens carry identical proportional rights and the founder's retained interest is represented on the same basis." },
        { type: "p", text: "The owner receives CA$2 million in new capital, while the LLC continues to own the property. The founder has not necessarily received CA$2 million personally; the money generally goes to the LLC in a primary issuance. A sale of the founder's existing interests would work differently." },
        { type: "cards", items: [{ title: "How investors might earn a return", text: "Suppose the property generates CA$800,000 a year in net operating income (NOI), before mortgage payments, capital expenditures, taxes at the owner level, and investor distributions. That NOI is not automatically available for distribution. The actual cash available depends on debt service, reserves, renovations, occupancy, and other expenses." }] },
        { type: "p", text: "Investors' returns could come from:" },
        {
          type: "bullets",
          items: [
            "Rental cash flow: distributions from cash available under the LLC's distribution rules.",
            "Property appreciation: a share of the gain if the property increases in value.",
            "Sale proceeds: a share of the net proceeds when the LLC sells the property.",
            "Refinancing: potentially a distribution of some proceeds if the lender permits it and the LLC's governing documents allow it.",
          ],
        },
        { type: "note", text: "None of these returns is guaranteed." },
      ],
    },
    {
      id: "sh-different",
      title: "4. What makes student housing different from ordinary real estate?",
      blocks: [
        { type: "p", text: "Student housing combines real estate ownership with an operating business. This affects how the LLC should be structured and what investors need to understand." },
        {
          type: "cards",
          items: [
            { title: "Academic-year occupancy", text: "Revenue may be concentrated around university terms, with vacancies during summer or between leases. Investors need to understand annualized occupancy, lease renewals, and seasonal cash reserves." },
            { title: "Operating costs and maintenance", text: "Furnishings, utilities, turnover cleaning, repairs, security, and common areas can make operating costs materially different from those of conventional rental apartments." },
            { title: "University-related demand", text: "Enrollment trends, competing housing supply, student affordability, and proximity to campus influence the business's performance." },
            { title: "Property versus operating company", text: "The building owner may lease the property to a separate management or operating company. If so, the investment documents should explain how rent, management fees, expenses, and related-party transactions are handled." },
          ],
        },
        { type: "note", text: "A useful structure may involve a property-owning LLC and a separate operating company, but this is not always necessary. The choice depends on liability, tax, financing, licensing, and commercial considerations." },
      ],
    },
    {
      id: "sh-implement",
      title: "5. How to implement tokenization",
      blocks: [
        { type: "p", text: "A practical implementation usually involves six steps." },
        {
          type: "steps",
          items: [
            { title: "Review the existing ownership and mortgage.", text: "Confirm who owns the property, whether the LLC has other assets or liabilities, and whether a transfer of interests or new equity issuance requires lender consent." },
            { title: "Determine the transaction objective.", text: "Decide whether the owner wants to raise new capital, sell existing ownership, refinance, or gradually transfer the business to a successor." },
            { title: "Choose the investment rights.", text: "Define equity, preferred equity, or debt; voting rights; distribution priorities; management authority; exit provisions; and investor transfer restrictions." },
            { title: "Complete the legal and tax work.", text: "Amend the LLC operating agreement as needed, prepare offering documents, assess securities-law requirements, and model the tax consequences of issuing or selling interests." },
            { title: "Select the tokenization infrastructure.", text: "Choose a platform for issuing tokens, maintaining ownership records, verifying investor eligibility, administering distributions, and enforcing transfer restrictions." },
            { title: "Raise capital and administer the investment.", text: "Onboard eligible investors, issue tokens in accordance with the legal documents, report financial performance, and handle distributions and eventual exits." },
          ],
        },
        { type: "note", text: "A blockchain can improve recordkeeping and automate certain permitted transactions, but it does not automatically make the investment liquid or replace legal ownership records. In the United States, the SEC has specifically distinguished issuer-sponsored, custodial, and synthetic tokenized securities, which can confer different rights." },
      ],
    },
    {
      id: "sh-risks",
      title: "6. The main risks to address",
      blocks: [
        { type: "risks" },
        { type: "p", text: "If the property is in Canada, the applicable provincial or territorial securities regime must be considered. The Canadian Securities Administrators launched Project Tokenization in 2026 to examine how tokenized financial products intersect with Canadian securities laws." },
      ],
    },
    {
      id: "sh-retiring",
      title: "7. The special opportunity for a retiring owner",
      blocks: [
        { type: "p", text: "If your objective is to retire from student-housing ownership or management, tokenization could support a gradual transition rather than an immediate sale of the entire property. For example, you might:" },
        {
          type: "bullets",
          items: [
            "Sell a portion of your existing LLC interest to new investors and receive personal liquidity.",
            "Retain a minority economic interest while transferring day-to-day management to an experienced operator.",
            "Structure a preferred investment for incoming capital, with a negotiated distribution priority.",
            "Establish a succession or eventual sale plan with clearly defined rights for the founder, operator, and investors.",
          ],
        },
        { type: "note", text: "The crucial decision is whether you want to sell the property, sell part of your ownership, raise capital for the LLC, or step away from the operating business while retaining investment income. Those are different transactions, and tokenization is a mechanism that may facilitate them — not a substitute for deciding which transaction is right." },
      ],
    },
  ],
};

const DE: StudentHousingEssay = {
  kicker: "Tokenisierung",
  title: "Tokenisierung einer LLC, die Studentenwohnheime besitzt",
  subtitle:
    "Wie digitale Token das wirtschaftliche Eigentum an einer Studentenwohnheim-Investition aufteilen können – während die LLC Eigentümerin des Gebäudes bleibt.",
  disclaimer: "Allgemeine Informationen, keine Rechtsberatung.",
  print: "Aufsatz drucken",
  intro: [
    "Tokenisierung ist eine Möglichkeit, das wirtschaftliche Eigentum an einer Studentenwohnheim-Investition in digitale Einheiten, sogenannte Token, aufzuteilen. Statt die gesamte Immobilie zu verkaufen oder einen einzigen Käufer für das gesamte Unternehmen zu finden, kann ein Eigentümer kleinere Anteile an mehrere Investoren verkaufen, einen Teil des Eigentums behalten und die Verwaltung der Immobilie an jemand anderen übertragen.",
    "Der entscheidende Unterschied: Die Tokenisierung einer LLC bedeutet nicht zwangsläufig, dass die Immobilie selbst tokenisiert wird. Meist werden die Eigentumsanteile an der LLC digitalisiert, die das Studentenwohnheim besitzt oder betreibt.",
  ],
  ownership: {
    layers: [
      { title: "Studentenwohnheim", text: "Gebäude, Grundstück, Mietverträge und Mieteinnahmen" },
      { title: "Immobilienhaltende LLC", text: "Hält die Immobilie, vorbehaltlich ihrer Finanzierung und Rechtsstruktur" },
    ],
    arrows: ["Rechtliches Eigentum", "LLC-Mitgliedschaftsanteile digital abgebildet"],
    slices: [
      { label: "Gründer", pct: 40, text: "Einbehaltener Anteil" },
      { label: "Investoren", pct: 50, text: "Investorenanteile" },
      { label: "Manager", pct: 10, text: "Beispielhafter Anteil" },
    ],
    note: "Nur beispielhafte Aufteilung. Die 10 % des Managers könnten verdient, gekauft oder anders strukturiert werden; die 40 % des Gründers und die 50 % der Investoren müssen nicht die Stimmrechte oder Ausschüttungsrechte widerspiegeln.",
  },
  structures: [
    {
      letter: "A",
      title: "Eigenkapital-Token – Eigentum",
      text: "Investoren erwerben Mitgliedschaftsanteile an der immobilienhaltenden LLC. Sie können einen Anteil an den Mietgewinnen und an der Wertsteigerung beim Verkauf erhalten – vorbehaltlich des Gesellschaftsvertrags, der Schuldverpflichtungen und der Ausschüttungsrangfolge.",
      bestFor: "Eigentümer, die Eigenkapital beschaffen und gleichzeitig an der Immobilie beteiligt bleiben möchten.",
    },
    {
      letter: "B",
      title: "Schuld-Token – Darlehen",
      text: "Investoren leihen der LLC über ein ordnungsgemäß strukturiertes Schuldinstrument Geld. Die Token repräsentieren das Darlehen oder die damit verbundenen Rechte; Zins- und Rückzahlungsbedingungen sind in den Dokumenten festgelegt.",
      bestFor: "Eigentümer, die eine Finanzierung wünschen, ohne so viel Eigenkapital abzugeben. Das Darlehen kann je nach Struktur besichert oder unbesichert sein.",
    },
    {
      letter: "C",
      title: "Vorzugskapital oder Hybrid",
      text: "Investoren erhalten eine ausgehandelte Vorzugsrendite oder einen Ausschüttungsvorrang, gegebenenfalls gefolgt von einer Beteiligung an weiteren Gewinnen. Der Gründer kann das Stammkapital und die Geschäftsführung behalten.",
      bestFor: "Eigentümer im Ruhestand, die einen Teil des Werts realisieren, aber eine Rolle im Übergang behalten möchten, oder neue Betreiber, die eine maßgeschneiderte Kapitalstruktur benötigen.",
    },
  ],
  structuresNote:
    "Dies sind finanzielle und rechtliche Strukturen, nicht bloß unterschiedliche Token-Designs. Ein Token, der eine Investition in eine LLC repräsentiert, muss in der Regel nach dem Wertpapierrecht der jeweiligen Rechtsordnung beurteilt werden.",
  bestForLabel: "Am besten geeignet für:",
  example: {
    caption: "Beispielzahlen (Beispielbeträge in CAD)",
    headers: ["Posten", "Beispielbetrag"],
    rows: [
      ["Marktwert der Immobilie", "10.000.000 CA$"],
      ["Ausstehende Hypothek", "4.000.000 CA$"],
      ["Geschätzter Eigenkapitalwert", "6.000.000 CA$"],
      ["Neues Eigenkapital für Investoren", "2.000.000 CA$"],
      ["Vom Gründer gehaltenes Eigenkapital, vor weiteren Anpassungen", "4.000.000 CA$"],
    ],
    note: "Diese Zahlen setzen voraus, dass die Immobilie zum Marktwert bewertet wird, ohne weitere Verbindlichkeiten, Transaktionskosten oder Anpassungen. Die 6 Mio. CA$ sind der geschätzte Eigenkapitalwert, nicht der Bruttowert der Immobilie.",
  },
  risks: {
    caption: "Hauptrisiken",
    headers: ["Risiko", "Was vor der Token-Ausgabe zu klären ist"],
    rows: [
      ["Hypothekenbeschränkungen", "Ob der Kreditgeber neue Investoren, Übertragungen von LLC-Anteilen oder Kontrollwechsel zulässt"],
      ["Wertpapierrechtliche Compliance", "Welche Prospektausnahmen, Offenlegungen, Investorenqualifikationen und Weiterverkaufsbeschränkungen gelten"],
      ["Steuerliche Folgen", "Ob Investoren steuerlich transparente Zuweisungen, Ausschüttungen oder andere steuerliche Meldepflichten erhalten"],
      ["Liquidität für Investoren", "Ob Weiterübertragungen erlaubt sind und ob tatsächlich ein regelkonformer Handelsplatz existiert"],
      ["Governance", "Wer über Aufnahmen, Budgets, Refinanzierung, Renovierungen, Verkäufe und Ausschüttungen entscheidet"],
      ["Bewertung und Ausstieg", "Wie die Immobilie und die Investorenanteile bewertet werden und wie Investoren aussteigen können"],
      ["Technologie und Verwahrung", "Wer das Token-Register und den Wallet-Zugang kontrolliert und wie die Wiederherstellung erfolgt, wenn Schlüssel verloren gehen oder die Plattform ausfällt"],
    ],
  },
  sections: [
    {
      id: "sh-structure",
      title: "1. So funktioniert die Struktur",
      blocks: [
        { type: "p", text: "Stellen Sie sich vor, Sie besitzen ein Studentenwohnheim mit 100 Betten in der Nähe einer Universität. Das Gebäude gehört einer LLC, die Mieten einzieht, Ausgaben bezahlt, die Immobilie instand hält und Gewinne an ihre Eigentümer ausschüttet." },
        { type: "ownership" },
        { type: "p", text: "In diesem Beispiel bleibt die LLC Eigentümerin des Gebäudes. Die digitalen Token repräsentieren – je nach Rechtsdokumenten – definierte Mitgliedschaftsanteile oder wirtschaftliche Rechte an der LLC. Die Token werden auf einer Blockchain erfasst, während der Gesellschaftsvertrag und das geltende Recht bestimmen, wem die Anteile rechtlich gehören und welche Ansprüche sie vermitteln." },
      ],
    },
    {
      id: "sh-tokens",
      title: "2. Was würden die Token repräsentieren?",
      blocks: [
        { type: "p", text: "Für ein Studentenwohnheim-Projekt gibt es drei gängige Strukturen." },
        { type: "structures" },
      ],
    },
    {
      id: "sh-example",
      title: "3. Rechenbeispiel: Kapitalbeschaffung bei Studentenwohnheim-Investoren",
      blocks: [
        { type: "p", text: "Angenommen, das Studentenwohnheim weist folgende Merkmale auf:" },
        { type: "example" },
        { type: "p", text: "Der Eigentümer könnte Investorenanteile im Wert von 2 Mio. CA$ gegen neues Kapital ausgeben. Wird die Transaktion als Primäremission bei einer Eigenkapitalbewertung von 6 Mio. CA$ vor der Finanzierung (pre-money) strukturiert, läge der Eigenkapitalwert danach (post-money) bei 8 Mio. CA$." },
        {
          type: "bullets",
          items: [
            "Gründer: 75 % des Eigenkapitals nach der Finanzierungsrunde.",
            "Neue Investoren zusammen: 25 %.",
            "Token: eine digitale Abbildung der in den LLC-Dokumenten festgelegten Anteile.",
          ],
        },
        { type: "p", text: "Der Investorenanteil könnte zum Beispiel in 2.000 Token zu je 1.000 CA$ aufgeteilt werden. Jeder Token entspräche 0,0125 % des Eigenkapitals nach der Finanzierung – vorausgesetzt, alle Token tragen identische anteilige Rechte und der Anteil des Gründers wird auf derselben Grundlage abgebildet." },
        { type: "p", text: "Der Eigentümer erhält 2 Mio. CA$ neues Kapital, während die LLC Eigentümerin der Immobilie bleibt. Der Gründer hat die 2 Mio. CA$ nicht unbedingt persönlich erhalten; bei einer Primäremission fließt das Geld in der Regel an die LLC. Ein Verkauf bestehender Anteile des Gründers würde anders funktionieren." },
        { type: "cards", items: [{ title: "Wie Investoren eine Rendite erzielen könnten", text: "Angenommen, die Immobilie erwirtschaftet 800.000 CA$ jährlichen Nettobetriebsertrag (NOI) – vor Hypothekenzahlungen, Investitionsausgaben, Steuern auf Eigentümerebene und Ausschüttungen an Investoren. Dieser NOI steht nicht automatisch zur Ausschüttung bereit. Die tatsächlich verfügbaren Mittel hängen von Schuldendienst, Rücklagen, Renovierungen, Belegung und weiteren Ausgaben ab." }] },
        { type: "p", text: "Renditen für Investoren könnten stammen aus:" },
        {
          type: "bullets",
          items: [
            "Mietüberschüssen: Ausschüttungen aus verfügbaren Mitteln gemäß den Ausschüttungsregeln der LLC.",
            "Wertsteigerung: einem Anteil am Gewinn, wenn die Immobilie an Wert gewinnt.",
            "Verkaufserlösen: einem Anteil am Nettoerlös, wenn die LLC die Immobilie verkauft.",
            "Refinanzierung: möglicherweise einer Ausschüttung eines Teils der Erlöse, sofern der Kreditgeber und die Gesellschaftsdokumente der LLC dies zulassen.",
          ],
        },
        { type: "note", text: "Keine dieser Renditen ist garantiert." },
      ],
    },
    {
      id: "sh-different",
      title: "4. Was unterscheidet Studentenwohnheime von gewöhnlichen Immobilien?",
      blocks: [
        { type: "p", text: "Studentenwohnheime verbinden Immobilieneigentum mit einem operativen Geschäft. Das beeinflusst, wie die LLC strukturiert sein sollte und was Investoren verstehen müssen." },
        {
          type: "cards",
          items: [
            { title: "Belegung im Studienjahr", text: "Einnahmen können sich auf die Semester konzentrieren, mit Leerständen im Sommer oder zwischen Mietverträgen. Investoren müssen die Jahresbelegung, Vertragsverlängerungen und saisonale Liquiditätsreserven verstehen." },
            { title: "Betriebskosten und Instandhaltung", text: "Möblierung, Nebenkosten, Reinigung beim Mieterwechsel, Reparaturen, Sicherheit und Gemeinschaftsflächen können die Betriebskosten deutlich von denen herkömmlicher Mietwohnungen abheben." },
            { title: "Nachfrage durch die Universität", text: "Entwicklung der Studierendenzahlen, konkurrierendes Wohnangebot, Bezahlbarkeit für Studierende und Nähe zum Campus beeinflussen die Ertragslage." },
            { title: "Immobilien- versus Betriebsgesellschaft", text: "Der Gebäudeeigentümer kann die Immobilie an eine separate Verwaltungs- oder Betriebsgesellschaft vermieten. In diesem Fall sollten die Investitionsdokumente erläutern, wie Miete, Verwaltungsgebühren, Ausgaben und Geschäfte mit nahestehenden Parteien gehandhabt werden." },
          ],
        },
        { type: "note", text: "Eine sinnvolle Struktur kann aus einer immobilienhaltenden LLC und einer separaten Betriebsgesellschaft bestehen, ist aber nicht immer nötig. Die Wahl hängt von Haftungs-, Steuer-, Finanzierungs-, Genehmigungs- und kaufmännischen Erwägungen ab." },
      ],
    },
    {
      id: "sh-implement",
      title: "5. So wird die Tokenisierung umgesetzt",
      blocks: [
        { type: "p", text: "Eine praktische Umsetzung umfasst in der Regel sechs Schritte." },
        {
          type: "steps",
          items: [
            { title: "Bestehende Eigentumsverhältnisse und Hypothek prüfen.", text: "Klären, wem die Immobilie gehört, ob die LLC weitere Vermögenswerte oder Verbindlichkeiten hat und ob eine Anteilsübertragung oder neue Eigenkapitalausgabe die Zustimmung des Kreditgebers erfordert." },
            { title: "Ziel der Transaktion festlegen.", text: "Entscheiden, ob der Eigentümer neues Kapital beschaffen, bestehendes Eigentum verkaufen, refinanzieren oder das Geschäft schrittweise an einen Nachfolger übergeben möchte." },
            { title: "Investitionsrechte wählen.", text: "Eigenkapital, Vorzugskapital oder Fremdkapital definieren; dazu Stimmrechte, Ausschüttungsrangfolge, Geschäftsführungsbefugnisse, Ausstiegsregeln und Übertragungsbeschränkungen für Investoren." },
            { title: "Rechtliche und steuerliche Arbeit abschließen.", text: "Den Gesellschaftsvertrag der LLC nach Bedarf ändern, Angebotsunterlagen erstellen, wertpapierrechtliche Anforderungen prüfen und die steuerlichen Folgen der Ausgabe oder des Verkaufs von Anteilen modellieren." },
            { title: "Tokenisierungs-Infrastruktur auswählen.", text: "Eine Plattform wählen, um Token auszugeben, Eigentumsregister zu führen, die Berechtigung von Investoren zu prüfen, Ausschüttungen abzuwickeln und Übertragungsbeschränkungen durchzusetzen." },
            { title: "Kapital beschaffen und die Investition verwalten.", text: "Berechtigte Investoren aufnehmen, Token gemäß den Rechtsdokumenten ausgeben, über die finanzielle Entwicklung berichten sowie Ausschüttungen und spätere Ausstiege abwickeln." },
          ],
        },
        { type: "note", text: "Eine Blockchain kann die Dokumentation verbessern und bestimmte zulässige Transaktionen automatisieren, macht die Investition aber nicht automatisch liquide und ersetzt keine rechtlichen Eigentumsnachweise. In den USA unterscheidet die SEC ausdrücklich zwischen vom Emittenten aufgelegten, verwahrten und synthetischen tokenisierten Wertpapieren, die unterschiedliche Rechte vermitteln können." },
      ],
    },
    {
      id: "sh-risks",
      title: "6. Die wichtigsten Risiken",
      blocks: [
        { type: "risks" },
        { type: "p", text: "Liegt die Immobilie in Kanada, ist das jeweilige Wertpapierrecht der Provinz oder des Territoriums zu beachten. Die Canadian Securities Administrators haben 2026 das Project Tokenization gestartet, um zu untersuchen, wie tokenisierte Finanzprodukte mit dem kanadischen Wertpapierrecht zusammenwirken." },
      ],
    },
    {
      id: "sh-retiring",
      title: "7. Die besondere Chance für Eigentümer im Ruhestand",
      blocks: [
        { type: "p", text: "Wenn Sie sich aus dem Eigentum oder der Verwaltung von Studentenwohnheimen zurückziehen möchten, kann die Tokenisierung einen schrittweisen Übergang statt eines sofortigen Verkaufs der gesamten Immobilie ermöglichen. Sie könnten zum Beispiel:" },
        {
          type: "bullets",
          items: [
            "Einen Teil Ihres bestehenden LLC-Anteils an neue Investoren verkaufen und persönliche Liquidität erhalten.",
            "Eine wirtschaftliche Minderheitsbeteiligung behalten und das Tagesgeschäft an einen erfahrenen Betreiber übergeben.",
            "Eine Vorzugsbeteiligung für neues Kapital mit ausgehandeltem Ausschüttungsvorrang strukturieren.",
            "Einen Nachfolge- oder späteren Verkaufsplan mit klar definierten Rechten für Gründer, Betreiber und Investoren aufstellen.",
          ],
        },
        { type: "note", text: "Die entscheidende Frage ist, ob Sie die Immobilie verkaufen, einen Teil Ihres Eigentums verkaufen, Kapital für die LLC beschaffen oder sich aus dem operativen Geschäft zurückziehen und dennoch Kapitalerträge behalten möchten. Das sind unterschiedliche Transaktionen – die Tokenisierung ist ein Mechanismus, der sie erleichtern kann, aber kein Ersatz für die Entscheidung, welche Transaktion die richtige ist." },
      ],
    },
  ],
};

export const TALISU_STUDENT_HOUSING_ESSAY: Record<Locale, StudentHousingEssay> = {
  en: EN,
  de: DE,
};
