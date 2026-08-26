import Link from "next/link";
import Image from "next/image";
import { TALISPROS_START_SEGMENTS } from "@/lib/talispros/start-content";

export default function TalisprosStartSidebar() {
  return (
    <aside className="flex-none bg-[#f2f2f0] text-black lg:h-full lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain lg:border-l lg:border-[#dedede] lg:[&::-webkit-scrollbar]:hidden lg:[-ms-overflow-style:none] lg:[scrollbar-width:none]">
      <div className="flex min-h-[220px] items-end justify-center px-4 pb-8 pt-5 lg:min-h-[295px] lg:px-5 lg:pb-7 lg:pt-4">
        <h2 className="max-w-[19rem] text-center text-black sm:max-w-[20.5rem]">
          <span
            className="block text-[42px] leading-[0.96] tracking-[-0.01em] text-[#c8c8c4] sm:text-[52px] lg:text-[58px]"
            style={{
              textShadow:
                "0 1px 0 rgba(255,255,255,0.9), 0 -1px 0 rgba(0,0,0,0.28)",
            }}
          >
            Join Us
          </span>
          <span className="mt-5 block text-[26px] leading-[1.1] tracking-[-0.008em] sm:mt-6 sm:text-[30px] lg:text-[34px]">
            <span className="block whitespace-nowrap">Get Your Own</span>
            <span className="block whitespace-nowrap">Mapsite™ Market™</span>
          </span>
          <span className="mt-5 block text-[16px] leading-[1.1] tracking-[-0.008em] sm:mt-6 sm:text-[18px] lg:text-[20px]">
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
            className="group block min-h-[176px] border-2 border-[#dedede] bg-white px-4 py-6 text-center transition-colors hover:border-black"
          >
            <p className="mb-3 text-[11px] uppercase tracking-[0.12em] text-neutral-500">{segment.label}</p>
            <h3 className="mb-5 text-[16px] leading-[1.1] tracking-[-0.008em] text-black sm:text-[18px] lg:text-[20px]">
              {segment.title}
            </h3>
            <Image
              src="/images/talispros/click-icon.png"
              alt=""
              width={56}
              height={56}
              className="mx-auto h-14 w-14 object-contain"
            />
          </Link>
        ))}
      </div>
    </aside>
  );
}
