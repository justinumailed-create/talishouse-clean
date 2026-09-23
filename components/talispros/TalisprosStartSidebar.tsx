import Link from "next/link";
import Image from "next/image";
import { TALISPROS_START_SEGMENTS } from "@/lib/talispros/start-content";

export default function TalisprosStartSidebar() {
  return (
    <aside className="flex-none bg-[#f2f2f0] text-black lg:h-full lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain lg:border-l lg:border-[#dedede] lg:[&::-webkit-scrollbar]:hidden lg:[-ms-overflow-style:none] lg:[scrollbar-width:none]">
      <div className="flex flex-col items-center justify-center px-4 pb-5 pt-6 lg:box-border lg:h-[9.5625rem] lg:justify-start lg:border-b lg:border-neutral-200 lg:px-5 lg:py-0">
        <div className="hidden h-[60%] w-full shrink-0 lg:block" aria-hidden="true" />
        <h2 className="max-w-[19rem] text-center text-black sm:max-w-[20.5rem] lg:-translate-y-1/2">
          <span className="block text-[20px] leading-[1.15] tracking-[-0.008em] sm:text-[28px] sm:leading-[1.2]">
            What Best
            <br />
            Describes You?
          </span>
        </h2>
      </div>

      <div className="space-y-4 px-4 pb-10 sm:space-y-5 sm:px-5">
        {TALISPROS_START_SEGMENTS.map((segment) => (
          <Link
            key={segment.label}
            href={segment.href}
            className="group block min-h-[141px] border-2 border-[#dedede] bg-white px-4 py-5 text-center transition-colors hover:border-black"
          >
            <p className="mb-3 text-[11px] uppercase tracking-[0.12em] text-neutral-500">{segment.label}</p>
            <h3 className="mb-4 whitespace-nowrap text-[15px] leading-[1.1] tracking-[-0.008em] text-black sm:text-[16px]">
              {segment.title}
            </h3>
            <Image
              src="/images/talispros/click-icon.png"
              alt=""
              width={44}
              height={44}
              className="mx-auto h-11 w-11 object-contain"
            />
          </Link>
        ))}
      </div>
    </aside>
  );
}
