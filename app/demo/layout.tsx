import TalisprosLayoutClient from "@/components/talispros/TalisprosLayoutClient";
import { poppins } from "@/lib/fonts";

/** Same blue bar as the Mapsites builder. The storefront header stays off /demo. */
export default function DemoLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={poppins.className}>
      <TalisprosLayoutClient>{children}</TalisprosLayoutClient>
    </div>
  );
}
