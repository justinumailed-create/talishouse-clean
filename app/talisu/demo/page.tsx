import { redirect } from "next/navigation";

/** Legacy iframe of demo-mapsite — navigate to the real experience. */
export default function TalisUDemoRedirectPage() {
  redirect("/demo");
}
