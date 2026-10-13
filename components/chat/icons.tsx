import type { ChatTick } from "@/lib/chat/model";

type P = { className?: string };
const base = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, viewBox: "0 0 24 24" };

export const IconBack = ({ className = "h-6 w-6" }: P) => <svg {...base} className={className}><path d="M15 18l-6-6 6-6" /></svg>;
export const IconSearch = ({ className = "h-5 w-5" }: P) => <svg {...base} className={className}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>;
export const IconSend = ({ className = "h-5 w-5" }: P) => <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M3.4 20.4l17.45-7.48a1 1 0 000-1.84L3.4 3.6a.99.99 0 00-1.39.91L2 9.12c0 .5.37.93.87.99L17 12 2.87 13.88c-.5.07-.87.5-.87 1l.01 4.61c0 .71.73 1.2 1.39.91z" /></svg>;
export const IconPlus = ({ className = "h-6 w-6" }: P) => <svg {...base} className={className}><path d="M12 5v14M5 12h14" /></svg>;
export const IconPin = ({ className = "h-4 w-4" }: P) => <svg {...base} className={className}><path d="M12 17v5M9 3h6l-1 6 3 3H7l3-3-1-6z" /></svg>;
export const IconClose = ({ className = "h-5 w-5" }: P) => <svg {...base} className={className}><path d="M6 6l12 12M18 6L6 18" /></svg>;
export const IconMenu = ({ className = "h-5 w-5" }: P) => <svg viewBox="0 0 24 24" fill="currentColor" className={className}><circle cx="12" cy="5" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="12" cy="19" r="1.8" /></svg>;
export const IconFile = ({ className = "h-5 w-5" }: P) => <svg {...base} className={className}><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" /><path d="M14 3v5h5" /></svg>;
export const IconBook = ({ className = "h-5 w-5" }: P) => <svg {...base} className={className}><path d="M4 19.5A2.5 2.5 0 016.5 17H20V3H6.5A2.5 2.5 0 004 5.5v14z" /><path d="M4 19.5A2.5 2.5 0 006.5 22H20v-5" /></svg>;
export const IconImage = ({ className = "h-5 w-5" }: P) => <svg {...base} className={className}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="M21 15l-5-5L5 21" /></svg>;
export const IconMegaphone = ({ className = "h-5 w-5" }: P) => <svg {...base} className={className}><path d="M3 11v2a1 1 0 001 1h3l5 4V6L7 10H4a1 1 0 00-1 1z" /><path d="M16 8a5 5 0 010 8M19 5a9 9 0 010 14" /></svg>;
export const IconGrid = ({ className = "h-5 w-5" }: P) => <svg {...base} className={className}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>;

/** single grey = sent, double grey = delivered, double blue = read */
export function Ticks({ tick, className = "" }: { tick: ChatTick; className?: string }) {
  const color = tick === "read" ? "text-[#0EA5E9]" : "text-[#94a3b8]";
  const label = tick === "read" ? "Read" : tick === "delivered" ? "Delivered" : "Sent";
  return (
    <svg viewBox="0 0 18 12" className={`inline-block h-3 w-[18px] ${color} ${className}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-label={label} data-tick={tick}>
      {tick === "sent" ? <path d="M3 6.5l3 3 7-7.5" /> : (<><path d="M1 6.5l3 3 7-7.5" /><path d="M7.5 9.2l.3.3 7-7.5" /></>)}
    </svg>
  );
}
