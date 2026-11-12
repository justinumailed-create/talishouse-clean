import { PRIVACY_POLICY, PRIVACY_POLICY_META, type LegalSection } from "@/lib/talisu/pmc-legal";
import type { Locale } from "@/lib/i18n/config";
import { presentLegal } from "./present";

/**
 * Privacy Policy body. English is the policy already in the repo.
 * Swap this file when Ralf sends the final wording.
 */

const PRIVACY_DE: LegalSection[] = [
  {
    n: 1,
    title: "Einleitung",
    blocks: [
      "TalisALL („Unternehmen“, „wir“ oder „uns“) betreibt eine Softwareplattform, mit der Immobilien, Orte, Immobilienprofis und verwandte Leistungen beworben werden.",
      "Diese Datenschutzerklärung beschreibt, wie wir Informationen erheben, nutzen, weitergeben und schützen, wenn Sie unsere Website, die Plattform und die zugehörigen Dienste (zusammen der „Dienst“) nutzen.",
      "Mit der Nutzung des Dienstes nehmen Sie diese Datenschutzerklärung zur Kenntnis.",
    ],
  },
  {
    n: 2,
    title: "Welche Informationen wir erheben",
    blocks: [
      "Wir können folgende Kategorien von Informationen erheben:",
      {
        list: [
          "Kontodaten: Name, E-Mail-Adresse, Telefonnummer, Firmenname, Anmeldedaten und weitere Angaben bei der Kontoeröffnung.",
          "Immobilien- und Werbeinhalte: Beschreibungen, Fotos, Videos, Kartenorte, Links, Werbematerial und sonstige Inhalte, die über den Dienst eingereicht oder veröffentlicht werden.",
          "Nutzungsdaten: besuchte Seiten, genutzte Funktionen, Gerät, Browsertyp, IP-Adresse und allgemeine Interaktionsdaten.",
          "Kommunikation: Angaben, die Sie uns bei Support, Anfragen oder Rückmeldungen machen.",
          "Vorgangsdaten: Abonnement und Abrechnungsunterlagen. Kartendaten können von Zahlungsdienstleistern verarbeitet werden und werden von uns nicht unmittelbar gespeichert.",
        ],
      },
    ],
  },
  {
    n: 3,
    title: "Wie wir Informationen nutzen",
    blocks: [
      "Wir nutzen erhobene Informationen, um:",
      {
        list: [
          "den Dienst zu betreiben, zu pflegen und zu verbessern.",
          "Benutzerkonten anzulegen und zu verwalten.",
          "Angebote, Werbematerial und kartenbezogene Informationen anzuzeigen und zu verbreiten.",
          "Kontakte zwischen Nutzern, Immobilienprofis, Eigentümern und Interessenten zu ermöglichen.",
          "Abonnements und Zahlungen zu verarbeiten.",
          "Hinweise zum Dienst zu senden, Anfragen zu beantworten und Support zu leisten.",
          "Betrug und Missbrauch zu erkennen, die Sicherheit zu wahren und unsere Vereinbarungen durchzusetzen.",
          "gesetzliche Pflichten zu erfüllen und berechtigte Interessen zu schützen.",
        ],
      },
      "Wir verkaufen personenbezogene Informationen nicht gegen Geld. Soweit das geltende Recht bestimmte werbliche Offenlegungen als „Verkauf“ oder „Weitergabe“ behandelt, erfüllen wir die dafür geltenden Pflichten.",
    ],
  },
  {
    n: 4,
    title: "Öffentlich gezeigte Inhalte",
    blocks: [
      "Der Dienst kann Nutzern, Eigentümern, Immobilienprofis, Agenturen und anderen Dritten erlauben, Informationen, Fotos, Videos, Beschreibungen, Links, Kontaktdaten und anderes Material einzureichen und zu veröffentlichen.",
      "Öffentlich veröffentlichte Inhalte können für andere sichtbar, online auffindbar und von Dritten kopiert oder weiterverbreitet werden.",
      "Wer Inhalte einreicht, sorgt für die erforderlichen Rechte und die rechtliche Befugnis. Vertrauliche oder sensible personenbezogene Daten sollen nicht zur öffentlichen Anzeige eingereicht werden, wenn das nicht angemessen und rechtmäßig ist.",
      "Wir können Inhalte entfernen oder den Zugang beschränken, soweit das vernünftigerweise nötig oder gesetzlich geboten ist. Wir garantieren nicht, dass jeder Inhalt geprüft oder sofort entfernt wird.",
    ],
  },
  {
    n: 5,
    title: "Immobilienangaben und Inhalte Dritter",
    blocks: [
      "Der Dienst kann Informationen von Nutzern, Websites Dritter, öffentlichen Quellen, Kartenanbietern, Immobiliendatenbanken, Werbekunden und anderen externen Quellen zeigen.",
      "Wir garantieren nicht Richtigkeit, Vollständigkeit, Verlässlichkeit, Aktualität, Verfügbarkeit, Eigentum, Rechtslage, Preise, Maße, Lage oder sonstige Eigenschaften einer Immobilie oder eines Inhalts.",
      "Der Dienst dient der Werbung und Information. Angaben sollten unabhängig geprüft und vor Kauf, Verkauf, Miete, Anlage oder anderen Entscheidungen fachlich abgesichert werden.",
      "Für Handeln, Unterlassen, Angaben, Produkte, Leistungen oder Inhalte Dritter sind wir vorbehaltlich des geltenden Rechts nicht verantwortlich.",
    ],
  },
  {
    n: 6,
    title: "Cookies und ähnliche Techniken",
    blocks: [
      "Wir können Cookies, Pixel, Analysewerkzeuge und ähnliche Techniken nutzen, um Sitzungen zu halten, Einstellungen zu merken, die Nutzung zu verstehen, die Leistung zu verbessern und zulässige Werbung zu unterstützen.",
      "Cookies lassen sich über die Browsereinstellungen oder vorhandene Datenschutzsteuerungen verwalten. Werden bestimmte Cookies abgeschaltet, kann der Dienst eingeschränkt sein.",
      "Soweit das Gesetz es verlangt, holen wir eine Einwilligung ein, bevor wir nicht erforderliche Cookies oder ähnliche Techniken einsetzen.",
    ],
  },
  {
    n: 7,
    title: "Weitergabe",
    blocks: [
      "Wir können Informationen weitergeben an:",
      {
        list: [
          "Hosting, Cloud, Analyse, Zahlungsabwicklung und andere Dienstleister.",
          "Partner für Karten, Werbung, Kommunikation und Technik, soweit das für den Dienst nötig ist.",
          "Geschäftspartner oder andere Nutzer, wenn eine von Ihnen gewünschte Funktion das erfordert oder Sie die Weitergabe erlauben.",
          "Behörden, soweit das Gesetz es verlangt oder der Schutz von Rechten, Sicherheit und Schutz vernünftigerweise nötig ist.",
          "Einen Rechtsnachfolger bei Zusammenschluss, Übernahme, Umstrukturierung, Finanzierung oder Verkauf von Geschäftswerten, vorbehaltlich des geltenden Rechts.",
        ],
      },
      "Dienstleister dürfen Informationen verarbeiten, soweit das für ihre beauftragte Leistung und nach den geltenden Anforderungen nötig ist.",
    ],
  },
  {
    n: 8,
    title: "Aufbewahrung und Sicherheit",
    blocks: [
      "Wir bewahren personenbezogene Informationen so lange auf, wie das vernünftigerweise nötig ist, um den Dienst zu erbringen, Konten zu führen, Verträge zu erfüllen, Streitigkeiten zu klären, Vereinbarungen durchzusetzen und gesetzliche Pflichten zu erfüllen.",
      "Wir setzen angemessene organisatorische und technische Schutzmaßnahmen ein, die Informationen vor unbefugtem Zugriff, Verlust, Missbrauch oder Offenlegung schützen sollen.",
      "Kein System, keine Internetübertragung und keine elektronische Speicherung ist vollkommen sicher. Absolute Sicherheit können wir nicht garantieren.",
    ],
  },
  {
    n: 9,
    title: "Websites und Dienste Dritter",
    blocks: [
      "Der Dienst kann Links zu Websites, Kartendiensten, Angebotsplattformen oder anderen externen Stellen enthalten. Diese Dienste haben eigene Datenschutzregeln und Bedingungen.",
      "Wir kontrollieren die Datenschutzpraxis, Sicherheit, Verfügbarkeit oder Inhalte Dritter nicht und sind dafür nicht verantwortlich. Vor der Angabe von Informationen sollten die jeweiligen Regeln gelesen werden.",
    ],
  },
  {
    n: 10,
    title: "Ihre Rechte",
    blocks: [
      "Je nach Ihrem Ort und dem geltenden Recht können Sie Auskunft, Berichtigung, Löschung oder eine Kopie bestimmter personenbezogener Informationen verlangen oder einer Verarbeitung widersprechen oder sie einschränken.",
      "Es können weitere Rechte zu Einwilligung, Datenübertragbarkeit, zielgerichteter Werbung oder zum Verkauf oder zur Weitergabe personenbezogener Informationen bestehen.",
      "Eine Anfrage senden Sie an die unten genannten Kontaktdaten. Wir können Ihre Identität prüfen, bevor wir die Anfrage bearbeiten, und antworten nach dem geltenden Recht.",
    ],
  },
  {
    n: 11,
    title: "Kinder",
    blocks: [
      "Der Dienst richtet sich nicht an Kinder unter dem Alter, in dem sie den Dienst am jeweiligen Ort rechtmäßig nutzen dürfen. Wir erheben wissentlich keine personenbezogenen Informationen von Kindern entgegen dem geltenden Recht. Werden wir auf eine unrechtmäßige Erhebung aufmerksam, ergreifen wir angemessene Schritte.",
    ],
  },
  {
    n: 12,
    title: "Internationale Übermittlungen",
    blocks: [
      "Ihre Informationen können in anderen Ländern als Ihrem Wohnsitzland verarbeitet oder gespeichert werden, wo unsere Dienstleister oder unser Betrieb sitzen. Dort kann anderes Datenschutzrecht gelten.",
      "Soweit erforderlich, setzen wir angemessene Garantien für internationale Übermittlungen personenbezogener Informationen ein.",
    ],
  },
  {
    n: 13,
    title: "Änderungen",
    blocks: [
      "Wir können diese Datenschutzerklärung von Zeit zu Zeit ändern. Änderungen werden im Dienst mit einem aktualisierten Datum veröffentlicht. Soweit das Gesetz es verlangt, informieren wir zusätzlich oder holen eine Einwilligung ein.",
      "Die weitere Nutzung des Dienstes nach dem Wirksamwerden einer aktualisierten Erklärung unterliegt dem geltenden Recht und etwaigen Einwilligungspflichten.",
    ],
  },
  {
    n: 14,
    title: "Kontakt",
    blocks: [
      "Fragen oder Anfragen zu dieser Datenschutzerklärung: TalisALL PMC — E-Mail: welcome@talispros.com — Website: Talisall.com",
    ],
  },
];

export function privacyDocument(locale: Locale): {
  title: string;
  kicker: string;
  meta: string[];
  sections: LegalSection[];
} {
  if (locale === "de") {
    return {
      title: "Datenschutzerklärung",
      kicker: "Tsplits™",
      meta: [
        `Stand: 14. Oktober 2026`,
        `Unternehmen: ${PRIVACY_POLICY_META.company}`,
        "Websites: talisu.com, talispros.com, taliswebs.com, talishouse.com",
      ],
      sections: presentLegal(PRIVACY_DE),
    };
  }
  return {
    title: "Privacy Policy",
    kicker: "Tsplits™",
    meta: [
      `Effective date: ${PRIVACY_POLICY_META.effectiveDate}`,
      `Company: ${PRIVACY_POLICY_META.company}`,
      `Websites: ${PRIVACY_POLICY_META.websites}`,
    ],
    sections: presentLegal(PRIVACY_POLICY),
  };
}
