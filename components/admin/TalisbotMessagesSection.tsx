import {
  isTalisbotSearching,
  listAdminTalisbotComments,
  listAdminTalisbotMessages,
  type AdminTalisbotComment,
  type AdminTalisbotMessage,
} from "@/lib/talispros/admin-talisbot-messages";
import TalisbotMessagesPanel from "./TalisbotMessagesPanel";

const PREVIEW_MESSAGES: AdminTalisbotMessage[] = [
  {
    id: "preview-progress",
    type: "progress",
    title: "Searching markets…",
    body: "Hi Ralf — TalisBOT™ just started a sourcing run. Checking: Corner Brook, NL; Gander, NL.",
    fastCode: null,
    brokerage: null,
    prospectQueueId: null,
    metadata: {
      i18n: {
        en: {
          title: "Searching markets…",
          body: "Hi Ralf — TalisBOT™ just started a sourcing run. Checking: Corner Brook, NL; Gander, NL.",
        },
        de: {
          title: "Märkte werden durchsucht …",
          body: "Hallo Ralf — TalisBOT™ hat einen Recherche-Lauf gestartet. Prüfe: Corner Brook, NL; Gander, NL.",
        },
      },
    },
    createdBy: "talisbot",
    parentId: null,
    replyToCommentId: null,
    readAt: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "preview-result",
    type: "result",
    title: "Sourcing run finished",
    body: "Hi Ralf — run complete. 2 new brokerages added. Markets: Corner Brook, NL; Gander, NL.",
    fastCode: null,
    brokerage: null,
    prospectQueueId: null,
    metadata: {
      i18n: {
        en: {
          title: "Sourcing run finished",
          body: "Hi Ralf — run complete. 2 new brokerages added. Markets: Corner Brook, NL; Gander, NL.",
        },
        de: {
          title: "Recherche-Lauf fertig",
          body: "Hallo Ralf — Lauf abgeschlossen. 2 neue Maklerbüros hinzugefügt. Märkte: Corner Brook, NL; Gander, NL.",
        },
      },
    },
    createdBy: "talisbot",
    parentId: null,
    replyToCommentId: null,
    readAt: null,
    createdAt: new Date(Date.now() - 3600_000).toISOString(),
  },
  {
    id: "preview-needs",
    type: "needs_review",
    title: "KSAB Real Estate — who is the decision maker?",
    body: "Hi Ralf — sample needs-review card for screenshots.",
    fastCode: null,
    brokerage: "KSAB Real Estate",
    prospectQueueId: null,
    metadata: {},
    createdBy: "talisbot",
    parentId: null,
    replyToCommentId: null,
    readAt: null,
    createdAt: new Date(Date.now() - 7200_000).toISOString(),
  },
];

const PREVIEW_COMMENTS: AdminTalisbotComment[] = [
  {
    id: "preview-c1",
    messageId: "preview-needs",
    body: "Please hold the code until we confirm Managing Broker vs owner.",
    author: "Ralf Meyer",
    createdAt: new Date(Date.now() - 3500_000).toISOString(),
    status: "new",
    answeredAt: null,
  },
  {
    id: "preview-c2",
    messageId: "preview-needs",
    body: "Noted — leaving KSAB code pending.",
    author: "TalisBOT™",
    createdAt: new Date(Date.now() - 3400_000).toISOString(),
    status: "answered",
    answeredAt: new Date(Date.now() - 3400_000).toISOString(),
  },
];

export default async function TalisbotMessagesSection({
  locale,
  talisbotDay,
  preview,
}: {
  locale: "en" | "de";
  talisbotDay?: string | null;
  preview?: string | null;
}) {
  const isPreview = preview === "searching" || preview === "done" || preview === "history";
  if (isPreview) {
    return (
      <TalisbotMessagesPanel
        locale={locale}
        messages={PREVIEW_MESSAGES}
        comments={PREVIEW_COMMENTS}
        searching={preview === "searching"}
        dayFilter={null}
        preview
      />
    );
  }

  const day = talisbotDay && /^\d{4}-\d{2}-\d{2}$/.test(talisbotDay) ? talisbotDay : undefined;
  const [messages, comments, searching] = await Promise.all([
    listAdminTalisbotMessages({ day, limit: 200 }),
    listAdminTalisbotComments({ limit: 500 }),
    isTalisbotSearching(),
  ]);
  return (
    <TalisbotMessagesPanel
      locale={locale}
      messages={messages}
      comments={comments}
      searching={searching}
      dayFilter={day ?? null}
    />
  );
}
