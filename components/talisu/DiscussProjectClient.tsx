"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import OwnershipLearnMoreForm from "@/components/talispros/OwnershipLearnMoreForm";
import TransactionStructurePicker from "@/components/talisu/TransactionStructurePicker";
import WorkingPageShell from "@/components/talispros/WorkingPageShell";
import {
  ownershipTopicFromId,
  type OwnershipContactTopic,
} from "@/lib/talispros/ownership-contact";
import { useT } from "@/lib/i18n/client";

/**
 * /talisu/discuss — "Share a Project Vision" (Ralf, Oct 18). Catalogue look,
 * ~1,400 px: left column = EXPLORE TRANSACTION STRUCTURES (explanations open
 * below the buttons, replacing the old topic dropdown), right column = form.
 * The open structure is the one recorded with the submission.
 */
export default function DiscussProjectClient({ topic }: { topic: OwnershipContactTopic }) {
  const router = useRouter();
  const c = useT().contactForm;
  const [openId, setOpenId] = useState<string>(topic.toLowerCase());
  const selected = ownershipTopicFromId(openId);
  return (
    <WorkingPageShell
      testId="talisu-discuss"
      contentTestId="talisu-discuss-content"
      leftWidth="44rem"
      headline={c.pageSubtitle}
      title={
        <div>
          <h1 className="text-[30px] font-semibold leading-tight tracking-[-0.03em] text-neutral-950 sm:text-[34px]">
            {c.pageTitle}
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-neutral-600">{c.pageIntro}</p>
        </div>
      }
      left={
        <TransactionStructurePicker
          openId={openId}
          onOpenChange={(id) => id && setOpenId(id)}
          requireSelection
          testId="discuss-structures"
        />
      }
    >
      <div className="rounded-[24px] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_40px_rgba(0,0,0,0.06)] sm:p-6">
        <OwnershipLearnMoreForm
          topic={selected}
          variant="page"
          onClose={() => router.push("/")}
        />
      </div>
    </WorkingPageShell>
  );
}
