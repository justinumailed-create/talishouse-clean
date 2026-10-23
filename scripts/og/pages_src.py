# -*- coding: utf-8 -*-
"""Source of truth for page SEO + share cards. Run generate.py to emit
lib/seo/pages.json and render public/og/pages/<slug>-<locale>.jpg."""

AISHA = ("images/mapsites/aisha-c.webp", 0.5, {"en": "Aisha C. — Team Leader", "de": "Aisha C. – Teamleiterin"}, "Aisha C., Team Leader")
WEBSTER = ("talisu/webster-banker-v3.jpg", 0.5, {"en": "Webster M. — Fulfilment Options", "de": "Webster M. – Fulfilment-Optionen"}, "Webster M., Projects Analyst")
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
    ("Talispros™ | Claim Your Market, Open Your Mapsite",
     "Claim your market on Talispros™. Your Mapsite pins your place on the map so buyers and partners can find you, with Talisbooks™ and TalisTV™.",
     "TALISPROS™  ·  MAPSITES", ["Claim your market.", "Open your", "Mapsite"], ["Mapsites", "Talisbooks™", "TalisTV™"]),
    ("Talispros™ | Markt sichern, Mapsite eröffnen",
     "Sichern Sie Ihren Markt auf Talispros™. Ihre Mapsite setzt Sie auf die Karte, damit Käufer und Partner Sie finden – mit Talisbooks™ und TalisTV™.",
     "TALISPROS™  ·  MAPSITES", ["Markt sichern.", "Ihre Mapsite", "eröffnen"], ["Mapsites", "Talisbooks™", "TalisTV™"]))
add("/start", "start", "public", MAP,
    ("Talispros™ | Claim Your Market",
     "Claim your market on Talispros™. Mapsite pins your place on the map so buyers and partners can find you. Explore Talisbooks™ and grow your exposure.",
     "TALISPROS™  ·  START", ["Claim your", "market on", "Talispros™"], ["Mapsites", "Talisbooks™"]),
    ("Talispros™ | Sichern Sie Ihren Markt",
     "Sichern Sie Ihren Markt auf Talispros™. Die Mapsite setzt Sie auf die Karte, damit Käufer und Partner Sie finden. Entdecken Sie Talisbooks™.",
     "TALISPROS™  ·  START", ["Sichern Sie", "Ihren Markt auf", "Talispros™"], ["Mapsites", "Talisbooks™"]))
add("/talisu/mkts", "talisu-mkts", "public", MAP,
    ("Markets Served: Claim a 50-Mile Market | TalisU™",
     "Select the PIN nearest you to claim a semi-exclusive market of 50 miles (80 km) around a centre point on the Talismaps™ market map.",
     "TALISU™  ·  MARKETS", ["Claim a", "50-mile market", "near you"], ["Semi-exclusive", "80 km radius", "Talismaps™"]),
    ("Bediente Märkte: 80-km-Markt sichern | TalisU™",
     "Wählen Sie den PIN in Ihrer Nähe und sichern Sie einen semi-exklusiven Markt von 80 km (50 Meilen) rund um einen Mittelpunkt auf Talismaps™.",
     "TALISU™  ·  MÄRKTE", ["Sichern Sie", "einen 80-km-Markt", "in Ihrer Nähe"], ["Semi-exklusiv", "80 km Radius", "Talismaps™"]))
add("/catalogue", "catalogue", "public", TDOME,
    ("Talishouse™ Product Catalogue | Talispros™",
     "Browse the Talishouse™ Product Catalogue. Every design is numbered (P01, P02…); tap one to register for that product.",
     "TALISHOUSE™  ·  CATALOGUE", ["Talishouse™", "Product", "Catalogue"], ["T-Dome", "Glasshouse™", "Talistowns™"]),
    ("Talishouse™ Produktkatalog | Talispros™",
     "Entdecken Sie den Talishouse™ Produktkatalog. Jedes Design ist nummeriert (P01, P02…); tippen Sie eines an, um sich dafür zu registrieren.",
     "TALISHOUSE™  ·  KATALOG", ["Talishouse™", "Produkt-", "katalog"], ["T-Dome", "Glasshouse™", "Talistowns™"]))
add("/talisu/reg", "talisu-reg", "custom", AISHA, None, None)
add("/talisu/engage", "talisu-engage", "custom", WEBSTER, None, None)
add("/talisu", "talisu-faq", "public", AISHA,
    ("TalisU™ FAQ: Talispros™, Mapsites and FAST Codes",
     "Answers to frequently asked questions about Talispros™, Mapsites, FAST Codes and TalisU™ fulfilment options.",
     "TALISU™  ·  FAQ", ["Frequently", "asked", "questions"], ["Mapsites", "FAST Codes", "TalisU™"]),
    ("TalisU™ FAQ: Talispros™, Mapsites und FAST Codes",
     "Antworten auf häufige Fragen zu Talispros™, Mapsites, FAST Codes und den Abwicklungsoptionen von TalisU™.",
     "TALISU™  ·  FAQ", ["Häufig", "gestellte", "Fragen"], ["Mapsites", "FAST Codes", "TalisU™"]))
# ---------- PMC sequence (TalisU dropdown, below the divider) ----------
add("/talisu/talispros", "talisu-talispros", "public", WINDSWEPT,
    ("Talispros PMC: Map-Based Marketing for Canadian Brokerages",
     "Why Canadian brokerages add Talispros Mapsites beside MLS® and their website: earlier leads, sharper targeting, new ad revenue and stronger local brands.",
     "TALISPROS  ·  PMC", ["Industry adjacent", "markets for", "brokerages"], ["Promote", "Manage", "Cooperate"]),
    ("Talispros PMC: Kartenbasiertes Marketing für Makler",
     "Warum kanadische Makler Talispros-Mapsites neben MLS® und ihrer Website nutzen: frühere Leads, präziseres Targeting, neue Werbeerlöse, stärkere Marken.",
     "TALISPROS  ·  PMC", ["Branchennahe", "Märkte für", "Makler"], ["Promote", "Manage", "Cooperate"]))
add("/talisu/media-directory", "talisu-media-directory", "public", MAP,
    ("Media Directory: Where Talispros PINs Are Syndicated",
     "The Talispros media directory: global property portals and classifieds where Mapsite PINs are auto-syndicated in 10-day cycles. Open any outlet in place.",
     "TALISPROS  ·  MEDIA DIRECTORY", ["Your PINs,", "syndicated", "worldwide"], ["100+ outlets", "10-day cycles", "Global reach"]),
    ("Mediendirektorium: Wohin Talispros-PINs syndiziert werden",
     "Das Talispros-Mediendirektorium: weltweite Immobilienportale, in die Mapsite-PINs in 10-Tage-Zyklen automatisch syndiziert werden. Portale direkt öffnen.",
     "TALISPROS  ·  MEDIENDIREKTORIUM", ["Ihre PINs,", "weltweit", "syndiziert"], ["100+ Portale", "10-Tage-Zyklen", "Globale Reichweite"]))
add("/talisu/contract", "talisu-contract", "utility", BRAND,
    ("Service Agreement: Sign with Your Agent Code | Talispros",
     "Open the TalisALL PMC Service Agreement with your agent code, sign it electronically and continue to Talispros registration.",
     "TALISPROS  ·  CONTRACT", ["Sign your", "Service", "Agreement"], ["Agent code", "E-signature", "Then register"]),
    ("Dienstleistungsvertrag mit Agenten-Code signieren",
     "Öffnen Sie den TalisALL PMC Dienstleistungsvertrag mit Ihrem Agenten-Code, unterschreiben Sie elektronisch und fahren Sie mit der Registrierung fort.",
     "TALISPROS  ·  VERTRAG", ["Ihren", "Dienstleistungs-", "vertrag signieren"], ["Agenten-Code", "E-Signatur", "Dann registrieren"]))
add("/talisu/discuss", "talisu-discuss", "public", WEBSTER,
    ("Share a Project Vision | TalisU™",
     "Explore Conventional, SPLITS, Fractionalization and Tokenization structures and share your project vision with an advisor. No registration needed.",
     "TALISU™  ·  PROJECT VISION", ["Share a", "Project Vision"], ["Conventional · SPLITS", "Fractionalization", "Tokenization"]),
    ("Projektvision teilen | TalisU™",
     "Entdecken Sie Konventionell, SPLITS, Fraktionalisierung und Tokenisierung und teilen Sie Ihre Projektvision mit einem Berater. Ohne Registrierung.",
     "TALISU™  ·  PROJEKTVISION", ["Projektvision", "teilen"], ["Konventionell · SPLITS", "Fraktionalisierung", "Tokenisierung"]))
add("/talisu/terms", "talisu-terms", "public", BRAND,
    ("Terms of Service | Talispros by TalisALL PMC",
     "Talispros Terms of Service: platform role, customer responsibilities, warranties, liability, fees in CAD, intellectual property, termination and privacy.",
     "TALISPROS  ·  TERMS", ["Terms of", "Service"], ["TalisALL PMC", "Fees in CAD", "No long-term commitment"]),
    ("Nutzungsbedingungen | Talispros von TalisALL PMC",
     "Talispros-Nutzungsbedingungen: Rolle der Plattform, Kundenpflichten, Gewährleistung, Haftung, Gebühren in CAD, geistiges Eigentum, Kündigung, Datenschutz.",
     "TALISPROS  ·  BEDINGUNGEN", ["Nutzungs-", "bedingungen"], ["TalisALL PMC", "Gebühren in CAD", "Keine Langzeitbindung"]))
add("/talisu/privacy", "talisu-privacy", "public", BRAND,
    ("Privacy Policy | TalisALL (Talispros, TalisU, Taliswebs)",
     "How TalisALL collects, uses, shares and protects information across talispros.com, talisu.com, taliswebs.com and talishouse.com, and your privacy rights.",
     "TALISALL  ·  PRIVACY", ["Privacy", "Policy"], ["Your data", "Your rights", "Security"]),
    ("Datenschutzerklärung | TalisALL (Talispros, TalisU)",
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
     "TalisTV™ is the Talispros™ in-house online TV station. See the programme guide with what is live and up next.",
     "TALISTV™  ·  PROGRAMME GUIDE", ["TalisTV™", "in-house online", "TV station"], ["Live", "Up next", "Guide"]),
    ("TalisTV™ | Hauseigener Online-TV-Sender",
     "TalisTV™ ist der hauseigene Online-TV-Sender von Talispros™. Im Programmführer sehen Sie, was live läuft und was als Nächstes kommt.",
     "TALISTV™  ·  PROGRAMMFÜHRER", ["TalisTV™", "hauseigener", "Online-TV-Sender"], ["Live", "Als Nächstes", "Programm"]))
add("/talispros/demo-mapsite", "demo-mapsite", "public", CLAIMED,
    ("Build a Demo eBook and Mapsite | Talispros™",
     "Place a demonstration pin and attach the pinned Talispros™ eBook. Try a Mapsite with no FAST Code issued.",
     "TALISPROS™  ·  DEMO", ["Build a", "demo eBook", "and Mapsite"], ["Demo pin", "eBook", "No FAST Code"]),
    ("Demo-E-Book und Mapsite erstellen | Talispros™",
     "Setzen Sie einen Demo-Pin und hängen Sie das Talispros™ E-Book an. Testen Sie eine Mapsite, ohne dass ein FAST Code vergeben wird.",
     "TALISPROS™  ·  DEMO", ["Demo-E-Book", "und Mapsite", "erstellen"], ["Demo-Pin", "E-Book", "Ohne FAST Code"]))
add("/talispros/demo-mapsite/ebook", "demo-ebook", "public", COVER,
    ("Demo Talisbook™ from the Pinned eBook | Talispros™",
     "Turn the pinned Talispros™ eBook PDF into a demonstration Talisbook™ with optimised pages.",
     "TALISBOOKS™  ·  DEMO", ["Generate a", "demo", "Talisbook™"], []),
    ("Demo-Talisbook™ aus dem E-Book | Talispros™",
     "Verwandeln Sie das angeheftete Talispros™ E-Book-PDF in ein Demo-Talisbook™ mit optimierten Seiten.",
     "TALISBOOKS™  ·  DEMO", ["Erstellen Sie", "ein Demo-", "Talisbook™"], []))
add("/talisu/kb", "talisu-kb", "public", LAPTOP,
    ("TalisU™ Knowledge Base: Audio, Video, Learning",
     "TalisU™ Knowledge Base: audios, videos and learning material for Mapsites and FAST Codes.",
     "TALISU™  ·  KNOWLEDGE BASE", ["Knowledge Base", "audio, video", "and learning"], ["Audio", "Video", "Mapsites"]),
    ("TalisU™ Wissensdatenbank: Audio, Video, Lernen",
     "TalisU™ Wissensdatenbank: Audios, Videos und Lernmaterial zu Mapsites und FAST Codes.",
     "TALISU™  ·  WISSENSDATENBANK", ["Wissensdatenbank", "Audio, Video", "und Lernen"], ["Audio", "Video", "Mapsites"]))
add("/talisu/au", "talisu-audio", "public", AISHA,
    ("TalisU™ Audio: Aisha & Webster",
     "Listen to TalisU™ audio: a short welcome plus Aisha & Webster on digital property fractionalization.",
     "TALISU™  ·  AUDIO", ["Listen:", "Aisha & Webster", "on TalisU™"], ["Welcome", "Fractionalization"]),
    ("TalisU™ Audio: Aisha & Webster",
     "Hören Sie TalisU™ Audio: eine kurze Begrüßung sowie Aisha & Webster über die digitale Fraktionalisierung von Immobilien.",
     "TALISU™  ·  AUDIO", ["Hören Sie:", "Aisha & Webster", "bei TalisU™"], ["Begrüßung", "Fraktionalisierung"]))
add("/talisu/video", "talisu-video", "public", LAPTOP,
    ("TalisU™ Video Library and TalisTV™",
     "The TalisU™ video library and TalisTV™ programming.",
     "TALISU™  ·  VIDEO", ["TalisU™", "video library", "and TalisTV™"], []),
    ("TalisU™ Videothek und TalisTV™",
     "Die TalisU™ Videothek und das TalisTV™ Programm.",
     "TALISU™  ·  VIDEO", ["TalisU™", "Videothek", "und TalisTV™"], []))
add("/learn-more", "learn-more", "public", COVER,
    ("Learn More About Tokenization | Talispros™",
     "Explore tokenization with the Talisbooks™ eBook experience and TalisU™ audio.",
     "TALISU™  ·  LEARN MORE", ["Learn more", "about", "tokenization"], ["Talisbooks™", "TalisU™ Audio"]),
    ("Mehr über Tokenisierung erfahren | Talispros™",
     "Entdecken Sie die Tokenisierung mit dem Talisbooks™ E-Book-Erlebnis und TalisU™ Audio.",
     "TALISU™  ·  MEHR ERFAHREN", ["Mehr über", "Tokenisierung", "erfahren"], ["Talisbooks™", "TalisU™ Audio"]))

# ---------- Mapsite / Talispros pages ----------
add("/talispros", "talispros-pmc", "public", LAPTOP,
    ("Talispros™ PMC | Industry Adjacent Marketplaces",
     "Talispros™ PMC: industry adjacent marketplaces for real estate professionals, with monthly content support, co-promotion and referral networks.",
     "TALISPROS™  ·  PMC", ["Industry adjacent", "marketplaces for", "real estate pros"], ["Mapsites", "FAST Codes", "TalisForms™"]),
    ("Talispros™ PMC | Branchennahe Marktplätze",
     "Talispros™ PMC: branchennahe Marktplätze für Immobilienprofis, mit monatlicher Content-Unterstützung, Co-Promotion und Empfehlungsnetzwerken.",
     "TALISPROS™  ·  PMC", ["Branchennahe", "Marktplätze für", "Immobilienprofis"], ["Mapsites", "FAST Codes", "TalisForms™"]))
add("/talispros/mapsite", "mapsite-app", "public", PIN,
    ("Talispros™ Mapsite | Claim Your Market",
     "Claim your market on the Talispros™ Mapsite, the fullscreen map application for FSBOs, builders and real estate professionals.",
     "TALISPROS™  ·  MAPSITE", ["The fullscreen", "map for your", "market"], ["FSBOs", "Builders", "Realtors"]),
    ("Talispros™ Mapsite | Sichern Sie Ihren Markt",
     "Sichern Sie Ihren Markt auf der Talispros™ Mapsite, der Vollbild-Kartenanwendung für Privatverkäufer, Bauträger und Immobilienprofis.",
     "TALISPROS™  ·  MAPSITE", ["Die Vollbild-", "Karte für Ihren", "Markt"], ["Privatverkäufer", "Bauträger", "Makler"]))
add("/mapsite", "mapsite-home", "public", PIN,
    ("Mapsite | Talispros™",
     "Open the Talispros™ Mapsite: map-first marketing that pins your business where buyers and partners are looking.",
     "TALISPROS™  ·  MAPSITE", ["Map-first", "marketing on", "your Mapsite"], []),
    ("Mapsite | Talispros™",
     "Öffnen Sie die Talispros™ Mapsite: kartenbasiertes Marketing, das Ihr Unternehmen dort zeigt, wo Käufer und Partner suchen.",
     "TALISPROS™  ·  MAPSITE", ["Kartenbasiertes", "Marketing auf", "Ihrer Mapsite"], []))
add("/talispros/build-mapsite/assisted", "build-assisted", "public", RAHUL,
    ("Have Me Build It: Assisted Mapsite Build | Talispros™",
     "Send Rahul your details and he builds your Mapsite for you, with your FAST Code and first Talisbook™.",
     "TALISPROS™  ·  ASSISTED BUILD", ["Have me", "build your", "Mapsite"], ["FAST Code", "Talisbook™"]),
    ("Lassen Sie bauen: Mapsite mit Hilfe | Talispros™",
     "Senden Sie Rahul Ihre Angaben und er baut Ihre Mapsite für Sie, mit FAST Code und Ihrem ersten Talisbook™.",
     "TALISPROS™  ·  BAUSERVICE", ["Lassen Sie", "Ihre Mapsite", "bauen"], ["FAST Code", "Talisbook™"]))
add("/talispros/claim-a-market", "claim-a-market", "public", MAP,
    ("Claim a Market™ | Talispros™",
     "Claim a market inside Talismaps™: market visibility, referral networks, industry adjacent exposure and FAST Code access.",
     "TALISPROS™  ·  CLAIM A MARKET™", ["Claim your", "market inside", "Talismaps™"], ["Visibility", "Referrals", "FAST Code"]),
    ("Claim a Market™ | Talispros™",
     "Sichern Sie sich einen Markt in Talismaps™: Marktpräsenz, Empfehlungsnetzwerke, branchennahe Reichweite und FAST-Code-Zugang.",
     "TALISPROS™  ·  CLAIM A MARKET™", ["Sichern Sie", "Ihren Markt in", "Talismaps™"], ["Präsenz", "Empfehlungen", "FAST Code"]))
add("/talispros/markets/claim-a-market", "build-mapsite-market", "public", AISHA,
    ("Build Your Mapsite | Talispros™",
     "Mapsite is the centre of Talispros™. Submit your Build Request to receive a FAST Code and create your first Talisbook™.",
     "TALISPROS™  ·  BUILD MAPSITE", ["Build your", "Mapsite", "today"], ["FAST Code", "Talisbook™", "TalisTV™"]),
    ("Erstellen Sie Ihre Mapsite | Talispros™",
     "Die Mapsite ist das Herz von Talispros™. Senden Sie Ihre Bauanfrage, erhalten Sie einen FAST Code und erstellen Sie Ihr erstes Talisbook™.",
     "TALISPROS™  ·  MAPSITE ERSTELLEN", ["Erstellen Sie", "Ihre", "Mapsite"], ["FAST Code", "Talisbook™", "TalisTV™"]))
add("/talispros/markets/for-sale-by-owners", "market-fsbo", "public", AISHA,
    ("Mapsites for For Sale By Owners | Talispros™",
     "Sell privately with professional reach. Rahul promotes your property on your own Mapsite; you sell through your lawyer with no real estate fees.",
     "TALISPROS™  ·  FOR SALE BY OWNERS", ["Sell privately", "with professional", "reach"], ["FSBO", "Mapsite", "No agent fees"]),
    ("Mapsites für Privatverkäufer | Talispros™",
     "Privat verkaufen mit professioneller Reichweite. Rahul bewirbt Ihre Immobilie auf Ihrer Mapsite; Sie verkaufen über Ihren Anwalt ohne Maklergebühr.",
     "TALISPROS™  ·  PRIVATVERKÄUFER", ["Privat verkaufen", "mit professioneller", "Reichweite"], ["Privatverkauf", "Mapsite", "Ohne Maklergebühr"]))
add("/talispros/markets/real-estate-professionals", "market-realtors", "public", AISHA,
    ("Mapsites for Real Estate Professionals | Talispros™",
     "Mapsites encourage listing qualification based on service floors, so reward structures rise over time and Mapsites pay for themselves.",
     "TALISPROS™  ·  REAL ESTATE PROS", ["Mapsites that", "pay for", "themselves"], ["Listings", "Service floors", "Referrals"]),
    ("Mapsites für Immobilienprofis | Talispros™",
     "Mapsites fördern die Qualifizierung von Angeboten über Mindeststandards, sodass Vergütungen steigen und sich Mapsites selbst tragen.",
     "TALISPROS™  ·  IMMOBILIENPROFIS", ["Mapsites, die", "sich selbst", "tragen"], ["Angebote", "Standards", "Empfehlungen"]))
add("/talispros/markets/talishouse-builders", "market-builders", "public", REC,
    ("Mapsites for Talishouse™ Builders | Talispros™",
     "Map-based marketing for Talishouse™ builders on a proprietary platform, without real estate licensing fees.",
     "TALISPROS™  ·  TALISHOUSE™ BUILDERS", ["Map-based", "marketing for", "builders"], ["Talishouse™", "Mapsite", "Segmentation"]),
    ("Mapsites für Talishouse™ Bauträger | Talispros™",
     "Kartenbasiertes Marketing für Talishouse™ Bauträger auf einer eigenen Plattform, ohne Gebühren für Maklerlizenzen.",
     "TALISPROS™  ·  TALISHOUSE™ BAUTRÄGER", ["Karten-", "marketing für", "Bauträger"], ["Talishouse™", "Mapsite", "Segmentierung"]))
add("/talispros/register", "talispros-register", "public", AISHA,
    ("Register Your Mapsite | Talispros™",
     "Choose your account level and activate your Mapsite through secure online registration.",
     "TALISPROS™  ·  REGISTER", ["Register", "your", "Mapsite"], ["Root Account™", "Derivative Account™"]),
    ("Registrieren Sie Ihre Mapsite | Talispros™",
     "Wählen Sie Ihre Kontostufe und aktivieren Sie Ihre Mapsite über die sichere Online-Registrierung.",
     "TALISPROS™  ·  REGISTRIEREN", ["Registrieren Sie", "Ihre", "Mapsite"], ["Root Account™", "Derivative Account™"]))
add("/talispros/register-agents", "register-agents", "public", AISHA,
    ("Register Your Agents | Talispros™",
     "After Root Account™ payment, register Derivative Account™ agents under your FAST Code.",
     "TALISPROS™  ·  AGENTS", ["Register", "your", "agents"], ["Root Account™", "Derivative Account™"]),
    ("Registrieren Sie Ihre Agenten | Talispros™",
     "Registrieren Sie nach der Zahlung für Ihren Root Account™ Agenten mit Derivative Account™ unter Ihrem FAST Code.",
     "TALISPROS™  ·  AGENTEN", ["Registrieren Sie", "Ihre", "Agenten"], ["Root Account™", "Derivative Account™"]))
add("/talispros/start/developer", "start-developer", "public", TOWNS,
    ("Developers and Builders: Own Your Market | Talispros™",
     "Claim a market with a Root Account™. Deploy up to 100 Derivative Accounts, enable SPLITS and establish your organisation inside Talismaps™.",
     "TALISPROS™  ·  DEVELOPER / BUILDER", ["Own your", "market", "territory"], ["Root Account™", "SPLITS", "Talismaps™"]),
    ("Bauträger: Ihr eigenes Marktgebiet | Talispros™",
     "Sichern Sie einen Markt mit einem Root Account™. Bis zu 100 Derivative Accounts, SPLITS und Ihre Organisation in Talismaps™.",
     "TALISPROS™  ·  BAUTRÄGER", ["Ihr eigenes", "Markt-", "gebiet"], ["Root Account™", "SPLITS", "Talismaps™"]))
add("/talispros/start/investor", "start-investor", "public", MAP,
    ("Real Estate Investors: Portfolio Presence | Talispros™",
     "Manage multiple properties under one Derivative Account™. Generate FAST Codes for each asset and track them all on Talismaps™.",
     "TALISPROS™  ·  REAL ESTATE INVESTOR", ["Build your", "portfolio", "presence"], ["Derivative Account™", "FAST Codes"]),
    ("Immobilieninvestoren: Ihr Portfolio | Talispros™",
     "Verwalten Sie mehrere Immobilien unter einem Derivative Account™. FAST Codes für jedes Objekt, alles auf Talismaps™ im Blick.",
     "TALISPROS™  ·  IMMOBILIENINVESTOR", ["Präsentieren Sie", "Ihr", "Portfolio"], ["Derivative Account™", "FAST Codes"]))
add("/talispros/ebook-choice", "ebook-choice", "public", RAHUL,
    ("Choose Your eBook Path | Talispros™",
     "Choose whether to generate your own Talisbooks™ eBook or have Rahul build it for you.",
     "TALISBOOKS™  ·  EBOOK", ["Build it yourself", "or have Rahul", "build it"], []),
    ("Wählen Sie Ihren E-Book-Weg | Talispros™",
     "Entscheiden Sie, ob Sie Ihr Talisbooks™ E-Book selbst erstellen oder von Rahul erstellen lassen.",
     "TALISBOOKS™  ·  E-BOOK", ["Selbst erstellen", "oder von Rahul", "erstellen lassen"], []))
add("/talispros/ebook-generate", "ebook-generate", "public", COVER,
    ("Generate Your Own Talisbooks™ eBook | Talispros™",
     "Generate your own Talisbooks™ eBook from property images, title, description and location. No payment required.",
     "TALISBOOKS™  ·  GENERATE", ["Generate your", "own Talisbooks™", "eBook"], ["Images", "Location", "No payment"]),
    ("Eigenes Talisbooks™ E-Book erstellen | Talispros™",
     "Erstellen Sie Ihr eigenes Talisbooks™ E-Book aus Bildern, Titel, Beschreibung und Lage der Immobilie. Keine Zahlung erforderlich.",
     "TALISBOOKS™  ·  ERSTELLEN", ["Erstellen Sie", "Ihr Talisbooks™", "E-Book"], ["Bilder", "Lage", "Kostenlos"]))
add("/talispros/ebook-rahul", "ebook-rahul", "public", RAHUL,
    ("Have Rahul Build Your eBook | Talispros™",
     "Upload your photo, logo, property images and details so Rahul can build your Talisbooks™ eBook.",
     "TALISBOOKS™  ·  ASSISTED EBOOK", ["Have Rahul", "build your", "eBook"], ["Photo", "Logo", "Property images"]),
    ("Rahul erstellt Ihr E-Book | Talispros™",
     "Laden Sie Foto, Logo, Immobilienbilder und Angaben hoch, damit Rahul Ihr Talisbooks™ E-Book erstellen kann.",
     "TALISBOOKS™  ·  E-BOOK-SERVICE", ["Rahul erstellt", "Ihr", "E-Book"], ["Foto", "Logo", "Immobilienbilder"]))
add("/talispros/forms", "talisforms", "public", LAPTOP,
    ("TalisForms™ | Forms Infrastructure | Talispros™",
     "TalisForms™: white-label forms with CRM integrations, multi-step workflows and conditional logic.",
     "TALISFORMS™  ·  FORMS", ["Forms", "infrastructure for", "Talispros™"], ["White label", "CRM", "Workflows"]),
    ("TalisForms™ | Formular-Infrastruktur | Talispros™",
     "TalisForms™: White-Label-Formulare mit CRM-Integration, mehrstufigen Abläufen und bedingter Logik.",
     "TALISFORMS™  ·  FORMULARE", ["Formular-", "Infrastruktur für", "Talispros™"], ["White Label", "CRM", "Abläufe"]))
add("/talismaps", "talismaps", "public", MAP,
    ("Talismaps™ | Interactive Map Platform",
     "Talismaps™ is the interactive map platform of the Talispros™ ecosystem, with root accounts, derivative maps, Adpro PINs and listings.",
     "TALISMAPS™  ·  MAP PLATFORM", ["Interactive", "property", "discovery maps"], ["Root accounts", "Adpro PINs", "Listings"]),
    ("Talismaps™ | Interaktive Kartenplattform",
     "Talismaps™ ist die interaktive Kartenplattform von Talispros™, mit Root Accounts, abgeleiteten Karten, Adpro PINs und Angeboten.",
     "TALISMAPS™  ·  KARTENPLATTFORM", ["Interaktive", "Karten zur", "Immobiliensuche"], ["Root Accounts", "Adpro PINs", "Angebote"]))
add("/fast-code", "fast-code", "public", PIN,
    ("Generate Your FAST Code | Talispros™",
     "Generate your unique FAST Code to access your Talispros™ Mapsite.",
     "TALISPROS™  ·  FAST CODE", ["Generate", "your", "FAST Code"], []),
    ("Erstellen Sie Ihren FAST Code | Talispros™",
     "Erstellen Sie Ihren persönlichen FAST Code für den Zugang zu Ihrer Talispros™ Mapsite.",
     "TALISPROS™  ·  FAST CODE", ["Erstellen Sie", "Ihren", "FAST Code"], []))
add("/build-mapsite", "build-mapsite", "public", PIN,
    ("Build a Mapsite with AdPro™ PINs | Talispros™",
     "Request your Mapsite build: choose a single AdPro™ PIN or packages for teams, brokerages and enterprises.",
     "TALISPROS™  ·  BUILD A MAPSITE", ["Build a", "Mapsite", "for your business"], ["Single PIN", "Teams", "Enterprise"]),
    ("Mapsite mit AdPro™ PINs erstellen | Talispros™",
     "Fordern Sie Ihre Mapsite an: ein einzelner AdPro™ PIN oder Pakete für Teams, Maklerbüros und Unternehmen.",
     "TALISPROS™  ·  MAPSITE ERSTELLEN", ["Erstellen Sie", "eine Mapsite", "für Ihr Geschäft"], ["Einzel-PIN", "Teams", "Unternehmen"]))
add("/register-mapsite", "register-mapsite", "public", PIN,
    ("Register and Activate Your Mapsite | Talispros™",
     "Register your Mapsite and activate your Talispros™ presence with a one-time registration.",
     "TALISPROS™  ·  REGISTER", ["Register and", "activate your", "Mapsite"], ["AdPro™ PINs"]),
    ("Mapsite registrieren und aktivieren | Talispros™",
     "Registrieren Sie Ihre Mapsite und aktivieren Sie Ihre Talispros™ Präsenz mit einer einmaligen Registrierung.",
     "TALISPROS™  ·  REGISTRIEREN", ["Registrieren und", "aktivieren Sie", "Ihre Mapsite"], ["AdPro™ PINs"]))
add("/register", "register-legacy", "public", PIN,
    ("Register Your Mapsite Account | Talispros™",
     "Register your Mapsite account, choose a monthly plan and activate your Talispros™ presence.",
     "TALISPROS™  ·  ACCOUNT", ["Register your", "Mapsite", "account"], ["Monthly plan", "AdPro™ PINs"]),
    ("Mapsite-Konto registrieren | Talispros™",
     "Registrieren Sie Ihr Mapsite-Konto, wählen Sie einen Monatsplan und aktivieren Sie Ihre Talispros™ Präsenz.",
     "TALISPROS™  ·  KONTO", ["Registrieren Sie", "Ihr Mapsite-", "Konto"], ["Monatsplan", "AdPro™ PINs"]))
add("/partner-access", "partner-access", "public", BRAND,
    ("Wholesale Partner Access with FAST Codes | TalisU™",
     "Access dedicated TalisU™ Mapsites using your FAST Code.",
     "TALISU™  ·  PARTNER ACCESS", ["Wholesale", "partner", "access"], ["FAST Code", "Mapsites"]),
    ("Großhandels-Partnerzugang mit FAST Code | TalisU™",
     "Greifen Sie mit Ihrem FAST Code auf eigene TalisU™ Mapsites zu.",
     "TALISU™  ·  PARTNERZUGANG", ["Großhandels-", "Partner-", "zugang"], ["FAST Code", "Mapsites"]))
add("/partner-view", "partner-view", "public", LAPTOP,
    ("Tell Us About Your Project | Talispros™",
     "Partners: tell us about your project and the Talispros™ team will follow up.",
     "TALISPROS™  ·  PARTNERS", ["Tell us", "about your", "project"], []),
    ("Erzählen Sie uns von Ihrem Projekt | Talispros™",
     "Partner: Erzählen Sie uns von Ihrem Projekt, das Talispros™ Team meldet sich bei Ihnen.",
     "TALISPROS™  ·  PARTNER", ["Erzählen Sie", "uns von Ihrem", "Projekt"], []))
add("/subscription", "subscription", "public", LAPTOP,
    ("Referral Partner Programme | Talispros™",
     "Join the Talispros™ referral partner programme: exclusive project leads, marketing materials, referral tracking and wholesale pricing.",
     "TALISPROS™  ·  PARTNER PROGRAMME", ["Become a", "referral", "partner"], ["Leads", "Tracking", "Wholesale"]),
    ("Empfehlungspartner-Programm | Talispros™",
     "Werden Sie Talispros™ Empfehlungspartner: exklusive Projekt-Leads, Marketingmaterial, Empfehlungs-Tracking und Großhandelspreise.",
     "TALISPROS™  ·  PARTNERPROGRAMM", ["Werden Sie", "Empfehlungs-", "partner"], ["Leads", "Tracking", "Großhandel"]))
add("/business-office", "business-office", "public", LAPTOP,
    ("Business Office: Moonlighting Is Lucrative | Talispros™",
     "The Talispros™ Business Office: refer lease-to-own projects, collect on your projects, join partner programmes or propose a project.",
     "TALISPROS™  ·  BUSINESS OFFICE", ["Moonlighting", "is", "lucrative"], ["Lease-to-Own", "Partners", "Projects"]),
    ("Business Office: Nebenverdienst lohnt sich | Talispros™",
     "Das Talispros™ Business Office: Mietkauf-Projekte empfehlen, Projekte abrechnen, Partnerprogramme nutzen oder ein Projekt vorschlagen.",
     "TALISPROS™  ·  BUSINESS OFFICE", ["Nebenverdienst", "lohnt", "sich"], ["Mietkauf", "Partner", "Projekte"]))
add("/business-office/apply", "propose-project", "public", REC,
    ("Propose a Project | Talispros™ Business Office",
     "Propose a project and start a side business with Talispros™.",
     "TALISPROS™  ·  BUSINESS OFFICE", ["Propose", "a", "project"], []),
    ("Projekt vorschlagen | Talispros™ Business Office",
     "Schlagen Sie ein Projekt vor und starten Sie ein Nebengeschäft mit Talispros™.",
     "TALISPROS™  ·  BUSINESS OFFICE", ["Schlagen Sie", "ein Projekt", "vor"], []))
add("/business-office/register", "bo-register", "public", LAPTOP,
    ("Business Office Registration | Talispros™",
     "Business Office registration for Talispros™ partners is coming soon.",
     "TALISPROS™  ·  BUSINESS OFFICE", ["Business Office", "registration", "coming soon"], []),
    ("Business-Office-Registrierung | Talispros™",
     "Die Business-Office-Registrierung für Talispros™ Partner folgt in Kürze.",
     "TALISPROS™  ·  BUSINESS OFFICE", ["Business Office", "Registrierung", "folgt in Kürze"], []))
add("/add-project", "add-project", "public", REC,
    ("Add a Project | Talispros™",
     "Submit your project details and request a preferred FAST Code.",
     "TALISPROS™  ·  PROJECTS", ["Add", "your", "project"], []),
    ("Projekt hinzufügen | Talispros™",
     "Reichen Sie Ihre Projektdaten ein und wünschen Sie sich einen FAST Code.",
     "TALISPROS™  ·  PROJEKTE", ["Fügen Sie", "Ihr Projekt", "hinzu"], []))
add("/find-your-market", "find-your-market", "public", MAP,
    ("Find Your Market | Talispros™",
     "Answer a few questions about your goal, timeline and home type to find the Talishouse™ product and path that fit you.",
     "TALISPROS™  ·  FIND YOUR MARKET", ["Find", "your", "market"], ["Goal", "Timeline", "Home type"]),
    ("Finden Sie Ihren Markt | Talispros™",
     "Beantworten Sie ein paar Fragen zu Ziel, Zeitplan und Haustyp und finden Sie das passende Talishouse™ Produkt.",
     "TALISPROS™  ·  MARKT FINDEN", ["Finden Sie", "Ihren", "Markt"], ["Ziel", "Zeitplan", "Haustyp"]))

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
    ("Lease-to-Own Talishouse™ Homes | Talispros™",
     "Estimate a lease-to-own plan for a Talishouse™ product: payment term, monthly payment and ownership progress.",
     "TALISHOUSE™  ·  LEASE-TO-OWN", ["Lease-to-own", "your", "Talishouse™"], ["Term", "Monthly", "Ownership"]),
    ("Mietkauf für Talishouse™ Häuser | Talispros™",
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
    ("Privacy Policy | Talispros™",
     "How Talispros™ collects, uses and protects your personal information.",
     "TALISPROS™  ·  LEGAL", ["Privacy", "policy", ""], []),
    ("Datenschutzerklärung | Talispros™",
     "Wie Talispros™ Ihre personenbezogenen Daten erhebt, nutzt und schützt.",
     "TALISPROS™  ·  RECHTLICHES", ["Datenschutz-", "erklärung", ""], []))
add("/terms", "terms", "public", BRAND,
    ("Terms of Service | Talispros™",
     "The terms of service that govern your use of the Talispros™ website and services.",
     "TALISPROS™  ·  LEGAL", ["Terms", "of service", ""], []),
    ("Nutzungsbedingungen | Talispros™",
     "Die Nutzungsbedingungen für die Website und Dienste von Talispros™.",
     "TALISPROS™  ·  RECHTLICHES", ["Nutzungs-", "bedingungen", ""], []))

# ---------- confirmation pages (noindex) ----------
add("/registration-success", "registration-success", "utility", BRAND,
    ("Registration Successful | Talispros™",
     "Your Mapsite has been created successfully.",
     "TALISPROS™  ·  REGISTRATION", ["Your Mapsite", "is", "ready"], []),
    ("Registrierung erfolgreich | Talispros™",
     "Ihre Mapsite wurde erfolgreich erstellt.",
     "TALISPROS™  ·  REGISTRIERUNG", ["Ihre Mapsite", "ist", "bereit"], []))
add("/register/success", "register-success", "utility", BRAND,
    ("Mapsite Account Registered | Talispros™",
     "Your Mapsite account has been registered. Keep your FAST Code to sign in.",
     "TALISPROS™  ·  REGISTRATION", ["Mapsite", "account", "registered"], []),
    ("Mapsite-Konto registriert | Talispros™",
     "Ihr Mapsite-Konto wurde registriert. Bewahren Sie Ihren FAST Code für die Anmeldung auf.",
     "TALISPROS™  ·  REGISTRIERUNG", ["Mapsite-", "Konto", "registriert"], []))
add("/success", "subscription-success", "utility", BRAND,
    ("Subscription Successful | Talispros™",
     "Thank you for subscribing. Your referral partner subscription is now active.",
     "TALISPROS™  ·  PARTNERS", ["Thank you", "for", "subscribing"], []),
    ("Abo erfolgreich | Talispros™",
     "Danke für Ihr Abo. Ihr Empfehlungspartner-Abo ist jetzt aktiv.",
     "TALISPROS™  ·  PARTNER", ["Danke für", "Ihr", "Abo"], []))
add("/project-received", "project-received", "utility", BRAND,
    ("Project Received | Talispros™",
     "Thank you for referring a project. A team member will follow up within two business days.",
     "TALISPROS™  ·  PROJECTS", ["Thank you:", "project", "received"], []),
    ("Projekt erhalten | Talispros™",
     "Danke für Ihre Projektempfehlung. Ein Teammitglied meldet sich innerhalb von zwei Werktagen.",
     "TALISPROS™  ·  PROJEKTE", ["Danke:", "Projekt", "erhalten"], []))
add("/match-results", "match-results", "utility", MAP,
    ("Your Match Results | Talispros™",
     "Your recommended Talishouse™ product and path, based on your goal, timeline and home type.",
     "TALISPROS™  ·  FIND YOUR MARKET", ["Your", "match", "results"], []),
    ("Ihre Ergebnisse | Talispros™",
     "Ihr empfohlenes Talishouse™ Produkt und Ihr Weg, basierend auf Ziel, Zeitplan und Haustyp.",
     "TALISPROS™  ·  MARKT FINDEN", ["Ihre", "passenden", "Ergebnisse"], []))

# ---------- login pages (noindex, dedicated cards) ----------
add("/admin/login", "admin-login", "login", BRAND,
    ("Admin Login | Talispros™",
     "Sign in to the Talispros™ admin console to manage Mapsites, Talisbooks™, agents and payments.",
     "TALISPROS™  ·  ADMIN", ["Admin", "sign", "in"], []),
    ("Admin-Anmeldung | Talispros™",
     "Melden Sie sich in der Talispros™ Admin-Konsole an, um Mapsites, Talisbooks™, Agenten und Zahlungen zu verwalten.",
     "TALISPROS™  ·  ADMIN", ["Admin-", "Anmeldung", ""], []))
add("/agent/login", "agent-login", "login", BRAND,
    ("Agent Login | Talispros™ Agent Portal",
     "Sign in to your Talispros™ agent account with the login ID and password from your administrator.",
     "TALISPROS™  ·  AGENT PORTAL", ["Sign in to your", "agent", "account"], []),
    ("Agenten-Anmeldung | Talispros™ Agent Portal",
     "Melden Sie sich mit der Login-ID und dem Passwort Ihres Administrators bei Ihrem Talispros™ Agentenkonto an.",
     "TALISPROS™  ·  AGENT PORTAL", ["Melden Sie sich", "bei Ihrem", "Agentenkonto an"], []))
add("/agent/change-password", "agent-change-password", "login", BRAND,
    ("Change Password | Talispros™ Agent Portal",
     "Choose a new password for your Talispros™ agent account.",
     "TALISPROS™  ·  AGENT PORTAL", ["Choose a", "new", "password"], []),
    ("Passwort ändern | Talispros™ Agent Portal",
     "Wählen Sie ein neues Passwort für Ihr Talispros™ Agentenkonto.",
     "TALISPROS™  ·  AGENT PORTAL", ["Neues", "Passwort", "wählen"], []))
add("/chat", "chat", "utility", BRAND,
    ("Chat | Talispros™ Agent Portal",
     "Private messages and team updates for Talispros™ agents and admins.",
     "TALISPROS™  ·  CHAT", ["Team", "chat", "& updates"], []),
    ("Chat | Talispros™ Agent Portal",
     "Private Nachrichten und Team-Updates für Talispros™ Agenten und Admins.",
     "TALISPROS™  ·  CHAT", ["Team-", "Chat", "& Updates"], []))
add("/chat/[conversationId]", "chat-conversation", "utility", BRAND,
    ("Conversation | Talispros™ Chat",
     "A private Talispros™ conversation. Only its participants can read it.",
     "TALISPROS™  ·  CHAT", ["Private", "conver-", "sation"], []),
    ("Unterhaltung | Talispros™ Chat",
     "Eine private Talispros™ Unterhaltung. Nur die Teilnehmer können sie lesen.",
     "TALISPROS™  ·  CHAT", ["Private", "Unter-", "haltung"], []))
add("/crm/login", "crm-login", "login", BRAND,
    ("CRM Login | Talispros™",
     "Sign in to the Talispros™ CRM with your access code or FAST Code.",
     "TALISPROS™  ·  CRM", ["CRM", "sign", "in"], []),
    ("CRM-Anmeldung | Talispros™",
     "Melden Sie sich mit Ihrem Zugangscode oder FAST Code beim Talispros™ CRM an.",
     "TALISPROS™  ·  CRM", ["CRM-", "Anmeldung", ""], []))
add("/admin/agent/leads", "agent-leads", "utility", BRAND,
    ("Brokerage Leads | Talispros™ Agent Portal",
     "Search, filter and export brokerage contacts agents prospect in Canada and the USA.",
     "TALISPROS™  ·  AGENT PORTAL", ["Brokerage", "leads for", "your market"], ["Canada", "USA", "CSV import"]),
    ("Makler-Leads | Talispros™ Agentenportal",
     "Maklerkontakte suchen, filtern und exportieren, die Agenten in Kanada und den USA ansprechen.",
     "TALISPROS™  ·  AGENTENPORTAL", ["Makler-Leads", "für Ihren", "Markt"], ["Kanada", "USA", "CSV-Import"]))
add("/admin/agent/leads/new", "agent-leads-new", "utility", BRAND,
    ("Add a Brokerage Lead | Talispros™",
     "Add a decision maker at an independent brokerage. The lead is saved to the agent who enters it.",
     "TALISPROS™  ·  AGENT PORTAL", ["Add a", "brokerage", "lead"], ["Canada", "USA"]),
    ("Makler-Lead hinzufügen | Talispros™",
     "Einen Entscheider eines unabhängigen Maklerbüros hinzufügen. Der Lead gehört dem Agenten, der ihn erfasst.",
     "TALISPROS™  ·  AGENTENPORTAL", ["Makler-Lead", "hinzu-", "fügen"], ["Kanada", "USA"]))
add("/admin/agent/leads/import", "agent-leads-import", "utility", BRAND,
    ("Import Brokerage Leads | Talispros™",
     "Upload a daily CSV, map the columns, and review duplicates before the leads are saved.",
     "TALISPROS™  ·  AGENT PORTAL", ["Import a", "daily", "CSV"], ["Preview", "Duplicates"]),
    ("Makler-Leads importieren | Talispros™",
     "Laden Sie die tägliche CSV hoch, ordnen Sie die Spalten zu und prüfen Sie Dubletten vor dem Speichern.",
     "TALISPROS™  ·  AGENTENPORTAL", ["Tägliche", "CSV", "importieren"], ["Vorschau", "Dubletten"]))
add("/admin/agent/leads/[id]", "agent-leads-edit", "utility", BRAND,
    ("Edit a Brokerage Lead | Talispros™",
     "Update a brokerage lead and read its edit history. Agents cannot delete a lead.",
     "TALISPROS™  ·  AGENT PORTAL", ["Edit a", "brokerage", "lead"], ["History", "No delete"]),
    ("Makler-Lead bearbeiten | Talispros™",
     "Einen Makler-Lead aktualisieren und den Verlauf lesen. Agenten können einen Lead nicht löschen.",
     "TALISPROS™  ·  AGENTENPORTAL", ["Makler-Lead", "bear-", "beiten"], ["Verlauf", "Kein Löschen"]))
add("/talispros/client/login", "client-login", "login", BRAND,
    ("Mapsite Owner Login | Talispros™",
     "Mapsite owners: sign in to your Talispros™ marketing dashboard and books.",
     "TALISPROS™  ·  MAPSITE OWNERS", ["Mapsite", "owner", "sign in"], []),
    ("Anmeldung für Mapsite-Inhaber | Talispros™",
     "Mapsite-Inhaber: Melden Sie sich bei Ihrem Talispros™ Marketing-Dashboard und Ihren Büchern an.",
     "TALISPROS™  ·  MAPSITE-INHABER", ["Anmeldung für", "Mapsite-", "Inhaber"], []))

# ---------- dynamic pages: generated per record (existing /api/og routes) ----------
for r, en_t, de_t in [
    ("/mapsite/[slug]", "Mapsite (name from record)", "Mapsite (Name aus Datensatz)"),
    ("/mapsite/[slug]/map", "Mapsite map (name from record)", "Mapsite-Karte"),
    ("/ma/[fastcode]", "Mapsite by FAST Code", "Mapsite nach FAST Code"),
    ("/talispros/mapsite/[accountType]/[fastCode]", "Mapsite by FAST Code", "Mapsite nach FAST Code"),
    ("/talispros/mapsites/[fastCode]", "Published Mapsite", "Veröffentlichte Mapsite"),
    ("/talispros/register-your-mapsite/[fastCode]", "Register for this Mapsite", "Für diese Mapsite registrieren"),
    ("/ttvaccess/[fastCode]", "TalisTV™ access", "TalisTV™ Zugang"),
    ("/talisbooks/fast/[fastCode]", "Mapsite bookshelf", "Mapsite-Bücherregal"),
    ("/talisbooks/viewer/[slug]", "Talisbook™ (title from record)", "Talisbook™"),
]:
    P.append(dict(route=r, slug=None, kind="dynamic", photo=None, en=(en_t,), de=(de_t,)))

add("/talispros/build-mapsite", "talispros-build-mapsite", "public", CLAIMED,
    ("Build My Mapsite | Talispros™",
     "Set up your Talispros™ Mapsite: place your pin, add your listing details and prepare your FAST Code and first Talisbook™.",
     "TALISPROS™  ·  BUILD MY MAPSITE", ["Build", "my", "Mapsite"], ["Pin", "FAST Code", "Talisbook™"]),
    ("Meine Mapsite erstellen | Talispros™",
     "Richten Sie Ihre Talispros™ Mapsite ein: Pin setzen, Angebotsdetails ergänzen, FAST Code und erstes Talisbook™ vorbereiten.",
     "TALISPROS™  ·  MAPSITE ERSTELLEN", ["Meine", "Mapsite", "erstellen"], ["Pin", "FAST Code", "Talisbook™"]))
