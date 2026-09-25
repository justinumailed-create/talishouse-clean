"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import EbookGenerateClient from "@/components/talispros/EbookGenerateClient";
import { unlockIsolatedBookshelfAction } from "@/app/catalogue/bookshelf/actions";
import {
  ISOLATED_BOOKSHELF_DESTINATION,
  ISOLATED_BOOKSHELF_PATH,
} from "@/lib/talisbooks/isolated-bookshelf";

type Props = {
  fastCode: string;
  mapsiteId: string;
  accountType: string;
  agentName: string;
  agentEmail: string;
  agentPhone: string;
  propertyAddress: string;
  listingTitle: string;
  destination?: string;
};

/**
 * Wraps the standard self-serve ebook generator for the isolated catalogue shelf.
 * On success: unlock cookie + redirect to /catalogue/bookshelf.
 */
export default function IsolatedBookshelfCreateClient({
  fastCode,
  mapsiteId,
  accountType,
  agentName,
  agentEmail,
  agentPhone,
  propertyAddress,
  listingTitle,
  destination = ISOLATED_BOOKSHELF_DESTINATION,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className={pending ? "pointer-events-none opacity-70" : undefined}>
      <EbookGenerateClient
        embedded
        fastCode={fastCode}
        mapsiteId={mapsiteId}
        accountType={accountType}
        requestId={null}
        initialAgentName={agentName}
        initialAgentEmail={agentEmail}
        initialAgentPhone={agentPhone}
        initialPropertyAddress={propertyAddress}
        initialListingTitle={listingTitle}
        isolatedBookshelf
        destination={destination}
        onCompleted={() => {
          startTransition(async () => {
            await unlockIsolatedBookshelfAction();
            router.replace(`${ISOLATED_BOOKSHELF_PATH}?created=1`);
            router.refresh();
          });
        }}
      />
    </div>
  );
}
