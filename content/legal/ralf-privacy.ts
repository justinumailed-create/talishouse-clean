import type { RalfLegalDocument } from "./ralf-document";

/** Ralf's Privacy Policy, copied from the November 2026 PDF. */
export const RALF_PRIVACY: RalfLegalDocument = {
  testId: "privacy-page",
  coverKicker: "PRIVACY POLICY",
  coverDate: "NOVEMBER 13, 2026",
  coverTitle: "PRIVACY POLICY",
  blocks: [
    { kind: "h2", text: "PRIVACY POLICY" },
    { kind: "p", text: "Effective Date: November16th, 2026" },
    { kind: "p", text: "Website: www.tsplits.com" },
    { kind: "p", text: "Effective Date: October 2026" },
    {
      kind: "p",
      text: "Your privacy is important to TSPLITS Inc. (“we,” “us,” or “our”). This Privacy Policy explains what information we collect, why we collect it, how we use it, and the circumstances under which it may be disclosed.",
    },
    { kind: "h2", text: "1. Our Privacy Principles" },
    { kind: "p", text: "We follow these fundamental principles when handling your information:" },
    {
      kind: "bullets",
      items: [
        "We only request personal information when it is genuinely necessary.",
        "We do not share your personal information with third parties except when necessary to comply with applicable laws, develop and improve our products and services, or protect our rights and property.",
        "We do not retain personal information on our servers unless it is necessary for the ongoing operation and delivery of our services.",
      ],
    },
    { kind: "h2", text: "2. Information We Collect" },
    { kind: "h3", text: "2.1 Website Visitors" },
    {
      kind: "p",
      text: "Like most website operators, we collect certain non-personally identifiable information that web browsers and servers typically make available. This may include:",
    },
    {
      kind: "bullets",
      items: [
        "Browser type;",
        "Language preference;",
        "Referring website; and",
        "The date and time of each visit or request.",
      ],
    },
    {
      kind: "p",
      text: "We collect this information to better understand how visitors use and interact with our website and to help us improve its functionality and user experience.",
    },
    {
      kind: "p",
      text: "From time to time, we may publish non-personally identifiable information in aggregate form, such as reports or statistics about website usage trends. When presented in this manner, the information is not intended to identify individual visitors.",
    },
    {
      kind: "p",
      text: "Our website may also collect information that could potentially be used to identify a visitor, such as an Internet Protocol (IP) address.",
    },
    { kind: "h3", text: "2.2 Personally Identifiable Information" },
    {
      kind: "p",
      text: "Some visitors choose to interact with our website in ways that require us to collect personally identifiable information. The type and amount of information collected depends on the nature of the interaction.",
    },
    {
      kind: "p",
      text: "In each case, we collect only the information that is reasonably necessary or appropriate to fulfill the purpose of the visitor’s interaction with our website or to provide the requested service.",
    },
    {
      kind: "p",
      text: "We do not disclose personally identifiable information except as described in this Privacy Policy.",
    },
    {
      kind: "p",
      text: "You may choose not to provide personally identifiable information. However, doing so may prevent you from accessing or using certain features, activities, or services available through our website.",
    },
    { kind: "h2", text: "3. How We Use Information" },
    { kind: "p", text: "We may use information collected through our website to:" },
    {
      kind: "bullets",
      items: [
        "Provide and support requested services;",
        "Operate and maintain our website;",
        "Understand how visitors use our website;",
        "Improve our website, products, and services;",
        "Remember certain access preferences;",
        "Monitor website usage and functionality; and",
        "Comply with applicable legal obligations.",
      ],
    },
    { kind: "h2", text: "4. Protection and Disclosure of Personal Information" },
    {
      kind: "p",
      text: "We may disclose potentially personally identifiable and personally identifiable information only to individuals, service providers, and affiliated organizations that:",
    },
    {
      kind: "numbers",
      items: [
        "Need access to the information to provide or support services available through our website; and",
        "Have agreed to keep the information confidential and not disclose it to others.",
      ],
    },
    {
      kind: "p",
      text: "Some of these individuals, service providers, or affiliated organizations may be located outside your country of residence. By using our website, you acknowledge and consent to the transfer of information to such parties where applicable.",
    },
    {
      kind: "p",
      text: "We do not rent or sell potentially personally identifiable or personally identifiable information to third parties.",
    },
    { kind: "h3", text: "4.1 Legal and Safety Disclosures" },
    {
      kind: "p",
      text: "We may disclose potentially personally identifiable or personally identifiable information outside the circumstances described above when required by law or when we reasonably believe, in good faith, that disclosure is necessary to:",
    },
    {
      kind: "bullets",
      items: [
        "Comply with a legal obligation or valid legal process;",
        "Protect the rights, property, or safety of our website, business, users, or third parties; or",
        "Protect the public from harm.",
      ],
    },
    { kind: "h2", text: "5. Cookies" },
    {
      kind: "p",
      text: "A cookie is a small piece of information that a website stores on a visitor’s computer or other device. The visitor’s web browser sends the cookie back to the website each time the visitor returns.",
    },
    {
      kind: "p",
      text: "We use cookies to help recognize and understand visitors, monitor website usage, and remember certain access preferences. Cookies help us improve the functionality and overall experience of our website.",
    },
    {
      kind: "p",
      text: "If you do not wish to allow cookies, you can configure your web browser to refuse or restrict them. However, disabling cookies may cause certain features or functions of our website to operate incorrectly or become unavailable.",
    },
    { kind: "h2", text: "6. Data Retention" },
    {
      kind: "p",
      text: "We do not retain personal information on its servers unless retention is necessary for the ongoing operation and delivery of our services or as otherwise required by applicable law.",
    },
    { kind: "h2", text: "7. Changes to This Privacy Policy" },
    {
      kind: "p",
      text: "TSPLITS may update or modify this Privacy Policy from time to time at our discretion. While we expect most changes to be minor, we encourage visitors to review this page periodically to remain informed about how we collect, use, and protect information.",
    },
    {
      kind: "p",
      text: "Any changes will become effective when the updated Privacy Policy is posted on this website. Your continued use of the website after changes are posted constitutes your acceptance of the revised Privacy Policy.",
    },
    { kind: "h2", text: "8. Contact Us" },
    {
      kind: "p",
      text: "If you have questions or concerns about this Privacy Policy or our privacy practices, please contact us through the contact information provided on our website.",
    },
    {
      kind: "lines",
      items: [
        "www.tsplits.com",
        "342 Eskasoni Road, Northside East Bay, Nova Scotia, Canada, B1J 1K8",
        "EM: welcome@tsplits.com",
        "TF: +1-888-585-5288",
      ],
    },
  ],
};
