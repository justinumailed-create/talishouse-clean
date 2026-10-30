# -*- coding: utf-8 -*-
"""Source of truth for page SEO + share cards. Run generate.py to emit
lib/seo/pages.json and render public/og/pages/<slug>-<locale>.jpg."""

AISHA = ("images/mapsites/aisha-c.webp", 0.5, {"en": "Aisha C. — Team Leader", "de": "Aisha C. – Teamleiterin"}, "Aisha C., Team Leader")
WEBSTER = ("talisu/webster-team-leader-v2.jpg", 0.5, {"en": "Thorsten P — Fulfilment Options", "de": "Thorsten P – Fulfilment-Optionen"}, "Thorsten P, Team Leader")
RAHUL = ("images/mapsites/lrg1-rahul.jpeg", 0.5, {"en": "Rahul — Marketing Admin", "de": "Rahul – Marketing-Admin"}, "Rahul, Marketing Admin")
MAP = ("assets/home-demo/01-talismaps-mkts.jpg", 0.42, None, None)
SHELF = ("assets/home-demo/02-talisbooks-bookshelf.jpg", 0.3, None, None)
CLAIMED = ("assets/home-demo/03-claimed-mapsite-rm22.jpg", 0.12, None, None)
LAPTOP = ("images/mapsite-bottom-right.jpg", 0.55, None, None)
TDOME = ("talisu/mkts/T-Dome-elevateNF.jpg", 0.5, None, None)
PIN = ("talisu/mkts/PIN-Map-1920L.jpeg", 0.45, None, None)
GLASS = ("images/glasshouse/hero.png", 0.45, None, None)
REC = ("images/talishouse/recreational/hero.png", 0.4, None, None)
RES = ("images/talishouse/residential/hero.jpg", 0.4, None, None)
TOWNS = ("images/talistowns.jpg", 0.4, None, None)
COVER = ("talisbooks/pinned/front-cover.jpg", 0.5, None, None)
WINDSWEPT = ("talisu/pmc/windswept.jpg", 0.45, None, None)
BRAND = None   # blue panel with the white Windswept tree
ADMIN = "admin"

# (route, slug, kind, photo, en, de)
# kind: public | login | utility (noindex) | dynamic | custom (reg/engage, own code)
# each locale: (title, description, kicker, [headline lines], [chips])
P = []
def add(route, slug, kind, photo, en, de):
    P.append(dict(route=route, slug=slug, kind=kind, photo=photo, en=en, de=de))

# ---------- priority public pages ----------
add("/", "home", "public", CLAIMED,
    ("Tsplits™ | Claim Your Market, Open Your Mapsite",
     "Claim your market on Tsplits™. Your Mapsite pins your place on the map so buyers and partners can find you, with Talisbooks™ and TalisTV™.",
     "TSPLITS™  ·  MAPSITES", ["Claim your market.", "Open your", "Mapsite"], ["Mapsites", "Talisbooks™", "TalisTV™"]),
    ("Tsplits™ | Markt sichern, Mapsite eröffnen",
     "Sichern Sie Ihren Markt auf Tsplits™. Ihre Mapsite setzt Sie auf die Karte, damit Käufer und Partner Sie finden – mit Talisbooks™ und TalisTV™.",
     "TSPLITS™  ·  MAPSITES", ["Markt sichern.", "Ihre Mapsite", "eröffnen"], ["Mapsites", "Talisbooks™", "TalisTV™"]))
add("/start", "start", "public", MAP,
    ("Tsplits™ | Claim Your Market",
     "Claim your market on Tsplits™. Mapsite pins your place on the map so buyers and partners can find you. Explore Talisbooks™ and grow your exposure.",
     "TSPLITS™  ·  START", ["Claim your", "market on", "Tsplits™"], ["Mapsites", "Talisbooks™"]),
    ("Tsplits™ | Sichern Sie Ihren Markt",
     "Sichern Sie Ihren Markt auf Tsplits™. Die Mapsite setzt Sie auf die Karte, damit Käufer und Partner Sie finden. Entdecken Sie Talisbooks™.",
     "TSPLITS™  ·  START", ["Sichern Sie", "Ihren Markt auf", "Tsplits™"], ["Mapsites", "Talisbooks™"]))
add("/talisu/mkts", "talisu-mkts", "public", MAP,
    ("Markets Served: Claim an 80 km Market | TalisU™",
     "Select the PIN nearest you to claim a semi-exclusive market of 80 km around a centre point on the Talismaps™ market map.",
     "TALISU™  ·  MARKETS", ["Claim an", "80 km market", "near you"], ["Semi-exclusive", "80 km radius", "Talismaps™"]),
    ("Bediente Märkte: 80-km-Markt sichern | TalisU™",
     "Wählen Sie den PIN in Ihrer Nähe und sichern Sie einen semi-exklusiven Markt im Umkreis von 80 km um einen Mittelpunkt auf Talismaps™.",
     "TALISU™  ·  MÄRKTE", ["Sichern Sie", "einen 80-km-Markt", "in Ihrer Nähe"], ["Semi-exklusiv", "80 km Radius", "Talismaps™"]))
add("/catalogue", "catalogue", "public", TDOME,
    ("Talishouse™ Product Catalogue | Tsplits™",
     "Browse the Talishouse™ Product Catalogue. Every design is numbered (P01, P02…); tap one to register for that product.",
     "TALISHOUSE™  ·  CATALOGUE", ["Talishouse™", "Product", "Catalogue"], ["T-Dome", "Glasshouse™", "Talistowns™"]),
    ("Talishouse™ Produktkatalog | Tsplits™",
     "Entdecken Sie den Talishouse™ Produktkatalog. Jedes Design ist nummeriert (P01, P02…); tippen Sie eines an, um sich dafür zu registrieren.",
     "TALISHOUSE™  ·  KATALOG", ["Talishouse™", "Produkt-", "katalog"], ["T-Dome", "Glasshouse™", "Talistowns™"]))
add("/talisu/reg", "talisu-reg", "custom", AISHA, None, None)
add("/talisu/engage", "talisu-engage", "custom", WEBSTER, None, None)
add("/talisu", "talisu-faq", "public", AISHA,
    ("TalisU™ FAQ: Tsplits™, Mapsites and FAST Codes",
     "Answers to frequently asked questions about Tsplits™, Mapsites, FAST Codes and TalisU™ fulfilment options.",
     "TALISU™  ·  FAQ", ["Frequently", "asked", "questions"], ["Mapsites", "FAST Codes", "TalisU™"]),
    ("TalisU™ FAQ: Tsplits™, Mapsites und FAST Codes",
     "Antworten auf häufige Fragen zu Tsplits™, Mapsites, FAST Codes und den Abwicklungsoptionen von TalisU™.",
     "TALISU™  ·  FAQ", ["Häufig", "gestellte", "Fragen"], ["Mapsites", "FAST Codes", "TalisU™"]))
# ---------- PMC sequence (TalisU dropdown, below the divider) ----------
add("/talisu/talispros", "talisu-talispros", "public", WINDSWEPT,
    ("Tsplits™ PMC: Map-Based Marketing for Canadian Brokerages",
     "Why Canadian brokerages add Tsplits™ Mapsites beside MLS® and their website: earlier leads, sharper targeting, new ad revenue and stronger local brands.",
     "TSPLITS™  ·  PMC", ["Industry adjacent", "markets for", "brokerages"], ["Promote", "Manage", "Cooperate"]),
    ("Tsplits™ PMC: Kartenbasiertes Marketing für Makler",
     "Warum kanadische Makler Tsplits™-Mapsites neben MLS® und ihrer Website nutzen: frühere Leads, präziseres Targeting, neue Werbeerlöse, stärkere Marken.",
     "TSPLITS™  ·  PMC", ["Branchennahe", "Märkte für", "Makler"], ["Promote", "Manage", "Cooperate"]))
add("/talisu/media-directory", "talisu-media-directory", "public", MAP,
    ("Media Directory: Where Tsplits™ PINs Are Syndicated",
     "The Tsplits™ media directory: global property portals and classifieds where Mapsite PINs are auto-syndicated in 10-day cycles. Open any outlet in place.",
     "TSPLITS™  ·  MEDIA DIRECTORY", ["Your PINs,", "syndicated", "worldwide"], ["100+ outlets", "10-day cycles", "Global reach"]),
    ("Mediendirektorium: Wohin Tsplits™-PINs syndiziert werden",
     "Das Tsplits™-Mediendirektorium: weltweite Immobilienportale, in die Mapsite-PINs in 10-Tage-Zyklen automatisch syndiziert werden. Portale direkt öffnen.",
     "TSPLITS™  ·  MEDIENDIREKTORIUM", ["Ihre PINs,", "weltweit", "syndiziert"], ["100+ Portale", "10-Tage-Zyklen", "Globale Reichweite"]))
add("/talisu/contract", "talisu-contract", "utility", BRAND,
    ("Service Agreement: Sign with Your Agent Code | Tsplits™",
     "Open the TalisALL PMC Service Agreement with your agent code, sign it electronically and continue to Tsplits™ registration.",
     "TSPLITS™  ·  CONTRACT", ["Sign your", "Service", "Agreement"], ["Agent code", "E-signature", "Then register"]),
    ("Dienstleistungsvertrag mit Agenten-Code signieren",
     "Öffnen Sie den TalisALL PMC Dienstleistungsvertrag mit Ihrem Agenten-Code, unterschreiben Sie elektronisch und fahren Sie mit der Registrierung fort.",
     "TSPLITS™  ·  VERTRAG", ["Ihren", "Dienstleistungs-", "vertrag signieren"], ["Agenten-Code", "E-Signatur", "Dann registrieren"]))
add("/talisu/discuss", "talisu-discuss", "public", WEBSTER,
    ("Share a Project Vision | TalisU™",
     "Explore Conventional, Lease-to-Own, Fractionalization and Tokenization structures and share your project vision with an advisor. No registration needed.",
     "TALISU™  ·  PROJECT VISION", ["Share a", "Project Vision"], ["Conventional · Lease-to-Own", "Fractionalization", "Tokenization"]),
    ("Projektvision teilen | TalisU™",
     "Entdecken Sie Konventionell, Mietkauf, Fraktionalisierung und Tokenisierung und teilen Sie Ihre Projektvision mit einem Berater. Ohne Registrierung.",
     "TALISU™  ·  PROJEKTVISION", ["Projektvision", "teilen"], ["Konventionell · Mietkauf", "Fraktionalisierung", "Tokenisierung"]))
add("/talisu/tsplits", "talisu-tsplits", "public", ("talisbooks/tsplits/og-cover.jpg", 0.5, None, None),
    ("TSPLITS™ eBook – from Vision to Implementation | TalisU™",
     "Read the TSPLITS™ eBook page by page: turn a listing vision into a project with Conventional, Lease-to-Own, Fractionalization or Tokenization.",
     "TALISU™  ·  TSPLITS™ EBOOK", ["TSPLITS™", "From Vision to", "Implementation"], ["10-page eBook", "EN · DE", "Download PDF"]),
    ("TSPLITS™ eBook – von der Vision zur Umsetzung | TalisU™",
     "Das TSPLITS™ eBook zum Blättern: aus einer Listing-Vision wird ein Projekt – Konventionell, Mietkauf, Fraktionalisierung oder Tokenisierung.",
     "TALISU™  ·  TSPLITS™ EBOOK", ["TSPLITS™", "Von der Vision", "zur Umsetzung"], ["10-seitiges eBook", "DE · EN", "PDF herunterladen"]))
add("/talisu/terms", "talisu-terms", "public", BRAND,
    ("Terms of Service | Tsplits™ by TalisALL PMC",
     "Tsplits™ Terms of Service: platform role, customer responsibilities, warranties, liability, fees in CAD, intellectual property, termination and privacy.",
     "TSPLITS™  ·  TERMS", ["Terms of", "Service"], ["TalisALL PMC", "Fees in CAD", "No long-term commitment"]),
    ("Nutzungsbedingungen | Tsplits™ von TalisALL PMC",
     "Tsplits™-Nutzungsbedingungen: Rolle der Plattform, Kundenpflichten, Gewährleistung, Haftung, Gebühren in CAD, geistiges Eigentum, Kündigung, Datenschutz.",
     "TSPLITS™  ·  BEDINGUNGEN", ["Nutzungs-", "bedingungen"], ["TalisALL PMC", "Gebühren in CAD", "Keine Langzeitbindung"]))
add("/talisu/privacy", "talisu-privacy", "public", BRAND,
    ("Privacy Policy | TalisALL (Tsplits™, TalisU)",
     "How TalisALL collects, uses, shares and protects information across talispros.com, talisu.com, taliswebs.com and talishouse.com, and your privacy rights.",
     "TALISALL  ·  PRIVACY", ["Privacy", "Policy"], ["Your data", "Your rights", "Security"]),
    ("Datenschutzerklärung | TalisALL (Tsplits™, TalisU)",
     "Wie TalisALL Informationen auf talispros.com, talisu.com, taliswebs.com und talishouse.com erhebt, nutzt, teilt und schützt – und Ihre Datenschutzrechte.",
     "TALISALL  ·  DATENSCHUTZ", ["Datenschutz-", "erklärung"], ["Ihre Daten", "Ihre Rechte", "Sicherheit"]))
add("/catalogue/bookshelf", "bookshelf", "public", SHELF,
    ("Talisbooks™ Bookshelf | ALLPINS Mapsite",
     "The Mapsite-connected Talisbooks™ bookshelf for FAST Code ALLPINS. Open a cover to read the books on the shelf.",
     "TALISBOOKS™  ·  BOOKSHELF", ["Open a cover", "on the", "Talisbooks™ shelf"], ["ALLPINS", "eBooks", "Mapsites"]),
    ("Talisbooks™ Bücherregal | ALLPINS Mapsite",
     "Das mit der Mapsite verbundene Talisbooks™ Bücherregal für FAST Code ALLPINS. Öffnen Sie ein Cover, um die Bücher zu lesen.",
     "TALISBOOKS™  ·  BÜCHERREGAL", ["Öffnen Sie", "ein Cover im", "Talisbooks™ Regal"], ["ALLPINS", "E-Books", "Mapsites"]))
add("/talisbooks", "talisbooks", "public", SHELF,
    ("Explore Talisbooks™ | Digital Lookbooks",
     "Browse Talisbooks™ digital lookbooks and branded publications on the bookshelf. Mapsite pins your place on the map so buyers find your story.",
     "TALISBOOKS™  ·  EXPLORE", ["Explore", "Talisbooks™", "digital lookbooks"], ["Lookbooks", "eBooks", "Mapsites"]),
    ("Talisbooks™ entdecken | Digitale Lookbooks",
     "Stöbern Sie in digitalen Talisbooks™ Lookbooks und Markenpublikationen. Die Mapsite setzt Sie auf die Karte, damit Käufer Ihre Geschichte finden.",
     "TALISBOOKS™  ·  ENTDECKEN", ["Entdecken Sie", "Talisbooks™", "digitale Lookbooks"], ["Lookbooks", "E-Books", "Mapsites"]))
add("/talisbooks/library", "talisbooks-library", "public", SHELF,
    ("Talisbooks™ Library | Search and Open Lookbooks",
     "The Talisbooks™ library of FAST-linked lookbooks. Search, sort and open covers in the viewer.",
     "TALISBOOKS™  ·  LIBRARY", ["The", "Talisbooks™", "library"], ["Search", "Sort", "Read"]),
    ("Talisbooks™ Bibliothek | Lookbooks suchen und öffnen",
     "Die Talisbooks™ Bibliothek mit FAST-verknüpften Lookbooks. Suchen, sortieren und Cover im Viewer öffnen.",
     "TALISBOOKS™  ·  BIBLIOTHEK", ["Die", "Talisbooks™", "Bibliothek"], ["Suchen", "Sortieren", "Lesen"]))
add("/talisbooks/viewer", "talisbooks-viewer", "public", COVER,
    ("Talisbooks™ Viewer | Read a Digital Lookbook",
     "Read a Talisbooks™ digital lookbook page by page in the viewer.",
     "TALISBOOKS™  ·  VIEWER", ["Read a", "Talisbooks™", "lookbook"], []),
    ("Talisbooks™ Viewer | Digitales Lookbook lesen",
     "Lesen Sie ein digitales Talisbooks™ Lookbook Seite für Seite im Viewer.",
     "TALISBOOKS™  ·  VIEWER", ["Lesen Sie ein", "Talisbooks™", "Lookbook"], []))
add("/talistv", "talistv", "public", LAPTOP,
    ("TalisTV™ | In-House Online TV Station",
     "TalisTV™ is the Tsplits™ in-house online TV station. See the programme guide with what is live and up next.",
     "TALISTV™  ·  PROGRAMME GUIDE", ["TalisTV™", "in-house online", "TV station"], ["Live", "Up next", "Guide"]),
    ("TalisTV™ | Hauseigener Online-TV-Sender",
     "TalisTV™ ist der hauseigene Online-TV-Sender von Tsplits™. Im Programmführer sehen Sie, was live läuft und was als Nächstes kommt.",
     "TALISTV™  ·  PROGRAMMFÜHRER", ["TalisTV™", "hauseigener", "Online-TV-Sender"], ["Live", "Als Nächstes", "Programm"]))
add("/talispros/demo-mapsite", "demo-mapsite", "public", CLAIMED,
    ("Build a Demo eBook and Mapsite | Tsplits™",
     "Place a demonstration pin and attach the pinned Tsplits™ eBook. Try a Mapsite with no FAST Code issued.",
     "TSPLITS™  ·  DEMO", ["Build a", "demo eBook", "and Mapsite"], ["Demo pin", "eBook", "No FAST Code"]),
    ("Demo-E-Book und Mapsite erstellen | Tsplits™",
     "Setzen Sie einen Demo-Pin und hängen Sie das Tsplits™ E-Book an. Testen Sie eine Mapsite, ohne dass ein FAST Code vergeben wird.",
     "TSPLITS™  ·  DEMO", ["Demo-E-Book", "und Mapsite", "erstellen"], ["Demo-Pin", "E-Book", "Ohne FAST Code"]))
add("/talispros/demo-mapsite/ebook", "demo-ebook", "public", COVER,
    ("Demo Talisbook™ from the Pinned eBook | Tsplits™",
     "Turn the pinned Tsplits™ eBook PDF into a demonstration Talisbook™ with optimised pages.",
     "TALISBOOKS™  ·  DEMO", ["Generate a", "demo", "Talisbook™"], []),
    ("Demo-Talisbook™ aus dem E-Book | Tsplits™",
     "Verwandeln Sie das angeheftete Tsplits™ E-Book-PDF in ein Demo-Talisbook™ mit optimierten Seiten.",
     "TALISBOOKS™  ·  DEMO", ["Erstellen Sie", "ein Demo-", "Talisbook™"], []))
add("/talisu/kb", "talisu-kb", "public", LAPTOP,
    ("TalisU™ Knowledge Base: Audio, Video, Learning",
     "TalisU™ Knowledge Base: audios, videos and learning material for Mapsites and FAST Codes.",
     "TALISU™  ·  KNOWLEDGE BASE", ["Knowledge Base", "audio, video", "and learning"], ["Audio", "Video", "Mapsites"]),
    ("TalisU™ Wissensdatenbank: Audio, Video, Lernen",
     "TalisU™ Wissensdatenbank: Audios, Videos und Lernmaterial zu Mapsites und FAST Codes.",
     "TALISU™  ·  WISSENSDATENBANK", ["Wissensdatenbank", "Audio, Video", "und Lernen"], ["Audio", "Video", "Mapsites"]))
add("/talisu/au", "talisu-audio", "public", AISHA,
    ("TalisU™ Audio: Aisha & Thorsten P",
     "Listen to TalisU™ audio: a short welcome plus Aisha & Thorsten P on digital property fractionalization.",
     "TALISU™  ·  AUDIO", ["Listen:", "Aisha & Thorsten P", "on TalisU™"], ["Welcome", "Fractionalization"]),
    ("TalisU™ Audio: Aisha & Thorsten P",
     "Hören Sie TalisU™ Audio: eine kurze Begrüßung sowie Aisha & Thorsten P über die digitale Fraktionalisierung von Immobilien.",
     "TALISU™  ·  AUDIO", ["Hören Sie:", "Aisha & Thorsten P", "bei TalisU™"], ["Begrüßung", "Fraktionalisierung"]))
add("/talisu/video", "talisu-video", "public", LAPTOP,
    ("TalisU™ Video Library and TalisTV™",
     "The TalisU™ video library and TalisTV™ programming.",
     "TALISU™  ·  VIDEO", ["TalisU™", "video library", "and TalisTV™"], []),
    ("TalisU™ Videothek und TalisTV™",
     "Die TalisU™ Videothek und das TalisTV™ Programm.",
     "TALISU™  ·  VIDEO", ["TalisU™", "Videothek", "und TalisTV™"], []))
add("/learn-more", "learn-more", "public", COVER,
    ("Learn More About Tokenization | Tsplits™",
     "Explore tokenization with the Talisbooks™ eBook experience and TalisU™ audio.",
     "TALISU™  ·  LEARN MORE", ["Learn more", "about", "tokenization"], ["Talisbooks™", "TalisU™ Audio"]),
    ("Mehr über Tokenisierung erfahren | Tsplits™",
     "Entdecken Sie die Tokenisierung mit dem Talisbooks™ E-Book-Erlebnis und TalisU™ Audio.",
     "TALISU™  ·  MEHR ERFAHREN", ["Mehr über", "Tokenisierung", "erfahren"], ["Talisbooks™", "TalisU™ Audio"]))

# ---------- Mapsite / Tsplits™ pages ----------
add("/talispros", "talispros-pmc", "public", LAPTOP,
    ("Tsplits™ PMC | Industry Adjacent Marketplaces",
     "Tsplits™ PMC: industry adjacent marketplaces for real estate professionals, with monthly content support, co-promotion and referral networks.",
     "TSPLITS™  ·  PMC", ["Industry adjacent", "marketplaces for", "real estate pros"], ["Mapsites", "FAST Codes", "TalisForms™"]),
    ("Tsplits™ PMC | Branchennahe Marktplätze",
     "Tsplits™ PMC: branchennahe Marktplätze für Immobilienprofis, mit monatlicher Content-Unterstützung, Co-Promotion und Empfehlungsnetzwerken.",
     "TSPLITS™  ·  PMC", ["Branchennahe", "Marktplätze für", "Immobilienprofis"], ["Mapsites", "FAST Codes", "TalisForms™"]))
add("/talispros/mapsite", "mapsite-app", "public", PIN,
    ("Tsplits™ Mapsite | Claim Your Market",
     "Claim your market on the Tsplits™ Mapsite, the fullscreen map application for FSBOs, builders and real estate professionals.",
     "TSPLITS™  ·  MAPSITE", ["The fullscreen", "map for your", "market"], ["FSBOs", "Builders", "Realtors"]),
    ("Tsplits™ Mapsite | Sichern Sie Ihren Markt",
     "Sichern Sie Ihren Markt auf der Tsplits™ Mapsite, der Vollbild-Kartenanwendung für Privatverkäufer, Bauträger und Immobilienprofis.",
     "TSPLITS™  ·  MAPSITE", ["Die Vollbild-", "Karte für Ihren", "Markt"], ["Privatverkäufer", "Bauträger", "Makler"]))
add("/mapsite", "mapsite-home", "public", PIN,
    ("Mapsite | Tsplits™",
     "Open the Tsplits™ Mapsite: map-first marketing that pins your business where buyers and partners are looking.",
     "TSPLITS™  ·  MAPSITE", ["Map-first", "marketing on", "your Mapsite"], []),
    ("Mapsite | Tsplits™",
     "Öffnen Sie die Tsplits™ Mapsite: kartenbasiertes Marketing, das Ihr Unternehmen dort zeigt, wo Käufer und Partner suchen.",
     "TSPLITS™  ·  MAPSITE", ["Kartenbasiertes", "Marketing auf", "Ihrer Mapsite"], []))
add("/talispros/build-mapsite/assisted", "build-assisted", "public", RAHUL,
    ("Have Me Build It: Assisted Mapsite Build | Tsplits™",
     "Send Rahul your details and he builds your Mapsite for you, with your FAST Code and first Talisbook™.",
     "TSPLITS™  ·  ASSISTED BUILD", ["Have me", "build your", "Mapsite"], ["FAST Code", "Talisbook™"]),
    ("Lassen Sie bauen: Mapsite mit Hilfe | Tsplits™",
     "Senden Sie Rahul Ihre Angaben und er baut Ihre Mapsite für Sie, mit FAST Code und Ihrem ersten Talisbook™.",
     "TSPLITS™  ·  BAUSERVICE", ["Lassen Sie", "Ihre Mapsite", "bauen"], ["FAST Code", "Talisbook™"]))
add("/talispros/claim-a-market", "claim-a-market", "public", MAP,
    ("Claim a Market™ | Tsplits™",
     "Claim a market inside Talismaps™: market visibility, referral networks, industry adjacent exposure and FAST Code access.",
     "TSPLITS™  ·  CLAIM A MARKET™", ["Claim your", "market inside", "Talismaps™"], ["Visibility", "Referrals", "FAST Code"]),
    ("Claim a Market™ | Tsplits™",
     "Sichern Sie sich einen Markt in Talismaps™: Marktpräsenz, Empfehlungsnetzwerke, branchennahe Reichweite und FAST-Code-Zugang.",
     "TSPLITS™  ·  CLAIM A MARKET™", ["Sichern Sie", "Ihren Markt in", "Talismaps™"], ["Präsenz", "Empfehlungen", "FAST Code"]))
add("/talispros/markets/claim-a-market", "build-mapsite-market", "public", AISHA,
    ("Build Your Mapsite | Tsplits™",
     "Mapsite is the centre of Tsplits™. Submit your Build Request to receive a FAST Code and create your first Talisbook™.",
     "TSPLITS™  ·  BUILD MAPSITE", ["Build your", "Mapsite", "today"], ["FAST Code", "Talisbook™", "TalisTV™"]),
    ("Erstellen Sie Ihre Mapsite | Tsplits™",
     "Die Mapsite ist das Herz von Tsplits™. Senden Sie Ihre Bauanfrage, erhalten Sie einen FAST Code und erstellen Sie Ihr erstes Talisbook™.",
     "TSPLITS™  ·  MAPSITE ERSTELLEN", ["Erstellen Sie", "Ihre", "Mapsite"], ["FAST Code", "Talisbook™", "TalisTV™"]))
add("/talispros/markets/for-sale-by-owners", "market-fsbo", "public", AISHA,
    ("Mapsites for For Sale By Owners | Tsplits™",
     "Sell privately with professional reach. Rahul promotes your property on your own Mapsite; you sell through your lawyer with no real estate fees.",
     "TSPLITS™  ·  FOR SALE BY OWNERS", ["Sell privately", "with professional", "reach"], ["FSBO", "Mapsite", "No agent fees"]),
    ("Mapsites für Privatverkäufer | Tsplits™",
     "Privat verkaufen mit professioneller Reichweite. Rahul bewirbt Ihre Immobilie auf Ihrer Mapsite; Sie verkaufen über Ihren Anwalt ohne Maklergebühr.",
     "TSPLITS™  ·  PRIVATVERKÄUFER", ["Privat verkaufen", "mit professioneller", "Reichweite"], ["Privatverkauf", "Mapsite", "Ohne Maklergebühr"]))
add("/talispros/markets/real-estate-professionals", "market-realtors", "public", AISHA,
    ("Mapsites for Real Estate Professionals | Tsplits™",
     "Mapsites encourage listing qualification based on service floors, so reward structures rise over time and Mapsites pay for themselves.",
     "TSPLITS™  ·  REAL ESTATE PROS", ["Mapsites that", "pay for", "themselves"], ["Listings", "Service floors", "Referrals"]),
    ("Mapsites für Immobilienprofis | Tsplits™",
     "Mapsites fördern die Qualifizierung von Angeboten über Mindeststandards, sodass Vergütungen steigen und sich Mapsites selbst tragen.",
     "TSPLITS™  ·  IMMOBILIENPROFIS", ["Mapsites, die", "sich selbst", "tragen"], ["Angebote", "Standards", "Empfehlungen"]))
add("/talispros/markets/talishouse-builders", "market-builders", "public", REC,
    ("Mapsites for Talishouse™ Builders | Tsplits™",
     "Map-based marketing for Talishouse™ builders on a proprietary platform, without real estate licensing fees.",
     "TSPLITS™  ·  TALISHOUSE™ BUILDERS", ["Map-based", "marketing for", "builders"], ["Talishouse™", "Mapsite", "Segmentation"]),
    ("Mapsites für Talishouse™ Bauträger | Tsplits™",
     "Kartenbasiertes Marketing für Talishouse™ Bauträger auf einer eigenen Plattform, ohne Gebühren für Maklerlizenzen.",
     "TSPLITS™  ·  TALISHOUSE™ BAUTRÄGER", ["Karten-", "marketing für", "Bauträger"], ["Talishouse™", "Mapsite", "Segmentierung"]))
add("/talispros/register", "talispros-register", "public", AISHA,
    ("Register Your Mapsite | Tsplits™",
     "Choose your account level and activate your Mapsite through secure online registration.",
     "TSPLITS™  ·  REGISTER", ["Register", "your", "Mapsite"], ["Root Account™", "Derivative Account™"]),
    ("Registrieren Sie Ihre Mapsite | Tsplits™",
     "Wählen Sie Ihre Kontostufe und aktivieren Sie Ihre Mapsite über die sichere Online-Registrierung.",
     "TSPLITS™  ·  REGISTRIEREN", ["Registrieren Sie", "Ihre", "Mapsite"], ["Root Account™", "Derivative Account™"]))
add("/talispros/register-agents", "register-agents", "public", AISHA,
    ("Register Your Agents | Tsplits™",
     "After Root Account™ payment, register Derivative Account™ agents under your FAST Code.",
     "TSPLITS™  ·  AGENTS", ["Register", "your", "agents"], ["Root Account™", "Derivative Account™"]),
    ("Registrieren Sie Ihre Agenten | Tsplits™",
     "Registrieren Sie nach der Zahlung für Ihren Root Account™ Agenten mit Derivative Account™ unter Ihrem FAST Code.",
     "TSPLITS™  ·  AGENTEN", ["Registrieren Sie", "Ihre", "Agenten"], ["Root Account™", "Derivative Account™"]))
add("/talispros/start/developer", "start-developer", "public", TOWNS,
    ("Developers and Builders: Own Your Market | Tsplits™",
     "Claim a market with a Root Account™. Deploy up to 100 Derivative Accounts, enable Lease-to-Own and establish your organisation inside Talismaps™.",
     "TSPLITS™  ·  DEVELOPER / BUILDER", ["Own your", "market", "territory"], ["Root Account™", "Lease-to-Own", "Talismaps™"]),
    ("Bauträger: Ihr eigenes Marktgebiet | Tsplits™",
     "Sichern Sie einen Markt mit einem Root Account™. Bis zu 100 Derivative Accounts, Mietkauf und Ihre Organisation in Talismaps™.",
     "TSPLITS™  ·  BAUTRÄGER", ["Ihr eigenes", "Markt-", "gebiet"], ["Root Account™", "Mietkauf", "Talismaps™"]))
add("/talispros/start/investor", "start-investor", "public", MAP,
    ("Real Estate Investors: Portfolio Presence | Tsplits™",
     "Manage multiple properties under one Derivative Account™. Generate FAST Codes for each asset and track them all on Talismaps™.",
     "TSPLITS™  ·  REAL ESTATE INVESTOR", ["Build your", "portfolio", "presence"], ["Derivative Account™", "FAST Codes"]),
    ("Immobilieninvestoren: Ihr Portfolio | Tsplits™",
     "Verwalten Sie mehrere Immobilien unter einem Derivative Account™. FAST Codes für jedes Objekt, alles auf Talismaps™ im Blick.",
     "TSPLITS™  ·  IMMOBILIENINVESTOR", ["Präsentieren Sie", "Ihr", "Portfolio"], ["Derivative Account™", "FAST Codes"]))
add("/talispros/ebook-choice", "ebook-choice", "public", RAHUL,
    ("Choose Your eBook Path | Tsplits™",
     "Choose whether to generate your own Talisbooks™ eBook or have Rahul build it for you.",
     "TALISBOOKS™  ·  EBOOK", ["Build it yourself", "or have Rahul", "build it"], []),
    ("Wählen Sie Ihren E-Book-Weg | Tsplits™",
     "Entscheiden Sie, ob Sie Ihr Talisbooks™ E-Book selbst erstellen oder von Rahul erstellen lassen.",
     "TALISBOOKS™  ·  E-BOOK", ["Selbst erstellen", "oder von Rahul", "erstellen lassen"], []))
add("/talispros/ebook-generate", "ebook-generate", "public", COVER,
    ("Generate Your Own Talisbooks™ eBook | Tsplits™",
     "Generate your own Talisbooks™ eBook from property images, title, description and location. No payment required.",
     "TALISBOOKS™  ·  GENERATE", ["Generate your", "own Talisbooks™", "eBook"], ["Images", "Location", "No payment"]),
    ("Eigenes Talisbooks™ E-Book erstellen | Tsplits™",
     "Erstellen Sie Ihr eigenes Talisbooks™ E-Book aus Bildern, Titel, Beschreibung und Lage der Immobilie. Keine Zahlung erforderlich.",
     "TALISBOOKS™  ·  ERSTELLEN", ["Erstellen Sie", "Ihr Talisbooks™", "E-Book"], ["Bilder", "Lage", "Kostenlos"]))
add("/talispros/ebook-rahul", "ebook-rahul", "public", RAHUL,
    ("Have Rahul Build Your eBook | Tsplits™",
     "Upload your photo, logo, property images and details so Rahul can build your Talisbooks™ eBook.",
     "TALISBOOKS™  ·  ASSISTED EBOOK", ["Have Rahul", "build your", "eBook"], ["Photo", "Logo", "Property images"]),
    ("Rahul erstellt Ihr E-Book | Tsplits™",
     "Laden Sie Foto, Logo, Immobilienbilder und Angaben hoch, damit Rahul Ihr Talisbooks™ E-Book erstellen kann.",
     "TALISBOOKS™  ·  E-BOOK-SERVICE", ["Rahul erstellt", "Ihr", "E-Book"], ["Foto", "Logo", "Immobilienbilder"]))
add("/talispros/forms", "talisforms", "public", LAPTOP,
    ("TalisForms™ | Forms Infrastructure | Tsplits™",
     "TalisForms™: white-label forms with CRM integrations, multi-step workflows and conditional logic.",
     "TALISFORMS™  ·  FORMS", ["Forms", "infrastructure for", "Tsplits™"], ["White label", "CRM", "Workflows"]),
    ("TalisForms™ | Formular-Infrastruktur | Tsplits™",
     "TalisForms™: White-Label-Formulare mit CRM-Integration, mehrstufigen Abläufen und bedingter Logik.",
     "TALISFORMS™  ·  FORMULARE", ["Formular-", "Infrastruktur für", "Tsplits™"], ["White Label", "CRM", "Abläufe"]))
add("/talismaps", "talismaps", "public", MAP,
    ("Talismaps™ | Interactive Map Platform",
     "Talismaps™ is the interactive map platform of the Tsplits™ ecosystem, with root accounts, derivative maps, Adpro PINs and listings.",
     "TALISMAPS™  ·  MAP PLATFORM", ["Interactive", "property", "discovery maps"], ["Root accounts", "Adpro PINs", "Listings"]),
    ("Talismaps™ | Interaktive Kartenplattform",
     "Talismaps™ ist die interaktive Kartenplattform von Tsplits™, mit Root Accounts, abgeleiteten Karten, Adpro PINs und Angeboten.",
     "TALISMAPS™  ·  KARTENPLATTFORM", ["Interaktive", "Karten zur", "Immobiliensuche"], ["Root Accounts", "Adpro PINs", "Angebote"]))
add("/fast-code", "fast-code", "public", PIN,
    ("Generate Your FAST Code | Tsplits™",
     "Generate your unique FAST Code to access your Tsplits™ Mapsite.",
     "TSPLITS™  ·  FAST CODE", ["Generate", "your", "FAST Code"], []),
    ("Erstellen Sie Ihren FAST Code | Tsplits™",
     "Erstellen Sie Ihren persönlichen FAST Code für den Zugang zu Ihrer Tsplits™ Mapsite.",
     "TSPLITS™  ·  FAST CODE", ["Erstellen Sie", "Ihren", "FAST Code"], []))
add("/build-mapsite", "build-mapsite", "public", PIN,
    ("Build a Mapsite with AdPro™ PINs | Tsplits™",
     "Request your Mapsite build: choose a single AdPro™ PIN or packages for teams, brokerages and enterprises.",
     "TSPLITS™  ·  BUILD A MAPSITE", ["Build a", "Mapsite", "for your business"], ["Single PIN", "Teams", "Enterprise"]),
    ("Mapsite mit AdPro™ PINs erstellen | Tsplits™",
     "Fordern Sie Ihre Mapsite an: ein einzelner AdPro™ PIN oder Pakete für Teams, Maklerbüros und Unternehmen.",
     "TSPLITS™  ·  MAPSITE ERSTELLEN", ["Erstellen Sie", "eine Mapsite", "für Ihr Geschäft"], ["Einzel-PIN", "Teams", "Unternehmen"]))
add("/register-mapsite", "register-mapsite", "public", PIN,
    ("Register and Activate Your Mapsite | Tsplits™",
     "Register your Mapsite and activate your Tsplits™ presence with a one-time registration.",
     "TSPLITS™  ·  REGISTER", ["Register and", "activate your", "Mapsite"], ["AdPro™ PINs"]),
    ("Mapsite registrieren und aktivieren | Tsplits™",
     "Registrieren Sie Ihre Mapsite und aktivieren Sie Ihre Tsplits™ Präsenz mit einer einmaligen Registrierung.",
     "TSPLITS™  ·  REGISTRIEREN", ["Registrieren und", "aktivieren Sie", "Ihre Mapsite"], ["AdPro™ PINs"]))
add("/register", "register-legacy", "public", PIN,
    ("Register Your Mapsite Account | Tsplits™",
     "Register your Mapsite account, choose a monthly plan and activate your Tsplits™ presence.",
     "TSPLITS™  ·  ACCOUNT", ["Register your", "Mapsite", "account"], ["Monthly plan", "AdPro™ PINs"]),
    ("Mapsite-Konto registrieren | Tsplits™",
     "Registrieren Sie Ihr Mapsite-Konto, wählen Sie einen Monatsplan und aktivieren Sie Ihre Tsplits™ Präsenz.",
     "TSPLITS™  ·  KONTO", ["Registrieren Sie", "Ihr Mapsite-", "Konto"], ["Monatsplan", "AdPro™ PINs"]))
add("/partner-access", "partner-access", "public", BRAND,
    ("Wholesale Partner Access with FAST Codes | TalisU™",
     "Access dedicated TalisU™ Mapsites using your FAST Code.",
     "TALISU™  ·  PARTNER ACCESS", ["Wholesale", "partner", "access"], ["FAST Code", "Mapsites"]),
    ("Großhandels-Partnerzugang mit FAST Code | TalisU™",
     "Greifen Sie mit Ihrem FAST Code auf eigene TalisU™ Mapsites zu.",
     "TALISU™  ·  PARTNERZUGANG", ["Großhandels-", "Partner-", "zugang"], ["FAST Code", "Mapsites"]))
add("/partner-view", "partner-view", "public", LAPTOP,
    ("Tell Us About Your Project | Tsplits™",
     "Partners: tell us about your project and the Tsplits™ team will follow up.",
     "TSPLITS™  ·  PARTNERS", ["Tell us", "about your", "project"], []),
    ("Erzählen Sie uns von Ihrem Projekt | Tsplits™",
     "Partner: Erzählen Sie uns von Ihrem Projekt, das Tsplits™ Team meldet sich bei Ihnen.",
     "TSPLITS™  ·  PARTNER", ["Erzählen Sie", "uns von Ihrem", "Projekt"], []))
add("/subscription", "subscription", "public", LAPTOP,
    ("Referral Partner Programme | Tsplits™",
     "Join the Tsplits™ referral partner programme: exclusive project leads, marketing materials, referral tracking and wholesale pricing.",
     "TSPLITS™  ·  PARTNER PROGRAMME", ["Become a", "referral", "partner"], ["Leads", "Tracking", "Wholesale"]),
    ("Empfehlungspartner-Programm | Tsplits™",
     "Werden Sie Tsplits™ Empfehlungspartner: exklusive Projekt-Leads, Marketingmaterial, Empfehlungs-Tracking und Großhandelspreise.",
     "TSPLITS™  ·  PARTNERPROGRAMM", ["Werden Sie", "Empfehlungs-", "partner"], ["Leads", "Tracking", "Großhandel"]))
add("/business-office", "business-office", "public", LAPTOP,
    ("Business Office: Moonlighting Is Lucrative | Tsplits™",
     "The Tsplits™ Business Office: refer lease-to-own projects, collect on your projects, join partner programmes or propose a project.",
     "TSPLITS™  ·  BUSINESS OFFICE", ["Moonlighting", "is", "lucrative"], ["Lease-to-Own", "Partners", "Projects"]),
    ("Business Office: Nebenverdienst lohnt sich | Tsplits™",
     "Das Tsplits™ Business Office: Mietkauf-Projekte empfehlen, Projekte abrechnen, Partnerprogramme nutzen oder ein Projekt vorschlagen.",
     "TSPLITS™  ·  BUSINESS OFFICE", ["Nebenverdienst", "lohnt", "sich"], ["Mietkauf", "Partner", "Projekte"]))
add("/business-office/apply", "propose-project", "public", REC,
    ("Propose a Project | Tsplits™ Business Office",
     "Propose a project and start a side business with Tsplits™.",
     "TSPLITS™  ·  BUSINESS OFFICE", ["Propose", "a", "project"], []),
    ("Projekt vorschlagen | Tsplits™ Business Office",
     "Schlagen Sie ein Projekt vor und starten Sie ein Nebengeschäft mit Tsplits™.",
     "TSPLITS™  ·  BUSINESS OFFICE", ["Schlagen Sie", "ein Projekt", "vor"], []))
add("/business-office/register", "bo-register", "public", LAPTOP,
    ("Business Office Registration | Tsplits™",
     "Business Office registration for Tsplits™ partners is coming soon.",
     "TSPLITS™  ·  BUSINESS OFFICE", ["Business Office", "registration", "coming soon"], []),
    ("Business-Office-Registrierung | Tsplits™",
     "Die Business-Office-Registrierung für Tsplits™ Partner folgt in Kürze.",
     "TSPLITS™  ·  BUSINESS OFFICE", ["Business Office", "Registrierung", "folgt in Kürze"], []))
add("/add-project", "add-project", "public", REC,
    ("Add a Project | Tsplits™",
     "Submit your project details and request a preferred FAST Code.",
     "TSPLITS™  ·  PROJECTS", ["Add", "your", "project"], []),
    ("Projekt hinzufügen | Tsplits™",
     "Reichen Sie Ihre Projektdaten ein und wünschen Sie sich einen FAST Code.",
     "TSPLITS™  ·  PROJEKTE", ["Fügen Sie", "Ihr Projekt", "hinzu"], []))
add("/find-your-market", "find-your-market", "public", MAP,
    ("Find Your Market | Tsplits™",
     "Answer a few questions about your goal, timeline and home type to find the Talishouse™ product and path that fit you.",
     "TSPLITS™  ·  FIND YOUR MARKET", ["Find", "your", "market"], ["Goal", "Timeline", "Home type"]),
    ("Finden Sie Ihren Markt | Tsplits™",
     "Beantworten Sie ein paar Fragen zu Ziel, Zeitplan und Haustyp und finden Sie das passende Talishouse™ Produkt.",
     "TSPLITS™  ·  MARKT FINDEN", ["Finden Sie", "Ihren", "Markt"], ["Ziel", "Zeitplan", "Haustyp"]))

# ---------- Talishouse products ----------
add("/catalog", "catalog", "public", RES,
    ("Talishouse™ Homes and Cottages Store",
     "Shop the Talishouse™ product line: Glasshouse™ 160, Talishouse™ 400, Talishouse™ 1,600 and Talistowns™.",
     "TALISHOUSE™  ·  STORE", ["Homes and", "cottages by", "Talishouse™"], ["Glasshouse™", "Talishouse™", "Talistowns™"]),
    ("Talishouse™ Häuser und Cottages",
     "Die Talishouse™ Produktlinie: Glasshouse™ 160, Talishouse™ 400, Talishouse™ 1.600 und Talistowns™.",
     "TALISHOUSE™  ·  SHOP", ["Häuser und", "Cottages von", "Talishouse™"], ["Glasshouse™", "Talishouse™", "Talistowns™"]))
add("/talishouse", "talishouse", "public", REC,
    ("Talishouse™ | Homes and Cottages",
     "Talishouse™ homes and cottages. Explore the Mapsite or propose a project to start your journey.",
     "TALISHOUSE™", ["Homes", "and", "cottages"], []),
    ("Talishouse™ | Häuser und Cottages",
     "Talishouse™ Häuser und Cottages. Entdecken Sie die Mapsite oder schlagen Sie ein Projekt vor.",
     "TALISHOUSE™", ["Häuser", "und", "Cottages"], []))
add("/glasshouse", "glasshouse", "public", GLASS,
    ("Glasshouse™ | Steel Frame with Glass Panels",
     "Configure your Glasshouse™: steel frame structure with glass panels on one, two or three sides, hardware and instructions.",
     "TALISHOUSE™  ·  GLASSHOUSE™", ["Glasshouse™", "steel and", "glass"], ["Steel frame", "Glass panels"]),
    ("Glasshouse™ | Stahlrahmen mit Glaspaneelen",
     "Konfigurieren Sie Ihr Glasshouse™: Stahlrahmen mit Glaspaneelen an einer, zwei oder drei Seiten, Beschläge und Anleitung.",
     "TALISHOUSE™  ·  GLASSHOUSE™", ["Glasshouse™", "Stahl und", "Glas"], ["Stahlrahmen", "Glaspaneele"]))
add("/talishouse-recreational", "talishouse-recreational", "public", REC,
    ("Talishouse™ 400 | Recreational Cottage",
     "Talishouse™ 400: a 20' x 20' steel structure with efficiency kitchen, four-piece bath and open-concept living. One-day assembly.",
     "TALISHOUSE™  ·  RECREATIONAL", ["Talishouse™ 400", "recreational", "cottage"], ["20' x 20'", "Kitchen", "Bath"]),
    ("Talishouse™ 400 | Freizeit-Cottage",
     "Talishouse™ 400: 20' x 20' Stahlkonstruktion mit Kompaktküche, Vollbad und offenem Wohnbereich. Montage an einem Tag.",
     "TALISHOUSE™  ·  FREIZEIT", ["Talishouse™ 400", "Freizeit-", "Cottage"], ["20' x 20'", "Küche", "Bad"]))
add("/talishouse-residential", "talishouse-residential", "public", RES,
    ("Talishouse™ 1,600 | Residential Homes",
     "Talishouse™ residential homes. Tell us about your project and our team will contact you with a custom quote.",
     "TALISHOUSE™  ·  RESIDENTIAL", ["Talishouse™", "residential", "homes"], ["Custom quote"]),
    ("Talishouse™ 1.600 | Wohnhäuser",
     "Talishouse™ Wohnhäuser. Erzählen Sie uns von Ihrem Projekt, unser Team meldet sich mit einem individuellen Angebot.",
     "TALISHOUSE™  ·  WOHNEN", ["Talishouse™", "Wohn-", "häuser"], ["Individuelles Angebot"]))
add("/talistowns", "talistowns", "public", TOWNS,
    ("Talistowns™ | Planned Talishouse™ Communities",
     "Talistowns™ communities. Tell us about your project and our team will contact you with a custom quote.",
     "TALISHOUSE™  ·  TALISTOWNS™", ["Talistowns™", "planned", "communities"], ["Custom quote"]),
    ("Talistowns™ | Geplante Talishouse™ Siedlungen",
     "Talistowns™ Siedlungen. Erzählen Sie uns von Ihrem Projekt, unser Team meldet sich mit einem individuellen Angebot.",
     "TALISHOUSE™  ·  TALISTOWNS™", ["Talistowns™", "geplante", "Siedlungen"], ["Individuelles Angebot"]))
add("/lease-to-own", "lease-to-own", "public", RES,
    ("Lease-to-Own Talishouse™ Homes | Tsplits™",
     "Estimate a lease-to-own plan for a Talishouse™ product: payment term, monthly payment and ownership progress.",
     "TALISHOUSE™  ·  LEASE-TO-OWN", ["Lease-to-own", "your", "Talishouse™"], ["Term", "Monthly", "Ownership"]),
    ("Mietkauf für Talishouse™ Häuser | Tsplits™",
     "Berechnen Sie einen Mietkauf für ein Talishouse™ Produkt: Laufzeit, Monatsrate und Eigentumsfortschritt.",
     "TALISHOUSE™  ·  MIETKAUF", ["Mietkauf", "für Ihr", "Talishouse™"], ["Laufzeit", "Monatsrate", "Eigentum"]))

# ---------- TalisU Sea-Cans ----------
add("/talisu/bo", "talisu-bo", "public", BRAND,
    ("TalisU™ Sea-Cans | Business Office",
     "DIY container homes with TalisU™ Sea-Cans. Express an interest to qualify for our 'Friends of…' discount.",
     "TALISU™  ·  SEA-CANS", ["DIY container", "homes with", "TalisU™ Sea-Cans"], ["20 ft.", "40 ft.", "High-Cube"]),
    ("TalisU™ Sea-Cans | Business Office",
     "DIY-Containerhäuser mit TalisU™ Sea-Cans. Bekunden Sie Interesse und sichern Sie sich unseren „Friends of…“-Rabatt.",
     "TALISU™  ·  SEA-CANS", ["DIY-Container-", "häuser mit", "TalisU™ Sea-Cans"], ["20 ft.", "40 ft.", "High-Cube"]))
for slug, code, name, dims, en_b, de_b in [
    ("tsc20", "TSC20", "Sea-Cans 20 ft.", "20' × 8' × 8'6\"", "Practical half-length versatility.", "Praktische Vielseitigkeit in halber Länge."),
    ("tsc40", "TSC40", "Sea-Cans 40 ft.", "40' × 8' × 8'6\"", "Maximum full-length versatility.", "Maximale Vielseitigkeit in voller Länge."),
    ("hc40", "HC40", "High-Cube 40 ft.", "40' × 8' × 9'6\"", "Best for home and cottage sections.", "Ideal für Haus- und Cottage-Module."),
    ("sd20", "SD20", "Side-Doors 20 ft.", "2 × 10' × 8' × 8'6\"", "Best for commercial applications.", "Ideal für gewerbliche Anwendungen."),
    ("sd40", "SD40", "Side-Doors 40 ft.", "4 × 10' × 8' × 8'6\"", "Best for commercial applications.", "Ideal für gewerbliche Anwendungen."),
]:
    add(f"/talisu/bo/{slug}", f"talisu-bo-{slug}", "public", BRAND,
        (f"TalisU™ {name} ({code}) | Sea-Cans",
         f"TalisU™ {name}, {dims}. {en_b} Order online or express an interest.",
         f"TALISU™  ·  SEA-CANS  ·  {code}", ["TalisU™", name, dims], []),
        (f"TalisU™ {name} ({code}) | Sea-Cans",
         f"TalisU™ {name}, {dims}. {de_b} Online bestellen oder Interesse bekunden.",
         f"TALISU™  ·  SEA-CANS  ·  {code}", ["TalisU™", name, dims], []))
add("/talisu/sh", "talisu-sh", "public", BRAND,
    ("TalisU™ Sea-Cans Show Home | By Appointment",
     "Visit the TalisU™ Sea-Cans building site in Nova Scotia, by appointment only.",
     "TALISU™  ·  SEA-CANS SHOW HOME", ["Visit the", "show home by", "appointment"], ["Nova Scotia"]),
    ("TalisU™ Sea-Cans Musterhaus | Nach Termin",
     "Besuchen Sie die TalisU™ Sea-Cans Baustelle in Nova Scotia, nur nach Terminvereinbarung.",
     "TALISU™  ·  SEA-CANS MUSTERHAUS", ["Besuchen Sie", "das Musterhaus", "nach Termin"], ["Nova Scotia"]))
add("/talisu/cu", "talisu-cu", "public", BRAND,
    ("Contact TalisU™ Sea-Cans",
     "Contact TalisU™ Sea-Cans about DIY container homes, wholesale discounts and direct shipment.",
     "TALISU™  ·  SEA-CANS", ["Contact", "TalisU™", "Sea-Cans"], []),
    ("Kontakt zu TalisU™ Sea-Cans",
     "Kontaktieren Sie TalisU™ Sea-Cans zu DIY-Containerhäusern, Großhandelsrabatten und Direktversand.",
     "TALISU™  ·  SEA-CANS", ["Kontakt zu", "TalisU™", "Sea-Cans"], []))
add("/talisu/blog", "talisu-blog", "public", BRAND,
    ("TalisU™ Sea-Cans Blog",
     "The TalisU™ Sea-Cans blog on DIY container homes is coming soon.",
     "TALISU™  ·  SEA-CANS", ["TalisU™", "Sea-Cans", "blog"], []),
    ("TalisU™ Sea-Cans Blog",
     "Der TalisU™ Sea-Cans Blog über DIY-Containerhäuser folgt in Kürze.",
     "TALISU™  ·  SEA-CANS", ["TalisU™", "Sea-Cans", "Blog"], []))

# ---------- legal ----------
add("/privacy", "privacy", "public", BRAND,
    ("Privacy Policy | Tsplits™",
     "How Tsplits™ collects, uses and protects your personal information.",
     "TSPLITS™  ·  LEGAL", ["Privacy", "policy", ""], []),
    ("Datenschutzerklärung | Tsplits™",
     "Wie Tsplits™ Ihre personenbezogenen Daten erhebt, nutzt und schützt.",
     "TSPLITS™  ·  RECHTLICHES", ["Datenschutz-", "erklärung", ""], []))
add("/terms", "terms", "public", BRAND,
    ("Terms of Service | Tsplits™",
     "The terms of service that govern your use of the Tsplits™ website and services.",
     "TSPLITS™  ·  LEGAL", ["Terms", "of service", ""], []),
    ("Nutzungsbedingungen | Tsplits™",
     "Die Nutzungsbedingungen für die Website und Dienste von Tsplits™.",
     "TSPLITS™  ·  RECHTLICHES", ["Nutzungs-", "bedingungen", ""], []))

# ---------- confirmation pages (noindex) ----------
add("/registration-success", "registration-success", "utility", BRAND,
    ("Registration Successful | Tsplits™",
     "Your Mapsite has been created successfully.",
     "TSPLITS™  ·  REGISTRATION", ["Your Mapsite", "is", "ready"], []),
    ("Registrierung erfolgreich | Tsplits™",
     "Ihre Mapsite wurde erfolgreich erstellt.",
     "TSPLITS™  ·  REGISTRIERUNG", ["Ihre Mapsite", "ist", "bereit"], []))
add("/register/success", "register-success", "utility", BRAND,
    ("Mapsite Account Registered | Tsplits™",
     "Your Mapsite account has been registered. Keep your FAST Code to sign in.",
     "TSPLITS™  ·  REGISTRATION", ["Mapsite", "account", "registered"], []),
    ("Mapsite-Konto registriert | Tsplits™",
     "Ihr Mapsite-Konto wurde registriert. Bewahren Sie Ihren FAST Code für die Anmeldung auf.",
     "TSPLITS™  ·  REGISTRIERUNG", ["Mapsite-", "Konto", "registriert"], []))
add("/success", "subscription-success", "utility", BRAND,
    ("Subscription Successful | Tsplits™",
     "Thank you for subscribing. Your referral partner subscription is now active.",
     "TSPLITS™  ·  PARTNERS", ["Thank you", "for", "subscribing"], []),
    ("Abo erfolgreich | Tsplits™",
     "Danke für Ihr Abo. Ihr Empfehlungspartner-Abo ist jetzt aktiv.",
     "TSPLITS™  ·  PARTNER", ["Danke für", "Ihr", "Abo"], []))
add("/project-received", "project-received", "utility", BRAND,
    ("Project Received | Tsplits™",
     "Thank you for referring a project. A team member will follow up within two business days.",
     "TSPLITS™  ·  PROJECTS", ["Thank you:", "project", "received"], []),
    ("Projekt erhalten | Tsplits™",
     "Danke für Ihre Projektempfehlung. Ein Teammitglied meldet sich innerhalb von zwei Werktagen.",
     "TSPLITS™  ·  PROJEKTE", ["Danke:", "Projekt", "erhalten"], []))
add("/match-results", "match-results", "utility", MAP,
    ("Your Match Results | Tsplits™",
     "Your recommended Talishouse™ product and path, based on your goal, timeline and home type.",
     "TSPLITS™  ·  FIND YOUR MARKET", ["Your", "match", "results"], []),
    ("Ihre Ergebnisse | Tsplits™",
     "Ihr empfohlenes Talishouse™ Produkt und Ihr Weg, basierend auf Ziel, Zeitplan und Haustyp.",
     "TSPLITS™  ·  MARKT FINDEN", ["Ihre", "passenden", "Ergebnisse"], []))

# ---------- login pages (noindex, dedicated cards) ----------
add("/admin/login", "admin-login", "login", BRAND,
    ("Admin Login | Tsplits™",
     "Sign in to the Tsplits™ admin console to manage Mapsites, Talisbooks™, agents and payments.",
     "TSPLITS™  ·  ADMIN", ["Admin", "sign", "in"], []),
    ("Admin-Anmeldung | Tsplits™",
     "Melden Sie sich in der Tsplits™ Admin-Konsole an, um Mapsites, Talisbooks™, Agenten und Zahlungen zu verwalten.",
     "TSPLITS™  ·  ADMIN", ["Admin-", "Anmeldung", ""], []))
add("/agent/login", "agent-login", "login", BRAND,
    ("Agent Login | Tsplits™ Agent Portal",
     "Sign in to your Tsplits™ agent account with the login ID and password from your administrator.",
     "TSPLITS™  ·  AGENT PORTAL", ["Sign in to your", "agent", "account"], []),
    ("Agenten-Anmeldung | Tsplits™ Agent Portal",
     "Melden Sie sich mit der Login-ID und dem Passwort Ihres Administrators bei Ihrem Tsplits™ Agentenkonto an.",
     "TSPLITS™  ·  AGENT PORTAL", ["Melden Sie sich", "bei Ihrem", "Agentenkonto an"], []))
add("/agent/change-password", "agent-change-password", "login", BRAND,
    ("Change Password | Tsplits™ Agent Portal",
     "Choose a new password for your Tsplits™ agent account.",
     "TSPLITS™  ·  AGENT PORTAL", ["Choose a", "new", "password"], []),
    ("Passwort ändern | Tsplits™ Agent Portal",
     "Wählen Sie ein neues Passwort für Ihr Tsplits™ Agentenkonto.",
     "TSPLITS™  ·  AGENT PORTAL", ["Neues", "Passwort", "wählen"], []))
add("/chat", "chat", "utility", BRAND,
    ("Chat | Tsplits™ Agent Portal",
     "Private messages and team updates for Tsplits™ agents and admins.",
     "TSPLITS™  ·  CHAT", ["Team", "chat", "& updates"], []),
    ("Chat | Tsplits™ Agent Portal",
     "Private Nachrichten und Team-Updates für Tsplits™ Agenten und Admins.",
     "TSPLITS™  ·  CHAT", ["Team-", "Chat", "& Updates"], []))
add("/chat/[conversationId]", "chat-conversation", "utility", BRAND,
    ("Conversation | Tsplits™ Chat",
     "A private Tsplits™ conversation. Only its participants can read it.",
     "TSPLITS™  ·  CHAT", ["Private", "conver-", "sation"], []),
    ("Unterhaltung | Tsplits™ Chat",
     "Eine private Tsplits™ Unterhaltung. Nur die Teilnehmer können sie lesen.",
     "TSPLITS™  ·  CHAT", ["Private", "Unter-", "haltung"], []))
add("/crm/login", "crm-login", "login", BRAND,
    ("CRM Login | Tsplits™",
     "Sign in to the Tsplits™ CRM with your access code or FAST Code.",
     "TSPLITS™  ·  CRM", ["CRM", "sign", "in"], []),
    ("CRM-Anmeldung | Tsplits™",
     "Melden Sie sich mit Ihrem Zugangscode oder FAST Code beim Tsplits™ CRM an.",
     "TSPLITS™  ·  CRM", ["CRM-", "Anmeldung", ""], []))
add("/admin/agent/leads", "agent-leads", "utility", BRAND,
    ("Brokerage Leads | Tsplits™ Agent Portal",
     "Search, filter and export brokerage contacts agents prospect in Canada and the USA.",
     "TSPLITS™  ·  AGENT PORTAL", ["Brokerage", "leads for", "your market"], ["Canada", "USA", "CSV import"]),
    ("Makler-Leads | Tsplits™ Agentenportal",
     "Maklerkontakte suchen, filtern und exportieren, die Agenten in Kanada und den USA ansprechen.",
     "TSPLITS™  ·  AGENTENPORTAL", ["Makler-Leads", "für Ihren", "Markt"], ["Kanada", "USA", "CSV-Import"]))
add("/admin/agent/leads/new", "agent-leads-new", "utility", BRAND,
    ("Add a Brokerage Lead | Tsplits™",
     "Add a decision maker at an independent brokerage. The lead is saved to the agent who enters it.",
     "TSPLITS™  ·  AGENT PORTAL", ["Add a", "brokerage", "lead"], ["Canada", "USA"]),
    ("Makler-Lead hinzufügen | Tsplits™",
     "Einen Entscheider eines unabhängigen Maklerbüros hinzufügen. Der Lead gehört dem Agenten, der ihn erfasst.",
     "TSPLITS™  ·  AGENTENPORTAL", ["Makler-Lead", "hinzu-", "fügen"], ["Kanada", "USA"]))
add("/admin/agent/leads/import", "agent-leads-import", "utility", BRAND,
    ("Import Brokerage Leads | Tsplits™",
     "Upload a daily CSV, map the columns, and review duplicates before the leads are saved.",
     "TSPLITS™  ·  AGENT PORTAL", ["Import a", "daily", "CSV"], ["Preview", "Duplicates"]),
    ("Makler-Leads importieren | Tsplits™",
     "Laden Sie die tägliche CSV hoch, ordnen Sie die Spalten zu und prüfen Sie Dubletten vor dem Speichern.",
     "TSPLITS™  ·  AGENTENPORTAL", ["Tägliche", "CSV", "importieren"], ["Vorschau", "Dubletten"]))
add("/admin/agent/leads/[id]", "agent-leads-edit", "utility", BRAND,
    ("Edit a Brokerage Lead | Tsplits™",
     "Update a brokerage lead and read its edit history. Agents cannot delete a lead.",
     "TSPLITS™  ·  AGENT PORTAL", ["Edit a", "brokerage", "lead"], ["History", "No delete"]),
    ("Makler-Lead bearbeiten | Tsplits™",
     "Einen Makler-Lead aktualisieren und den Verlauf lesen. Agenten können einen Lead nicht löschen.",
     "TSPLITS™  ·  AGENTENPORTAL", ["Makler-Lead", "bear-", "beiten"], ["Verlauf", "Kein Löschen"]))
add("/talispros/client/login", "client-login", "login", BRAND,
    ("Mapsite Owner Login | Tsplits™",
     "Mapsite owners: sign in to your Tsplits™ marketing dashboard and books.",
     "TSPLITS™  ·  MAPSITE OWNERS", ["Mapsite", "owner", "sign in"], []),
    ("Anmeldung für Mapsite-Inhaber | Tsplits™",
     "Mapsite-Inhaber: Melden Sie sich bei Ihrem Tsplits™ Marketing-Dashboard und Ihren Büchern an.",
     "TSPLITS™  ·  MAPSITE-INHABER", ["Anmeldung für", "Mapsite-", "Inhaber"], []))

# ---------- dynamic pages: generated per record (existing /api/og routes) ----------
for r, en_t, de_t in [
    ("/mapsite/[slug]", "Mapsite (name from record)", "Mapsite (Name aus Datensatz)"),
    ("/mapsite/[slug]/map", "Mapsite map (name from record)", "Mapsite-Karte"),
    ("/ma/[fastcode]", "Mapsite by FAST Code", "Mapsite nach FAST Code"),
    ("/talispros/mapsite/[accountType]/[fastCode]", "Mapsite by FAST Code", "Mapsite nach FAST Code"),
    ("/talispros/mapsites/[fastCode]", "Published Mapsite", "Veröffentlichte Mapsite"),
    ("/talispros/home/[fastCode]", "Personal home page", "Persönliche Startseite"),
    ("/talispros/register-your-mapsite/[fastCode]", "Register for this Mapsite", "Für diese Mapsite registrieren"),
    ("/ttvaccess/[fastCode]", "TalisTV™ access", "TalisTV™ Zugang"),
    ("/talisbooks/fast/[fastCode]", "Mapsite bookshelf", "Mapsite-Bücherregal"),
    ("/talisbooks/viewer/[slug]", "Talisbook™ (title from record)", "Talisbook™"),
]:
    P.append(dict(route=r, slug=None, kind="dynamic", photo=None, en=(en_t,), de=(de_t,)))

add("/talispros/build-mapsite", "talispros-build-mapsite", "public", CLAIMED,
    ("Build My Mapsite | Tsplits™",
     "Set up your Tsplits™ Mapsite: place your pin, add your listing details and prepare your FAST Code and first Talisbook™.",
     "TSPLITS™  ·  BUILD MY MAPSITE", ["Build", "my", "Mapsite"], ["Pin", "FAST Code", "Talisbook™"]),
    ("Meine Mapsite erstellen | Tsplits™",
     "Richten Sie Ihre Tsplits™ Mapsite ein: Pin setzen, Angebotsdetails ergänzen, FAST Code und erstes Talisbook™ vorbereiten.",
     "TSPLITS™  ·  MAPSITE ERSTELLEN", ["Meine", "Mapsite", "erstellen"], ["Pin", "FAST Code", "Talisbook™"]))
