/**
 * Hospitality tokenization essay — second essay in the /talisu FAQ right rail
 * (switch via the "Tokenization" / "Hospitality" tabs, deep link ?essay=hospitality).
 * Wording is verbatim from the source essay; only the formatting is structured.
 * Kept outside the i18n dictionaries (English for all locales), like the
 * bare-land essay in tokenization-essay.ts.
 */

export type HospitalityFlowStep = {
  label: string;
  /** Optional smaller line under the step label. */
  caption?: string;
};

export type HospitalityEssayBlock =
  | { type: "p"; text: string }
  /** Sub-heading inside a section (e.g. "Option 1 — Full exit"). */
  | { type: "h4"; text: string }
  | { type: "bullets"; items: readonly string[] }
  /** Highlighted one-liner / formula / quoted statement. */
  | { type: "callout"; lines: readonly string[] }
  /** Stacked structure blocks joined by ↓ arrows. */
  | { type: "flow"; steps: readonly HospitalityFlowStep[]; numbered?: boolean }
  /** Worked numeric example card. */
  | { type: "example"; items: readonly string[] };

export type HospitalityEssaySection = {
  id: string;
  title: string;
  blocks: readonly HospitalityEssayBlock[];
};

export const TALISU_HOSPITALITY_ESSAY = {
  eyebrow: "Tokenization · Hospitality",
  title: "Tokenization for a Retiring Hospitality Owner",
  disclaimer: "General information, not legal advice.",
  intro: [
    "For a retiring owner of a going-concern hospitality business, tokenization can be thought of as a way to turn the owner's LLC interest into fractional digital investment interests, potentially allowing the owner to monetize part or all of the business without necessarily selling the property/business to one buyer.",
    "The key is that you are not really tokenizing the hotel, resort, inn, restaurant, or operating business itself. You are tokenizing an interest in the entity that owns the relevant assets and/or operating business.",
  ],
  sections: [
    {
      id: "hospitality-typical-structure",
      title: "A typical structure",
      blocks: [
        { type: "p", text: "Suppose the retiring owner owns:" },
        {
          type: "callout",
          lines: ["Hotel property + operating business → Hospitality LLC"],
        },
        { type: "p", text: "The LLC might own:" },
        {
          type: "bullets",
          items: [
            "the real estate;",
            "buildings and improvements;",
            "furniture, fixtures and equipment;",
            "brand/IP;",
            "operating contracts;",
            "licenses, subject to their transfer rules;",
            "reservations/customer relationships;",
            "working capital;",
            "and the ongoing hospitality operation.",
          ],
        },
        { type: "p", text: "The owner could restructure it as:" },
        {
          type: "flow",
          steps: [
            { label: "Hospitality LLC" },
            { label: "Tokenized membership/economic interests" },
            { label: "Multiple investors" },
          ],
        },
        {
          type: "p",
          text: "Instead of selling the entire business to one purchaser, the retiring owner could potentially sell, for example, 60% of the economic interest through a tokenized offering while retaining 40%.",
        },
        {
          type: "p",
          text: "Or the owner could sell 100%, receiving the proceeds and exiting entirely.",
        },
      ],
    },
    {
      id: "hospitality-example",
      title: "An example",
      blocks: [
        {
          type: "p",
          text: "Imagine a boutique hotel is worth $8 million, including its real estate and operating business.",
        },
        { type: "p", text: "The retiring owner currently owns 100% of the LLC." },
        { type: "p", text: "A possible structure might be:" },
        {
          type: "example",
          items: [
            "LLC valuation: $8M",
            "800,000 digital interests issued",
            "Target value: $10 per interest",
            "Investors acquire 600,000 interests",
            "Retiring owner retains 200,000 interests",
          ],
        },
        {
          type: "p",
          text: "The owner has effectively sold 75% while retaining 25%.",
        },
        {
          type: "p",
          text: "But the important part is that the token needs to correspond to a legally enforceable interest.",
        },
        { type: "p", text: "For example:" },
        {
          type: "callout",
          lines: [
            "One token = 1/800,000 of the defined economic interest in Hospitality LLC.",
          ],
        },
        {
          type: "p",
          text: "The operating agreement could then establish how holders participate in:",
        },
        {
          type: "bullets",
          items: [
            "operating profits;",
            "distributions;",
            "refinancing proceeds;",
            "sale of the hotel;",
            "appreciation;",
            "voting;",
            "major capital expenditures;",
            "a future sale of the business.",
          ],
        },
        {
          type: "p",
          text: "The blockchain is essentially the digital record and transfer mechanism for those interests.",
        },
      ],
    },
    {
      id: "hospitality-why-attractive",
      title: "Why this can be attractive to a retiring owner",
      blocks: [
        {
          type: "p",
          text: "The interesting feature is that retirement doesn't necessarily have to mean:",
        },
        {
          type: "callout",
          lines: ["\u201CFind one buyer willing and able to write an $8 million cheque.\u201D"],
        },
        {
          type: "p",
          text: "Instead, the owner might be able to create a structured transition:",
        },
        { type: "h4", text: "Option 1 — Full exit" },
        {
          type: "p",
          text: "The owner tokenizes/sells 100% of the economic interest.",
        },
        {
          type: "callout",
          lines: ["Owner → cash", "Investors → ownership/economic interests"],
        },
        {
          type: "p",
          text: "The owner retires completely, subject to whatever transition obligations are negotiated.",
        },
        { type: "h4", text: "Option 2 — Partial liquidity" },
        { type: "p", text: "The owner sells 60–80% and retains the balance." },
        { type: "p", text: "This can be attractive if the owner wants:" },
        {
          type: "bullets",
          items: [
            "substantial liquidity now;",
            "continuing participation in future appreciation;",
            "reduced management responsibility;",
            "and a gradual transition.",
          ],
        },
        { type: "h4", text: "Option 3 — Management succession" },
        {
          type: "p",
          text: "This can be particularly interesting for a hospitality business.",
        },
        {
          type: "p",
          text: "The retiring owner could sell the economic interest to investors while a professional hotel operator or existing management team continues running the business.",
        },
        { type: "p", text: "The structure might become:" },
        {
          type: "flow",
          steps: [
            { label: "Investors / token holders" },
            { label: "Hospitality LLC" },
            { label: "Hotel + operations" },
            { label: "Professional management company" },
          ],
        },
        {
          type: "p",
          text: "The retiring owner gets out of day-to-day operations without necessarily forcing a sale of the underlying property.",
        },
      ],
    },
    {
      id: "hospitality-ownership-vs-revenue",
      title: "The crucial distinction: ownership vs. revenue sharing",
      blocks: [
        {
          type: "p",
          text: "There are two very different things you could tokenize.",
        },
        { type: "h4", text: "Equity tokenization" },
        {
          type: "p",
          text: "The token represents an ownership/economic interest in the LLC.",
        },
        {
          type: "p",
          text: "If the business performs well, holders participate according to their rights.",
        },
        { type: "p", text: "For example:" },
        {
          type: "callout",
          lines: ["Hotel generates $1M distributable cash flow"],
        },
        {
          type: "p",
          text: "After expenses, debt service, reserves, taxes, etc., suppose $600,000 is available for distribution.",
        },
        {
          type: "p",
          text: "If an investor owns 5% of the relevant economic interests, they might receive approximately:",
        },
        { type: "callout", lines: ["$600,000 × 5% = $30,000"] },
        { type: "p", text: "subject to the actual governing documents." },
        { type: "h4", text: "Revenue tokenization" },
        {
          type: "p",
          text: "Alternatively, investors could receive a contractual percentage of hotel revenue without owning the LLC.",
        },
        { type: "p", text: "That's a very different investment." },
        { type: "p", text: "For example:" },
        {
          type: "callout",
          lines: ["Investors receive 2% of gross room revenue for ten years."],
        },
        {
          type: "p",
          text: "The investor doesn't necessarily own part of the hotel or participate in its eventual sale.",
        },
        {
          type: "p",
          text: "For a retiring owner, equity tokenization can be much closer to an actual business succession/exit transaction, whereas revenue tokenization resembles financing.",
        },
      ],
    },
    {
      id: "hospitality-income-and-appreciation",
      title: "The hotel creates another interesting possibility",
      blocks: [
        {
          type: "p",
          text: "Unlike bare land, a going-concern hospitality business can generate ongoing cash flow.",
        },
        {
          type: "p",
          text: "So the token can potentially have two economic components:",
        },
        { type: "h4", text: "1. Income" },
        {
          type: "callout",
          lines: ["Hotel operating profits → distributions to eligible owners."],
        },
        { type: "h4", text: "2. Capital appreciation" },
        {
          type: "callout",
          lines: [
            "Hotel/business value increases → investors benefit when the property/business is eventually refinanced or sold.",
          ],
        },
        {
          type: "p",
          text: "That's potentially much more compelling than tokenizing a non-income-producing parcel of land.",
        },
      ],
    },
    {
      id: "hospitality-token-issue",
      title: "But there's a major issue with \u201Ctokens\u201D",
      blocks: [
        {
          type: "p",
          text: "You can't simply create 1 million blockchain tokens and declare:",
        },
        {
          type: "callout",
          lines: ["\u201CEach token represents 1/1,000,000 of the hotel.\u201D"],
        },
        { type: "p", text: "The legal documents have to make that true." },
        {
          type: "p",
          text: "You would generally need the LLC's governing documents and transaction documents to establish things such as:",
        },
        {
          type: "bullets",
          items: [
            "exactly what a token represents;",
            "who legally owns the corresponding LLC interest;",
            "voting rights;",
            "distribution rights;",
            "liquidation rights;",
            "transfer rights;",
            "restrictions on transfers;",
            "investor eligibility;",
            "what happens if tokens are lost;",
            "what happens upon a sale of the hotel;",
            "how a forced sale is handled;",
            "how new capital can be raised;",
            "dilution;",
            "management authority;",
            "related-party transactions;",
            "succession;",
            "death/disability;",
            "bankruptcy;",
            "regulatory compliance.",
          ],
        },
        {
          type: "p",
          text: "The smart contract then implements some of those rules electronically.",
        },
      ],
    },
    {
      id: "hospitality-retirement-structure",
      title: "A particularly useful retirement structure",
      blocks: [
        {
          type: "p",
          text: "For a retiring owner, I'd consider a structure along these lines conceptually:",
        },
        {
          type: "flow",
          steps: [
            { label: "Existing owner" },
            { label: "Reorganized Hospitality Holding LLC" },
            { label: "Hotel/property + operating assets" },
            { label: "Tokenized economic interests" },
          ],
        },
        {
          type: "p",
          text: "Then divide the transaction into three components:",
        },
        { type: "h4", text: "A. Retiring owner's liquidity" },
        {
          type: "p",
          text: "The owner sells a defined percentage of the LLC.",
        },
        { type: "h4", text: "B. Continuing management" },
        {
          type: "p",
          text: "A management agreement keeps the hotel operating without requiring the retiring owner to remain involved.",
        },
        { type: "h4", text: "C. Investor distributions" },
        {
          type: "p",
          text: "Eligible token holders receive distributions according to the LLC agreement.",
        },
        {
          type: "p",
          text: "That allows the business to continue operating as a business while ownership changes underneath it.",
        },
      ],
    },
    {
      id: "hospitality-complication",
      title: "One important complication",
      blocks: [
        {
          type: "p",
          text: "If the LLC owns both the real estate and the operating business, I would seriously consider whether they should remain in one entity.",
        },
        { type: "p", text: "A more sophisticated structure could be:" },
        {
          type: "flow",
          steps: [
            { label: "Property LLC", caption: "owns the hotel real estate" },
            { label: "Operating LLC", caption: "runs the hospitality business" },
            { label: "Management company" },
          ],
        },
        {
          type: "p",
          text: "Then tokenization could occur at the appropriate holding-company level.",
        },
        {
          type: "p",
          text: "That separation can make the economics much easier to understand because investors can distinguish:",
        },
        {
          type: "bullets",
          items: [
            "real-estate value;",
            "operating-business value;",
            "operating risk;",
            "debt;",
            "management fees;",
            "and distributions.",
          ],
        },
        {
          type: "p",
          text: "It can also matter substantially for financing, taxation, liability, licensing and securities-law analysis.",
        },
      ],
    },
    {
      id: "hospitality-not-blockchain",
      title: "The biggest issue is not blockchain",
      blocks: [
        {
          type: "p",
          text: "For an actual retiring owner, I'd approach this as a business succession + securities + real-estate transaction that happens to use blockchain technology.",
        },
        { type: "p", text: "The order should generally be:" },
        {
          type: "flow",
          numbered: true,
          steps: [
            { label: "Value the business" },
            { label: "Determine what is actually being sold" },
            { label: "Restructure the ownership if necessary" },
            { label: "Establish investor/economic rights legally" },
            { label: "Determine securities/regulatory requirements" },
            { label: "Create the token" },
            { label: "Establish compliant issuance and transfer procedures" },
            { label: "Operate the hotel and make distributions" },
          ],
        },
        {
          type: "p",
          text: "The token is therefore the last-mile technology, rather than the legal foundation.",
        },
      ],
    },
  ] satisfies readonly HospitalityEssaySection[],
} as const;
