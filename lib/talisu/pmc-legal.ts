/**
 * Service Agreement (PMC PDF Appendix A) and Privacy Policy (Appendix B),
 * transcribed from Ralf's PMC PDF (2026-10-14).
 *
 * - Contract page: full Service Agreement (sections 1–12) + Acceptance.
 * - Terms of Service page: the Service Agreement minus section 12
 *   (Governing Law), as Arun requested.
 * - Fee amounts are shown in CAD (the PDF used a bare "$").
 */

export type LegalBlock = string | { list: string[] } | { lettered: string[] };
export type LegalSection = { n: number; title: string; blocks: LegalBlock[] };

export const SERVICE_AGREEMENT_INTRO =
  "This Service Agreement (“Agreement”) is entered into between TalisALL PMC (“Provider”), and the undersigned (“Customer”), effective as of the date signed (“Effective Date”).";

export const SERVICE_AGREEMENT: LegalSection[] = [
  {
    n: 1,
    title: "Services",
    blocks: [
      "Provider operates an online software-as-a-service platform (“Platform”) that uses interactive maps, geographic information, digital content, and related tools to promote real estate properties, developments, businesses, and related services.",
      "Provider grants Customer a limited, non-exclusive, non-transferable right to access and use the Platform for its intended marketing purposes, subject to this Agreement.",
    ],
  },
  {
    n: 2,
    title: "Customer Responsibilities",
    blocks: [
      "Customer is solely responsible for all information, listings, photographs, videos, descriptions, links, logos, trademarks, advertisements, and other materials submitted to, uploaded to, or displayed through the Platform (“Customer Content”).",
      "Customer represents and warrants that:",
      {
        list: [
          "Customer has all necessary rights, permissions, and authorizations to publish its Customer Content.",
          "All submitted information is accurate and not misleading to the best of Customer’s knowledge.",
          "Customer Content complies with applicable laws, regulations, advertising standards, real estate licensing requirements, and third-party intellectual property rights.",
          "Customer will promptly correct or remove inaccurate, unauthorized, unlawful, or outdated content.",
        ],
      },
      "Customer is responsible for obtaining any necessary consent from property owners, listing agents, image owners, and other relevant parties.",
    ],
  },
  {
    n: 3,
    title: "Platform Role and No Endorsement",
    blocks: [
      "The Platform is a technology and marketing service only. Provider does not act as a real estate broker, agent, property manager, appraiser, legal adviser, or transaction intermediary by providing the Services.",
      "The display of a property, listing, business, product, service, advertisement, link, or other content does not constitute an endorsement, verification, recommendation, or guarantee by Provider.",
      "Unless expressly agreed in writing, Provider does not independently verify property ownership, listing authority, measurements, pricing, availability, property condition, legal status, investment performance, or the accuracy of information supplied by Customer or third parties.",
    ],
  },
  {
    n: 4,
    title: "Disclaimer of Warranties",
    blocks: [
      "To the maximum extent permitted by applicable law, the Platform and Services are provided on an “as is” and “as available” basis.",
      "Provider makes no express or implied warranty regarding:",
      {
        list: [
          "The accuracy, completeness, currency, legality, or reliability of any listing, map, data, or content.",
          "The visibility, placement, reach, impressions, engagement, leads, or commercial results of any marketing material.",
          "The uninterrupted availability, security, compatibility, or error-free operation of the Platform.",
          "The suitability of any property, product, service, listing, or other content displayed through the Platform.",
        ],
      },
      "Customer acknowledges that online mapping, geographic information, third-party data, internet connectivity, and external services may be inaccurate, unavailable, or subject to change.",
      "Customer furthermore acknowledges that Provider does not guarantee that any property, listing, product, advertisement, or other content will be displayed, remain available, receive traffic, generate leads, or result in a transaction as a result of being listed, pinned, featured or promoted.",
    ],
  },
  {
    n: 5,
    title: "Limitation of Liability and Content Exposure",
    blocks: [
      "To the maximum extent permitted by applicable law, Provider shall not be liable for any loss, damage, claim, cost, or expense arising from or relating to:",
      {
        lettered: [
          "The publication, display, distribution, visibility, ranking, promotion, omission, or removal of any property, product, service, listing, advertisement, or other content through the Platform.",
          "Any inaccurate, incomplete, outdated, misleading, unauthorized, defamatory, infringing, unlawful, or otherwise objectionable content supplied by Customer or any third party.",
          "Any reliance on information, representations, photographs, maps, descriptions, pricing, availability, or other material displayed through the Platform.",
          "Any property transaction, investment decision, negotiation, contract, dispute, or interaction between Customer and a prospective buyer, seller, tenant, landlord, agent, developer, advertiser, or other third party.",
          "Any loss of data, business opportunities, revenue, profits, goodwill, leads, anticipated savings, or business interruption.",
          "Any interruption, outage, technical failure, cyber incident, third-party service failure, or unauthorized access, except to the extent liability cannot lawfully be excluded.",
        ],
      },
      "To the maximum extent permitted by law, Provider shall not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages, or for loss of profits, revenue, business, or opportunity, whether arising in contract, tort (including negligence), statute, or otherwise.",
      "Aggregate Liability Cap. To the maximum extent permitted by applicable law, Provider’s total aggregate liability arising out of or relating to this Agreement or the Services shall not exceed the fees paid or payable by Customer to Provider for the Services during the twelve (12) months immediately preceding the event giving rise to the claim.",
      "The exclusions and limitations in this section apply regardless of the legal basis of the claim, subject to any liability that cannot lawfully be excluded or limited.",
    ],
  },
  {
    n: 6,
    title: "Indemnification",
    blocks: [
      "To the extent permitted by applicable law, Customer shall indemnify and hold harmless Provider and its officers, employees, and contractors against third-party claims, liabilities, damages, and reasonable legal expenses arising from:",
      {
        list: [
          "Customer Content or materials supplied by Customer.",
          "Customer’s breach of this Agreement or applicable law.",
          "Customer’s infringement of third-party rights.",
          "Customer’s representations, advertisements, listings, or dealings with third parties.",
        ],
      },
      "This obligation does not apply to the extent a claim results from Provider’s own wrongful conduct or other circumstances for which Customer cannot lawfully be required to provide indemnification.",
    ],
  },
  {
    n: 7,
    title: "Fees and Payment Schedule",
    blocks: [
      "Customer shall pay the subscription fees and any applicable charges agreed in the applicable order form, subscription plan, or written quotation.",
      "Fees are payable in advance and non-refundable to the extent permitted by law.",
      "Fee Schedule (all amounts in CAD):",
      {
        list: [
          "Root Account: CAD 1,000 annually; CAD 100 monthly*.",
          "Derivative Account: CAD 200 annually; CAD 100 monthly; pin: CAD 7 weekly* **.",
          "FSBO Account: CAD 1,000 annually; CAD 100 monthly*.",
          "Adpro Account: CAD 1,000 annually; CAD 100 monthly*.",
        ],
      },
      "* No long term commitment required. Just stop paying annual, monthly or weekly instalments and all obligation stops.",
      "** Weekly pin schedules ensure that no sold listings will remain on the system past their next instalment date.",
      "Reward Schedule:",
      {
        list: [
          "Root Accounts: 70% of monthly account and pin revenue derived from Derivative Account Holders.",
          "Derivative Accounts: none; benefit derives from exposure and relationship marketing advantages.",
          "FSBO Accounts: none; benefit derives from savings in brokerage fees.",
          "Adpro Accounts: none; benefit derives from increased levels of exposure to highly targeted and differentiated user groups.",
        ],
      },
      "Pay-outs:",
      {
        list: [
          "The 1st or 16th of every month, two months deferred to allow for charge-backs and other adjustments to be processed.",
        ],
      },
      "Provider may suspend access for overdue payments after providing three days notice in accordance with this Agreement, or by applicable law.",
    ],
  },
  {
    n: 8,
    title: "Intellectual Property",
    blocks: [
      "Provider retains all rights, title, and interest in the Platform, software, mapping interface, design, underlying technology, and Provider-owned materials.",
      "Customer retains ownership of Customer Content, subject to the rights necessary for Provider to deliver the Services.",
      "Customer grants Provider a non-exclusive, worldwide, royalty-free licence to host, reproduce, display, transmit, and technically process Customer Content to operate, maintain, support, and provide the Services.",
      "No ownership of the Platform is transferred to Customer.",
    ],
  },
  {
    n: 9,
    title: "Suspension and Termination",
    blocks: [
      "Either party may terminate this Agreement in accordance with the applicable subscription terms or written notice period agreed between the parties.",
      "Provider may suspend or terminate access where reasonably necessary to address content violations, non-payment, unlawful activity, security risks, material breach, or misuse of the Platform, subject to applicable law and any required notice.",
      "Upon termination, Customer’s right to access and use the Platform ends. Provider may remove Customer Content in accordance with its retention policies and applicable legal obligations.",
    ],
  },
  {
    n: 10,
    title: "Privacy and Data Protection",
    blocks: [
      "Each party shall comply with applicable privacy and data protection laws.",
      "Provider may process personal information as reasonably necessary to provide and maintain the Services, administer accounts, protect the Platform, and meet legal obligations. Further details may be set out in Provider’s privacy policy or a separate data processing agreement.",
      "Customer is responsible for ensuring that its collection and submission of personal information through the Platform is lawful.",
    ],
  },
  {
    n: 11,
    title: "General Provisions",
    blocks: [
      "This Agreement constitutes the entire agreement between the parties concerning the Services and supersedes prior agreements on the same subject, except for any separately executed terms expressly incorporated herein.",
      "Any amendment must be agreed upon in writing by the parties.",
      "Neither party shall be liable for a delay or failure caused by circumstances beyond its reasonable control, subject to applicable law.",
      "If any provision is found unenforceable, the remaining provisions shall remain in effect to the full extent permitted by law.",
      "This Agreement does not create a partnership, joint venture, agency, fiduciary relationship, or employment relationship between the parties.",
    ],
  },
  {
    n: 12,
    title: "Governing Law",
    blocks: [
      "This Agreement shall be governed by the laws of Nova Scotia, Canada, and the parties agree to submit to the jurisdiction of the courts located in Nova Scotia, Canada, subject to any mandatory legal rights or rules that apply.",
    ],
  },
];

/** Terms of Service = Service Agreement minus section 12 (Governing Law). */
export const TERMS_OF_SERVICE: LegalSection[] = SERVICE_AGREEMENT.filter((s) => s.n !== 12);

export const SERVICE_AGREEMENT_PROVIDER = {
  business: "TalisALL PMC",
  representative: "Ralf P. Meyer",
  signedOn: "October 13, 2026",
};

export const SERVICE_AGREEMENT_ACCEPTANCE =
  "By signing below, the parties acknowledge that they have read, understood, and agreed to this Service Agreement.";

export const PRIVACY_POLICY_META = {
  effectiveDate: "October 14, 2026",
  company: "TalisALL",
  websites: "talisu.com; talispros.com; taliswebs.com; talishouse.com",
};

export const PRIVACY_POLICY: LegalSection[] = [
  {
    n: 1,
    title: "Introduction",
    blocks: [
      "TalisALL (“Company,” “we,” “us,” or “our”) operates a software-as-a-service (“SaaS”) platform designed to promote real estate, properties, locations, real estate professionals, and related services.",
      "This Privacy Policy explains how we collect, use, disclose, and protect information when you access or use our website, platform, and related services (collectively, the “Service”).",
      "By using the Service, you acknowledge this Privacy Policy.",
    ],
  },
  {
    n: 2,
    title: "Information We Collect",
    blocks: [
      "We may collect the following categories of information:",
      {
        list: [
          "Account Information: Name, email address, telephone number, company name, login credentials, and other information provided when creating an account.",
          "Property and Promotional Information: Property descriptions, photographs, videos, map locations, links, marketing materials, and other content submitted or published through the Service.",
          "Usage Information: Pages visited, features used, device information, browser type, IP address, and general interaction data.",
          "Communications: Information provided when contacting us for support, making inquiries, or providing feedback.",
          "Transaction Information: Subscription details and billing records. Payment card information may be processed by third-party payment providers rather than stored directly by us.",
        ],
      },
    ],
  },
  {
    n: 3,
    title: "How We Use Information",
    blocks: [
      "We use collected information to:",
      {
        list: [
          "Operate, maintain, and improve the Service.",
          "Create and administer user accounts.",
          "Display and distribute property listings, promotional materials, and map-based information.",
          "Facilitate connections between users, real estate professionals, property owners, and prospective customers.",
          "Process subscriptions and payments.",
          "Communicate service announcements, respond to inquiries, and provide technical support.",
          "Detect fraud, prevent misuse, maintain security, and enforce our agreements.",
          "Comply with legal obligations and protect our legitimate business interests.",
        ],
      },
      "We do not sell personal information in exchange for money. Where applicable law defines certain advertising-related disclosures or data sharing as a “sale” or “sharing,” we will comply with the requirements applicable to those activities.",
    ],
  },
  {
    n: 4,
    title: "Publicly Displayed Content",
    blocks: [
      "The Service may permit users, property owners, real estate professionals, agencies, and other third parties to submit and publish information, photographs, videos, descriptions, links, contact details, and other materials.",
      "Content published publicly may be accessible to other users, searchable online, copied, or redistributed by third parties.",
      "Users are responsible for ensuring that they have the necessary rights, permissions, and legal authority to submit and publish such content. Please do not submit confidential or sensitive personal information for public display unless appropriate and lawful.",
      "We may remove, restrict, or disable access to content where reasonably necessary or required by law, but we do not guarantee that all content will be reviewed or removed immediately.",
    ],
  },
  {
    n: 5,
    title: "Property Information and Third-Party Content",
    blocks: [
      "The Service may display information obtained from users, third-party websites, public sources, mapping providers, real estate databases, advertisers, and other external sources.",
      "We do not guarantee the accuracy, completeness, reliability, currency, availability, ownership status, legal status, pricing, dimensions, location, or other characteristics of any property or related content displayed through the Service.",
      "The Service is intended for promotional and informational purposes only. Users should independently verify property information and obtain appropriate professional advice before making purchasing, selling, leasing, investment, or other decisions.",
      "We are not responsible for the acts, omissions, representations, products, services, or content of third parties, subject to applicable law.",
    ],
  },
  {
    n: 6,
    title: "Cookies and Similar Technologies",
    blocks: [
      "We may use cookies, pixels, analytics tools, and similar technologies to maintain sessions, remember preferences, understand platform usage, improve performance, and support permitted marketing activities.",
      "You may be able to manage cookies through your browser settings or available privacy controls. Disabling certain cookies may affect the functionality of the Service.",
      "Where required by law, we will obtain consent before using non-essential cookies or similar technologies.",
    ],
  },
  {
    n: 7,
    title: "Sharing and Disclosure of Information",
    blocks: [
      "We may disclose information to:",
      {
        list: [
          "Hosting providers, cloud services, analytics providers, payment processors, and other service providers.",
          "Mapping, advertising, communications, and technical service partners, where necessary for the Service.",
          "Business partners or other users when required to provide a feature you request or when you authorize the disclosure.",
          "Legal, regulatory, or governmental authorities when required by law or reasonably necessary to protect rights, safety, and security.",
          "A successor entity in connection with a merger, acquisition, restructuring, financing, or sale of business assets, subject to applicable law.",
        ],
      },
      "Service providers are permitted to process information as necessary to provide their contracted services and in accordance with applicable requirements.",
    ],
  },
  {
    n: 8,
    title: "Data Retention and Security",
    blocks: [
      "We retain personal information for as long as reasonably necessary to provide the Service, maintain accounts, fulfill contractual obligations, resolve disputes, enforce agreements, and comply with legal requirements.",
      "We use reasonable administrative, technical, and organizational safeguards designed to protect information against unauthorized access, loss, misuse, or disclosure.",
      "However, no system, internet transmission, or electronic storage method is completely secure. We cannot guarantee absolute security.",
    ],
  },
  {
    n: 9,
    title: "Third-Party Websites and Services",
    blocks: [
      "The Service may contain links to third-party websites, mapping services, listing platforms, or other external resources. Those services operate under their own privacy policies and terms.",
      "We do not control and are not responsible for the privacy practices, security, availability, or content of third-party services. Users should review the applicable policies before providing information to them.",
    ],
  },
  {
    n: 10,
    title: "Your Privacy Rights",
    blocks: [
      "Depending on your location and applicable law, you may have the right to request access to, correction of, deletion of, or a copy of certain personal information, or to object to or restrict certain processing.",
      "You may also have rights relating to consent, data portability, targeted advertising, or the sale or sharing of personal information where applicable.",
      "To submit a privacy request, contact us using the details below. We may need to verify your identity before processing your request. We will respond in accordance with applicable law.",
    ],
  },
  {
    n: 11,
    title: "Children's Privacy",
    blocks: [
      "The Service is not intended for children under the age at which they may lawfully use the Service in the applicable jurisdiction. We do not knowingly collect personal information from children in violation of applicable law. If we become aware that such information has been collected unlawfully, we will take appropriate steps to address it.",
    ],
  },
  {
    n: 12,
    title: "International Data Transfers",
    blocks: [
      "Your information may be processed or stored in countries other than your country of residence, where our service providers or business operations are located. Those countries may have different data protection laws.",
      "Where required, we will implement appropriate safeguards for international transfers of personal information.",
    ],
  },
  {
    n: 13,
    title: "Changes to This Policy",
    blocks: [
      "We may update this Privacy Policy from time to time. Changes will be posted on the Service with an updated effective date. Where required by law, we will provide additional notice or obtain consent.",
      "Your continued use of the Service after an updated policy becomes effective will be subject to applicable law and any consent requirements.",
    ],
  },
  {
    n: 14,
    title: "Contact Information",
    blocks: [
      "For questions, concerns, or requests relating to this Privacy Policy, contact: TalisALL PMC — Email: welcome@talispros.com — Website: Talisall.com",
    ],
  },
];

/** Plain-text Service Agreement (stored with each signature + hashed). */
export function serviceAgreementPlainText(): string {
  const lines: string[] = ["SERVICE AGREEMENT", "", SERVICE_AGREEMENT_INTRO, ""];
  for (const s of SERVICE_AGREEMENT) {
    lines.push(`${s.n}. ${s.title}`);
    for (const b of s.blocks) {
      if (typeof b === "string") lines.push(b);
      else if ("list" in b) b.list.forEach((item) => lines.push(`  • ${item}`));
      else b.lettered.forEach((item, i) => lines.push(`  ${String.fromCharCode(97 + i)}. ${item}`));
    }
    lines.push("");
  }
  lines.push(SERVICE_AGREEMENT_ACCEPTANCE, "");
  lines.push(
    `PROVIDER — Business: ${SERVICE_AGREEMENT_PROVIDER.business}; Authorized Representative: ${SERVICE_AGREEMENT_PROVIDER.representative}; Signed: ${SERVICE_AGREEMENT_PROVIDER.signedOn}`,
  );
  return lines.join("\n");
}
