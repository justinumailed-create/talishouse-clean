"use client";

import TalisBooksCenterfoldPreviewCard from "@/components/talisbooks/centerfold/TalisBooksCenterfoldPreviewCard";
import type { TalisBooksCenterfoldPreview } from "@/lib/talisbooks/image-engine";
import { reviewCenterfoldAction } from "@/app/admin/talisbooks/actions";

export default function TalisBooksCenterfoldPreviewList({
  previews,
}: {
  previews: TalisBooksCenterfoldPreview[];
}) {
  return (
    <div className="space-y-6">
      {previews.map((preview) => (
        <TalisBooksCenterfoldPreviewCard
          key={preview.originalImageId ?? preview.originalName}
          preview={preview}
          onReview={reviewCenterfoldAction}
        />
      ))}
    </div>
  );
}
