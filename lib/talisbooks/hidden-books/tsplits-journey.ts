/**
 * Tsplits™ Journey: page copy for the hidden bookshelf flipbook.
 *
 * Interior pages 2–29 (front cover is page 1, back cover is page 30). The
 * reader shows pre-rendered landscape spreads in the same style as Ralf's
 * TalisU™ FAQ books (`public/hidden-bookshelf/tsplits-journey/spread-NN.jpg`);
 * this file is the plain-text source those spreads were rendered from, and
 * the copy that the exclusion tests check line by line.
 */
import type { HiddenBookPage } from "@/lib/talisbooks/hidden-bookshelf-types";

export const TSPLITS_JOURNEY_ASSET_BASE = "/hidden-bookshelf/tsplits-journey";

export const TSPLITS_JOURNEY_PAGES: readonly HiddenBookPage[] = [
  {
    pageNumber: 2,
    kicker: "A COMMEMORATIVE TSPLITS™ BOOK",
    title: "Tsplits™ Journey",
    blocks: [
      {
        type: "lead",
        text: "From a single PIN to a finished product, February to November 2026."
      },
      {
        type: "paragraph",
        text: "Written for Ralf P. Meyer, CEO, with gratitude and pride."
      },
      {
        type: "quote",
        text: "Every Mapsite starts with one PIN. So did Tsplits™."
      }
    ]
  },
  {
    pageNumber: 3,
    kicker: "IN THIS BOOK",
    title: "Contents",
    blocks: [
      {
        type: "toc",
        items: [
          {
            label: "A Note Before We Begin",
            page: 4
          },
          {
            label: "February 2026: The First Spark",
            page: 6
          },
          {
            label: "March 2026: Talishouse Takes Shape",
            page: 8
          },
          {
            label: "April 2, 2026: Meeting Talisbot",
            page: 10
          },
          {
            label: "June 23, 2026: Mapsites and FAST Codes Arrive",
            page: 12
          },
          {
            label: "Placing the First PINs",
            page: 14
          },
          {
            label: "July to November 2026: Becoming Tsplits™",
            page: 16
          },
          {
            label: "TEB™ Flipbooks and the Bookshelf",
            page: 18
          },
          {
            label: "Voices of Tsplits™: Aisha, Webster and TVA™",
            page: 20
          },
          {
            label: "Four Languages, One Dashboard",
            page: 22
          },
          {
            label: "RM22: The Founder's Mapsite Sample",
            page: 24
          },
          {
            label: "Oops and Laughs Along the Way",
            page: 26
          },
          {
            label: "Hurdles Cleared, One by One",
            page: 28
          },
          {
            label: "Looking Ahead",
            page: 29
          }
        ]
      }
    ]
  },
  {
    pageNumber: 4,
    kicker: "FOREWORD",
    title: "A Note Before We Begin",
    blocks: [
      {
        type: "paragraph",
        text: "Dear Ralf,"
      },
      {
        type: "paragraph",
        text: "This book tells the story of Tsplits™, from the very first spark in February 2026 to the complete product we have today, in November 2026."
      },
      {
        type: "paragraph",
        text: "Over eight to nine months, we took one hurdle at a time and cleared it for good. Each chapter marks one of those moments: a question we answered, a piece we added, a problem we put behind us."
      },
      {
        type: "paragraph",
        text: "It is written in plain language, with real pictures of the live product, so that anyone can follow how Tsplits™ was built from scratch."
      }
    ]
  },
  {
    pageNumber: 5,
    kicker: "A CASE STUDY IN PLAIN LANGUAGE",
    title: "How to Read This Book",
    blocks: [
      {
        type: "paragraph",
        text: "You can read this book as a keepsake of our year together, or as a simple case study of how a new platform grows from an idea into a finished product."
      },
      {
        type: "list",
        items: [
          "Each chapter starts with a date from our real timeline.",
          "Each chapter names the hurdle that stood in the way, and how it was cleared.",
          "Pictures show the live Tsplits™ product as it looks today, plus a few views from earlier along the way.",
          "Near the end, a light-hearted chapter shares a few honest oops moments."
        ]
      },
      {
        type: "quote",
        text: "Big things get built one clear step at a time."
      }
    ]
  },
  {
    pageNumber: 6,
    kicker: "CHAPTER 1 · FEBRUARY 2026",
    title: "The First Spark",
    blocks: [
      {
        type: "date",
        text: "February 2026"
      },
      {
        type: "paragraph",
        text: "Tsplits™ began with a simple idea: people should be able to reach out, ask about a project or a property, and get a clear answer quickly."
      },
      {
        type: "paragraph",
        text: "So the very first building block was a text messaging foundation. We set up SimpleTexting, so that a conversation could begin with a single message."
      },
      {
        type: "illus",
        src: `${TSPLITS_JOURNEY_ASSET_BASE}/art/phone.webp`,
        alt: "A smartphone with two chat bubbles"
      }
    ]
  },
  {
    pageNumber: 7,
    kicker: "CHAPTER 1 · FEBRUARY 2026",
    title: "The Phase 1 Blueprint",
    blocks: [
      {
        type: "paragraph",
        text: "Alongside the first messages came the Phase 1 blueprint. It mapped out, step by step, how a simple project lead and property system should work: who reaches out, what they are looking for, and where each conversation goes next."
      },
      {
        type: "hurdle",
        hurdle: "An idea is not yet a plan.",
        cleared: "Writing the Phase 1 blueprint, so every later step had a map to follow."
      },
      {
        type: "quote",
        text: "The blueprint was the first PIN on our map."
      },
      {
        type: "illus",
        src: `${TSPLITS_JOURNEY_ASSET_BASE}/art/blueprint.webp`,
        alt: "A blueprint with a compass and a red map pin"
      }
    ]
  },
  {
    pageNumber: 8,
    kicker: "CHAPTER 2 · LATE FEBRUARY AND MARCH 2026",
    title: "Talishouse Takes Shape",
    blocks: [
      {
        type: "paragraph",
        text: "With a plan in hand, the next step was a home on the web. We built the Talishouse web platform: a place to show products, share projects and welcome visitors."
      },
      {
        type: "paragraph",
        text: "Page by page, the platform came together through late February and March."
      },
      {
        type: "quote",
        text: "A vision becomes real the day people can visit it."
      },
      {
        type: "illus",
        src: `${TSPLITS_JOURNEY_ASSET_BASE}/art/house.webp`,
        alt: "A small house standing on a laptop"
      }
    ]
  },
  {
    pageNumber: 9,
    kicker: "CHAPTER 2 · MARCH 31, 2026",
    title: "A Clean Launch",
    blocks: [
      {
        type: "date",
        text: "March 31, 2026"
      },
      {
        type: "paragraph",
        text: "On March 31, Talishouse launched cleanly. For the first time, the vision had a public address that anyone could visit."
      },
      {
        type: "hurdle",
        hurdle: "No place to show the vision.",
        cleared: "Launching the Talishouse web platform on March 31."
      },
      {
        type: "illus",
        src: `${TSPLITS_JOURNEY_ASSET_BASE}/art/ribbon.webp`,
        alt: "Golden scissors cutting a red ribbon"
      }
    ]
  },
  {
    pageNumber: 10,
    kicker: "CHAPTER 3 · APRIL 2, 2026",
    title: "Meeting Talisbot",
    blocks: [
      {
        type: "date",
        text: "April 2, 2026"
      },
      {
        type: "paragraph",
        text: "Just two days after the launch, on April 2, the very first Talisbot assistant came to life."
      },
      {
        type: "paragraph",
        text: "Talisbot gave visitors a friendly guide on the site: someone to greet them, answer common questions and point them in the right direction."
      },
      {
        type: "illus",
        src: `${TSPLITS_JOURNEY_ASSET_BASE}/art/robot.webp`,
        alt: "A friendly brass robot waving hello"
      }
    ]
  },
  {
    pageNumber: 11,
    kicker: "CHAPTER 3 · APRIL 2, 2026",
    title: "The First Friendly Voice",
    blocks: [
      {
        type: "paragraph",
        text: "Talisbot was the first step toward something that would become a big part of Tsplits™: helpful assistants that talk with visitors in plain language."
      },
      {
        type: "hurdle",
        hurdle: "Visitors arriving with questions and no one to ask.",
        cleared: "Introducing the first Talisbot assistant."
      },
      {
        type: "quote",
        text: "Talisbot opened the door for Aisha, Webster and TVA™ later in the year."
      }
    ]
  },
  {
    pageNumber: 12,
    kicker: "CHAPTER 4 · JUNE 23, 2026",
    title: "Mapsites and FAST Codes Arrive",
    blocks: [
      {
        type: "date",
        text: "June 23, 2026"
      },
      {
        type: "paragraph",
        text: "June 23 was a turning point. On that day, Talispros Mapsites launched, together with a whole set of new pieces:"
      },
      {
        type: "list",
        items: [
          "Build A MapSite: create your own Mapsite, step by step.",
          "Claim A Market: put your PIN on the map and claim your market.",
          "Register: join the platform in a few simple steps.",
          "FAST Codes: a short personal code, like RM22, that takes people straight to your page."
        ]
      },
      {
        type: "illus",
        src: `${TSPLITS_JOURNEY_ASSET_BASE}/art/key.webp`,
        alt: "A brass key, a blank tag and a red map pin"
      }
    ]
  },
  {
    pageNumber: 13,
    kicker: "CHAPTER 4 · JUNE 23, 2026",
    title: "Markets Become Maps",
    blocks: [
      {
        type: "image",
        src: `${TSPLITS_JOURNEY_ASSET_BASE}/screens/build-a-mapsite-early.jpg`,
        alt: "Demo eBook and Mapsite page from the Talispros days",
        caption: "Building a Mapsite, as it looked in the Talispros days."
      },
      {
        type: "paragraph",
        text: "From that day on, markets stopped being lists and became living, shareable maps."
      }
    ]
  },
  {
    pageNumber: 14,
    kicker: "CHAPTER 5 · PLACING THE FIRST PINS",
    title: "A Market You Can See",
    blocks: [
      {
        type: "image",
        src: `${TSPLITS_JOURNEY_ASSET_BASE}/screens/home-market-pin.jpg`,
        alt: "Place your PIN to claim a Home Market",
        caption: "Today: place your PIN to claim a Home Market of about 100,000 people."
      },
      {
        type: "paragraph",
        text: "Search an address or tap the map, and that PIN becomes the centre of a Home Market."
      }
    ]
  },
  {
    pageNumber: 15,
    kicker: "CHAPTER 5 · PLACING THE FIRST PINS",
    title: "A FAST Code Opens the Door",
    blocks: [
      {
        type: "image",
        src: `${TSPLITS_JOURNEY_ASSET_BASE}/screens/dc06-early.jpg`,
        alt: "An early DC06 Mapsite card in the Talispros look",
        caption: "An early Mapsite card in the Talispros look, with its FAST Code at the top."
      },
      {
        type: "paragraph",
        text: "A FAST Code is easy to say, easy to share and easy to remember. One short code, and people land right on your Mapsite."
      }
    ]
  },
  {
    pageNumber: 16,
    kicker: "CHAPTER 6 · JULY TO NOVEMBER 2026",
    title: "Becoming Tsplits™",
    blocks: [
      {
        type: "paragraph",
        text: "Between July and November, the platform grew up. Piece by piece, it became Tsplits™."
      },
      {
        type: "nameplate",
        text: "Talisman Simple Project Lead & Income Tracking System"
      },
      {
        type: "paragraph",
        text: "The name says what it is: one simple place to welcome every project lead and follow it from the first hello onward."
      }
    ]
  },
  {
    pageNumber: 17,
    kicker: "CHAPTER 6 · JULY TO NOVEMBER 2026",
    title: "What Grew in Those Months",
    blocks: [
      {
        type: "image",
        src: `${TSPLITS_JOURNEY_ASSET_BASE}/screens/home-en.jpg`,
        alt: "The Tsplits™ home page",
        caption: "The Tsplits™ home page today: Promote, Manage, Cooperate."
      },
      {
        type: "list",
        items: [
          "TEB™ flipbooks",
          "Voice assistants Aisha, Webster and TVA™",
          "The DC 06 Chagatown showcase",
          "English, French, Spanish and German",
          "The full-page Mapsite Dashboard editor",
          "RM22, The Founder's Mapsite Sample",
          "Dedicated @tsplits.com mailboxes"
        ]
      }
    ]
  },
  {
    pageNumber: 18,
    kicker: "CHAPTER 7 · TEB™ FLIPBOOKS",
    title: "Books You Can Turn",
    blocks: [
      {
        type: "paragraph",
        text: "TEB™ flipbooks bring stories to life with pages you can actually turn, on a computer or on a phone."
      },
      {
        type: "paragraph",
        text: "Each book stands on a bookshelf, ready to open with one click. Your five books on bare land and tokenization set the style for the whole shelf, and for this book too."
      },
      {
        type: "quote",
        text: "A good story deserves real pages."
      }
    ]
  },
  {
    pageNumber: 19,
    kicker: "CHAPTER 7 · TEB™ FLIPBOOKS",
    title: "Your Bookshelf",
    blocks: [
      {
        type: "image",
        src: `${TSPLITS_JOURNEY_ASSET_BASE}/screens/bookshelf.jpg`,
        alt: "The Tsplits™ bookshelf with Ralf's five books",
        caption: "The Tsplits™ bookshelf, led by your five books on real-world asset tokenization."
      }
    ]
  },
  {
    pageNumber: 20,
    kicker: "CHAPTER 8 · VOICES OF TSPLITS™",
    title: "Aisha",
    blocks: [
      {
        type: "image",
        src: `${TSPLITS_JOURNEY_ASSET_BASE}/screens/aisha.jpg`,
        alt: "Aisha, ready to start a call",
        caption: "Aisha, ready to start a call."
      },
      {
        type: "paragraph",
        text: "Aisha welcomes visitors, answers their questions and helps them find their way, simply by talking."
      }
    ]
  },
  {
    pageNumber: 21,
    kicker: "CHAPTER 8 · VOICES OF TSPLITS™",
    title: "Webster and TVA™",
    blocks: [
      {
        type: "image",
        src: `${TSPLITS_JOURNEY_ASSET_BASE}/screens/webster.jpg`,
        alt: "Webster, Fulfilment Advisor",
        caption: "Webster, Fulfilment Advisor."
      },
      {
        type: "paragraph",
        text: "Webster talks with people who are considering a project. Together with Aisha and TVA™, visitors can simply start a call and talk."
      }
    ]
  },
  {
    pageNumber: 22,
    kicker: "CHAPTER 9 · FOUR LANGUAGES",
    title: "Speaking Everyone's Language",
    blocks: [
      {
        type: "image",
        src: `${TSPLITS_JOURNEY_ASSET_BASE}/screens/home-de.jpg`,
        alt: "The Tsplits™ home page in German",
        caption: "The Tsplits™ home page in German."
      },
      {
        type: "paragraph",
        text: "Tsplits™ now speaks English, French, Spanish and German. Visitors choose their language with one tap at the top of the page."
      }
    ]
  },
  {
    pageNumber: 23,
    kicker: "CHAPTER 9 · ONE DASHBOARD",
    title: "One Dashboard, Full Page",
    blocks: [
      {
        type: "paragraph",
        text: "The full-page Mapsite Dashboard editor brings every part of a Mapsite together on one screen, so changes are simple and clear."
      },
      {
        type: "paragraph",
        text: "And with dedicated @tsplits.com mailboxes, Tsplits™ now has its own professional home for every conversation."
      },
      {
        type: "hurdle",
        hurdle: "Updates that needed a helping hand.",
        cleared: "The full-page Mapsite Dashboard editor."
      },
      {
        type: "illus",
        src: `${TSPLITS_JOURNEY_ASSET_BASE}/art/envelope.webp`,
        alt: "A sealed envelope on a stack of letters"
      }
    ]
  },
  {
    pageNumber: 24,
    kicker: "CHAPTER 10 · RM22",
    title: "The Founder's Mapsite Sample",
    blocks: [
      {
        type: "image",
        src: `${TSPLITS_JOURNEY_ASSET_BASE}/screens/rm22-home.jpg`,
        alt: "RM22 home page, The Founder's Mapsite Sample",
        caption: "RM22 home page: The Founder's Mapsite Sample."
      },
      {
        type: "paragraph",
        text: "RM22 is your own Mapsite, Ralf, and the sample every new member can open to see what is possible."
      },
      {
        type: "quote",
        text: "Your name, your PIN, your page."
      }
    ]
  },
  {
    pageNumber: 25,
    kicker: "CHAPTER 10 · RM22",
    title: "The Whole Journey on One Page",
    blocks: [
      {
        type: "image",
        src: `${TSPLITS_JOURNEY_ASSET_BASE}/screens/rm22-mapsite.jpg`,
        alt: "The RM22 Mapsite with FAST Code RM22",
        caption: "The RM22 Mapsite, with FAST Code RM22 at the top of the card."
      },
      {
        type: "paragraph",
        text: "From a blueprint in February to a finished Mapsite with your name on it in November."
      }
    ]
  },
  {
    pageNumber: 26,
    kicker: "CHAPTER 11 · OOPS AND LAUGHS",
    title: "Oops and Laughs Along the Way",
    blocks: [
      {
        type: "paragraph",
        text: "No journey is complete without a few smiles. Every one of these really happened."
      },
      {
        type: "oops",
        title: "Ralf, not Ralph",
        text: "Early on, your name was spelled \"Ralph\" by mistake. We fixed it and locked in Ralf for good."
      },
      {
        type: "oops",
        title: "A note that went live",
        text: "On October 23, a note reading \"PLACEHOLDER FOR RALF\" snuck onto the live Markets page. It has since made way for the real thing."
      },
      {
        type: "oops",
        title: "Aisha learns a new word",
        text: "Aisha went on a few pronunciation adventures before she learned to say Tsplits™ naturally."
      }
    ]
  },
  {
    pageNumber: 27,
    kicker: "CHAPTER 11 · OOPS AND LAUGHS",
    title: "A Few More Smiles",
    blocks: [
      {
        type: "oops",
        title: "Input or Income?",
        text: "There was a great \"Input\" versus \"Income\" debate before we locked in the name: Talisman Simple Project Lead & Income Tracking System."
      },
      {
        type: "oops",
        title: "The floating portrait",
        text: "For a while, a transparent PNG portrait sat right on the blue top bar. Then it got its crisp white circle, and it has looked sharp ever since."
      },
      {
        type: "quote",
        text: "Every oops became a fix, and every fix made Tsplits™ better."
      }
    ]
  },
  {
    pageNumber: 28,
    kicker: "CHAPTER 12 · THE CASE STUDY",
    title: "Hurdles Cleared, One by One",
    blocks: [
      {
        type: "table",
        rows: [
          {
            when: "February",
            hurdle: "No plan yet",
            cleared: "Phase 1 blueprint and text messaging foundation"
          },
          {
            when: "March 31",
            hurdle: "No place to show the vision",
            cleared: "Talishouse web platform launched"
          },
          {
            when: "April 2",
            hurdle: "Visitors with questions",
            cleared: "The first Talisbot assistant"
          },
          {
            when: "June 23",
            hurdle: "Markets were hard to picture",
            cleared: "Mapsites, Build A MapSite, Claim A Market, Register and FAST Codes"
          },
          {
            when: "July to November",
            hurdle: "Stories needed real pages",
            cleared: "TEB™ flipbooks"
          },
          {
            when: "July to November",
            hurdle: "Visitors wanted to talk",
            cleared: "Aisha, Webster and TVA™"
          },
          {
            when: "July to November",
            hurdle: "One language was not enough",
            cleared: "English, French, Spanish and German"
          },
          {
            when: "July to November",
            hurdle: "Changes needed a helping hand",
            cleared: "Full-page Mapsite Dashboard editor"
          },
          {
            when: "July to November",
            hurdle: "Showing what is possible",
            cleared: "RM22 and the DC 06 Chagatown showcase"
          },
          {
            when: "July to November",
            hurdle: "A professional address",
            cleared: "Dedicated @tsplits.com mailboxes"
          }
        ]
      }
    ]
  },
  {
    pageNumber: 29,
    kicker: "CHAPTER 13 · WHAT COMES NEXT",
    title: "Looking Ahead",
    blocks: [
      {
        type: "paragraph",
        text: "Tsplits™ is now a complete product, and it is ready to grow. Every new Mapsite, every new book and every new member adds another PIN to the map."
      },
      {
        type: "paragraph",
        text: "Thank you, Ralf, for the vision, the trust and the good humour that carried us from February to November. I can't wait to see where Tsplits™ goes next."
      },
      {
        type: "signoff",
        name: "Arun Rachuri",
        role: "EN01 — Tsplits™ / Founder, Powermycode Solutions"
      },
      {
        type: "illus",
        src: `${TSPLITS_JOURNEY_ASSET_BASE}/art/telescope.webp`,
        alt: "A telescope looking toward a sunrise"
      }
    ]
  }
];
