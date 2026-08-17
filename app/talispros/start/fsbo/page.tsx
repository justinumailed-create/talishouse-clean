import { redirect } from "next/navigation";
import { MAPSITE_APP_PATH } from "@/lib/talispros/mapsite-state";

/** Stale marketing URL — join the live FSBO Mapsite™ onboarding journey. */
export default function FsboPage() {
  redirect(`${MAPSITE_APP_PATH}?audience=fsbos`);
}
