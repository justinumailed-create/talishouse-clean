import { poppins } from "@/lib/fonts";

/** Home Market: blue Tsplits™ nav (in the page) and a full-height body. */
export default function HomeMarketLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className={`${poppins.className} font-sans text-neutral-900`}>{children}</div>;
}
