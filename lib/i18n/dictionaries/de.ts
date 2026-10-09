/**
 * Deutsches UI-Wörterbuch — von Hand übersetzt (Sie-Form).
 * Marken bleiben unverändert: Talispros™, Talishouse™, Mapsites/Mapsite,
 * Talisbooks™, TalisTV™, TalisU / Talis“U”, TalisBOT, FAST Codes™, TEB™, TTV™,
 * PIN, SamCart. Akronyme (URL, MLS, TEB, TVA, TTV) bleiben,
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
      product: "Produktoptionen",
    },
    talisuMenu: {
      faq: "FAQ",
      knowledgeBase: "Wissensdatenbank",
      audio: "Audio",
      video: "Video",
    },
    dashboardLocked: {
      title: "Dashboard ist gesperrt",
      body: "Registrieren Sie sich, um Ihr Mapsite-Dashboard nach erfolgreicher Zahlung freizuschalten.",
      cta: "Registrieren",
    },
    mapsitesMenu: {
      title: "Mapsites",
      prompt: "Geben Sie Ihren FAST Code™ ein, um Ihre persönliche Mapsite zu öffnen.",
      fieldLabel: "FAST Code™",
      placeholder: "FAST Code™",
      submit: "Mapsite öffnen",
      opening: "Wird geöffnet …",
      demo: "Demo-Mapsite",
      errEmpty: "Bitte geben Sie einen FAST Code™ ein.",
      errChars: "Bitte nur Buchstaben und Ziffern verwenden (kein & oder +).",
      errOpen: "Diese Mapsite konnte nicht geöffnet werden.",
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
      received: "Zahlungsrückmeldung erhalten – Ihre Mapsite wird freigeschaltet.",
      detected: "Zahlungsrückmeldung erkannt.",
      order: "SamCart-Bestellung",
      openClaimed: "Ihre beanspruchte Mapsite öffnen",
      useAccountBefore: "Nutzen Sie",
      useAccountAfter: "mit Ihrem FAST Code™, um Ihre Mapsite zu öffnen.",
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
    },
    segments: [
      { label: "Inhaber / Manager", title: "Makler oder Teamleiter" },
      { label: "Lizenziert", title: "Immobilienprofi" },
      { label: "Ohne Lizenz", title: "Privatverkauf (FSBO)" },
      { label: "Adpro™", title: "Produkt- und Dienstleistungsanbieter" },
    ],
    fastCode: {
      formAria: "Mapsite mit FAST Code öffnen",
      label: "FAST Code™",
      placeholder: "FAST Code eingeben",
      submit: "Mapsite",
      opening: "Wird geöffnet …",
      errEmpty: "Bitte geben Sie einen FAST Code ein.",
      errOpen: "Diese Mapsite konnte nicht geöffnet werden.",
    },
  },

  talisu: {
    faq: {
      title: "Häufig gestellte Fragen",
      items: [
        {
          question: "Was ist eine Mapsite?",
          answer:
            "Eine Mapsite ist ein kartenbasiertes Online-Navigationssystem, das branchennah eingesetzt werden kann und Ihnen mehr Flexibilität bei der Vermarktung hochpreisiger Produkte verschafft (also solcher, die in der Regel mehr als 10.000 $ pro Einheit kosten und ortsfest sind, rollen, schwimmen oder fliegen).",
        },
        {
          question: "Was bedeutet Talis“U”?",
          answer:
            "Das “U” ist ein Wortspiel und steht für „University“: Wir bilden unsere Registrierten weiter, damit sie ihre Marketing-Komfortzone erweitern und ihre Plattformen schnell und kompetent an den Start bringen können.",
        },
        {
          question: "Wofür steht PMC?",
          answer:
            "Promote – Manage – Cooperate (Bewerben – Verwalten – Kooperieren). Mapsites enthalten PINs, deren Fähnchen für jeden PIN Links zu URL, MLS®, TEB und TTV anzeigen:",
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
            "„Absolventen“ der TalisU™, die Mapsites nutzen, um die Infrastruktur komplexer Empfehlungs- und/oder Co-Promotion-Netzwerke visuell darzustellen, nachzuverfolgen und zu verwalten.",
        },
        {
          question: "Wie können Mapsites den Umsatz von Talispros™ steigern?",
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
            "Die Registrierung von Derivative-Konten, die die Mapsites von Root-Konten nutzen, kostet jährlich 198,50 $ für die Einrichtung des Kontos und monatlich 98,50 $ für dessen Fortführung.",
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
            "Füllen Sie das Formular aus: Die Initialen Ihres Vor- und Nachnamens bilden die eine Hälfte Ihres FAST Code™ (Free Access, Standard Tracking). Die andere Hälfte ist eine Zahl zwischen 01 und 99, die Sie in unserem System eindeutig macht. Ihre Straßenadresse positioniert Ihren Home-PIN auf Ihrer Beispiel-Mapsite. Die Beispiel-Mapsite zeigt uns, ob es Überschneidungen mit anderen Heimatmärkten gibt.",
            "Wählen Sie „Weiter zum Demo-eBook“.",
            "Ihre Mapsite wird erstellt und ein Fähnchen öffnet sich.",
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
          label: "Mapsites",
          text: "Wir stellen dedizierte kartenbasierte Plattformen bereit, die Ihnen als Werkzeuge für Empfehlungs- und Co-Promotion-Netzwerke dienen, wenn Sie zweckgebundene oder nutzergenerierte Inhalte veröffentlichen. Bitte beachten Sie: Inhalte müssen unpolitisch sein und nach allgemein anerkannten Maßstäben dem guten Geschmack entsprechen – darüber entscheiden wir nach eigenem Ermessen. Andernfalls werden Inhalte von unseren KI-Bots sofort und ohne Vorwarnung „blind“ geschaltet. Eine erneute Einreichung ist zulässig.",
        },
        {
          label: "Talisbooks™ (TEB)",
          text: "Wir stellen Ihr Online-Bücherregal bereit und verwalten es, um qualifizierte Angebote (QL) hervorzuheben, indem wir angeheftete digitale Publikationen weltweit aktiv bewerben. Qualifizierte Angebote sind natürlich solche, die Ihnen genug einbringen und eine ausreichend lange Laufzeit haben, um Ihre Leistungskennzahlen im Laufe der Zeit zu verbessern.",
        },
        {
          label: "Angebotsanalyse (TVA)",
          text: "Wir analysieren qualifizierte Angebote, um ihre Eignung für Investorengruppen zu ermitteln, die fortgeschrittene Transaktionsstrukturen suchen – darunter SPLITS, Fraktionalisierung und Tokenisierung. Da diese oft nicht mit einer Präsentation auf herkömmlichen Branchenplattformen vereinbar sind, benötigen sie Mapsites für die Vermarktung.",
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
      partnerHeading: "Ihr Anpassungspartner",
      partnerName: "Webster M. – Teamleiter",
      paragraphs: [
        "Modulare Container- oder Kuppelbauten erschließen „Hypermobilität“ bei struktureller Zuverlässigkeit und ermöglichen Unternehmen, die auf Kundenfrequenz angewiesen sind, physische Standorte genau dort einzusetzen, wo sie ihre Kunden finden.",
        "Vorgefertigte Module aus standardisiertem, langlebigem „Corten“-Stahl (korrosionsbeständig und mit hoher Zugfestigkeit) oder aus Fiberglas lassen sich schnell in Betrieb nehmen.",
        "Werden sie auf mobilen Plattformen installiert, kann in vielen nordamerikanischen Rechtsordnungen eine Baugenehmigung entfallen.",
      ],
      helpHeading: "So helfen wir Ihnen:",
      helpItems: [
        "Wählen Sie ein Design und leisten Sie eine Anzahlung von 2.000 $.",
        "Sie wird vollständig auf Ihre Bestellung angerechnet – und …",
        "Sie sichert Ihnen Ihren Platz in den Warteschlangen für Produktion und Versand.",
        "Außerdem reserviert sie Zeit bei unserer Anpassungsabteilung, um Ihre Vision präzise zu verwirklichen.",
      ],
      protectionHeading: "Schutz der Anzahlung:",
      protectionText:
        "Ihre Anzahlung ist bis zu 12 Monate geschützt (oder länger nach besonderer Vereinbarung von Fall zu Fall).",
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
    getHelp: "Kontakt hinterlassen",
    processesHeading: "Talispros™-Prozesse",
    allTopics: "← Alle Themen",
    contactAbout: "Hierzu Kontakt aufnehmen",
    back: "← Zurück",
    knowledge: [
      {
        id: "mapsites",
        title: "Mapsites",
        body: "Eine Mapsite ist Ihr kartenbasiertes Marktzuhause: PINs, Angebote und Partnerwerbung. Beanspruchen Sie einen Demo-Markt und registrieren Sie sich anschließend über SamCart, um Ihr Dashboard zu aktivieren.",
      },
      {
        id: "talisbooks",
        title: "Talisbooks™",
        body: "Talisbooks™ sind digitale Lookbooks in Bücherregalen. Jeder FAST Code™ kann ein eigenes TEB™-Regal haben; das Common Shelf und die öffentliche Bibliothek sammeln veröffentlichte Bücher.",
      },
      {
        id: "talismaps",
        title: "Talismaps™",
        body: "Talismaps™ betreibt eigene Karten-Engines (Satellit / PINs) für Märkte und Mapsites – keine eingebetteten Karten von Drittanbietern.",
      },
      {
        id: "fast-codes",
        title: "FAST Codes™",
        body: "Ein FAST Code™ ist Ihre Marktkennung. Er verbindet Ihre Mapsite, Ihr Talisbooks™-Regal und Ihre Verwaltungswerkzeuge. Demo-Codes nutzen „Beanspruchen“, ausgegebene Codes nutzen „Registrieren“.",
      },
      {
        id: "claim-register",
        title: "Beanspruchen / Registrieren",
        body: "Beanspruchen Sie einen Demo-Markt, um alles kennenzulernen. Die Registrierung (SamCart-Checkout) schaltet nach erfolgreicher Zahlung ein echtes Mapsite-Dashboard frei.",
      },
      {
        id: "shelves",
        title: "Regale",
        body: "Das Bücherregal ist das eigenständige ALLPINS-Katalogregal mit dem Tokenization-/ALLPINS-Buch als linker Hervorhebung. Das Mapsites-Menü führt zu beanspruchten und Demo-Mapsites.",
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
        body: "Starten Sie über Märkte → Nächster Schritt / Demo, um eine Demo-Mapsite zu erstellen und die Abläufe kennenzulernen, bevor Sie sich registrieren.",
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

  markets: {
    pmcTitle: "Talispros™ PMC",
    pmcBullets: [
      "Root-Konten können unbegrenzt viele Derivative-Konten registrieren.",
      "Derivative-Konten veröffentlichen auf Root-Mapsites und bewerben dort jeweils bis zu 100 PINs.",
      "FSBO- und Adpro-Konten bewerben Mapsites mit einem einzelnen PIN.",
    ],
    pmcTagline: "Bewerben - Verwalten - Kooperieren",
    footer:
      "Wählen Sie den PIN, der Ihnen am nächsten liegt, um einen Markt im Umkreis von 50 Meilen (80 Kilometern) um einen Mittelpunkt als teilexklusives Gebiet zu beanspruchen. Teilexklusiv bedeutet: Innerhalb dieses Kreises werden keine weiteren Märkte vergeben, benachbarte Märkte dürfen jedoch weiterhin Angebote pinnen, für die ihnen schriftliche und geprüfte Angebotsunterlagen vorliegen.",
    canada: "Kanada",
    doMore: "Do More...",
    noMatches: "Keine Treffer",
    close: "Schließen",
    nextLabel: "Nächster Schritt …",
    marketDescription:
      "Beanspruchen Sie einen branchennahen Marktplatz, indem Sie eine Demo-Mapsite erstellen.",
    pinLabels: {
      "nl": "Neufundland und Labrador",
      "ns": "Nova Scotia (Neuschottland)",
      "nb-pei": "New Brunswick & Prince Edward Island",
      "qc": "Québec",
      "on-east": "Ost-Ontario",
      "on-south": "Süd-Ontario",
      "on-north": "Nord-Ontario",
      "on-west": "West-Ontario",
      "mb": "Manitoba",
      "sk": "Saskatchewan",
      "ab": "Alberta",
      "bc": "British Columbia",
      "yt": "Yukon",
      "nt": "Nordwest-Territorien",
      "nu": "Nunavut",
      "modular-spaces": "Talishouse™ Modular Spaces",
    },
    doMoreDescriptions: {
      "modular-spaces":
        "Jeder registrierte Markt erhält angebotsseitigen Zugang zu einer breiten Auswahl an Bauten für den Selbstbau.",
    },
  },

  mapsite: {
    registerAccountNow: "Jetzt Konto registrieren",
    buildMyMapsite: "Meine Mapsite erstellen",
    claimReceived: "Anspruch eingegangen",
    fastCodeCaps: "FAST CODE",
    knowledgeBase: "Wissensdatenbank",
    partnerIntro: "Ich bin Ihre Marketingpartnerin …",
    logout: "Abmelden",
    loggingOut: "Abmeldung läuft …",
    logoutAria: "Von der Mapsite-Inhabersitzung abmelden",
    close: "Schließen",
    dashboardMenu: {
      ebooks: "E-Book-Editor",
      branding: "Logo- & Karten-Editor",
      pins: "PIN-Dashboard",
      bookshelf: "Bücherregal-Editor",
    },
    popup: {
      genericTitle: "Das erste von vielen E-Books",
      yourMapsite: "Ihre Mapsite",
      genericWriteup:
        "Nach der Registrierung kann Ihre Mapsite bis zu 10 Kategorien mit 100 PINs bewerben und so monatlich 1.000 Aufrufe erzielen. Niemals Vermittlungsprovisionen.",
      claimedFallback: "FAST Code™ {code} · beanspruchte Mapsite.",
      welcomeFallback:
        "Willkommen bei Talispros™. Wählen Sie Ihren Markt und starten Sie das Onboarding.",
      tebPreparing:
        "Ihr erstes Talisbook™ wird vorbereitet. TEB™ wird hier freigeschaltet, sobald es fertig ist.",
      resourceUnavailable: "{label} nicht verfügbar",
      resourceNotConfigured: "{label} ist noch nicht eingerichtet",
      fastCodeLabel: "FAST Code: {code}",
    },
    startHere: {
      aria: "Hier starten. Weiter zur Auswahl Ihres E-Books.",
      title: "Hier starten",
      subtitle: "Ihr erstes Talisbook™ öffnen",
    },
    urlGate: {
      headline: "Gesicherter URL-Zugang",
      intro:
        "Zahlungs- und Angebotslinks bleiben gesperrt, bis ein Sicherheitscode des Global Admin eingegeben wird.",
      generating: "Wird erstellt …",
      generateNew: "Neuen Sicherheitscode erstellen",
      generate: "Sicherheitscode erstellen",
      generated:
        "Der Sicherheitscode wurde erstellt und an die Admin-Benachrichtigungen gesendet. Bitten Sie den Admin um den 6-stelligen Code (gültig für {ttl}, einmalig verwendbar).",
      errGenerate: "Der Sicherheitscode konnte nicht erstellt werden.",
      errUnlock: "Die URL konnte nicht entsperrt werden.",
      codeLabel: "6-stelligen Sicherheitscode eingeben",
      checking: "Wird geprüft …",
      open: "URL öffnen",
      footnote:
        "Codes erscheinen unter Admin → Benachrichtigungen mit FAST Code und Uhrzeit. Jeder Code funktioniert einmal und läuft nach {ttl} ab.",
      ttl: "30 Minuten",
    },
    pinDashboard: {
      title: "PIN-Dashboard",
      errCheckout: "Der Checkout konnte nicht gestartet werden.",
      errCoordsOrMap:
        "Geben Sie einen gültigen Breiten- und Längengrad ein oder klicken Sie auf die Karte.",
      errCoords: "Geben Sie einen gültigen Breiten- und Längengrad ein.",
      placed: "PIN gesetzt.",
      updated: "PIN aktualisiert.",
      checkoutSuccess:
        "Zahlung erhalten. Die PIN-Kapazität wird aktualisiert, sobald Stripe die Zahlung bestätigt.",
      checkoutCancelled: "Checkout abgebrochen. Es wurden keine PINs hinzugefügt.",
      included: "Inklusive",
      onePin: "1 PIN",
      capacity: "Kapazität",
      purchased: "Gekauft",
      readyToPlace: "Bereit zum Setzen",
      buyHeading: "PINs kaufen · {price} CAD pro Stück",
      atLimit: "Diese Mapsite hat das Limit von 100 PINs erreicht.",
      quantity: "Anzahl",
      startingCheckout: "Checkout wird gestartet …",
      buyOne: "1 PIN kaufen · {price} CAD",
      buyMany: "{count} PINs kaufen · {price} CAD",
      leftOne: "Noch 1 PIN zum Kauf verfügbar.",
      leftMany: "Noch {count} PINs zum Kauf verfügbar.",
      placeHeading: "Setzen und korrigieren",
      placeHelp:
        "Der inklusive PIN bleibt beim Angebot. Setzen Sie gekaufte PINs per Klick auf die Karte oder durch Eingabe von Koordinaten. Ziehen Sie einen PIN oder bearbeiten Sie ihn hier, um den Standort zu korrigieren.",
      cancelPlacement: "Setzen abbrechen",
      placeAPin: "PIN setzen",
      clickMap: "Klicken Sie auf die Karte, um den nächsten PIN zu setzen.",
      label: "Bezeichnung",
      latitude: "Breitengrad",
      longitude: "Längengrad",
      placeAtCoords: "An Koordinaten setzen",
      savePin: "PIN speichern",
      noneYet: "Noch keine zusätzlichen PINs gesetzt.",
      fixing: "Wird korrigiert",
      fix: "Korrigieren",
      freeCredits: "Gratis-PINs",
      freeAvailableOne:
        "Sie haben 1 Gratis-PIN vom Talispros™-Admin. Er wird vor jeder Zahlung verwendet.",
      freeAvailableMany:
        "Sie haben {count} Gratis-PINs vom Talispros™-Admin. Sie werden vor jeder Zahlung verwendet.",
      useFreeOne: "1 Gratis-PIN hinzufügen",
      useFreeMany: "{count} Gratis-PINs hinzufügen",
      useFreeAndBuy: "{free} gratis + {paid} kaufen · {price} CAD",
      applyingFree: "PINs werden hinzugefügt …",
      freeAddedOne: "1 Gratis-PIN hinzugefügt. Keine Zahlung nötig.",
      freeAddedMany: "{count} Gratis-PINs hinzugefügt. Keine Zahlung nötig.",
    },
  },

  talisuHub: {
    talisTvSoon: "Alle Inhalte werden in Kürze auf TalisTV veröffentlicht!",
    kbTitle: "Wissensdatenbank",
    kbSubtitle: "Audios, Videos und Lernmaterial für TalisU™-Partner.",
    buckets: {
      audios: "Audios",
      videos: "Videos",
      learning: "Lernmaterial",
    },
    kbTabsAria: "Bereiche der Wissensdatenbank",
    kbEmptyLearning:
      "Hier entstehen weitere Lernmaterialien, sobald Leitfäden veröffentlicht werden.",
    kbEmpty: "In diesem Bereich gibt es noch keine Einträge.",
    kbUpdateContent: "Inhalte aktualisieren",
    kbLogout: "Abmelden",
    kbLogoutAria: "Von der Wissensdatenbank-Sitzung abmelden",
    kbChecking: "Zugriff wird geprüft …",
    kbUnlockHint:
      "Sie können die Wissensdatenbank auch über das TalisU-Menü in der Kopfzeile freischalten.",
  },

  viewer: {
    continueToRegister: "Weiter zur Registrierung",
    eyebrowFsbo: "Talisbooks™ Privatverkauf-Demo (FSBO)",
    eyebrowMagazine: "Talisbooks™ Magazin",
    eyebrowViewer: "Talisbooks™ Viewer",
    home: "Startseite",
    backToMapsite: "Zurück zur Mapsite",
    product: "Produkt",
    downloadPdf: "PDF herunterladen",
    markets: "Märkte",
    globalAdmin: "Globaler Admin",
    portraitStage: "Hochformat",
    landscapeStage: "Querformat",
    toPortraitAria: "Ansicht wieder ins Hochformat drehen",
    toLandscapeAria: "Ansicht ins Querformat drehen",
    portrait: "Hochformat",
    landscape: "Querformat",
    playback: "Wiedergabe",
    pause: "Pause",
    play: "Abspielen",
    flipSpeed: "Blättergeschwindigkeit",
    speedPresets: { slow: "Langsam", normal: "Normal", fast: "Schnell" },
    viewMode: "Ansichtsmodus",
    spread: "Doppelseite",
    spreadView: "Doppelseitenansicht",
    single: "Einzelseite",
    singlePage: "Einzelseitenansicht",
    previousPage: "Vorherige Seite",
    nextPage: "Nächste Seite",
    openMagazine: "Magazin öffnen",
    openBook: "Buch öffnen",
    openMagazineSingle: "Magazin öffnen · Einzelseite",
    openBookSingle: "Buch öffnen · Einzelseite",
    closedOpen: "Geschlossener Hardcover-Einband · Zum Öffnen klicken",
    closedReopen: "Geschlossener Hardcover-Einband · Zum erneuten Öffnen klicken",
  },

  bookshelf: {
    title: "Bücherregal",
    backToAllPins: "Zurück zu ALL-PINs",
    createEbook: "E-Book erstellen",
    ecosystem: "Talispros™-Ökosystem",
    rootAccount: "Root-Konto",
    derivativeAccount: "Derivative-Konto",
    subtitleScoped:
      "Öffnen Sie einen Einband zum Lesen. Dieses Regal zeigt nur Talisbooks™, die mit FAST Code {code} verbunden sind.",
    subtitleCreated:
      "Öffnen Sie einen Einband zum Lesen. In diesem Regal stehen erstellte Talisbooks™ mit FAST Codes. Das neueste Buch ist links angeheftet; ältere Bücher stehen rechts, von links nach rechts vom neuesten zum ältesten.",
    subtitlePublic:
      "Öffnen Sie einen Einband zum Lesen. Das hervorgehobene Buch steht vorne im Regal.",
    capacityTitle: "Monetarisierungskapazität eines voll bestückten Regals",
    capacityLabel: "Regalkapazität",
    perMonth: "Monat",
    register: "Registrieren",
    lockedTitle: "Bücherregal gesperrt",
    lockedBody:
      "Alle Bücherregal-Funktionen, Veröffentlichung, globales Marketing, zusätzliche Uploads, Derivative-Bücher und Adpro-Bücher werden nach der Kontoaktivierung freigeschaltet. Ihr erster Entwurf bleibt schon jetzt verfügbar.",
    highlightedAria: "Hervorgehobene und geplante Bücher",
    featuredLayoutAria: "Layout der Hervorhebungen",
    emptyFeatured: "Noch keine hervorgehobenen TalisBooks™",
    emptyPublished: "Noch keine veröffentlichten TalisBooks™",
    emptyCreated: "Noch keine erstellten FAST Talisbooks™",
    emptyScoped: "Noch kein E-Book in diesem FAST-Code-Regal",
    emptyHighlighted: "Noch keine hervorgehobenen Bücher",
    generalAria: "Allgemeine Bibliothek",
    savedOrder: "Gespeicherte Reihenfolge",
    sort: { published_desc: "Datum", title_asc: "Name" },
    noBooks: "Keine Bücher in diesem Regal",
    pageCount: "{page}/{count} ({total} Bücher)",
    prev: "Zurück",
    next: "Weiter",
    rootShelf: "Root-Regal",
    derivativeShelf: "Derivative-Regal",
  },

  catalogueUi: {
    register: "Registrieren",
    home: "Startseite",
    bookshelf: "Bücherregal",
    previous: "Zurück",
    next: "Weiter",
    customize: "{label} anpassen",
    customizeDesign: "Ein Design anpassen",
    pageOf: "Seite {page} von {count}",
    front: "Vorderseite",
    back: "Rückseite",
  },

  demo: {
    downloadPdf: "Demo-PDF herunterladen",
    eyebrow: "DEMONSTRATION",
    title: "Demo-eBook und Mapsite",
    placeAPin: "Setzen Sie einen PIN.",
    createFromSample: "Talisbook™ aus dem angehefteten Muster erstellen",
    fastCodeOnRegistration: "FAST Code wird bei der Registrierung vergeben",
    listingTitle: "Titel des Angebots",
    defaultListingTitle: "Demo-Mapsite",
    errPlacePin: "Setzen Sie einen PIN oder geben Sie eine Adresse ein, um fortzufahren.",
    continue: "Weiter zum Demo-eBook",
    continuing: "Weiter zum Demo-eBook …",
    nextNote:
      "Als Nächstes extrahieren Sie die Seiten des angehefteten Talispros-eBooks, optimieren sie und erstellen das Demonstrations-Talisbook™. Es wird kein FAST Code vergeben.",
    claimDescribe: "Was beschreibt Sie am besten?",
    claimChooseError:
      "Wählen Sie vor dem Beanspruchen aus, wer Sie sind (dieselben Optionen wie unter /start).",
    firstName: "Vorname",
    lastName: "Nachname",
    cancel: "Abbrechen",
    claim: "Beanspruchen",
    claiming: "Wird beansprucht …",
    previewNeedName:
      "Geben Sie Vor- und Nachnamen ein, um eine Vorschau Ihres FAST Code™ zu sehen.",
    previewBased:
      "Basierend auf „{name}“ – Initialen {initials}. Die letzten 2 Ziffern werden beim Beanspruchen vergeben.",
    previewError: "Aus diesem Namen konnte keine FAST Code™-Vorschau erstellt werden.",
    previewTitle: "FAST Code™-Vorschau",
  },

  login: {
    signIn: "Anmelden",
    signInLower: "Anmelden",
    signingIn: "Anmeldung läuft …",
    email: "E-Mail",
    password: "Passwort",
    genericError: "Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.",
    clientTitle: "Kundenanalysen",
    clientSubtitle: "Melden Sie sich mit Ihrer E-Mail-Adresse und Ihrem zugewiesenen FAST Code an",
    clientCodePlaceholder: "z. B. LRG1",
    clientInvalid: "E-Mail-Adresse oder FAST Code ist ungültig.",
    marketingTitle: "Marketing-Manager",
    marketingSubtitle:
      "Melden Sie sich an, um tägliche Kennzahlen und Checklisten-Updates für Kunden zu veröffentlichen",
    marketingInvalid: "E-Mail-Adresse oder Passwort ist ungültig",
    associateTitle: "Associate-Anmeldung",
    associateSubtitle: "Geben Sie Ihren FAST Code ein, um auf Ihr Dashboard zuzugreifen",
    associateCodePlaceholder: "z. B. FAST001",
    associateEmpty: "Bitte geben Sie Ihren FAST Code ein.",
    associateInvalid: "Ungültiger FAST Code. Bitte prüfen Sie ihn und versuchen Sie es erneut.",
    crmTitle: "CRM-Anmeldung",
    crmSubtitle: "Geben Sie Ihren Zugangscode ein, um fortzufahren",
    crmPlaceholder: "Zugangscode",
    crmEmpty: "Bitte geben Sie Ihren Zugangscode ein.",
    crmInvalid: "Ungültiger Zugangscode. Bitte versuchen Sie es erneut.",
    crmDemoCodes: "Demo-Zugangscodes",
  },

  meta: {
    bookshelf: {
      title: "ALLPINS Talisbooks™ · Bücherregal",
      description:
        "Mit Mapsites verbundenes Talisbooks™-Bücherregal für FAST Code ALLPINS. Öffnen Sie einen Einband, um die Bücher im separaten Regal zu lesen.",
    },
    demoMapsite: {
      title: "Demo-eBook und Mapsite erstellen",
      description:
        "Setzen Sie einen Demonstrations-PIN und hängen Sie das angeheftete Talispros-eBook an. Es wird kein FAST Code vergeben.",
    },
    catalogue: {
      title: "Katalog | Talishouse™ Produktkatalog",
      description:
        "Designideen aus dem Talishouse™ Produktkatalog. Jedes Design ist nummeriert (P01, P02 …) – tippen Sie auf ein Design, um sich für dieses Produkt zu registrieren.",
    },
    talisuKb: {
      title: "TalisU™ | Wissensdatenbank",
      description:
        "TalisU™-Wissensdatenbank – Audios, Videos und Lernmaterial für Mapsites und FAST Codes™.",
    },
    talisuVideo: {
      title: "TalisU™ | Video",
      description:
        "Die TalisU™-Videothek und das TalisTV™-Programm.",
    },
    talisuAudio: {
      title: "TalisU™ | Audio",
      description:
        "Hören Sie TalisU™-Audios – eine kurze Begrüßung startet automatisch, dazu Aisha & Webster über die digitale Fraktionalisierung von Immobilien.",
    },
    talisuMarkets: {
      title: "TalisU™ | Unsere Märkte",
      description:
        "Wählen Sie den PIN, der Ihnen am nächsten liegt, um einen Markt im Umkreis von 50 Meilen (80 Kilometern) als teilexklusives Gebiet zu beanspruchen.",
    },
    root: {
      title: "Talishouse | Häuser & Cottages",
      description:
        "Moderne Häuser und Cottages ab 58,50 $ pro Quadratfuß. An einem Tag gebaut, in einer Woche bezugsfertig. Mietkauf-Optionen verfügbar.",
    },
    home: {
      title: "Talispros™",
      description: "Sichern Sie sich Ihren Markt. Eröffnen Sie Ihre Mapsite.",
    },
    talisuLayout: {
      title: "TalisU™",
      description:
        "Branchennahe Abwicklungsoptionen – Konventionell, SPLITS, Fraktionalisierung und Tokenisierung.",
    },
    talisuFaq: {
      title: "TalisU™ | FAQ",
      description:
        "Häufig gestellte Fragen zu Talispros™, Mapsites und TalisU™.",
    },
    talisuRegister: {
      title: "TalisU™ | Konto registrieren",
      description:
        "Registrieren Sie Ihr TalisU™-Marketingpartnerkonto über den SamCart-Checkout.",
    },
    talisuEngage: {
      title: "Webster und sein Anpassungsteam beauftragen | TalisU™",
      description:
        "Arbeiten Sie mit Webster und seinem Anpassungsteam an Talishouse™ Modular Spaces: Glasshouse™, Talishouse™, Talistown™ und Talisdome™. Ihre Anzahlung wird vollständig auf Ihre Bestellung angerechnet.",
      ogImage: "/og/talisu-engage-de.jpg",
      ogImageAlt:
        "Webster M., Teamleiter, mit dem Talispros™-Baumlogo: Beauftragen Sie Webster und sein Anpassungsteam für Talishouse™ Modular Spaces",
    },
  },
};
