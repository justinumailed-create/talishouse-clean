/**
 * Deutsches UI-Wörterbuch — von Hand übersetzt (Sie-Form).
 * Marken bleiben unverändert: Talispros™, Talishouse™, Mapsites™/Mapsite,
 * Talisbooks™, TalisTV™, TalisU / Talis“U”, TalisBOT, FAST Codes™, TEB™, TTV™,
 * PIN, SamCart. Akronyme (URL, MLS, TEB, TVA, TTV, GH/TH/TT/TD) bleiben,
 * nur ihre Erklärungen werden übersetzt.
 */
import type { Dictionary } from "@/lib/i18n/dictionaries";
import {
  TALISU_ENGAGE,
  TALISU_REGISTER,
} from "@/lib/talisu/content";

export const de: Dictionary = {
  langSwitch: {
    groupLabel: "Sprache",
    en: "EN",
    de: "DE",
    enName: "English",
    deName: "Deutsch",
  },

  common: {
    back: "← Zurück",
    close: "Schließen",
    done: "Fertig",
    somethingWrong: "Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.",
    opening: "Wird geöffnet …",
  },

  nav: {
    tagline: "Branchennahe Mapsite-Märkte",
    brandSr: "Marke: Talispros™",
    markets: "Märkte",
    mapsites: "Mapsites",
    bookshelf: "Bücherregal",
    catalogue: "Katalog",
    register: "Registrieren",
    dashboard: "Dashboard",
    talisu: "TalisU",
    menuBack: "← Menü",
    registerMenu: {
      mapsite: "Mapsite",
      product: "Produkt",
    },
    talisuMenu: {
      faq: "FAQ",
      knowledgeBase: "Wissensdatenbank",
      audio: "Audio",
      video: "Video",
    },
    dashboardLocked: {
      title: "Dashboard ist gesperrt",
      body: "Registrieren Sie sich, um Ihr Mapsite™-Dashboard nach erfolgreicher Zahlung freizuschalten.",
      cta: "Registrieren",
    },
    mapsitesMenu: {
      title: "Mapsites™",
      prompt: "Geben Sie Ihren FAST Code™ ein, um Ihre persönliche Mapsite™ zu öffnen.",
      fieldLabel: "FAST Code™",
      placeholder: "FAST Code™",
      submit: "Mapsite™ öffnen",
      opening: "Wird geöffnet …",
      demo: "Demo-Mapsite™",
      errEmpty: "Bitte geben Sie einen FAST Code™ ein.",
      errChars: "Bitte nur Buchstaben und Ziffern verwenden (kein & oder +).",
      errOpen: "Diese Mapsite™ konnte nicht geöffnet werden.",
    },
  },

  kbUnlock: {
    title: "Wissensdatenbank",
    prompt: "Geben Sie Ihr Passwort ein, um die Inhalte freizuschalten.",
    passwordLabel: "Passwort",
    placeholder: "Passwort",
    error: "Falsches Passwort. Bitte versuchen Sie es erneut.",
    submit: "Freischalten",
  },

  home: {
    motto: "BEWERBEN – VERWALTEN – KOOPERIEREN",
    openAccount: "Ihr Konto eröffnen*",
    systemDemo: "System-Demo",
    legalSecondary: "*Es gelten bestimmte Einschränkungen.",
    bannerTitle: "Branchennahe Abwicklungsoptionen",
    structuresTagline: "Von uns unterstützte Transaktionsstrukturen",
    ownershipAria: "Eigentumsmodelle",
    closeDetails: "Details zu {title} schließen",
    learnMore: "Mehr erfahren",
    samcartReturn: {
      confirming: "Zahlungsrückmeldung wird bestätigt …",
      received: "Zahlungsrückmeldung erhalten – Ihre Mapsite™ wird freigeschaltet.",
      detected: "Zahlungsrückmeldung erkannt.",
      order: "SamCart-Bestellung",
      openClaimed: "Ihre beanspruchte Mapsite™ öffnen",
      useAccountBefore: "Nutzen Sie",
      useAccountAfter: "mit Ihrem FAST Code™, um Ihre Mapsite™ zu öffnen.",
      failedNote:
        "Rückmeldung erkannt, aber die Sitzung konnte nicht eingerichtet werden. Bitte melden Sie sich mit Ihrem FAST Code™ an.",
    },
    ownershipSections: [
      {
        id: "conventional",
        title: "Konventionell",
        body: "So wurden Immobilien schon immer erworben: Sie wählen eine Immobilie aus, geben ein Angebot ab, das Angebot wird angenommen, und Sie zahlen bar oder finanzieren. In beiden Fällen geht das Eigentum erst über, wenn der letzte Cent bezahlt ist.",
        result:
          "Das Ergebnis: Bis zur vollständigen Bezahlung haben Sie keinerlei Eigentumsrechte – nach Abschluss der Transaktion dafür die vollen Eigentumsrechte.",
        learnMoreLabel: "Mehr erfahren",
        learnMoreContact: true,
      },
      {
        id: "splits",
        title: "SPLITS",
        body: "Ähnlich wie „Konventionell“, jedoch mit einer SPLITS-Phase (Simple Project Lead & Input Tracking System). So umgehen Sie die Bank, benötigen aber eine Anzahlung und Ratenzahlungen bis zum Abschluss der Transaktion.",
        result:
          "Das Ergebnis: Sie haben volle Nutzungsrechte gemäß einem von Anwälten ausgearbeiteten Mietkaufvertrag („Lease-To-Own“).",
        learnMoreLabel: "Mehr erfahren",
        learnMoreContact: true,
      },
      {
        id: "fractionalization",
        title: "Fraktionalisierung",
        body: "Fraktionalisierung ermöglicht es mehreren Beteiligten, sich ein übergeordnetes physisches Interesse zu teilen. Dieses wird in klar definierte Anteile aufgeteilt, jeder mit eigenem Anspruch auf Rechte und auf eine anteilige Wertsteigerung.",
        result:
          "Das Ergebnis: Ideal für Partner und Investorengruppen, die Anteile am Gesamtobjekt erwerben möchten, ohne alles oder nichts kaufen zu müssen.",
        learnMoreLabel: "Mehr erfahren",
        learnMoreContact: true,
      },
      {
        id: "tokenization",
        title: "Tokenisierung",
        body: "Bei der Tokenisierung wird ein Interesse – ganz oder anteilig – als übertragbarer digitaler Vermögenswert erfasst. Langfristig ist dies die sauberste und am besten prüfbare Option für Eigentums- und Transaktionsstruktur sowie Buchführung.",
        result:
          "Das Ergebnis: Miteigentümer lassen sich leicht aufnehmen, die Anteile bleiben proportional, und Kapital kann beschafft werden, ohne den zugrunde liegenden Vermögenswert anzutasten.",
        learnMoreLabel: "Mehr erfahren",
        learnMoreContact: true,
      },
    ],
    corner: {
      markets: "Märkte",
      globalAdmin: "Globaler Admin",
    },
    segments: [
      { label: "Inhaber / Manager", title: "Makler oder Teamleiter" },
      { label: "Lizenziert", title: "Immobilienprofi" },
      { label: "Ohne Lizenz", title: "Privatverkauf (FSBO)" },
      { label: "Adpro™", title: "Produkt- und Dienstleistungsanbieter" },
    ],
    fastCode: {
      formAria: "Mapsite™ mit FAST Code öffnen",
      label: "FAST Code™",
      placeholder: "FAST Code eingeben",
      submit: "Mapsite",
      opening: "Wird geöffnet …",
      errEmpty: "Bitte geben Sie einen FAST Code ein.",
      errOpen: "Diese Mapsite™ konnte nicht geöffnet werden.",
    },
  },

  talisu: {
    faq: {
      title: "Häufig gestellte Fragen",
      items: [
        {
          question: "Was ist eine Mapsite™?",
          answer:
            "Eine Mapsite™ ist ein kartenbasiertes Online-Navigationssystem, das branchennah eingesetzt werden kann und Ihnen mehr Flexibilität bei der Vermarktung hochpreisiger Produkte verschafft (also solcher, die in der Regel mehr als 10.000 $ pro Einheit kosten und ortsfest sind, rollen, schwimmen oder fliegen).",
        },
        {
          question: "Was bedeutet Talis“U”?",
          answer:
            "Das “U” ist ein Wortspiel und steht für „University“: Wir bilden unsere Registrierten weiter, damit sie ihre Marketing-Komfortzone erweitern und ihre Plattformen schnell und kompetent an den Start bringen können.",
        },
        {
          question: "Wofür steht PMC?",
          answer:
            "Promote – Manage – Cooperate (Bewerben – Verwalten – Kooperieren). Mapsites™ enthalten PINs, deren Fähnchen für jeden PIN Links zu URL, MLS®, TEB und TTV anzeigen:",
          bullets: [
            "URL: ein Mittel, um Ihre Botschaften voranzubringen und die externe Kommunikation zu gestalten.",
            "MLS®: ein Link speziell für Immobilienprofis, der ohne Ablenkungen direkt zu bestimmten Angeboten führt.",
            "TEB: Talis eBooks / Talisbooks™ sind digitale Lead-Magneten und Werkzeuge für den Aufbau von Autorität, die Kunden anziehen und in umkämpften Märkten herausstechen.",
            "TTV: TalisTV™ verschafft Ihnen die Kontrolle über Ihre Markenbotschaft, beseitigt Abhängigkeiten von Werbung und sorgt für eine intensive Bindung Ihres Publikums.",
          ],
        },
        {
          question: "Wer sind Talispros™?",
          answer:
            "„Absolventen“ der TalisU™, die Mapsites™ nutzen, um die Infrastruktur komplexer Empfehlungs- und/oder Co-Promotion-Netzwerke visuell darzustellen, nachzuverfolgen und zu verwalten.",
        },
        {
          question: "Wie können Mapsites™ den Umsatz von Talispros™ steigern?",
          answer: [
            "Durch den Aufbau virtueller Monopole, die Untergrenzen für Servicegebühren etablieren.",
            "Beispiel: Vor Ort liegt die durchschnittliche Servicegebühr vielleicht bei „X“ und die durchschnittliche Vertragslaufzeit bei „Y“. Wie oft würden diese Durchschnittswerte infrage gestellt, wenn Sie auf herkömmliche Weise um Kunden konkurrieren?",
            "Virtuelle Monopole mit klar definierten Vorteilen können durchaus ein Argument dafür liefern, dass eine zusätzliche Vergütung und/oder eine längere Laufzeit gerechtfertigt sind.",
          ],
        },
        {
          question: "Was kostet die Registrierung eines Kontos?",
          answer: [
            "Die Registrierung von Root-, FSBO- und Adpro-Konten kostet jährlich 998,50 $ für die Einrichtung des Kontos und monatlich 98,50 $ für dessen Fortführung.",
            "Die Registrierung von Derivative-Konten, die die Mapsites™ von Root-Konten nutzen, kostet jährlich 198,50 $ für die Einrichtung des Kontos und monatlich 98,50 $ für dessen Fortführung.",
            "Zusätzliche globale Marketing-PINs kosten für Inhaber von Derivative-Konten 7 $ pro Woche (ein Dollar pro Tag, wöchentliche Bindung).",
          ],
        },
        {
          question: "Wann werden die Registrierungsgebühren fällig?",
          answer: "Nach der Genehmigung Ihres Marktantrags.",
        },
        {
          question: "Wie reiche ich einen Marktantrag ein?",
          answer: "Bitte gehen Sie auf Talispros.com in dieser Reihenfolge vor:",
          bullets: [
            "Wählen Sie „System-Demo“.",
            "Wählen Sie den PIN, der Ihrem Heimatstandort am nächsten liegt.",
            "Wählen Sie „Nächster Schritt“ und erstellen Sie ein Demo-eBook.",
            "Füllen Sie das Formular aus: Die Initialen Ihres Vor- und Nachnamens bilden die eine Hälfte Ihres FAST Code™ (Free Access, Standard Tracking). Die andere Hälfte ist eine Zahl zwischen 01 und 99, die Sie in unserem System eindeutig macht. Ihre Straßenadresse positioniert Ihren Home-PIN auf Ihrer Beispiel-Mapsite™. Die Beispiel-Mapsite™ zeigt uns, ob es Überschneidungen mit anderen Heimatmärkten gibt.",
            "Wählen Sie „Weiter zum Demo-eBook“.",
            "Ihre Mapsite™ wird erstellt und ein Fähnchen öffnet sich.",
            "Sie können Ihren Markt beanspruchen, indem Sie sich unter URL registrieren und die TEB- und TTV-Links öffnen.",
            "MLS® gilt nur für lizenzierte Immobilienprofis, die über Inhaber von Root-Konten registriert sind.",
          ],
        },
        {
          question: "Wie lange sind Marktgenehmigungen gültig?",
          answer: [
            "Bis jemand anderes genehmigt wird und sich registriert. Dieser Zeitraum kann Stunden oder Tage betragen, aber kaum Wochen oder Monate: Unser automatisiertes Platzierungssystem priorisiert Märkte, für die bereits Interesse besteht – und Ihre Demo hat genau dieses Interesse ausgelöst.",
          ],
        },
        {
          question: "Wie hoch sind die Vermittlungsprovisionen bei erfolgreichen Verkäufen?",
          answer:
            "Wir sind ein Werbe- und Marketingunternehmen. Wir berechnen keine Vermittlungsprovisionen.",
        },
        {
          question: "Wie lange binde ich mich mit einem Konto?",
          answer:
            "Stellen Sie einfach die Zahlung der Servicegebühren ein, um die Leistungen zu beenden und künftige Verpflichtungen zu vermeiden.",
        },
        {
          question: "Kann ich von einem Homeoffice aus arbeiten?",
          answer:
            "Ja, sofern das von Ihnen angegebene Fahrzeug Sie als Talispro ausweist – mit gut sichtbarer E-Mail-Adresse und Mobilnummer auf den Türen bzw. dem Aufbau sowie auf Heckklappe, Kofferraum oder Ladeklappe.",
        },
        {
          question: "Muss ich selbst im Unternehmen mitarbeiten?",
          answer:
            "Nein, sofern Sie mit jemandem zusammenarbeiten, der rechtlich nicht von Ihnen zu unterscheiden ist, und uns die entsprechenden Unterlagen vorliegen (z. B. Ehepartner oder volljähriges Kind).",
        },
        {
          question: "Wie viel Geld kann ich pro Jahr verdienen?",
          answer:
            "Wir können keine Zusicherungen dazu machen, wie viel Geschäft Sie erzielen werden. Zu viele Faktoren unterscheiden sich von Person zu Person und von Markt zu Markt.",
        },
        {
          question: "Erhalte ich vor dem Start eine Schulung?",
          answer:
            "Ja. Unser Schulungsprogramm ist sehr umfassend und weder zeitlich noch in seiner Dauer begrenzt. Wenn Sie es abgeschlossen haben, haben Sie Ihren ersten Verkauf getätigt und sind auf dem Weg in eine bessere Zukunft.",
        },
      ],
    },
    register: {
      ...TALISU_REGISTER,
      title: "Konto registrieren",
      partnerHeading: "Ihre Marketingpartnerin",
      partnerName: "Aisha C. – Teamleiterin",
      partnerIntro:
        "Mein Team und ich helfen Ihnen, Ihre immobiliennahen Marketinginitiativen entlang von vier großen Schwerpunkten auszubauen:",
      bullets: [
        {
          label: "Mapsites™",
          text: "Wir stellen dedizierte kartenbasierte Plattformen bereit, die Ihnen als Werkzeuge für Empfehlungs- und Co-Promotion-Netzwerke dienen, wenn Sie zweckgebundene oder nutzergenerierte Inhalte veröffentlichen. Bitte beachten Sie: Inhalte müssen unpolitisch sein und nach allgemein anerkannten Maßstäben dem guten Geschmack entsprechen – darüber entscheiden wir nach eigenem Ermessen. Andernfalls werden Inhalte von unseren KI-Bots sofort und ohne Vorwarnung „blind“ geschaltet. Eine erneute Einreichung ist zulässig.",
        },
        {
          label: "Talisbooks™ (TEB)",
          text: "Wir stellen Ihr Online-Bücherregal bereit und verwalten es, um qualifizierte Angebote (QL) hervorzuheben, indem wir angeheftete digitale Publikationen weltweit aktiv bewerben. Qualifizierte Angebote sind natürlich solche, die Ihnen genug einbringen und eine ausreichend lange Laufzeit haben, um Ihre Leistungskennzahlen im Laufe der Zeit zu verbessern.",
        },
        {
          label: "Angebotsanalyse (TVA)",
          text: "Wir analysieren qualifizierte Angebote, um ihre Eignung für Investorengruppen zu ermitteln, die fortgeschrittene Transaktionsstrukturen suchen – darunter SPLITS, Fraktionalisierung und Tokenisierung. Da diese oft nicht mit einer Präsentation auf herkömmlichen Branchenplattformen vereinbar sind, benötigen sie Mapsites™ für die Vermarktung.",
        },
        {
          label: "TalisTV™ (TTV)",
          text: "Wir stellen einen hauseigenen Online-TV-Sender bereit, verwalten ihn und geben ihm sein digitales Zuhause. Zusätzlich übernehmen wir die KI-gestützte Videoproduktion und unterstützen Sie bei der wöchentlichen Programmgestaltung – mit virtuellen Rundgängen, digitalen Besichtigungen (Open Houses) und natürlich wertsteigernden Angeboten.",
        },
      ],
      closing: "Nutzen Sie uns gern als Ressource …!",
    },
    engage: {
      ...TALISU_ENGAGE,
      title: "Das Team beauftragen",
      headline:
        "Leisten Sie eine Anzahlung, um Webster und sein Anpassungsteam zu beauftragen",
      partnerHeading: "Ihr Produktpartner",
      partnerName: "Webster M. – Teamleiter",
      partnerIntro:
        "Ich bin Ihr Produktpartner … Mein Team und ich helfen Ihnen, horizontal zu wachsen und sich breiter aufzustellen, indem Sie zusätzlich zu Ihrer Immobilie oder Ihrem Unternehmen Raum anbieten – in vier großen Produktlinien:",
      bullets: [
        {
          label: "GH",
          text: "Abkürzung für Glasshouse: GH sind Räume im Format 8x20 oder 10x20 mit einer, zwei oder drei Glasseiten, innen ausgebaut, aber nicht möbliert. Küche und Bad sind optional erhältlich.",
        },
        {
          label: "TH",
          text: "Abkürzung für Talishouse: TH sind faltbare Bauten im Format 20x20 oder 20x40 mit zwei oder drei Schlafzimmern und einem oder zwei Bädern. Küche, Ess- und Wohnbereich sind offen gestaltet oder weiter unterteilt, um Büro- oder Geschäftsräume zu schaffen. TH sind optional mobil, wodurch in vielen nordamerikanischen Rechtsordnungen keine Baugenehmigung erforderlich ist.",
        },
        {
          label: "TT",
          text: "Abkürzung für Talistown: TT sind viele TH auf einem Grundstück oder TH, die im Rahmen von SPLITS oder fraktionalisiertem Eigentum demselben Zweck dienen. TT lassen sich so skalieren, dass sie eine Million Dollar pro Jahr erwirtschaften.",
        },
        {
          label: "TD",
          text: "Abkürzung für Talisdome: TD sind der Inbegriff von Gästehaus, Einliegerwohnung, Homeoffice oder sogar Kurzzeitvermietung. Da sie nicht dauerhaft errichtet werden, ist in vielen nordamerikanischen Rechtsordnungen keine Baugenehmigung erforderlich.",
        },
      ],
      closing:
        "Senden Sie uns einen beliebigen Betrag bis maximal 10.000 $ als Anzahlung, um den Anpassungsprozess für Ihr Objekt oder Projekt zu starten.",
    },
    engageCustomizing: "Anpassung:",
    engageCataloguePage: "Talishouse™ Produktkatalog, Seite {page}",
    engageChange: "Ändern",
    footerPartOf: "ein Teil von",
  },

  bot: {
    name: "TalisBOT",
    subtitle: "Talispros™-Prozesse",
    openAria: "TalisBOT öffnen",
    closeAria: "TalisBOT schließen",
    faq: "FAQ",
    getHelp: "Hilfe erhalten / Kontakt hinterlassen",
    processesHeading: "Talispros™-Prozesse",
    allTopics: "← Alle Themen",
    contactAbout: "Hierzu Kontakt aufnehmen",
    back: "← Zurück",
    knowledge: [
      {
        id: "mapsites",
        title: "Mapsites™",
        body: "Eine Mapsite™ ist Ihr kartenbasiertes Marktzuhause: PINs, Angebote und Partnerwerbung. Beanspruchen Sie einen Demo-Markt und registrieren Sie sich anschließend über SamCart, um Ihr Dashboard zu aktivieren.",
      },
      {
        id: "talisbooks",
        title: "Talisbooks™",
        body: "Talisbooks™ sind digitale Lookbooks in Bücherregalen. Jeder FAST Code™ kann ein eigenes TEB™-Regal haben; das Common Shelf und die öffentliche Bibliothek sammeln veröffentlichte Bücher.",
      },
      {
        id: "talismaps",
        title: "Talismaps™",
        body: "Talismaps™ betreibt eigene Karten-Engines (Satellit / PINs) für Märkte und Mapsites™ – keine eingebetteten Karten von Drittanbietern.",
      },
      {
        id: "fast-codes",
        title: "FAST Codes™",
        body: "Ein FAST Code™ ist Ihre Marktkennung. Er verbindet Ihre Mapsite™, Ihr Talisbooks™-Regal und Ihre Verwaltungswerkzeuge. Demo-Codes nutzen „Beanspruchen“, ausgegebene Codes nutzen „Registrieren“.",
      },
      {
        id: "claim-register",
        title: "Beanspruchen / Registrieren",
        body: "Beanspruchen Sie einen Demo-Markt, um alles kennenzulernen. Die Registrierung (SamCart-Checkout) schaltet nach erfolgreicher Zahlung ein echtes Mapsite™-Dashboard frei.",
      },
      {
        id: "shelves",
        title: "Regale",
        body: "Das Bücherregal (Common Shelf) ist das eigenständige Katalogregal mit dem Cowboy's Guide unter der linken Hervorhebung. Das Mapsites™-Menü führt zu beanspruchten und Demo-Mapsites™.",
      },
      {
        id: "talisu",
        title: "TalisU™",
        body: "TalisU™ ist die Lern- und Marktebene: Wissensdatenbank, Audio, Video, Marktkarte und Registrierung – unter der blauen Talispros™-Kopfzeile.",
      },
      {
        id: "kb",
        title: "Wissensdatenbank",
        body: "Die Wissensdatenbank enthält Audios, Videos und Lernmaterial. Schalten Sie sie bei Aufforderung über die TalisU™-Navigation frei; Manager können Inhalte aktualisieren.",
      },
      {
        id: "demo",
        title: "Demo beanspruchen",
        body: "Starten Sie über Märkte → Nächster Schritt / Demo, um eine Demo-Mapsite™ zu erstellen und die Abläufe kennenzulernen, bevor Sie sich registrieren.",
      },
    ],
  },

  contactForm: {
    title: "Mehr erfahren",
    intro: "Erzählen Sie uns von Ihrem Interesse – wir melden uns bei Ihnen.",
    thanks: "Vielen Dank – Ihre Nachricht ist unterwegs.",
    advisor: "Ein Talispros™-Berater wird Sie zum Thema {topic} kontaktieren.",
    done: "Fertig",
    name: "Name",
    namePlaceholder: "Vor- und Nachname",
    email: "E-Mail",
    emailPlaceholder: "sie@beispiel.de",
    phone: "Telefon",
    phonePlaceholder: "(555) 555-5555",
    phoneError:
      "Bitte geben Sie eine gültige Telefonnummer aus den USA oder Kanada ein, z. B. (555) 555-5555.",
    project: "Projekt vorschlagen",
    projectPlaceholder: "Beschreiben Sie Ihr Projekt",
    sending: "Wird gesendet …",
    submit: "Anfrage senden",
    networkError: "Netzwerkfehler. Bitte versuchen Sie es erneut.",
    genericError: "Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.",
    back: "← Zurück",
    topics: {
      Conventional: "Konventionell",
      SPLITS: "SPLITS",
      Fractionalization: "Fraktionalisierung",
      Tokenization: "Tokenisierung",
    },
    apiErrors: {
      required: "Name, E-Mail, Telefon und Nachricht sind Pflichtfelder.",
      email: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
      save: "Ihre Anfrage konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.",
    },
  },

  meta: {
    root: {
      title: "Talishouse | Häuser & Cottages",
      description:
        "Moderne Häuser und Cottages ab 58,50 $ pro Quadratfuß. An einem Tag gebaut, in einer Woche bezugsfertig. Mietkauf-Optionen verfügbar.",
    },
    home: {
      title: "Talispros™",
      description: "Sichern Sie sich Ihren Markt. Eröffnen Sie Ihre Mapsite™.",
    },
    talisuLayout: {
      title: "TalisU™",
      description:
        "Branchennahe Abwicklungsoptionen – Konventionell, SPLITS, Fraktionalisierung und Tokenisierung.",
    },
    talisuFaq: {
      title: "TalisU™ | FAQ",
      description:
        "Häufig gestellte Fragen zu Talispros™, Mapsites™ und TalisU™.",
    },
    talisuRegister: {
      title: "TalisU™ | Konto registrieren",
      description:
        "Registrieren Sie Ihr TalisU™-Marketingpartnerkonto über den SamCart-Checkout.",
    },
    talisuEngage: {
      title: "TalisU™ | Das Team beauftragen",
      description:
        "Leisten Sie eine Anzahlung, um Webster und das Anpassungsteam für Glasshouse-, Talishouse-, Talistown- oder Talisdome-Projekte zu beauftragen.",
    },
  },
};
