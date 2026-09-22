import { redirect } from "next/navigation";

/** Old storefront alias. Product now opens the top-bound T-All catalogue. */
export default function CatalogAliasPage() {
  redirect("/catalogue");
}
