import { TERMS_OF_SERVICE, type LegalSection } from "@/lib/talisu/pmc-legal";
import type { Locale } from "@/lib/i18n/config";
import { presentLegal } from "./present";

/**
 * Terms of Service body. English is the Service Agreement already in the repo
 * (minus governing law), without the deliverables draft badge.
 * Swap this file when Ralf sends the final wording.
 */

const TERMS_DE: LegalSection[] = [
  {
    n: 1,
    title: "Leistungen",
    blocks: [
      "Der Anbieter betreibt eine Online-Softwareplattform („Plattform“), die interaktive Karten, geografische Informationen, digitale Inhalte und zugehörige Werkzeuge nutzt, um Immobilien, Projekte, Unternehmen und verwandte Leistungen zu bewerben.",
      "Der Anbieter räumt dem Kunden ein beschränktes, nicht ausschließliches, nicht übertragbares Recht ein, die Plattform für die vorgesehenen Marketingzwecke zu nutzen, vorbehaltlich dieser Bedingungen.",
    ],
  },
  {
    id: "deliverables",
    title: "Leistungen im Einzelnen",
    blocks: [
      "Vorbehaltlich dieser Bedingungen und der Kontoart des Kunden umfassen die Leistungen Folgendes:",
      {
        list: [
          "Mapsite: eine Präsenz auf einer eigenen Tsplits™ Mapsite des Kundenkontos, auf der der Kunde PINs (Place of Interest Nodes) setzen kann.",
          "PIN-Fähnchen: Ein ausgewählter PIN öffnet ein Fähnchen mit Links zu URL, RES, TEB und TTV. URL kann ein Dokumentenarchiv oder ein externer Ort sein. RES führt, soweit eingetragen, zu diesem Angebot auf Immobiliensites, MLS®, einer Maklerseite oder einer anderen herkömmlichen Site.",
          "TEB (Talis EBooks™): das Verfahren des Anbieters, aus PDF schnell Blätterbücher zu erzeugen.",
          "Auto-Syndication: PINs von Tsplits™ Mapsites werden in die im Mediendirektorium genannten Publikationen syndiziert, in Zyklen von 10 Tagen an und 3 Tagen aus. Das Verzeichnis kann sich ändern.",
          "TTV (TalisTV™), optional und gegen Aufpreis: der hauseigene Online-TV-Sender des Anbieters. Wird er gewählt, erzeugt der Anbieter aus vom Kunden geliefertem Material Inhalte, etwa virtuelle Besichtigungen, Infomercials und Greenscreen-Formate.",
          "Kontoarten: Root Account, Derivative Account, FSBO Account und Adpro Account. Welche Leistungen verfügbar sind, hängt von der Kontoart ab.",
        ],
      },
      "Diese Leistungen sind Marketingwerkzeuge. Dieser Abschnitt garantiert keine Sichtbarkeit, Platzierung, Reichweite, Aufrufe, Leads oder Abschlüsse. Die Abschnitte zur Rolle der Plattform, zu Gewährleistung und Haftung gelten.",
    ],
  },
  {
    n: 2,
    title: "Pflichten des Kunden",
    blocks: [
      "Der Kunde ist allein verantwortlich für alle Angaben, Angebote, Fotos, Videos, Beschreibungen, Links, Logos, Marken, Anzeigen und sonstigen Materialien, die er über die Plattform einreicht oder anzeigen lässt („Kundeninhalte“).",
      "Der Kunde sichert zu:",
      {
        list: [
          "Er verfügt über alle erforderlichen Rechte und Genehmigungen, um seine Kundeninhalte zu veröffentlichen.",
          "Die eingereichten Angaben sind nach seinem Wissen richtig und nicht irreführend.",
          "Die Kundeninhalte halten geltendes Recht, Werbestandards, berufsrechtliche Vorgaben und Rechte Dritter ein.",
          "Unrichtige, unbefugte, rechtswidrige oder veraltete Inhalte werden unverzüglich berichtigt oder entfernt.",
        ],
      },
      "Der Kunde holt erforderliche Einwilligungen von Eigentümern, Maklern, Bildrechten und anderen Beteiligten ein.",
    ],
  },
  {
    n: 3,
    title: "Rolle der Plattform",
    blocks: [
      "Die Plattform ist ein Technik- und Marketingdienst. Mit den Leistungen wird der Anbieter nicht Makler, Verwalter, Gutachter, Rechtsberater oder Vermittler eines Geschäfts.",
      "Die Anzeige einer Immobilie, eines Angebots, Unternehmens, Produkts, einer Anzeige, eines Links oder sonstigen Inhalts ist keine Empfehlung, Prüfung oder Garantie des Anbieters.",
      "Soweit nicht schriftlich anders vereinbart, prüft der Anbieter Eigentum, Angebotsbefugnis, Maße, Preise, Verfügbarkeit, Zustand, Rechtslage oder die Richtigkeit der vom Kunden oder von Dritten gelieferten Angaben nicht selbst.",
    ],
  },
  {
    n: 4,
    title: "Gewährleistung",
    blocks: [
      "Soweit gesetzlich zulässig, werden Plattform und Leistungen „wie besehen“ und „wie verfügbar“ bereitgestellt.",
      "Der Anbieter übernimmt keine ausdrückliche oder stillschweigende Gewähr für:",
      {
        list: [
          "Richtigkeit, Vollständigkeit, Aktualität, Rechtmäßigkeit oder Verlässlichkeit eines Angebots, einer Karte, von Daten oder Inhalten.",
          "Sichtbarkeit, Platzierung, Reichweite, Impressionen, Beteiligung, Leads oder wirtschaftliche Ergebnisse.",
          "Ununterbrochene Verfügbarkeit, Sicherheit, Kompatibilität oder Fehlerfreiheit der Plattform.",
          "Die Eignung einer Immobilie, eines Produkts, einer Leistung oder eines sonstigen Inhalts.",
        ],
      },
      "Der Kunde erkennt an, dass Karten, Geodaten, Daten Dritter, die Internetverbindung und externe Dienste ungenau, nicht verfügbar oder Änderungen unterworfen sein können.",
      "Der Anbieter garantiert nicht, dass eine Immobilie, ein Angebot, ein Produkt, eine Anzeige oder ein sonstiger Inhalt angezeigt bleibt, Aufrufe erhält, Leads erzeugt oder zu einem Abschluss führt.",
    ],
  },
  {
    n: 5,
    title: "Haftung",
    blocks: [
      "Soweit gesetzlich zulässig, haftet der Anbieter nicht für Verluste, Schäden, Ansprüche oder Kosten aus oder im Zusammenhang mit:",
      {
        lettered: [
          "Veröffentlichung, Anzeige, Verbreitung, Sichtbarkeit, Rang, Bewerbung, Auslassung oder Entfernung von Inhalten über die Plattform.",
          "Unrichtigen, unvollständigen, veralteten, irreführenden, unbefugten, verleumderischen, rechtsverletzenden oder sonst zu beanstandenden Inhalten des Kunden oder Dritter.",
          "Dem Vertrauen auf Angaben, Darstellungen, Fotos, Karten, Beschreibungen, Preise, Verfügbarkeit oder sonstiges über die Plattform gezeigtes Material.",
          "Immobiliengeschäften, Anlageentscheidungen, Verhandlungen, Verträgen, Streitigkeiten oder dem Kontakt zwischen dem Kunden und Interessenten, Eigentümern, Mietern, Vermietern, Maklern, Entwicklern, Werbekunden oder sonstigen Dritten.",
          "Datenverlust, entgangenen Geschäften, Umsatz, Gewinn, Goodwill, Leads, erwarteten Einsparungen oder Betriebsunterbrechung.",
          "Unterbrechung, Ausfall, technischem Fehler, Cybervorfall, Ausfall eines Drittdienstes oder unbefugtem Zugriff, soweit die Haftung gesetzlich ausgeschlossen werden kann.",
        ],
      },
      "Soweit gesetzlich zulässig, haftet der Anbieter nicht für mittelbare, zufällige, besondere, Folge-, exemplarische oder Strafschäden und nicht für entgangenen Gewinn, Umsatz, Geschäfte oder Chancen, gleich auf welcher Rechtsgrundlage.",
      "Obergrenze. Soweit gesetzlich zulässig, ist die Gesamthaftung des Anbieters aus oder im Zusammenhang mit diesen Bedingungen oder den Leistungen auf die Entgelte begrenzt, die der Kunde in den zwölf Monaten vor dem anspruchsauslösenden Ereignis für die Leistungen gezahlt hat oder zu zahlen hat.",
      "Die Ausschlüsse und Grenzen gelten unabhängig von der Anspruchsgrundlage, soweit die Haftung nicht zwingend besteht.",
    ],
  },
  {
    n: 6,
    title: "Freistellung",
    blocks: [
      "Soweit gesetzlich zulässig, stellt der Kunde den Anbieter und dessen Organe, Beschäftigte und Auftragnehmer von Ansprüchen Dritter, Schäden und angemessenen Rechtskosten frei, die entstehen aus:",
      {
        list: [
          "Kundeninhalten oder vom Kunden gelieferten Materialien.",
          "Einer Verletzung dieser Bedingungen oder geltenden Rechts durch den Kunden.",
          "Einer Verletzung von Rechten Dritter durch den Kunden.",
          "Angaben, Anzeigen, Angeboten oder dem Geschäftsverkehr des Kunden mit Dritten.",
        ],
      },
      "Die Pflicht gilt nicht, soweit ein Anspruch auf eigenem Fehlverhalten des Anbieters beruht oder der Kunde gesetzlich nicht zur Freistellung verpflichtet werden kann.",
    ],
  },
  {
    n: 7,
    title: "Entgelte",
    blocks: [
      "Der Kunde zahlt die vereinbarten Abonnemententgelte und sonstigen Entgelte aus Bestellformular, Tarif oder schriftlichem Angebot.",
      "Entgelte sind im Voraus fällig und, soweit gesetzlich zulässig, nicht erstattungsfähig.",
      "Entgelttabelle (alle Beträge in CAD):",
      {
        list: [
          "Root Account: 1.000 CAD jährlich; 100 CAD monatlich*.",
          "Derivative Account: 200 CAD jährlich; 100 CAD monatlich; PIN: 7 CAD wöchentlich* **.",
          "FSBO Account: 1.000 CAD jährlich; 100 CAD monatlich*.",
          "Adpro Account: 1.000 CAD jährlich; 100 CAD monatlich*.",
        ],
      },
      "* Keine langfristige Bindung. Werden jährliche, monatliche oder wöchentliche Raten nicht weitergezahlt, endet die Pflicht.",
      "** Wöchentliche PIN-Raten sorgen dafür, dass verkaufte Angebote nicht über den nächsten Ratentermin hinaus im System bleiben.",
      "Beteiligung:",
      {
        list: [
          "Root Accounts: 70 % der monatlichen Konto- und PIN-Erlöse aus Derivative Accounts.",
          "Derivative Accounts: keine; der Nutzen liegt in Sichtbarkeit und Beziehungsmarketing.",
          "FSBO Accounts: keine; der Nutzen liegt in ersparten Maklergebühren.",
          "Adpro Accounts: keine; der Nutzen liegt in Sichtbarkeit bei gezielten Nutzergruppen.",
        ],
      },
      "Auszahlungen:",
      {
        list: [
          "Am 1. oder 16. jedes Monats, um zwei Monate versetzt, damit Rückbelastungen und andere Anpassungen verarbeitet werden können.",
        ],
      },
      "Bei Zahlungsverzug kann der Anbieter den Zugang nach einer Frist von drei Tagen aussetzen, soweit diese Bedingungen oder das Gesetz das vorsehen.",
    ],
  },
  {
    n: 8,
    title: "Geistiges Eigentum",
    blocks: [
      "Der Anbieter behält alle Rechte an der Plattform, der Software, der Kartenoberfläche, dem Design, der zugrunde liegenden Technik und den eigenen Materialien.",
      "Der Kunde behält das Eigentum an den Kundeninhalten, vorbehaltlich der Rechte, die der Anbieter zur Erbringung der Leistungen braucht.",
      "Der Kunde räumt dem Anbieter eine nicht ausschließliche, weltweite, unentgeltliche Lizenz ein, Kundeninhalte zu hosten, zu vervielfältigen, anzuzeigen, zu übertragen und technisch zu verarbeiten, um die Leistungen zu betreiben und zu unterstützen.",
      "Eigentum an der Plattform geht nicht auf den Kunden über.",
    ],
  },
  {
    n: 9,
    title: "Aussetzung und Beendigung",
    blocks: [
      "Jede Seite kann diese Bedingungen nach dem jeweiligen Abonnement oder einer vereinbarten schriftlichen Frist beenden.",
      "Der Anbieter kann den Zugang aussetzen oder beenden, soweit das vernünftigerweise nötig ist, um Inhaltsverstöße, Nichtzahlung, rechtswidriges Verhalten, Sicherheitsrisiken, eine wesentliche Verletzung oder Missbrauch zu beheben, vorbehaltlich des Gesetzes und einer erforderlichen Mitteilung.",
      "Mit der Beendigung endet das Recht des Kunden, die Plattform zu nutzen. Der Anbieter kann Kundeninhalte nach seinen Aufbewahrungsregeln und gesetzlichen Pflichten entfernen.",
    ],
  },
  {
    n: 10,
    title: "Datenschutz",
    blocks: [
      "Jede Seite hält das geltende Datenschutzrecht ein.",
      "Der Anbieter darf personenbezogene Daten verarbeiten, soweit das für die Leistungen, die Konten, den Schutz der Plattform und gesetzliche Pflichten erforderlich ist. Einzelheiten stehen in der Datenschutzerklärung oder einer gesonderten Vereinbarung zur Auftragsverarbeitung.",
      "Der Kunde sorgt dafür, dass seine Erhebung und Übermittlung personenbezogener Daten über die Plattform rechtmäßig ist.",
    ],
  },
  {
    n: 11,
    title: "Allgemeines",
    blocks: [
      "Diese Bedingungen sind die gesamte Vereinbarung der Seiten über die Leistungen und ersetzen frühere Abreden zum selben Gegenstand, außer gesondert geschlossene Bedingungen sind ausdrücklich einbezogen.",
      "Änderungen bedürfen der schriftlichen Zustimmung der Seiten.",
      "Keine Seite haftet für Verzug oder Ausfall durch Umstände außerhalb ihrer zumutbaren Kontrolle, soweit das Gesetz das zulässt.",
      "Ist eine Bestimmung undurchsetzbar, bleiben die übrigen im gesetzlich zulässigen Umfang wirksam.",
      "Diese Bedingungen begründen keine Gesellschaft, kein Gemeinschaftsunternehmen, keine Vertretung, kein Treuhandverhältnis und kein Arbeitsverhältnis.",
    ],
  },
];

export function termsDocument(locale: Locale): {
  title: string;
  kicker: string;
  meta: string[];
  sections: LegalSection[];
} {
  if (locale === "de") {
    return {
      title: "Nutzungsbedingungen",
      kicker: "Tsplits™",
      meta: ["TalisALL PMC", "Beträge in CAD"],
      sections: presentLegal(TERMS_DE),
    };
  }
  return {
    title: "Terms of Service",
    kicker: "Tsplits™",
    meta: ["TalisALL PMC", "Amounts in CAD"],
    sections: presentLegal(TERMS_OF_SERVICE),
  };
}
