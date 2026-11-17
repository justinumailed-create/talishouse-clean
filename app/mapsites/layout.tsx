import TalisprosLayoutClient from "@/components/talispros/TalisprosLayoutClient";
import { poppins } from "@/lib/fonts";

export default function MapsitesLayout({
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
