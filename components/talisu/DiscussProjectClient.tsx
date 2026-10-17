"use client";

import { useRouter } from "next/navigation";
import OwnershipLearnMoreForm from "@/components/talispros/OwnershipLearnMoreForm";
import type { OwnershipContactTopic } from "@/lib/talispros/ownership-contact";

/** /talisu/discuss form: page variant (topic + Google Places location). */
export default function DiscussProjectClient({ topic }: { topic: OwnershipContactTopic }) {
  const router = useRouter();
  return (
    <OwnershipLearnMoreForm
      topic={topic}
      variant="page"
      onClose={() => router.push("/")}
    />
  );
}
