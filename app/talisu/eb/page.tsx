import { redirect } from "next/navigation";

/** Legacy iframe of bookshelf — navigate to the real experience. */
export default function TalisUEbookRedirectPage() {
  redirect("/catalogue/bookshelf");
}
