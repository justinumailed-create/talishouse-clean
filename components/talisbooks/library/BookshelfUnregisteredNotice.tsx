"use client";

import { useT } from "@/lib/i18n/client";
import BookshelfRegisterCta from "@/components/talisbooks/library/BookshelfRegisterCta";

/** Connected bookshelf for an unregistered FAST Code: read-only + Register CTA. */
export default function BookshelfUnregisteredNotice() {
  const lock = useT().bookshelf.lock;
  return (
    <div
      className="flex flex-wrap items-center justify-end gap-3"
      data-testid="bookshelf-unregistered-notice"
    >
      <p className="max-w-[18rem] text-right text-xs text-neutral-500">{lock.readOnly}</p>
      <BookshelfRegisterCta className="px-4 py-2.5" />
    </div>
  );
}
