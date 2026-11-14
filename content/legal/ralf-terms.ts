import type { RalfLegalDocument } from "./ralf-document";

/** Ralf's Terms of Service, copied from the November 2026 PDF. */
export const RALF_TERMS: RalfLegalDocument = {
  testId: "terms-page",
  coverKicker: "TERMS OF SERVICE",
  coverDate: "NOVEMBER 13, 2026",
  coverTitle: "TERMS OF SERVICE",
  blocks: [
    { kind: "h2", text: "TERMS OF SERVICE AND USER AGREEMENT" },
    { kind: "p", text: "for TSPLITS™ MAPSITES" },
    { kind: "p", text: "Effective Date: November16th, 2026" },
    { kind: "p", text: "Website: www.tsplits.com" },
    { kind: "h2", text: "1. ACCEPTANCE OF TERMS" },
    {
      kind: "p",
      text: 'These Terms of Service and User Agreement ("Terms") govern access to and use of Mapsites, an online real estate inventory publishing, geographic mapping and promotional platform operated by TSPLITS Inc. ("TSPLITS", "Company", "we", "us" or "our").',
    },
    {
      kind: "p",
      text: "By registering for an account, accessing the Platform, publishing real estate inventory, creating or promoting geographic map pins, purchasing promotional services or otherwise using the Platform, users agree to be bound by these Terms.",
    },
    {
      kind: "p",
      text: 'These Terms apply to all registered users, including property owners, real estate agents, brokerages, developers, property managers, advertisers and other authorized participants ("Users").',
    },
    { kind: "h2", text: "2. PURPOSE AND NATURE OF MAPSITES" },
    {
      kind: "p",
      text: 'The term “Mapsites” refers to a proprietary online software-as-a-service ("SaaS") platform developed and operated by TSPLITS Inc..',
    },
    {
      kind: "p",
      text: "The Platform provides technology that enables Users to publish, organize, geographically identify, display and promote real estate inventory through an interactive mapping environment.",
    },
    { kind: "p", text: "The Platform enables Users to:" },
    {
      kind: "letters",
      items: [
        "Publish and maintain real estate inventory.",
        "Associate individual properties, developments, projects and other inventory with corresponding geographic map pins.",
        "Attach property descriptions, photographs, videos, documents, hyperlinks and contact information to published inventory.",
        "Create, manage and promote individual pins or groups of pins.",
        "Purchase enhanced geographic visibility, featured placements and other advertising services.",
        "Organize and present inventory by property category, geographic location, region or other available classifications.",
        "Access additional publishing, promotional and management functionality made available by TSPLITS.",
      ],
    },
    {
      kind: "p",
      text: "TSPLITS provides technology, publishing, mapping and promotional services only. TSPLITS does not operate as a real estate brokerage, agent, property owner, property manager, appraiser, lender or representative of any property transaction.",
    },
    { kind: "h2", text: "3. TWO DISTINCT COMMERCIAL SERVICES" },
    { kind: "p", text: "Mapsites operates through two separate but complementary service categories." },
    { kind: "h3", text: "3.1 Inventory Publishing Services" },
    {
      kind: "p",
      text: "Inventory Publishing Services allow authorized Users to submit, publish, display, manage and maintain real estate inventory through the Platform.",
    },
    {
      kind: "p",
      text: "Published inventory may be associated with corresponding geographic pins and made available for viewing by prospective purchasers, tenants, investors and other interested parties.",
    },
    {
      kind: "p",
      text: "Publishing services may be offered through free accounts, paid accounts, subscriptions, individual publishing fees or other commercial arrangements.",
    },
    { kind: "h3", text: "3.2 Pin Promotion and Advertising Services" },
    {
      kind: "p",
      text: "Pin Promotion Services allow Users to purchase additional promotional exposure for selected inventory and its associated geographic pins.",
    },
    { kind: "p", text: "Promotional opportunities may include:" },
    {
      kind: "letters",
      items: [
        "Featured or highlighted map pins.",
        "Enhanced geographic visibility.",
        "Preferred promotional positioning.",
        "Geographic or regional advertising.",
        "Category-based promotional exposure.",
        "Featured properties and developments.",
        "Sponsored placements and other advertising opportunities.",
        "Additional promotional products developed by TSPLITS.",
      ],
    },
    {
      kind: "p",
      text: "Publishing inventory does not automatically entitle a User to enhanced promotional exposure.",
    },
    {
      kind: "p",
      text: "Similarly, purchasing pin promotion does not confer ownership, brokerage rights, agency rights or any other interest in the underlying property.",
    },
    {
      kind: "p",
      text: "Users may publish inventory first and subsequently elect to promote individual properties, groups of properties or corresponding geographic pins.",
    },
    {
      kind: "p",
      text: "TSPLITS retains discretion over the technical, operational and commercial delivery of these services.",
    },
    { kind: "h2", text: "4. USER ELIGIBILITY AND PUBLISHER AUTHORIZATION" },
    { kind: "p", text: "Users may include:" },
    {
      kind: "letters",
      items: [
        "Individual property owners.",
        "Licensed real estate agents and brokerages.",
        "Real estate developers and builders.",
        "Property managers and landlords.",
        "Commercial and industrial property operators.",
        "Authorized property representatives.",
        "Other individuals or organizations legally entitled to publish and promote real estate inventory.",
      ],
    },
    {
      kind: "p",
      text: "Every User publishing inventory represents and warrants that they own the property or have obtained all necessary authorization, permissions and contractual rights to publish and promote it.",
    },
    {
      kind: "p",
      text: "Users acting on behalf of another person or organization are responsible for obtaining appropriate authorization.",
    },
    {
      kind: "p",
      text: "Users acting as real estate professionals remain responsible for complying with applicable licensing, disclosure and professional obligations.",
    },
    {
      kind: "p",
      text: "TSPLITS may request evidence of publishing authority and may reject, restrict or remove inventory where satisfactory evidence is not provided.",
    },
    { kind: "h2", text: "5. PUBLISHING AND MAINTAINING REAL ESTATE INVENTORY" },
    {
      kind: "p",
      text: "Users may publish residential, commercial, industrial, agricultural, recreational and other real estate inventory, including:",
    },
    {
      kind: "letters",
      items: [
        "Properties available for sale.",
        "Properties available for lease or rent.",
        "Vacant land and development sites.",
        "Residential and commercial developments.",
        "New construction and pre-construction projects.",
        "Investment properties and real estate-related business opportunities, where legally permitted.",
      ],
    },
    {
      kind: "p",
      text: "Users are solely responsible for ensuring that published information is accurate, complete, current and not misleading.",
    },
    { kind: "p", text: "This responsibility includes:" },
    {
      kind: "bullets",
      items: [
        "Property descriptions and addresses.",
        "Asking prices, rental rates and other financial information.",
        "Availability and transaction status.",
        "Property dimensions and measurements.",
        "Photographs, videos and visual representations.",
        "Zoning, development and permitted-use information.",
        "Ownership and listing authority.",
        "Material representations and promotional claims.",
      ],
    },
    {
      kind: "p",
      text: "Users must promptly update, correct or remove information that becomes inaccurate, outdated or misleading.",
    },
    {
      kind: "p",
      text: "TSPLITS does not independently verify the ownership, legal status, condition, availability, pricing or characteristics of published inventory.",
    },
    { kind: "h2", text: "6. GEOGRAPHIC MAP PINS AND PROPERTY ASSOCIATION" },
    {
      kind: "p",
      text: "The Platform allows Users to create and associate geographic map pins with published real estate inventory.",
    },
    { kind: "p", text: "Each pin is intended to identify, locate or promote the corresponding inventory item." },
    { kind: "p", text: "Users are responsible for ensuring that:" },
    {
      kind: "letters",
      items: [
        "Pins are associated with the correct inventory.",
        "Geographic positioning is reasonably accurate.",
        "Pin placement does not intentionally misrepresent property location, boundaries or identity.",
        "Pins do not imply ownership, endorsement, authorization or affiliation that does not exist.",
        "Changes in inventory status are reflected in the associated pin.",
      ],
    },
    { kind: "p", text: "Map pins are informational and promotional representations only." },
    {
      kind: "p",
      text: "They do not constitute property surveys, title searches, legal boundary determinations or authoritative property-location certifications.",
    },
    {
      kind: "p",
      text: "TSPLITS may provide mapping and geographic functionality through its own systems or third-party mapping providers.",
    },
    {
      kind: "p",
      text: "TSPLITS may adjust, reposition, restrict or remove pins where reasonably necessary for technical, operational, legal or commercial reasons.",
    },
    { kind: "h2", text: "7. PIN PROMOTION AND PAID ADVERTISING" },
    {
      kind: "p",
      text: "Users may purchase promotional services for individual pins, selected groups of pins or other published inventory.",
    },
    {
      kind: "p",
      text: "TSPLITS may establish promotional rates based on duration, location, property category, visibility, format, subscription level or other commercial considerations.",
    },
    { kind: "p", text: "Payment for promotional services purchases the specified promotional opportunity only." },
    { kind: "p", text: "TSPLITS does not guarantee any particular number of:" },
    {
      kind: "letters",
      items: [
        "Impressions or views.",
        "Clicks or engagements.",
        "Inquiries or leads.",
        "Property showings or appointments.",
        "Offers, sales or leases.",
        "Other commercial outcomes.",
      ],
    },
    {
      kind: "p",
      text: "Where appropriate, TSPLITS may identify paid promotional placements as featured, sponsored or promoted content.",
    },
    {
      kind: "p",
      text: "Purchasing promotional services does not constitute an endorsement, verification or guarantee of the underlying property or inventory.",
    },
    { kind: "h2", text: "8. PUBLISHER AND PROMOTER DISTINCTION" },
    { kind: "p", text: "For purposes of these Terms:" },
    {
      kind: "p",
      text: "Publisher means the individual or organization responsible for submitting, maintaining and authorizing the publication of real estate inventory.",
    },
    {
      kind: "p",
      text: "Promoter means a User who purchases or otherwise obtains promotional exposure for published inventory and associated geographic pins.",
    },
    { kind: "p", text: "A User may act as both Publisher and Promoter." },
    {
      kind: "p",
      text: "Purchasing promotional services does not transfer the Publisher's responsibilities to TSPLITS.",
    },
    { kind: "p", text: "TSPLITS acts solely as the operator of the technology and promotional infrastructure." },
    {
      kind: "p",
      text: "TSPLITS does not become the property advertiser of record, listing broker, selling agent, landlord, owner or transaction representative merely because it provides promotional exposure.",
    },
    { kind: "h2", text: "9. PUBLISHER RESPONSIBILITY FOR INVENTORY AND CONTENT" },
    {
      kind: "p",
      text: "Publishers retain responsibility for all information, representations, materials and content submitted to or displayed through the Platform.",
    },
    {
      kind: "p",
      text: "This includes property descriptions, photographs, videos, documents, advertising claims, geographic representations and associated promotional materials.",
    },
    {
      kind: "p",
      text: "Publishers warrant that they have the necessary rights and permissions to submit and authorize the use of their content.",
    },
    {
      kind: "p",
      text: "TSPLITS does not independently verify or warrant the accuracy, legality, authenticity, completeness or suitability of submitted inventory or content.",
    },
    {
      kind: "p",
      text: "Publishers agree to indemnify TSPLITS against claims arising from unauthorized, inaccurate, misleading, infringing or unlawful inventory and content, subject to applicable law.",
    },
    { kind: "h2", text: "10. USER CONTENT AND INTELLECTUAL PROPERTY" },
    {
      kind: "p",
      text: 'Users retain ownership of their photographs, videos, descriptions, logos, documents and other submitted materials ("User Content").',
    },
    {
      kind: "p",
      text: "By submitting User Content, Users grant TSPLITS a worldwide, non-exclusive, royalty-free licence to host, store, reproduce, display, distribute, transmit, format, modify for technical purposes and otherwise use that content as reasonably necessary to:",
    },
    {
      kind: "letters",
      items: [
        "Operate and provide the Platform.",
        "Publish and display associated inventory and geographic pins.",
        "Deliver paid and unpaid promotional services.",
        "Advertise and promote Mapsites and its services.",
        "Distribute inventory through authorized Platform channels.",
        "Improve and develop Platform functionality.",
      ],
    },
    {
      kind: "p",
      text: "TSPLITS does not acquire ownership of the underlying property or User Content merely because it is published through Mapsites.",
    },
    {
      kind: "p",
      text: "Users warrant that they have obtained all necessary intellectual property rights, licences, permissions and consents.",
    },
    {
      kind: "p",
      text: "TSPLITS may remove content upon receiving a credible infringement complaint or where it reasonably believes that content violates applicable law or these Terms.",
    },
    { kind: "h2", text: "11. PLATFORM TECHNOLOGY AND PROPRIETARY RIGHTS" },
    {
      kind: "p",
      text: "TSPLITS retains all rights, title and interest in and to Mapsites and its underlying technology, including:",
    },
    {
      kind: "letters",
      items: [
        "Software and source code.",
        "Platform architecture and design.",
        "Mapping and pin functionality.",
        "Database structures and proprietary systems.",
        "User interface and presentation formats.",
        "Proprietary algorithms and functionality.",
        "Aggregated analytics and operational information.",
        "Trademarks, branding and other proprietary materials.",
      ],
    },
    {
      kind: "p",
      text: "No User acquires ownership of any part of the Platform by registering, publishing inventory or purchasing promotional services.",
    },
    {
      kind: "p",
      text: "Users receive only the limited rights necessary to access and use the services in accordance with these Terms.",
    },
    { kind: "h2", text: "12. PLATFORM DATA, ANALYTICS AND COMMERCIAL INTELLIGENCE" },
    {
      kind: "p",
      text: "TSPLITS may collect and generate operational and analytical information concerning Platform usage, including inventory activity, pin impressions, geographic engagement, promotional performance and other service statistics.",
    },
    {
      kind: "p",
      text: "Subject to applicable privacy and data protection legislation, TSPLITS may use aggregated or anonymized information to:",
    },
    {
      kind: "letters",
      items: [
        "Improve Platform services.",
        "Develop new promotional products.",
        "Evaluate advertising effectiveness.",
        "Establish commercial pricing and service packages.",
        "Identify general geographic and inventory trends.",
        "Develop new business opportunities.",
      ],
    },
    {
      kind: "p",
      text: "TSPLITS retains ownership of its proprietary analytics, aggregated performance measurements and operational data, subject to Users' rights in their personal information and applicable law.",
    },
    { kind: "h2", text: "13. LEADS, INQUIRIES AND USER COMMUNICATIONS" },
    {
      kind: "p",
      text: "The Platform may facilitate contact requests, inquiries and expressions of interest between prospective purchasers, tenants, property owners, agents and other Users.",
    },
    { kind: "p", text: "Unless expressly agreed otherwise:" },
    {
      kind: "letters",
      items: [
        "TSPLITS does not act as a broker, intermediary, negotiator or representative in any property transaction.",
        "Publishers are responsible for responding to and managing inquiries.",
        "TSPLITS does not guarantee the authenticity, qualifications, financial capacity or intentions of individuals submitting inquiries.",
        "TSPLITS does not guarantee lead volumes, conversions, sales, rentals or other commercial outcomes.",
        "Users are responsible for obtaining necessary consent before using personal information received through the Platform.",
      ],
    },
    { kind: "p", text: "Additional lead-management services may be subject to separate commercial arrangements." },
    { kind: "h2", text: "14. USER CONDUCT AND PROHIBITED ACTIVITIES" },
    { kind: "p", text: "Users agree not to:" },
    {
      kind: "letters",
      items: [
        "Publish inventory without appropriate authorization.",
        "Publish fraudulent, misleading or materially inaccurate property information.",
        "Misrepresent ownership, availability, pricing, location or legal status.",
        "Upload copyrighted materials without authorization.",
        "Use pins to misrepresent property locations or boundaries.",
        "Manipulate promotional positioning, advertising statistics or Platform functionality.",
        "Publish discriminatory or unlawful advertisements.",
        "Collect or misuse personal information without lawful authority.",
        "Interfere with Platform security or operations.",
        "Access accounts, data or systems without authorization.",
        "Use the Platform for unlawful purposes.",
        "Misrepresent an affiliation with TSPLITS or another Platform User.",
      ],
    },
    { kind: "h2", text: "15. CONTENT REVIEW, REMOVAL AND PLATFORM DISCRETION" },
    {
      kind: "p",
      text: "TSPLITS reserves the right, but does not assume a general obligation, to review, monitor, reject, edit, restrict, suspend or remove any inventory, pin, advertisement, User Content or account.",
    },
    { kind: "p", text: "Such action may be taken where TSPLITS reasonably believes that:" },
    {
      kind: "letters",
      items: [
        "These Terms have been violated.",
        "Information is fraudulent, misleading or materially inaccurate.",
        "A User lacks appropriate publishing authority.",
        "Content infringes third-party rights.",
        "Content creates legal, regulatory, security or reputational concerns.",
        "Applicable fees have not been paid.",
        "Continued publication is inconsistent with the Company's operational or commercial policies.",
      ],
    },
    {
      kind: "p",
      text: "If notified, TSPLITS may remove or disable a pin where associated inventory has been withdrawn, sold, leased, expired or otherwise become unsuitable for publication.",
    },
    {
      kind: "p",
      text: "If not notified, the PIN will automatically disappear, when the next weekly placement fee is not paid.",
    },
    { kind: "h2", text: "16. FEES, SUBSCRIPTIONS AND PROMOTIONAL CHARGES" },
    { kind: "p", text: "TSPLITS may charge for:" },
    {
      kind: "letters",
      items: [
        "Platform subscriptions.",
        "Inventory publishing services.",
        "Individual property or pin publishing.",
        "Enhanced pin promotion.",
        "Featured placements and advertising.",
        "Additional functionality and premium services.",
        "Brokerage and multi-user packages.",
        "Developer and large-inventory packages.",
      ],
    },
    {
      kind: "p",
      text: "Applicable prices, payment periods, billing arrangements and service descriptions will be disclosed in the shopping cart before purchase.",
    },
    {
      kind: "p",
      text: "Users authorize TSPLITS or its designated payment processor to collect applicable charges.",
    },
    {
      kind: "p",
      text: "Subscription renewals, cancellation procedures, taxes and refund policies will be disclosed through the applicable purchase process.",
    },
    {
      kind: "p",
      text: "Unless otherwise expressly stated, fees for services already delivered are non-refundable, subject to applicable law.",
    },
    { kind: "p", text: "TSPLITS may revise its pricing and service offerings upon reasonable notice." },
    { kind: "h2", text: "17. THIRD-PARTY SERVICES AND EXTERNAL INFORMATION" },
    {
      kind: "p",
      text: "The Platform may incorporate third-party mapping, hosting, payment processing, analytics, advertising and other technology services.",
    },
    {
      kind: "p",
      text: "TSPLITS does not control and is not responsible for the accuracy, availability, reliability or performance of third-party services.",
    },
    { kind: "p", text: "Third-party mapping information may contain inaccuracies, omissions or delays." },
    {
      kind: "p",
      text: "TSPLITS does not warrant that external property information, geographic representations or linked resources are accurate or continuously available.",
    },
    { kind: "h2", text: "18. NO BROKERAGE, AGENCY OR PROPERTY TRANSACTION RELATIONSHIP" },
    { kind: "p", text: "TSPLITS provides technology, inventory publishing and promotional services only." },
    {
      kind: "p",
      text: "TSPLITS is not a party to, nor does it represent any party in, a transaction involving property published through the Platform.",
    },
    {
      kind: "p",
      text: "Publication or promotion of inventory does not create a brokerage, agency, fiduciary, partnership, joint venture or other representative relationship between TSPLITS and a User.",
    },
    { kind: "p", text: "TSPLITS does not:" },
    {
      kind: "letters",
      items: [
        "Verify property ownership or title.",
        "Conduct property inspections or appraisals.",
        "Negotiate property transactions.",
        "Prepare or approve purchase or lease agreements.",
        "Receive or hold property deposits or transaction funds.",
        "Provide legal, financial, mortgage or investment advice.",
      ],
    },
    {
      kind: "p",
      text: "All negotiations, offers, agreements, purchases, sales, leases and other transactions are solely between the relevant parties.",
    },
    { kind: "h2", text: "19. ACCURACY, DUE DILIGENCE AND RELIANCE" },
    {
      kind: "p",
      text: "TSPLITS makes no representation or warranty concerning the accuracy, completeness, legality, availability or reliability of inventory or User Content.",
    },
    {
      kind: "p",
      text: "Users and prospective purchasers, tenants and other interested parties are responsible for independently verifying property information.",
    },
    {
      kind: "p",
      text: "Users and prospective purchasers should obtain independent legal, financial, surveying, inspection and other professional advice where appropriate.",
    },
    {
      kind: "p",
      text: "No listing, pin, photograph, video or promotional representation should be treated as a substitute for independent due diligence.",
    },
    { kind: "h2", text: "20. PRIVACY AND PERSONAL INFORMATION" },
    {
      kind: "p",
      text: "The Company's collection, use, storage and disclosure of personal information are governed by its Privacy Policy and applicable privacy legislation.",
    },
    {
      kind: "p",
      text: "Users must not submit or disclose personal information through the Platform without an appropriate legal basis and any required consent.",
    },
    {
      kind: "p",
      text: "Users must comply with applicable privacy and data protection obligations when handling inquiries, leads and contact information received through the Platform.",
    },
    {
      kind: "p",
      text: "TSPLITS may use service providers to process information in accordance with its Privacy Policy and applicable law.",
    },
    { kind: "h2", text: "21. DISCLAIMER OF WARRANTIES" },
    {
      kind: "p",
      text: 'The Platform and associated services are provided on an "as is" and "as available" basis, to the maximum extent permitted by law.',
    },
    {
      kind: "p",
      text: "TSPLITS disclaims all warranties and conditions, whether express, implied or statutory, including warranties of merchantability, fitness for a particular purpose, uninterrupted availability and accuracy.",
    },
    { kind: "p", text: "TSPLITS does not warrant that:" },
    {
      kind: "letters",
      items: [
        "The Platform will be uninterrupted or error-free.",
        "Published inventory will generate inquiries or transactions.",
        "Pins will achieve particular visibility or geographic accuracy.",
        "Promotional services will produce specific commercial outcomes.",
        "User Content or third-party information will be accurate or reliable.",
      ],
    },
    { kind: "h2", text: "22. LIMITATION OF LIABILITY" },
    {
      kind: "p",
      text: "To the maximum extent permitted by applicable law, TSPLITS and its directors, officers, employees, contractors, affiliates and service providers shall not be liable for indirect, incidental, consequential, special, exemplary or punitive damages, including lost profits, lost revenue, lost business opportunities, loss of data or anticipated transactions.",
    },
    { kind: "p", text: "Without limiting the foregoing, TSPLITS shall not be responsible for losses arising from:" },
    {
      kind: "letters",
      items: [
        "The accuracy, legality, ownership, condition, value or availability of published inventory.",
        "The content, photographs, videos or representations supplied by Users.",
        "The creation, positioning, association or promotion of geographic pins.",
        "The failure of promotional services to generate inquiries or transactions.",
        "Disputes or transactions between Users and third parties.",
        "Unauthorized use of User accounts.",
        "Third-party services, mapping systems or external websites.",
        "Technical interruptions or events beyond the Company's reasonable control.",
      ],
    },
    {
      kind: "p",
      text: "Where legally permissible, TSPLITS' aggregate liability arising from a User's use of the Platform shall not exceed the total fees paid by that User to TSPLITS during the twelve months immediately preceding the event giving rise to the claim.",
    },
    {
      kind: "p",
      text: "Nothing in these Terms excludes or limits liability that cannot lawfully be excluded or limited under applicable law.",
    },
    { kind: "h2", text: "23. INDEMNIFICATION" },
    {
      kind: "p",
      text: "Users agree to indemnify and hold harmless TSPLITS, its directors, officers, employees, contractors, affiliates and service providers against claims, losses, liabilities, damages, costs and reasonable legal expenses arising from:",
    },
    {
      kind: "letters",
      items: [
        "The publication or promotion of inventory by the User.",
        "The User's lack of authority to publish or promote inventory.",
        "Inaccurate, misleading or unlawful User Content.",
        "The User's creation or placement of pins.",
        "Alleged infringement of third-party intellectual property or other rights.",
        "Violations of real estate advertising or licensing requirements.",
        "Privacy violations or unlawful use of personal information.",
        "Claims or disputes arising from transactions involving published inventory.",
        "The User's breach of these Terms or applicable law.",
      ],
    },
    { kind: "p", text: "These indemnification obligations apply to the extent permitted by applicable law." },
    { kind: "h2", text: "24. INSURANCE AND RISK MANAGEMENT" },
    {
      kind: "p",
      text: "TSPLITS may maintain commercial general liability, errors and omissions, cyber liability and privacy breach insurance as it considers appropriate to the nature and scale of its operations.",
    },
    {
      kind: "p",
      text: "Users remain responsible for maintaining insurance appropriate to their own real estate, brokerage, property management, development or advertising activities.",
    },
    {
      kind: "p",
      text: "Nothing in these Terms constitutes a representation that TSPLITS provides insurance coverage for Users, properties, inventory or transactions.",
    },
    { kind: "h2", text: "25. SUSPENSION AND TERMINATION" },
    { kind: "p", text: "TSPLITS may suspend, restrict or terminate access to the Platform where a User:" },
    {
      kind: "letters",
      items: [
        "Violates these Terms.",
        "Fails to pay applicable fees.",
        "Publishes unlawful or misleading content.",
        "Lacks appropriate inventory publishing authority.",
        "Creates material legal, operational or security risks.",
      ],
    },
    {
      kind: "p",
      text: "Users may discontinue their use of the Platform in accordance with applicable cancellation procedures.",
    },
    {
      kind: "p",
      text: "Upon termination, TSPLITS may remove or disable access to the User's inventory, pins and promotional materials, subject to applicable contractual and legal obligations.",
    },
    {
      kind: "p",
      text: "Termination does not extinguish outstanding payment obligations or provisions intended to survive termination.",
    },
    { kind: "h2", text: "26. CHANGES TO THE PLATFORM AND TERMS" },
    {
      kind: "p",
      text: "TSPLITS may modify, suspend, discontinue or replace Platform features, publishing services, mapping functionality, pricing structures and promotional offerings.",
    },
    {
      kind: "p",
      text: "TSPLITS may revise these Terms from time to time and will communicate material changes through the Platform or another reasonable notification method.",
    },
    {
      kind: "p",
      text: "Continued use following the effective date of revised Terms constitutes acceptance of the changes to the extent permitted by applicable law.",
    },
    { kind: "h2", text: "27. CANADIAN LEGAL COMPLIANCE" },
    {
      kind: "p",
      text: "Users agree to comply with all applicable federal, provincial and municipal laws and regulations concerning:",
    },
    {
      kind: "letters",
      items: [
        "Real estate licensing and brokerage activities.",
        "Property advertising and disclosure requirements.",
        "Consumer protection and competition law.",
        "Human rights and fair housing obligations.",
        "Copyright, trademarks and intellectual property.",
        "Privacy and personal information protection.",
        "Electronic marketing and anti-spam requirements.",
        "Taxation and commercial transactions.",
      ],
    },
    {
      kind: "p",
      text: "TSPLITS reserves the right to modify its services or restrict publication where necessary to maintain compliance with applicable legal requirements.",
    },
    { kind: "h2", text: "28. GOVERNING LAW AND DISPUTE RESOLUTION" },
    {
      kind: "p",
      text: "These Terms shall be governed by the laws of Nova Scotia, Canada, and the applicable federal laws of Canada.",
    },
    {
      kind: "p",
      text: "Subject to mandatory consumer protection legislation and other applicable legal requirements, disputes arising under these Terms shall be submitted to the courts of Nova Scotia.",
    },
    { kind: "h2", text: "29. GENERAL PROVISIONS" },
    {
      kind: "p",
      text: "These Terms, together with the Company's Privacy Policy, applicable pricing schedules and any additional service agreements, constitute the agreement between TSPLITS and the User concerning use of the Platform.",
    },
    {
      kind: "p",
      text: "If any provision is found unenforceable, the remaining provisions shall continue in effect.",
    },
    { kind: "p", text: "No waiver of any provision shall be effective unless made in writing." },
    {
      kind: "p",
      text: "Users may not assign their rights or obligations without TSPLITS' prior written consent.",
    },
    {
      kind: "p",
      text: "Provisions intended by their nature to survive termination shall remain effective following termination.",
    },
    { kind: "h2", text: "30. CONTACT INFORMATION" },
    {
      kind: "lines",
      items: [
        "TSPLITS Inc.",
        "Product: Mapsites",
        "Website: www.tsplits.com",
        "Email: welcome@tsplits.com",
        "Business Address: 342 Eskasoni Road, Northside East Bay, Nova Scotia, B1J 1K8.",
      ],
    },
  ],
};
