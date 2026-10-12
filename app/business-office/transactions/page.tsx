import TransactionsPage from "./page-client";
import { adminMetadata } from "@/lib/seo/page-metadata";

export async function generateMetadata() {
  return adminMetadata("Transactions");
}

export default function Page() {
  return <TransactionsPage />;
}
