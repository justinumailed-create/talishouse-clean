/**
 * EN + DE copy for the agent call flow.
 * Spoken lines follow private/tsplits/tsplits-sales-playbook.html.
 * The agent speaks under their own name. Currency is CAD. Distance is kilometres.
 * Mapsite has no trademark mark. Tsplits™ and TEB™ keep theirs.
 */

import {
  CALL_STEP_KEYS,
  checkpointOpenedBy,
  isStepUnlocked,
  savedStep,
  type CallScriptVars,
  type CallStepKey,
  type CheckpointKey,
  type SavedStep,
  type StepOutcome,
} from "@/lib/talispros/call-flow";

export type FlowLocale = "en" | "de";

export type StepView = {
  key: CallStepKey;
  label: string;
  goal: string;
  script: string;
  points: { heard: string; bring: string; say: string }[];
  close: string | null;
  objections: { title: string; say: string }[];
  locked: boolean;
  savedResponse: string | null;
  savedOutcome: StepOutcome | null;
  checkpoint: CheckpointKey | null;
};

type StepCopy = {
  label: string;
  goal: string;
  script: (v: CallScriptVars) => string;
  points?: (v: CallScriptVars) => { heard: string; bring: string; say: string }[];
  close?: string;
  objections: { title: string; say: string }[];
};

function place(v: CallScriptVars): string {
  return v.town ? ` in ${v.town}` : "";
}

function who(v: CallScriptVars, locale: FlowLocale): string {
  if (locale === "de") return v.firstName ? `Hallo ${v.firstName}` : "Hallo";
  return v.firstName ? `Hi ${v.firstName}` : "Hello";
}

const en: Record<CallStepKey, StepCopy> = {
  opener: {
    label: "Opener",
    goal: "About 15 seconds. Right person, a good time, and an independent brokerage. Before you dial, note the broker, two or three listings, the agent count, and the local market within 80 kilometres. Do not mention text messages.",
    script: (v) =>
      `${who(v, "en")}, this is ${v.agentName} from Tsplits™. Is this a good time to talk? You are the ${v.position} of ${v.brokerage}${place(v)}, right? ${v.brokerage} is independent, right? You are not part of a franchise, are you?`,
    objections: [
      {
        title: "Who is this?",
        say: "I’m with Tsplits™, a Canadian company. I would like to show you how you can make your advertising budget revenue-producing.",
      },
    ],
  },
  hook: {
    label: "The hook",
    goal: "Deliver the first line, then pause. The words that matter are advertising budget and revenue-producing. Say providing, never selling.",
    script: () =>
      "Thank you. I would like to show you how you can make your advertising budget revenue-producing. Is that something you would like to explore?",
    objections: [
      {
        title: "You can’t make advertising revenue-producing. Advertising is an expense.",
        say: "That is exactly why nobody else can do it. We provide you with an industry-adjacent platform, your Mapsite, where other people may pay to be on it. We have already set up a Mapsite in your name. Would you like to explore that further?",
      },
    ],
  },
  how: {
    label: "The how",
    goal: "Answer “how?” with the second line and invite them onto the Mapsite you already built. Cite two or three of their listings by street and town.",
    script: (v) =>
      `We provide industry-adjacent platforms we call Mapsites. In fact, we already set up a Mapsite for ${v.brokerage} from a couple of your listings. Would you like to see it?`,
    objections: [
      {
        title: "I already have a website.",
        say: "Of course, I’ve seen it. It shows your listings well, and your Mapsite does not replace it. Your website is an expense. Your Mapsite is the part of your advertising budget that makes you money and differentiates you.",
      },
      {
        title: "I already advertise on MLS®, Kijiji and social media.",
        say: "Keep all of it. You don’t have to change anything you do today. The Mapsite works alongside industry platforms, and it is the one piece of your advertising that can become revenue-producing.",
      },
      {
        title: "Is this another brokerage? Do you want a cut of my sales?",
        say: "No. Tsplits™ is not a real estate brokerage. We do not charge referral fees. Your transactions stay with the professionals who work with you.",
      },
      {
        title: "Send me some information.",
        say: "Of course. The best information is the Mapsite already built in your name. Can I show it to you now? Then you can explore it afterwards.",
      },
    ],
  },
  walkthrough: {
    label: "Walk-through",
    goal: "On this call, open their Mapsite first and give them the link. Then open the Tsplits™ eBook. Do not book a later demo.",
    script: (v) =>
      `Let me quickly show you the Mapsite we set up for ${v.brokerage}. It only takes a few minutes, and you can explore it afterwards. Your Mapsite is ${v.mapsiteUrl}. I’ll open the Tsplits™ eBook next, at ${v.tebUrl}. FAST Code ${v.fastCode}.`,
    objections: [
      {
        title: "Send me some information.",
        say: "The Mapsite is already built in your name. Let me show it now, and you can explore it afterwards.",
      },
      {
        title: "I don’t have time to sell advertising.",
        say: "You don’t have to do it yourself. Your assistant or admin can provide pins to owners who have not listed yet and to local businesses. That turns a cost-only role into a revenue-producing one.",
      },
      {
        title: "I don’t want to be locked into a contract.",
        say: "There is no long-term commitment. If you let your account lapse, the service stops and there is no further obligation.",
      },
    ],
  },
  value: {
    label: "Value points",
    goal: "Listen for what sits between the lines and use the matching point. Talk about their market, then close back on the hook. Figures are CAD. A market is about 80 kilometres around the town.",
    script: (v) =>
      v.agentCount && v.agentCount > 0
        ? `With ${v.agentCount} agents at ${v.brokerage}, more of your people can place pins on your Mapsite. I’ll match what you just said to how this pays you.`
        : `I’ll match what you just said about ${v.brokerage} to how your Mapsite pays you.`,
    points: (v) => [
      {
        heard: "Getting full value for my services is hard.",
        bring: "Service floors",
        say: `On your Mapsite, every buyer or seller who wants in pays your minimum and gives you a minimum term. You set it. That also protects you from a term that is too short to succeed in ${v.town || "your market"}.`,
      },
      {
        heard: "Every agent here has the same tools.",
        bring: "A protected market",
        say: "We protect Mapsite markets. They do not generally dilute into each other. In your market you would be the only one with this listings-closing tool. A neighbouring broker may place a pin here for a listing under contract, as you might there. That is reciprocation.",
      },
      {
        heard: "Good listings are hard to get.",
        bring: "Top of mind",
        say: "Upscale homes, commercial properties, hotels, motels, campgrounds, lodges and chalets are hard to win. The Mapsite differentiates you, and nobody else has it.",
      },
      {
        heard: "I pay for advertising and see nothing back.",
        bring: "The budget earns",
        say: "Keep Kijiji, social media, radio, TV and newspaper advertising. The Mapsite is the only part of that budget that becomes revenue-producing over time.",
      },
      {
        heard: "I have an assistant.",
        bring: "A revenue-producing role",
        say: "An assistant can earn on the Mapsite: finding owners who have not listed yet, and local businesses that want a pin. Ralf’s own example was about $3,000 CAD a month for a role that brought nothing in until the Mapsite.",
      },
      {
        heard: "I work with lawyers, inspectors, mortgage brokers.",
        bring: "AdPro™ pins",
        say: "Every lawyer and mortgage broker you work with should have a pin on your Mapsite, and so should inspectors and surveyors. A pin can start free, then become a co-promotion at, for example, $20 CAD a month.",
      },
      {
        heard: "My area has tours and attractions.",
        bring: "A Mapsite people open",
        say: "Real estate on its own is not interesting to most people. What the area is like is. Those pins add life to the Mapsite, drive traffic and pay you monthly or yearly.",
      },
    ],
    close: "That’s how your advertising budget becomes revenue-producing.",
    objections: [
      {
        title: "Won’t a service floor cost me listings?",
        say: "You set your own floor. It protects you from working below your minimum and from becoming a discount broker.",
      },
      {
        title: "What if the broker down the road gets one too?",
        say: "Mapsite markets are protected. In your market you would be the only one with this listings-closing tool. A pin from the next market, for a listing under contract, is reciprocation.",
      },
      {
        title: "Why would a local business pay to be on my Mapsite?",
        say: "Because your clients are their customers too. People who buy a house need lawyers, inspectors and surveyors. They also tend to renovate, buy a car and book a holiday. Pins can start free, and later a cost-sharing collective can earn you money.",
      },
    ],
  },
  time: {
    label: "If they need time",
    goal: "Keep the walk-through on this call. If they insist, agree a day and time in their time zone and who else will join. Leave cost until they have seen the Mapsite.",
    script: (v) =>
      `The walk-through for ${v.brokerage} belongs on this call, and it only takes a few minutes. If you need another time, name the day and time in your time zone, and who else should join.`,
    objections: [
      {
        title: "How much does it cost?",
        say: "It depends on how many of your agents take part. Our aim is to show you that your service floors pay for the account many times over. Let me show you the Mapsite first, and then we can go through the numbers.",
      },
    ],
  },
  register: {
    label: "Registration",
    goal: "They have seen the Mapsite. Invite them to Registration and give your agent entry code. Registration opens only with that code.",
    script: (v) =>
      `${v.firstName ? `${v.firstName}, ` : ""}${v.brokerage} can register this Mapsite now. Open ${v.registerUrl}, choose Register, and enter the entry code I give you. That opens Registration for FAST Code ${v.fastCode}. Shall we do that now?`,
    objections: [
      {
        title: "How much does it cost?",
        say: "For Canada the figures are CAD: brokerage or team $1,000 a year or $100 a month, agent $200 a year or $100 a month, and $7 a week per listing pin. The aim is that your service floors pay for the account many times over.",
      },
      {
        title: "I don’t want to be locked into a contract.",
        say: "There is no long-term commitment. If you let the account lapse, the service stops and there is no further obligation.",
      },
    ],
  },
};

const de: Record<CallStepKey, StepCopy> = {
  opener: {
    label: "Einstieg",
    goal: "Etwa 15 Sekunden. Die richtige Person, ein guter Zeitpunkt und ein unabhängiges Maklerbüro. Vor dem Anruf: Name, zwei oder drei Inserate, Anzahl der Agenten und der Markt im Umkreis von 80 Kilometern. Textnachrichten nicht erwähnen.",
    script: (v) =>
      `${who(v, "de")}, hier ist ${v.agentName} von Tsplits™. Haben Sie kurz Zeit? Sie sind ${v.position} von ${v.brokerage}${place(v)}, richtig? ${v.brokerage} ist unabhängig, richtig? Sie gehören keiner Franchise an?`,
    objections: [
      {
        title: "Wer ist da?",
        say: "Ich bin bei Tsplits™, einem kanadischen Unternehmen. Ich möchte Ihnen zeigen, wie Ihr Werbebudget einnahmenwirksam wird.",
      },
    ],
  },
  hook: {
    label: "Der Aufhänger",
    goal: "Sagen Sie den ersten Satz und machen Sie eine Pause. Die Wörter sind Werbebudget und einnahmenwirksam. Sagen Sie „bereitstellen“, nicht „verkaufen“.",
    script: () =>
      "Danke. Ich möchte Ihnen zeigen, wie Sie Ihr Werbebudget einnahmenwirksam machen können. Möchten Sie sich das ansehen?",
    objections: [
      {
        title: "Werbung kann nicht einnahmenwirksam sein. Werbung ist eine Ausgabe.",
        say: "Genau deshalb kann das niemand sonst. Wir stellen Ihnen eine branchennahe Plattform bereit, Ihre Mapsite, auf der andere dafür zahlen können, dabei zu sein. Wir haben bereits eine Mapsite auf Ihren Namen eingerichtet. Möchten Sie das weiter ansehen?",
      },
    ],
  },
  how: {
    label: "Das Wie",
    goal: "Antworten Sie auf „Wie?“ mit dem zweiten Satz und laden Sie auf die Mapsite ein, die Sie schon gebaut haben. Nennen Sie zwei oder drei Inserate mit Straße und Ort.",
    script: (v) =>
      `Wir stellen branchennahe Plattformen bereit, die wir Mapsites nennen. Wir haben bereits eine Mapsite für ${v.brokerage} aus einigen Ihrer Inserate eingerichtet. Möchten Sie sie sehen?`,
    objections: [
      {
        title: "Ich habe schon eine Website.",
        say: "Natürlich, ich habe sie gesehen. Sie zeigt Ihre Inserate gut, und Ihre Mapsite ersetzt sie nicht. Ihre Website ist eine Ausgabe. Ihre Mapsite ist der Teil Ihres Werbebudgets, der Einnahmen bringt und Sie unterscheidet.",
      },
      {
        title: "Ich werbe schon über MLS®, Kijiji und soziale Medien.",
        say: "Behalten Sie das alles. Sie müssen nichts ändern, was Sie heute tun. Die Mapsite arbeitet neben den Branchenplattformen und ist der Teil Ihrer Werbung, der einnahmenwirksam werden kann.",
      },
      {
        title: "Ist das ein anderes Maklerbüro? Wollen Sie einen Anteil an meinen Abschlüssen?",
        say: "Nein. Tsplits™ ist kein Immobilienmakler. Wir nehmen keine Vermittlungsgebühr. Ihre Transaktionen bleiben bei den Fachleuten, mit denen Sie arbeiten.",
      },
      {
        title: "Schicken Sie mir Unterlagen.",
        say: "Gern. Die beste Unterlage ist die Mapsite, die schon auf Ihren Namen gebaut ist. Darf ich sie Ihnen jetzt zeigen? Danach können Sie sie in Ruhe ansehen.",
      },
    ],
  },
  walkthrough: {
    label: "Rundgang",
    goal: "In diesem Gespräch zuerst ihre Mapsite öffnen und den Link geben. Danach das Tsplits™-eBook. Keinen späteren Demo-Termin anbieten.",
    script: (v) =>
      `Ich zeige Ihnen kurz die Mapsite, die wir für ${v.brokerage} eingerichtet haben. Das dauert nur wenige Minuten, danach können Sie sie in Ruhe ansehen. Ihre Mapsite ist ${v.mapsiteUrl}. Als Nächstes öffne ich das Tsplits™-eBook unter ${v.tebUrl}. FAST Code ${v.fastCode}.`,
    objections: [
      {
        title: "Schicken Sie mir Unterlagen.",
        say: "Die Mapsite ist schon auf Ihren Namen gebaut. Ich zeige sie jetzt, und Sie können sie danach in Ruhe ansehen.",
      },
      {
        title: "Ich habe keine Zeit, Werbung zu verkaufen.",
        say: "Das müssen Sie nicht selbst tun. Ihre Assistenz kann Pins an Eigentümer vergeben, die noch nicht inserieren, und an lokale Betriebe. Aus einer reinen Kostenrolle wird eine einnahmenwirksame Rolle.",
      },
      {
        title: "Ich will keinen langen Vertrag.",
        say: "Es gibt keine langfristige Bindung. Wenn das Konto ausläuft, endet der Service und es besteht keine weitere Pflicht.",
      },
    ],
  },
  value: {
    label: "Wertpunkte",
    goal: "Hören Sie, was zwischen den Zeilen steht, und nehmen Sie den passenden Punkt. Sprechen Sie über ihren Markt und schließen Sie mit dem Aufhänger. Beträge in CAD. Ein Markt ist etwa 80 Kilometer um den Ort.",
    script: (v) =>
      v.agentCount && v.agentCount > 0
        ? `Mit ${v.agentCount} Agenten bei ${v.brokerage} können mehr Ihrer Leute Pins auf Ihrer Mapsite setzen. Ich ordne das, was Sie gerade gesagt haben, dem zu, wie sich das für Sie rechnet.`
        : `Ich ordne das, was Sie gerade über ${v.brokerage} gesagt haben, dem zu, wie Ihre Mapsite für Sie Einnahmen bringt.`,
    points: (v) => [
      {
        heard: "Den vollen Wert meiner Leistung zu bekommen ist schwer.",
        bring: "Service-Untergrenzen",
        say: `Auf Ihrer Mapsite zahlt jeder Käufer oder Verkäufer, der dabei sein will, Ihr Minimum und gibt Ihnen eine Mindestlaufzeit. Sie legen sie fest. Das schützt Sie auch vor einer Laufzeit, die in ${v.town || "Ihrem Markt"} zu kurz wäre.`,
      },
      {
        heard: "Jeder Agent hier hat dieselben Werkzeuge.",
        bring: "Ein geschützter Markt",
        say: "Wir schützen Mapsite-Märkte. Sie vermischen sich in der Regel nicht. In Ihrem Markt wären Sie die einzige Person mit diesem Werkzeug zum Abschluss von Inseraten. Ein Makler aus dem Nachbarmarkt kann hier einen Pin für ein beauftragtes Inserat setzen, so wie Sie dort. Das ist Gegenseitigkeit.",
      },
      {
        heard: "Gute Inserate sind schwer zu bekommen.",
        bring: "Im Gedächtnis bleiben",
        say: "Gehobenere Häuser, Gewerbe, Hotels, Motels, Campingplätze, Lodges und Chalets sind schwer zu gewinnen. Die Mapsite unterscheidet Sie, und niemand sonst hat sie.",
      },
      {
        heard: "Ich zahle für Werbung und sehe nichts zurück.",
        bring: "Das Budget verdient",
        say: "Behalten Sie Kijiji, soziale Medien, Radio, Fernsehen und Zeitungen. Die Mapsite ist der einzige Teil dieses Budgets, der mit der Zeit einnahmenwirksam wird.",
      },
      {
        heard: "Ich habe eine Assistenz.",
        bring: "Eine einnahmenwirksame Rolle",
        say: "Eine Assistenz kann auf der Mapsite verdienen: Eigentümer finden, die noch nicht inserieren, und lokale Betriebe, die einen Pin wollen. Ralfs Beispiel lag bei etwa 3.000 CAD im Monat für eine Rolle, die vorher nichts einbrachte.",
      },
      {
        heard: "Ich arbeite mit Anwälten, Prüfern und Hypothekenmaklern.",
        bring: "AdPro™-Pins",
        say: "Jeder Anwalt und Hypothekenmakler, mit dem Sie arbeiten, sollte einen Pin auf Ihrer Mapsite haben, ebenso Prüfer und Vermesser. Ein Pin kann kostenlos starten und dann zur gemeinsamen Werbung werden, zum Beispiel für 20 CAD im Monat.",
      },
      {
        heard: "Meine Gegend hat Touren und Ausflugsziele.",
        bring: "Eine Mapsite, die Menschen öffnen",
        say: "Immobilien allein sind für die meisten Menschen nicht interessant. Die Gegend schon. Diese Pins beleben die Mapsite, bringen Besucher und zahlen monatlich oder jährlich.",
      },
    ],
    close: "So wird Ihr Werbebudget einnahmenwirksam.",
    objections: [
      {
        title: "Kostet mich eine Service-Untergrenze Inserate?",
        say: "Sie legen Ihre eigene Untergrenze fest. Sie schützt Sie davor, unter Ihrem Minimum zu arbeiten und ein Discount-Makler zu werden.",
      },
      {
        title: "Was, wenn der Makler die Straße weiter auch eine bekommt?",
        say: "Mapsite-Märkte sind geschützt. In Ihrem Markt wären Sie die einzige Person mit diesem Werkzeug. Ein Pin aus dem nächsten Markt für ein beauftragtes Inserat ist Gegenseitigkeit.",
      },
      {
        title: "Warum sollte ein lokaler Betrieb für meine Mapsite zahlen?",
        say: "Weil Ihre Kundinnen und Kunden auch ihre Kundschaft sind. Wer ein Haus kauft, braucht zum Beispiel Anwälte, Prüfer und Vermesser. Danach wird oft renoviert, ein Auto gekauft und ein Urlaub gebucht. Pins können kostenlos starten, und später kann eine Kostenteilung Einnahmen bringen.",
      },
    ],
  },
  time: {
    label: "Wenn sie Zeit brauchen",
    goal: "Der Rundgang bleibt in diesem Gespräch. Wenn sie bestehen, vereinbaren Sie Tag und Uhrzeit in ihrer Zeitzone und wer noch dabei ist. Über Kosten sprechen Sie erst, wenn sie die Mapsite gesehen haben.",
    script: (v) =>
      `Der Rundgang für ${v.brokerage} gehört in dieses Gespräch und dauert nur wenige Minuten. Wenn Sie einen anderen Zeitpunkt brauchen, nennen Sie Tag und Uhrzeit in Ihrer Zeitzone und wer noch dabei sein soll.`,
    objections: [
      {
        title: "Was kostet das?",
        say: "Das hängt davon ab, wie viele Ihrer Agenten mitmachen. Unser Ziel ist zu zeigen, dass Ihre Service-Untergrenzen das Konto um ein Vielfaches tragen. Lassen Sie mich zuerst die Mapsite zeigen, danach gehen wir die Zahlen durch.",
      },
    ],
  },
  register: {
    label: "Registrierung",
    goal: "Sie haben die Mapsite gesehen. Laden Sie zur Registrierung ein und geben Sie Ihren Agenten-Eintrittscode. Die Registrierung öffnet sich nur mit diesem Code.",
    script: (v) =>
      `${v.firstName ? `${v.firstName}, ` : ""}${v.brokerage} kann diese Mapsite jetzt registrieren. Öffnen Sie ${v.registerUrl}, wählen Sie Registrieren und geben Sie den Eintrittscode ein, den ich Ihnen nenne. Damit öffnet sich die Registrierung für den FAST Code ${v.fastCode}. Machen wir das jetzt?`,
    objections: [
      {
        title: "Was kostet das?",
        say: "Für Kanada gelten CAD: Maklerbüro oder Team 1.000 $ im Jahr oder 100 $ im Monat, Agent 200 $ im Jahr oder 100 $ im Monat, und 7 $ pro Woche je Inserat-Pin. Das Ziel ist, dass Ihre Service-Untergrenzen das Konto um ein Vielfaches tragen.",
      },
      {
        title: "Ich will keinen langen Vertrag.",
        say: "Es gibt keine langfristige Bindung. Wenn das Konto ausläuft, endet der Service und es besteht keine weitere Pflicht.",
      },
    ],
  },
};

const STEPS: Record<FlowLocale, Record<CallStepKey, StepCopy>> = { en, de };

export function buildStepViews(locale: FlowLocale, vars: CallScriptVars, saved: readonly SavedStep[]): StepView[] {
  const table = STEPS[locale];
  return CALL_STEP_KEYS.map((key) => {
    const copy = table[key];
    const row = savedStep(saved, key);
    const locked = !isStepUnlocked(key, saved);
    return {
      key,
      label: copy.label,
      goal: copy.goal,
      script: locked ? "" : copy.script(vars),
      points: locked || !copy.points ? [] : copy.points(vars),
      close: locked ? null : (copy.close ?? null),
      objections: locked ? [] : copy.objections,
      locked,
      savedResponse: row?.response ?? null,
      savedOutcome: row?.outcome ?? null,
      checkpoint: checkpointOpenedBy(key, "continue"),
    };
  });
}

export function stepLabel(key: CallStepKey | "done" | "stopped", locale: FlowLocale): string {
  if (key === "done") return locale === "de" ? "Registrierung erfasst" : "Registration recorded";
  if (key === "stopped") return locale === "de" ? "Kein Interesse" : "Not interested";
  return STEPS[locale][key].label;
}

export const CHECKPOINT_LABEL: Record<FlowLocale, Record<CheckpointKey, string>> = {
  en: {
    after_first_contact: "After first contact",
    after_demo: "After the demo is shown",
    before_registration: "Before Registration",
  },
  de: {
    after_first_contact: "Nach dem ersten Kontakt",
    after_demo: "Nachdem die Demo gezeigt wurde",
    before_registration: "Vor der Registrierung",
  },
};

const POSITION: Record<FlowLocale, Record<string, string>> = {
  en: {
    broker: "broker",
    acting_broker: "acting broker",
    managing_broker: "managing broker",
    team_leader: "team leader",
  },
  de: {
    broker: "Makler",
    acting_broker: "stellvertretende Maklerin oder stellvertretender Makler",
    managing_broker: "geschäftsführende Maklerin oder geschäftsführender Makler",
    team_leader: "Teamleiterin oder Teamleiter",
  },
};

export function positionSpoken(position: string, locale: FlowLocale): string {
  return POSITION[locale][position] || POSITION[locale].broker;
}

export function flowUi(locale: FlowLocale) {
  if (locale === "de") {
    return {
      brand: "Tsplits™ — Talisman Simple Project Lead & Einnahmen-Tracking-System",
      kicker: "Agenten-Dashboard",
      active: "Aktiv",
      disabled: "Deaktiviert",
      login: "Anmelde-ID",
      chat: "Chat",
      unread: "ungelesen",
      assigned: "Zugewiesene Mapsites",
      assignedHint: "Sortiert nach der nächsten Handlung. Name oder Kontaktdaten öffnen die Lead-CRM.",
      empty: "Ihnen ist noch keine Mapsite zugewiesen.",
      emptyReview: "Es gibt noch keine zugewiesenen FAST Codes.",
      next: "Nächster Schritt",
      progress: "Fortschritt",
      points: "Punkte",
      open: "CRM öffnen",
      tasks: "Aufgaben",
      readOnly: "Nur-Lese-Vorschau. Formulare sind deaktiviert.",
      streak: "Tage in Folge",
      badges: "Abzeichen",
      noBadges: "Abzeichen erscheinen mit dem ersten Anruf, der ersten gezeigten Demo und der ersten Registrierung.",
      board: "Aritri und Enanko",
      boardHint: "Punkte für abgeschlossene Schritte. Registrierung zählt extra.",
      first_call: "Erster Anruf",
      first_demo: "Erste Demo gezeigt",
      first_registration: "Erste Registrierung",
      checkpoint: "Prüfpunkt",
      comments: "Kommentare",
      review: "Prüfung",
      reviewHint: "Alle Leads. Sie können Prüfpunkte sehen und kommentieren.",
      crmKicker: "Lead-CRM",
      saveLead: "Lead speichern",
      saving: "Wird gespeichert …",
      saved: "Gespeichert",
      failed: "Das hat nicht geklappt. Bitte versuchen Sie es erneut.",
      locked: "Gesperrt, bis die Antwort des vorherigen Schritts gespeichert ist.",
      response: "Was hat die Person gesagt?",
      responseHint: "Pflicht. Speichern öffnet den nächsten Schritt.",
      saveResponse: "Antwort speichern und weiter",
      notInterested: "Kein Interesse speichern",
      goal: "Ziel",
      say: "Das sagen Sie",
      heard: "Zwischen den Zeilen",
      bring: "Ansprechen",
      objections: "Wahrscheinliche Einwände",
      history: "Verlauf",
      historyEmpty: "Noch keine Einträge.",
      checkpoints: "Prüfpunkte",
      checkpointWait: "Prüfpunkte öffnen sich nach dem ersten Kontakt, nach der gezeigten Demo und vor der Registrierung.",
      comment: "Kommentar",
      commentHint: "Für Ralf und Agent Arun sichtbar auf diesem Lead.",
      post: "Kommentar speichern",
      noComments: "Noch kein Kommentar.",
      entry: "Eintrittscode",
      entryHint: "Diesen Code nennt die Person bei der Registrierung. Er ist kein Passwort.",
      entryMissing: "Der Eintrittscode erscheint hier, sobald er auf dem Agentenkonto liegt.",
      registerLink: "Registrierung öffnen",
      mapsite: "Mapsite öffnen",
      teb: "TEB™ öffnen",
      stageHistory: "Phasenverlauf",
      agentCount: "Anzahl der Agenten",
      source: "Quelle",
      town: "Ort",
      fastCode: "FAST Code",
      brokerage: "Maklerbüro",
      decision: "Entscheider",
      position: "Position",
      cell: "Mobil",
      office: "Bürotelefon",
      email: "E-Mail",
      address: "Adresse",
      website: "Website",
      country: "Land",
      market: "Markt",
      notes: "Notiz",
      noDelete: "Leads können bearbeitet, aber nicht gelöscht werden.",
      reviewerNote: "Sie sehen diesen Lead und können an Prüfpunkten kommentieren.",
      savedOn: "Gespeicherte Antwort",
      contact: "Kontakt",
      you: "Ihre Serie",
    };
  }
  return {
    brand: "Tsplits™ — Talisman Simple Project Lead & Income Tracking System",
    kicker: "Agent dashboard",
    active: "Active",
    disabled: "Disabled",
    login: "Login ID",
    chat: "Chat",
    unread: "unread",
    assigned: "Assigned Mapsites",
    assignedHint: "Ordered by the next action. A brokerage name or contact opens the lead CRM.",
    empty: "No Mapsite is assigned to you yet.",
    emptyReview: "No FAST Codes are assigned yet.",
    next: "Next step",
    progress: "Progress",
    points: "Points",
    open: "Open CRM",
    tasks: "Tasks",
    readOnly: "Read-only preview. Forms are disabled.",
    streak: "day streak",
    badges: "Badges",
    noBadges: "Badges appear with the first call, the first demo shown, and the first registration.",
    board: "Aritri and Enanko",
    boardHint: "Points for completed steps. Registration counts extra.",
    first_call: "First call",
    first_demo: "First demo shown",
    first_registration: "First registration",
    checkpoint: "Checkpoint",
    comments: "Comments",
    review: "Review",
    reviewHint: "Every lead. You can view checkpoints and comment.",
    crmKicker: "Lead CRM",
    saveLead: "Save lead",
    saving: "Saving…",
    saved: "Saved",
    failed: "That did not work. Please try again.",
    locked: "Locked until the previous step’s response is saved.",
    response: "What did they say?",
    responseHint: "Required. Saving unlocks the next step.",
    saveResponse: "Save response and continue",
    notInterested: "Save as not interested",
    goal: "Goal",
    say: "Say this",
    heard: "Between the lines",
    bring: "Bring up",
    objections: "Likely objections",
    history: "History",
    historyEmpty: "Nothing recorded yet.",
    checkpoints: "Checkpoints",
    checkpointWait: "Checkpoints open after first contact, after the demo is shown, and before Registration.",
    comment: "Comment",
    commentHint: "Ralf and Agent Arun see this on the lead.",
    post: "Save comment",
    noComments: "No comment yet.",
    entry: "Entry code",
    entryHint: "The prospect enters this code at Registration. It is not a password.",
    entryMissing: "The entry code shows here once it is on the agent account.",
    registerLink: "Open Registration",
    mapsite: "Open Mapsite",
    teb: "Open TEB™",
    stageHistory: "Stage history",
    agentCount: "Agent count",
    source: "Source",
    town: "Town",
    fastCode: "FAST Code",
    brokerage: "Brokerage",
    decision: "Decision maker",
    position: "Position",
    cell: "Cell",
    office: "Office phone",
    email: "Email",
    address: "Address",
    website: "Website",
    country: "Country",
    market: "Market",
    notes: "Note",
    noDelete: "Leads can be edited and cannot be deleted.",
    reviewerNote: "You can view this lead and comment at checkpoints.",
    savedOn: "Saved response",
    contact: "Contact",
    you: "Your streak",
  };
}

export type FlowUi = ReturnType<typeof flowUi>;
