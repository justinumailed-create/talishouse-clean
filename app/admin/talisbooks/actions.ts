"use server";

import { setCenterfoldReviewStatus } from "@/lib/talisbooks/centerfold-service";
import type { TalisBooksCenterfoldReviewStatus } from "@/lib/talisbooks/image-engine";
import { requireTalisprosAdminPage } from "@/lib/talispros-admin-auth";

export async function reviewCenterfoldAction(
  originalImageId: string,
  status: Extract<TalisBooksCenterfoldReviewStatus, "approved" | "rejected">,
) {
  await requireTalisprosAdminPage();
  await setCenterfoldReviewStatus(originalImageId, status);
}
