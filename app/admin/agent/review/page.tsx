import { redirect } from "next/navigation";
import { AssignedMapsites, Leaderboard } from "@/components/admin/agents/CallFlowPanels";
import { getAdminSessionAccount } from "@/lib/admin-auth";
import { flowAccess } from "@/lib/talispros/call-flow";
import { flowUi } from "@/lib/talispros/call-flow-copy";
import { loadLeaderboard, loadReviewBoard } from "@/lib/talispros/call-flow-server";
import { getLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function AgentReviewPage() {
  const account = await getAdminSessionAccount();
  const access = flowAccess(account);
  if (!account || (access !== "reviewer" && access !== "admin")) redirect("/admin/agent");
  const locale = (await getLocale()) === "de" ? "de" : "en";
  const ui = flowUi(locale);
  const [cards, board] = await Promise.all([loadReviewBoard(), loadLeaderboard()]);
  return (
    <div className="space-y-6" data-testid="reviewer-board">
      <header className="rounded-2xl border border-neutral-200 bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#1E4ED8]">{ui.review}</p>
        <h1 className="mt-1 text-2xl font-semibold text-neutral-900">{account.name}</h1>
        <p className="mt-1 text-sm text-neutral-500">{ui.reviewHint}</p>
      </header>
      <Leaderboard rows={board} ui={ui} />
      <AssignedMapsites cards={cards} ui={{ ...ui, empty: ui.emptyReview }} locale={locale} hrefFor={(code) => `/admin/agent/flow/${code.toLowerCase()}`} />
    </div>
  );
}
