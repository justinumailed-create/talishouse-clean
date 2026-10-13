/**
 * Long-Term Care tokenization essay (4th tab in the /talisu FAQ essay rail).
 * EN + DE bodies live here (like the other essays). Illustrative amounts are
 * example figures in CAD (CA$).
 */
import type { Locale } from "@/lib/i18n/config";

export type LtcNode = { title: string; text: string };

export type LtcBlock =
  | { type: "p"; text: string }
  | { type: "lead"; title: string; text: string }
  | { type: "bullets"; items: readonly string[] }
  | { type: "steps"; items: readonly { title: string; text: string }[] }
  | { type: "note"; text: string }
  | { type: "flow"; levels: readonly (readonly LtcNode[])[]; testId: string }
  | { type: "valuation"; total: string; label: string; parts: readonly { label: string; value: string; pct: number }[] }
  | { type: "split"; parts: readonly { label: string; pct: number; text: string }[] }
  | { type: "options"; items: readonly { letter: string; title: string; text: string }[] }
  | { type: "table"; caption: string; headers: readonly [string, string]; rows: readonly (readonly [string, string])[] };

export type LtcSection = { id: string; title: string; blocks: readonly LtcBlock[] };

export type LongTermCareEssay = {
  kicker: string;
  title: string;
  subtitle: string;
  disclaimer: string;
  print: string;
  intro: readonly string[];
  sections: readonly LtcSection[];
};

const EN: LongTermCareEssay = {
  kicker: "Tokenization",
  title: "Tokenizing an LLC that owns long-term care facilities",
  subtitle:
    "How digital tokens can divide ownership or economic rights in a care-facility LLC — to raise capital, add investors or plan succession.",
  disclaimer: "General information, not legal advice.",
  print: "Print essay",
  intro: [
    "Tokenization is a way of dividing ownership or certain economic rights in a business into digital units, called tokens, that can be held and potentially transferred by investors.",
    "For a long-term care facility operator or owner, tokenization could provide a way to raise capital, bring in new investors, finance facility upgrades, or gradually transition ownership to a successor while retaining professional management.",
    "The key distinction is that the tokens represent legally defined rights in the LLC; they do not automatically represent direct ownership of the nursing homes, the land, or the residents' care operations.",
  ],
  sections: [
    {
      id: "ltc-structure",
      title: "1. How the structure works",
      blocks: [
        { type: "p", text: "Imagine an owner who operates three long-term care facilities through an LLC. The LLC owns the real estate, buildings, equipment, and perhaps the operating business." },
        {
          type: "flow",
          testId: "ltc-structure-diagram",
          levels: [
            [{ title: "Three long-term care facilities", text: "Buildings, land, equipment and/or operating business" }],
            [{ title: "Property-owning or operating LLC", text: "Holds assets, contracts, debt and business obligations" }],
            [{ title: "Digital tokens linked to LLC interests", text: "Represent specified ownership, distribution or investment rights" }],
            [
              { title: "Investor A", text: "Tokens" },
              { title: "Investor B", text: "Tokens" },
              { title: "Other investors", text: "Tokens" },
            ],
          ],
        },
        { type: "p", text: "The LLC remains the legal entity responsible for the assets and obligations specified in its contracts. The token system records who holds the investment interests and may automate certain transactions, subject to the governing legal documents." },
      ],
    },
    {
      id: "ltc-what-owned",
      title: "2. What exactly would investors own?",
      blocks: [
        { type: "p", text: "There are several ways to structure the transaction. The best choice depends on whether the owner wants to sell real estate, raise money for the operating business, or transition out of ownership." },
        {
          type: "options",
          items: [
            { letter: "A", title: "Tokens representing equity in the LLC", text: "Investors acquire membership interests in the LLC. They may be entitled to a share of distributable profits, proceeds from a sale, and certain voting rights. The original owner can retain a controlling interest." },
            { letter: "B", title: "Tokens representing an interest in the real estate", text: "A property-owning LLC holds the land and buildings, while a separate licensed operator runs the care facilities. Investors participate in property income, potentially including rent paid by the operator, and any eventual property sale proceeds." },
            { letter: "C", title: "Tokens representing an interest in the operating business", text: "Investors participate in the economics of the care business, which could include operating profits and business-sale proceeds. This structure exposes investors more directly to staffing costs, occupancy, reimbursement rates and regulatory risks." },
            { letter: "D", title: "Debt or income-linked tokens", text: "Investors lend money to the LLC or receive contractually defined income rights instead of conventional equity. These investors may have no ownership or voting rights, and their payment priority depends on the financing documents." },
          ],
        },
        { type: "note", text: "These structures are not interchangeable. In particular, calling an instrument a token does not exempt it from securities laws or turn a contractual claim into legal title to property." },
      ],
    },
    {
      id: "ltc-example",
      title: "3. A practical example: tokenizing a CA$30 million portfolio",
      blocks: [
        { type: "p", text: "Suppose the owner has three long-term care facilities valued at CA$30 million in total. The portfolio has an existing mortgage of CA$10 million. The owner's approximate equity is therefore CA$20 million before transaction costs, taxes, and other liabilities." },
        {
          type: "valuation",
          total: "CA$30,000,000",
          label: "Illustrative portfolio valuation",
          parts: [
            { label: "Existing mortgage", value: "CA$10 million", pct: 33.3 },
            { label: "Owner's equity", value: "CA$20 million", pct: 66.7 },
          ],
        },
        { type: "lead", title: "Example capital raise", text: "The owner sells 25% of the equity in the LLC to investors for CA$5 million, assuming the equity is fairly valued at CA$20 million and there are no additional adjustments." },
        {
          type: "split",
          parts: [
            { label: "Original owner", pct: 75, text: "Retained equity" },
            { label: "New investors", pct: 25, text: "Combined equity" },
          ],
        },
        { type: "note", text: "Assumption: this is a primary issuance or capital transaction in which the LLC receives the CA$5 million. If the owner sells existing interests personally, the proceeds generally go to the owner instead." },
        { type: "lead", title: "What would the digital tokens look like?", text: "The LLC could authorize 20 million digital tokens, each corresponding to one twenty-millionth of the total equity interest. Under this illustrative structure:" },
        {
          type: "bullets",
          items: [
            "15 million tokens would belong to the original owner.",
            "5 million tokens would belong to the new investors.",
            "Each token would represent 0.000005% of the LLC's total equity.",
          ],
        },
        { type: "p", text: "The token count is arbitrary; what matters is that the legal ownership records and governing agreements define exactly what each token represents." },
      ],
    },
    {
      id: "ltc-returns",
      title: "4. How investors could earn a return",
      blocks: [
        { type: "p", text: "Investors would typically look to three potential sources of return." },
        {
          type: "steps",
          items: [
            { title: "Operating distributions:", text: "If the facilities generate distributable cash after payroll, food, utilities, maintenance, debt service, reserves, and other expenses, investors may receive a share according to their ownership rights." },
            { title: "Growth in asset or business value:", text: "Improved occupancy, operational efficiency, renovations, or changes in market conditions could increase the value of the investment. Losses are also possible." },
            { title: "Sale or refinancing:", text: "Investors might receive proceeds if the facilities are sold, the LLC is acquired, or a refinancing releases distributable equity, subject to debt repayment and the agreed distribution waterfall." },
          ],
        },
        { type: "note", text: "Example: if the LLC has CA$1.2 million available for distribution in a year and all equity classes participate equally, holders of 25% of the equity would collectively receive CA$300,000 — an illustrative 6% cash distribution on their CA$5 million investment, not a guaranteed yield." },
      ],
    },
    {
      id: "ltc-why",
      title: "5. Why tokenization might be especially useful for long-term care facilities",
      blocks: [
        { type: "p", text: "For a portfolio of care facilities, the strongest rationale may be succession planning and capital formation rather than simply issuing digital assets." },
        {
          type: "table",
          caption: "Potential benefits for the owner",
          headers: ["Potential benefit", "How it could help the owner"],
          rows: [
            ["Partial retirement", "Sell a portion of the equity while retaining an ownership stake."],
            ["Growth capital", "Raise funds for renovations, accessibility improvements, equipment, or additional facilities."],
            ["Diversified investors", "Allow multiple eligible investors to participate rather than relying on a single buyer."],
            ["Gradual succession", "Transfer economic ownership over time while retaining management authority, if the agreements and regulations permit."],
            ["Potentially easier transfers", "Use digital records to track ownership and eligible transfers, subject to securities restrictions."],
            ["Portfolio-level financing", "Raise capital across multiple facilities through a holding company, if the ownership and debt structures permit it."],
          ],
        },
        { type: "note", text: "An important caveat: tokenization does not automatically create liquidity. A token can be technically transferable yet legally restricted, difficult to sell, or worth less than its purchase price." },
      ],
    },
    {
      id: "ltc-issues",
      title: "6. The special legal and financial issues with long-term care",
      blocks: [
        { type: "p", text: "This sector has additional complexities compared with ordinary commercial real estate." },
        {
          type: "steps",
          items: [
            { title: "Facility licensing and change-of-control approval.", text: "A transaction involving ownership interests can trigger regulatory requirements even when the building itself is not sold. For example, Ontario's Fixing Long-Term Care Act, 2021 contains requirements concerning controlling interests in licensees, and Nova Scotia's regulations address changes in control of companies owning certain nursing homes and residential care facilities. The applicable rules depend on the jurisdiction and transaction." },
            { title: "Separate the real estate from the care operation where appropriate.", text: "A potentially useful arrangement is a property-owning LLC that leases the buildings to a separately licensed operator. This can help distinguish real estate investment from operating-business risk. However, the lease, financing, related-party arrangements, and regulatory requirements must be properly structured; separation does not eliminate all liabilities." },
            { title: "Government funding and reimbursement.", text: "Many facilities depend on government funding, regulated reimbursement, or public-sector contracts. Investors need to understand how those arrangements affect revenue, eligible expenses, distributions, and any change-of-control process." },
            { title: "Staffing and care obligations.", text: "Labour costs, staffing requirements, resident safety, quality-of-care standards, inspections, insurance, and potential litigation can materially affect cash flow and enterprise value. Investor distributions cannot take priority over obligations that the facility must legally meet." },
            { title: "Securities, tax and investor eligibility.", text: "Tokens representing investment interests will often be securities. The offering may need to comply with securities registration, prospectus exemptions, investor qualification, disclosure, and resale restrictions. Tax treatment depends on the entity, jurisdiction, and type of interest issued." },
            { title: "Existing lenders and investors.", text: "Mortgage agreements, guarantees, partnership agreements, and other contracts may restrict equity transfers, new investors, distributions, or changes in control. These restrictions must be reviewed before issuing tokens." },
          ],
        },
      ],
    },
    {
      id: "ltc-retirement",
      title: "7. A sensible structure for an owner approaching retirement",
      blocks: [
        { type: "p", text: "For an owner who wants to reduce personal involvement without abruptly selling the entire portfolio, a structure like this is worth evaluating first:" },
        {
          type: "flow",
          testId: "ltc-retirement-diagram",
          levels: [
            [{ title: "Retiring owner", text: "Retains a negotiated ownership stake" }],
            [{ title: "Holding LLC", text: "Owns property LLCs and/or interests in operating entities" }],
            [
              { title: "Property entities", text: "Real estate, leases and property-level financing" },
              { title: "Operating entities", text: "Licensed care operations, staff and resident services" },
            ],
            [{ title: "Tokenized investment interests", text: "Issued to qualified investors under legally compliant offering documents" }],
          ],
        },
        { type: "p", text: "The owner could retain control through voting rights, a manager-managed LLC, or another legally valid governance arrangement while selling some economic participation. Those rights must be carefully drafted; retaining voting control does not necessarily mean retaining complete operational or regulatory control." },
        { type: "p", text: "Three alternatives are worth comparing before proceeding:" },
        {
          type: "bullets",
          items: [
            "Partial equity sale: suitable when the owner wants cash now and is willing to share future upside.",
            "Real estate investment structure: suitable when the owner wants to separate property ownership from care operations.",
            "Full or staged business sale: suitable when retirement and a complete exit are the primary goals, with tokenization considered only if it improves the economics or buyer pool.",
          ],
        },
      ],
    },
    {
      id: "ltc-before-launch",
      title: "8. What to establish before launching",
      blocks: [
        { type: "p", text: "The first steps are to determine the ownership structure, obtain an independent valuation, review facility licences and funding agreements, model debt and distributable cash flow, and obtain legal and tax advice on the proposed token offering. Only then select a token platform." },
        { type: "note", text: "The platform is the technical layer. The real value lies in a well-structured investment, clear investor rights, sound care operations, and a credible exit strategy." },
      ],
    },
  ],
};

const DE: LongTermCareEssay = {
  kicker: "Tokenisierung",
  title: "Tokenisierung einer LLC, die Langzeitpflegeeinrichtungen besitzt",
  subtitle:
    "Wie digitale Token Eigentum oder wirtschaftliche Rechte an einer Pflegeheim-LLC aufteilen können – um Kapital zu beschaffen, Investoren aufzunehmen oder die Nachfolge zu planen.",
  disclaimer: "Allgemeine Informationen, keine Rechtsberatung.",
  print: "Essay drucken",
  intro: [
    "Tokenisierung ist eine Methode, Eigentum oder bestimmte wirtschaftliche Rechte an einem Unternehmen in digitale Einheiten – sogenannte Token – aufzuteilen, die von Investoren gehalten und unter Umständen übertragen werden können.",
    "Für Betreiber oder Eigentümer von Langzeitpflegeeinrichtungen kann die Tokenisierung ein Weg sein, Kapital zu beschaffen, neue Investoren zu gewinnen, Modernisierungen zu finanzieren oder das Eigentum schrittweise an Nachfolger zu übergeben, während ein professionelles Management bestehen bleibt.",
    "Entscheidend ist: Die Token verkörpern rechtlich definierte Rechte an der LLC. Sie stellen nicht automatisch direktes Eigentum an den Pflegeheimen, am Grundstück oder am Pflegebetrieb für die Bewohner dar.",
  ],
  sections: [
    {
      id: "ltc-structure",
      title: "1. So funktioniert die Struktur",
      blocks: [
        { type: "p", text: "Angenommen, eine Eigentümerin betreibt drei Langzeitpflegeeinrichtungen über eine LLC. Die LLC besitzt die Immobilien, Gebäude, Ausstattung und eventuell auch den Pflegebetrieb." },
        {
          type: "flow",
          testId: "ltc-structure-diagram",
          levels: [
            [{ title: "Drei Langzeitpflegeeinrichtungen", text: "Gebäude, Grundstücke, Ausstattung und/oder Pflegebetrieb" }],
            [{ title: "Immobilien- oder Betreiber-LLC", text: "Hält Vermögenswerte, Verträge, Schulden und betriebliche Verpflichtungen" }],
            [{ title: "Digitale Token, verknüpft mit LLC-Anteilen", text: "Verkörpern festgelegte Eigentums-, Ausschüttungs- oder Investitionsrechte" }],
            [
              { title: "Investor A", text: "Token" },
              { title: "Investor B", text: "Token" },
              { title: "Weitere Investoren", text: "Token" },
            ],
          ],
        },
        { type: "p", text: "Die LLC bleibt die juristische Person, die für die in ihren Verträgen festgelegten Vermögenswerte und Verpflichtungen verantwortlich ist. Das Token-System erfasst, wer die Beteiligungen hält, und kann bestimmte Vorgänge automatisieren – im Rahmen der maßgeblichen Rechtsdokumente." },
      ],
    },
    {
      id: "ltc-what-owned",
      title: "2. Was genau besitzen die Investoren?",
      blocks: [
        { type: "p", text: "Die Transaktion lässt sich auf verschiedene Weise strukturieren. Die beste Wahl hängt davon ab, ob die Eigentümerin Immobilien verkaufen, Kapital für den Pflegebetrieb beschaffen oder sich aus dem Eigentum zurückziehen möchte." },
        {
          type: "options",
          items: [
            { letter: "A", title: "Token als Eigenkapital an der LLC", text: "Investoren erwerben Mitgliedschaftsanteile an der LLC. Sie können Anspruch auf einen Teil der ausschüttbaren Gewinne, auf Verkaufserlöse und auf bestimmte Stimmrechte haben. Die ursprüngliche Eigentümerin kann eine Mehrheitsbeteiligung behalten." },
            { letter: "B", title: "Token als Beteiligung an der Immobilie", text: "Eine Immobilien-LLC hält Grundstücke und Gebäude, während ein separat lizenzierter Betreiber die Pflegeeinrichtungen führt. Investoren sind an den Immobilienerträgen beteiligt – etwa an der Miete des Betreibers – sowie an einem späteren Verkaufserlös." },
            { letter: "C", title: "Token als Beteiligung am Pflegebetrieb", text: "Investoren sind an der Wirtschaftlichkeit des Pflegebetriebs beteiligt, etwa an Betriebsgewinnen und Unternehmensverkaufserlösen. Diese Struktur setzt Investoren unmittelbarer Personalkosten, Belegung, Vergütungssätzen und regulatorischen Risiken aus." },
            { letter: "D", title: "Fremdkapital- oder ertragsgebundene Token", text: "Investoren leihen der LLC Geld oder erhalten vertraglich definierte Ertragsrechte statt klassischem Eigenkapital. Sie haben unter Umständen keine Eigentums- oder Stimmrechte; ihr Zahlungsrang ergibt sich aus den Finanzierungsdokumenten." },
          ],
        },
        { type: "note", text: "Diese Strukturen sind nicht austauschbar. Insbesondere befreit die Bezeichnung „Token“ ein Instrument nicht vom Wertpapierrecht und macht aus einem vertraglichen Anspruch kein rechtliches Eigentum an einer Immobilie." },
      ],
    },
    {
      id: "ltc-example",
      title: "3. Praxisbeispiel: Tokenisierung eines Portfolios von CA$30 Millionen",
      blocks: [
        { type: "p", text: "Angenommen, die Eigentümerin besitzt drei Langzeitpflegeeinrichtungen mit einem Gesamtwert von CA$30 Millionen. Auf dem Portfolio lastet eine Hypothek von CA$10 Millionen. Das Eigenkapital beträgt also rund CA$20 Millionen – vor Transaktionskosten, Steuern und sonstigen Verbindlichkeiten." },
        {
          type: "valuation",
          total: "CA$30.000.000",
          label: "Illustrative Portfoliobewertung",
          parts: [
            { label: "Bestehende Hypothek", value: "CA$10 Mio.", pct: 33.3 },
            { label: "Eigenkapital der Eigentümerin", value: "CA$20 Mio.", pct: 66.7 },
          ],
        },
        { type: "lead", title: "Beispielhafte Kapitalbeschaffung", text: "Die Eigentümerin verkauft 25 % des Eigenkapitals der LLC für CA$5 Millionen an Investoren – unter der Annahme, dass das Eigenkapital fair mit CA$20 Millionen bewertet ist und keine weiteren Anpassungen anfallen." },
        {
          type: "split",
          parts: [
            { label: "Ursprüngliche Eigentümerin", pct: 75, text: "Behaltenes Eigenkapital" },
            { label: "Neue Investoren", pct: 25, text: "Gemeinsames Eigenkapital" },
          ],
        },
        { type: "note", text: "Annahme: Es handelt sich um eine Primäremission bzw. Kapitalmaßnahme, bei der die LLC die CA$5 Millionen erhält. Verkauft die Eigentümerin bestehende Anteile persönlich, fließt der Erlös in der Regel ihr zu." },
        { type: "lead", title: "Wie könnten die digitalen Token aussehen?", text: "Die LLC könnte 20 Millionen digitale Token ausgeben, von denen jeder einem Zwanzigmillionstel des gesamten Eigenkapitals entspricht. In dieser beispielhaften Struktur:" },
        {
          type: "bullets",
          items: [
            "15 Millionen Token gehören der ursprünglichen Eigentümerin.",
            "5 Millionen Token gehören den neuen Investoren.",
            "Jeder Token entspricht 0,000005 % des gesamten Eigenkapitals der LLC.",
          ],
        },
        { type: "p", text: "Die Anzahl der Token ist beliebig; entscheidend ist, dass die rechtlichen Eigentumsnachweise und Gesellschaftsverträge genau festlegen, was jeder Token verkörpert." },
      ],
    },
    {
      id: "ltc-returns",
      title: "4. Wie Investoren eine Rendite erzielen könnten",
      blocks: [
        { type: "p", text: "Investoren betrachten typischerweise drei mögliche Ertragsquellen." },
        {
          type: "steps",
          items: [
            { title: "Laufende Ausschüttungen:", text: "Erwirtschaften die Einrichtungen nach Personal, Verpflegung, Energie, Instandhaltung, Schuldendienst, Rücklagen und sonstigen Kosten ausschüttbare Mittel, können Investoren entsprechend ihren Rechten einen Anteil erhalten." },
            { title: "Wertsteigerung von Immobilie oder Unternehmen:", text: "Höhere Belegung, effizienterer Betrieb, Renovierungen oder Marktveränderungen können den Wert der Investition erhöhen. Verluste sind ebenfalls möglich." },
            { title: "Verkauf oder Refinanzierung:", text: "Investoren können Erlöse erhalten, wenn die Einrichtungen verkauft werden, die LLC übernommen wird oder eine Refinanzierung ausschüttbares Eigenkapital freisetzt – nach Schuldentilgung und gemäß der vereinbarten Ausschüttungsreihenfolge." },
          ],
        },
        { type: "note", text: "Beispiel: Stehen der LLC in einem Jahr CA$1,2 Millionen zur Ausschüttung zur Verfügung und sind alle Eigenkapitalklassen gleichberechtigt, erhalten die Inhaber von 25 % des Eigenkapitals zusammen CA$300.000 – eine illustrative Barausschüttung von 6 % auf ihre CA$5 Millionen, keine garantierte Rendite." },
      ],
    },
    {
      id: "ltc-why",
      title: "5. Warum Tokenisierung gerade für Langzeitpflegeeinrichtungen sinnvoll sein kann",
      blocks: [
        { type: "p", text: "Bei einem Portfolio von Pflegeeinrichtungen liegt der stärkste Grund oft in Nachfolgeplanung und Kapitalbildung – nicht einfach in der Ausgabe digitaler Vermögenswerte." },
        {
          type: "table",
          caption: "Mögliche Vorteile für die Eigentümerin",
          headers: ["Möglicher Vorteil", "Wie er der Eigentümerin helfen könnte"],
          rows: [
            ["Teilweiser Ruhestand", "Einen Teil des Eigenkapitals verkaufen und dennoch beteiligt bleiben."],
            ["Wachstumskapital", "Mittel für Renovierungen, Barrierefreiheit, Ausstattung oder weitere Einrichtungen beschaffen."],
            ["Breitere Investorenbasis", "Mehrere berechtigte Investoren beteiligen, statt auf einen einzelnen Käufer angewiesen zu sein."],
            ["Schrittweise Nachfolge", "Wirtschaftliches Eigentum über die Zeit übertragen und die Geschäftsführung behalten – sofern Verträge und Vorschriften es erlauben."],
            ["Möglicherweise einfachere Übertragungen", "Eigentum und zulässige Übertragungen digital erfassen – vorbehaltlich wertpapierrechtlicher Beschränkungen."],
            ["Finanzierung auf Portfolioebene", "Über eine Holding Kapital für mehrere Einrichtungen beschaffen, sofern Eigentums- und Finanzierungsstruktur dies zulassen."],
          ],
        },
        { type: "note", text: "Wichtiger Vorbehalt: Tokenisierung schafft nicht automatisch Liquidität. Ein Token kann technisch übertragbar und dennoch rechtlich beschränkt, schwer verkäuflich oder weniger wert als sein Kaufpreis sein." },
      ],
    },
    {
      id: "ltc-issues",
      title: "6. Besondere rechtliche und finanzielle Fragen in der Langzeitpflege",
      blocks: [
        { type: "p", text: "Diese Branche ist komplexer als gewöhnliche Gewerbeimmobilien." },
        {
          type: "steps",
          items: [
            { title: "Betriebslizenzen und Genehmigung bei Kontrollwechsel.", text: "Eine Transaktion mit Gesellschaftsanteilen kann regulatorische Pflichten auslösen, selbst wenn das Gebäude nicht verkauft wird. So enthält Ontarios Fixing Long-Term Care Act, 2021 Vorgaben zu beherrschenden Beteiligungen an Lizenznehmern, und die Vorschriften von Nova Scotia regeln Kontrollwechsel bei Gesellschaften, die bestimmte Pflege- und Wohnheime besitzen. Welche Regeln gelten, hängt von Rechtsordnung und Transaktion ab." },
            { title: "Immobilie und Pflegebetrieb, wo sinnvoll, trennen.", text: "Eine mögliche Lösung ist eine Immobilien-LLC, die die Gebäude an einen separat lizenzierten Betreiber vermietet. So lassen sich Immobilieninvestment und Betriebsrisiko unterscheiden. Mietvertrag, Finanzierung, Geschäfte mit nahestehenden Parteien und regulatorische Anforderungen müssen jedoch sauber gestaltet sein; die Trennung beseitigt nicht alle Haftungsrisiken." },
            { title: "Öffentliche Finanzierung und Vergütung.", text: "Viele Einrichtungen sind auf staatliche Mittel, regulierte Vergütung oder öffentliche Verträge angewiesen. Investoren müssen verstehen, wie diese Vereinbarungen Umsatz, anrechenbare Kosten, Ausschüttungen und etwaige Kontrollwechselverfahren beeinflussen." },
            { title: "Personal- und Pflegepflichten.", text: "Personalkosten, Personalvorgaben, Bewohnersicherheit, Pflegequalität, Inspektionen, Versicherungen und mögliche Rechtsstreitigkeiten können Cashflow und Unternehmenswert erheblich beeinflussen. Ausschüttungen an Investoren haben keinen Vorrang vor gesetzlichen Pflichten der Einrichtung." },
            { title: "Wertpapierrecht, Steuern und Investorenberechtigung.", text: "Token, die Beteiligungen verkörpern, sind häufig Wertpapiere. Das Angebot muss gegebenenfalls Registrierungspflichten, Prospektausnahmen, Anforderungen an Investoren, Offenlegungs- und Weiterverkaufsbeschränkungen einhalten. Die steuerliche Behandlung hängt von Rechtsform, Rechtsordnung und Art der Beteiligung ab." },
            { title: "Bestehende Kreditgeber und Investoren.", text: "Hypothekenverträge, Bürgschaften, Gesellschaftsverträge und andere Vereinbarungen können Anteilsübertragungen, neue Investoren, Ausschüttungen oder Kontrollwechsel einschränken. Diese Beschränkungen sind vor der Ausgabe von Token zu prüfen." },
          ],
        },
      ],
    },
    {
      id: "ltc-retirement",
      title: "7. Eine sinnvolle Struktur für Eigentümer kurz vor dem Ruhestand",
      blocks: [
        { type: "p", text: "Wer sein persönliches Engagement reduzieren möchte, ohne das gesamte Portfolio abrupt zu verkaufen, sollte zunächst eine Struktur wie diese prüfen:" },
        {
          type: "flow",
          testId: "ltc-retirement-diagram",
          levels: [
            [{ title: "Eigentümerin im Übergang zum Ruhestand", text: "Behält eine ausgehandelte Beteiligung" }],
            [{ title: "Holding-LLC", text: "Besitzt Immobilien-LLCs und/oder Anteile an Betreibergesellschaften" }],
            [
              { title: "Immobiliengesellschaften", text: "Immobilien, Mietverträge und Finanzierung auf Objektebene" },
              { title: "Betreibergesellschaften", text: "Lizenzierter Pflegebetrieb, Personal und Leistungen für Bewohner" },
            ],
            [{ title: "Tokenisierte Beteiligungen", text: "An qualifizierte Investoren ausgegeben, auf Basis rechtskonformer Angebotsunterlagen" }],
          ],
        },
        { type: "p", text: "Die Eigentümerin könnte über Stimmrechte, eine managergeführte LLC oder eine andere rechtlich zulässige Governance-Struktur die Kontrolle behalten und gleichzeitig wirtschaftliche Beteiligungen verkaufen. Diese Rechte müssen sorgfältig formuliert werden; die Stimmenmehrheit bedeutet nicht zwangsläufig vollständige operative oder regulatorische Kontrolle." },
        { type: "p", text: "Vor dem nächsten Schritt lohnt der Vergleich von drei Alternativen:" },
        {
          type: "bullets",
          items: [
            "Teilverkauf von Eigenkapital: geeignet, wenn die Eigentümerin jetzt Liquidität möchte und künftige Wertsteigerungen teilen will.",
            "Immobilien-Investmentstruktur: geeignet, wenn Immobilieneigentum und Pflegebetrieb getrennt werden sollen.",
            "Vollständiger oder gestaffelter Unternehmensverkauf: geeignet, wenn Ruhestand und vollständiger Ausstieg im Vordergrund stehen – Tokenisierung nur, wenn sie die Wirtschaftlichkeit oder den Käuferkreis verbessert.",
          ],
        },
      ],
    },
    {
      id: "ltc-before-launch",
      title: "8. Was vor dem Start geklärt sein sollte",
      blocks: [
        { type: "p", text: "Die ersten Schritte: Eigentumsstruktur festlegen, eine unabhängige Bewertung einholen, Betriebslizenzen und Finanzierungsvereinbarungen prüfen, Schulden und ausschüttbaren Cashflow modellieren sowie rechtlichen und steuerlichen Rat zum geplanten Token-Angebot einholen. Erst dann wird eine Token-Plattform ausgewählt." },
        { type: "note", text: "Die Plattform ist nur die technische Ebene. Der eigentliche Wert liegt in einer gut strukturierten Investition, klaren Investorenrechten, einem soliden Pflegebetrieb und einer glaubwürdigen Exit-Strategie." },
      ],
    },
  ],
};

export const TALISU_LONG_TERM_CARE_ESSAY: Record<Locale, LongTermCareEssay> = { en: EN, de: DE };
