/**
 * Tokenization essay shown on the right half of /talisu FAQ.
 * Kept outside the i18n dictionaries so EN/DE parity tests stay intact;
 * rendered in English for all locales (FAQ accordion remains localized).
 */

export type TokenizationEssayModelRow = {
  model: string;
  represents: string;
};

export type TokenizationEssaySection = {
  id: string;
  title: string;
  paragraphs?: readonly string[];
  bullets?: readonly string[];
  /** Optional ordered design options (A–E). */
  lettered?: readonly { letter: string; text: string }[];
  /** Optional callout / flow line under a section. */
  flow?: string;
  note?: string;
};

export const TALISU_TOKENIZATION_ESSAY = {
  title: "Tokenization of an LLC That Owns Bare Land",
  subtitle:
    "How blockchain tokens can represent economic or ownership interests in a land-holding LLC — without tokenizing the deed itself.",
  disclaimer: "General information, not legal advice.",
  intro:
    "Tokenization of an LLC that owns bare land generally means creating blockchain-based digital tokens that represent an economic or ownership interest in the LLC, rather than tokenizing the land deed itself.",
  sections: [
    {
      id: "basic-structure",
      title: "The basic structure",
      paragraphs: [
        "Suppose:",
      ],
      bullets: [
        "Land: 100 acres of undeveloped land",
        "Owner: LandCo LLC",
        "Land value: $10 million",
        "Tokens: 1,000,000 tokens",
      ],
      flow: "Bare land → LLC → membership interests / economic rights → digital tokens",
      note:
        "The typical structure looks like the flow above. The LLC remains the registered owner of the land. The tokens represent whatever rights the LLC’s legal documents say they represent.",
    },
    {
      id: "token-rights",
      title: "What the tokens represent",
      paragraphs: [
        "For example, if the LLC issues 1,000,000 tokens and each token represents 1/1,000,000 of the LLC’s economic interest, a holder of 100,000 tokens might have an economic interest equivalent to 10% — but only if the operating agreement and token terms actually grant that right.",
      ],
    },
    {
      id: "what-is-tokenized",
      title: "What is actually being tokenized?",
      paragraphs: [
        "There are several materially different models.",
      ],
      note:
        "These are not interchangeable. Calling something a “real-estate token” does not determine what legal rights the purchaser has.",
    },
    {
      id: "example-parcel",
      title: "Example: $10 million parcel",
      paragraphs: [
        "Imagine an LLC acquires bare land for $10 million and issues 1,000,000 tokens at $10 each. An investor who buys 25,000 tokens for $250,000 would hold 2.5% — if the tokens are proportional equity interests under the governing documents.",
        "If the land later sells for $15 million, distributions follow the rights in those documents — not a simple $15 million ÷ 1,000,000 = $15 per token. Debt, expenses, taxes, reserves, fees, preferred interests, and other waterfalls can all change what a token holder actually receives.",
      ],
    },
    {
      id: "why-llc",
      title: "Why use an LLC?",
      paragraphs: [
        "Blockchain does not magically transfer title to land. Title stays with the LLC (or other legal owner). Tokens sit one or more layers above that ownership.",
      ],
      flow: "Investor → Token → LLC membership / economic rights → LLC → Title to land",
    },
    {
      id: "important-distinction",
      title: "The important distinction",
      paragraphs: [
        "Two systems run in parallel:",
      ],
      bullets: [
        "Legal: title, deed, LLC formation, operating agreement, securities documents, and related paperwork determine what ownership or economic rights exist.",
        "Blockchain: token contract, wallets, balances, whitelist, and secondary-market mechanics record who controls the token.",
      ],
      note:
        "The blockchain records who controls the token; the legal documents determine what that token means.",
    },
    {
      id: "bare-land",
      title: "Bare land can make the structure interesting",
      paragraphs: [
        "With undeveloped land there is often little or no rental income at the start. Economics may instead turn on appreciation, sale, subdivision, rezoning, development, leasing, or resource rights — depending on what the project and legal documents allow.",
      ],
    },
    {
      id: "securities",
      title: "A major legal issue: securities",
      paragraphs: [
        "Where purchasers expect profits from the efforts of others, tokens may be treated as securities under frameworks such as the Howey test (U.S.) and comparable analysis elsewhere.",
        "That can imply purchaser limits, qualification or exemption pathways, disclosure, resale rules, KYC/AML, and transfer restrictions. Requirements in Canada and the United States differ — and neither is covered by a marketing summary.",
      ],
    },
    {
      id: "design-question",
      title: "One particularly important design question",
      paragraphs: [
        "What should a token holder own?",
      ],
      lettered: [
        {
          letter: "A",
          text: "Membership / equity interest in the land-owning LLC",
        },
        {
          letter: "B",
          text: "Economic participation rights (distributions / returns) without full membership",
        },
        {
          letter: "C",
          text: "A contractual claim against the LLC or project economics",
        },
        {
          letter: "D",
          text: "An interest in an SPV that owns the land-owning LLC",
        },
        {
          letter: "E",
          text: "Direct beneficial ownership of the land itself",
        },
      ],
      note:
        "Options A–D are generally easier to structure than E. Direct beneficial ownership of land (E) raises title, registration, and regulatory issues that often make it impractical compared with interests in an entity stack.",
    },
  ] satisfies readonly TokenizationEssaySection[],
  modelsTable: {
    caption: "Token models compared",
    headers: ["Model", "What the token represents"] as const,
    rows: [
      {
        model: "Equity token",
        represents: "Actual membership / equity interest in the LLC",
      },
      {
        model: "Economic-interest token",
        represents:
          "Right to specified distributions or economic returns, without full membership rights",
      },
      {
        model: "Debt token",
        represents: "Loan / secured debt against the LLC or property",
      },
      {
        model: "Revenue token",
        represents: "Contractual right to a defined portion of future revenue",
      },
      {
        model: "SPV token",
        represents:
          "Interest in a separate entity that owns the land-owning LLC",
      },
      {
        model: "Fractional beneficial interest",
        represents:
          "Contractual / beneficial claim to the property economics",
      },
    ] as const satisfies readonly TokenizationEssayModelRow[],
  },
} as const;
