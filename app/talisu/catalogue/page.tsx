import { redirect } from "next/navigation";

/** Legacy iframe of catalogue — navigate to the real experience. */
export default function TalisUCatalogueRedirectPage() {
  redirect("/catalogue");
}
