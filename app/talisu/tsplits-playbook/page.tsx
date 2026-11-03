import { cookies } from "next/headers";
import { pageMetadata } from "@/lib/seo/page-metadata";
import { getLocale } from "@/lib/i18n/server";
import { tsplitsPlaybookCopy, type TsplitsPlaybookUnlockError } from "@/lib/talisu/tsplits-playbook";
import {
  hasTsplitsPlaybookAccess,
  isTsplitsPlaybookConfigured,
} from "@/lib/talisu/tsplits-playbook.server";
import TsplitsPlaybookGate from "@/components/talisu/TsplitsPlaybookGate";
import TsplitsPlaybookViewer from "@/components/talisu/TsplitsPlaybookViewer";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return pageMetadata("/talisu/tsplits-playbook");
}

const ERRORS = new Set<TsplitsPlaybookUnlockError>(["badCode", "tooMany", "unavailable"]);

/**
 * /talisu/tsplits-playbook — Tsplits™ Sales Playbook for the sales team.
 * Locked: only the passcode form (checked on the server, see
 * lib/talisu/tsplits-playbook.server.ts). Unlocked (12 h signed cookie): the
 * playbook HTML and a Download PDF button. noindex, not in any navigation.
 */
export default async function TsplitsPlaybookPage({
  searchParams,
}: {
  searchParams?: Promise<{ e?: string | string[] }>;
}) {
  const copy = tsplitsPlaybookCopy(await getLocale());
  const configured = isTsplitsPlaybookConfigured();
  const unlocked = configured && hasTsplitsPlaybookAccess(await cookies());
  if (unlocked) return <TsplitsPlaybookViewer copy={copy} />;

  const raw = (await searchParams)?.e;
  const e = (Array.isArray(raw) ? raw[0] : raw) as TsplitsPlaybookUnlockError | undefined;
  return (
    <TsplitsPlaybookGate
      copy={copy}
      available={configured}
      initialError={e && ERRORS.has(e) ? e : null}
    />
  );
}
