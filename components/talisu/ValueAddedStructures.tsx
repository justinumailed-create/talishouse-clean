"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/client";
import TransactionStructurePicker from "@/components/talisu/TransactionStructurePicker";

/**
 * Fulfilment options on /talisu/value-added (Webster): the shared structure
 * picker with the Tsplits™ wording on Lease-to-Own. Each "Learn More" opens
 * /talisu/discuss for that structure (on this site, never Taliswebs).
 */
export default function ValueAddedStructures() {
  const t = useT();
  const [openId, setOpenId] = useState<string | null>(null);
  const sections = t.home.ownershipSections.map((s) =>
    s.id === "lease-to-own" ? { ...s, body: t.talisu.valueAdded.leaseToOwnBody } : s,
  );
  return (
    <div className="mt-6 sm:mt-8">
      <TransactionStructurePicker
        openId={openId}
        onOpenChange={setOpenId}
        learnMore
        sectionLearnMoreLabel
        sections={sections}
        testId="value-added-structures"
      />
    </div>
  );
}
