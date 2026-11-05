import { listAdminTalisbotMessages } from "@/lib/talispros/admin-talisbot-messages";
import TalisbotMessagesPanel from "./TalisbotMessagesPanel";

export default async function TalisbotMessagesSection({ locale }: { locale: "en" | "de" }) {
  const messages = await listAdminTalisbotMessages({ limit: 50 });
  return <TalisbotMessagesPanel locale={locale} messages={messages} />;
}
