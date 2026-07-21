import Link from "next/link";
import Image from "next/image";
import { TALISPROS_START_SEGMENTS } from "@/lib/talispros/start-content";

export default function TalisprosStartSidebar() {
  return (
    <aside className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#f2f2f0] text-black lg:h-full lg:flex-none lg:border-l lg:border-[#dedede] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="flex min-h-[295px] items-end justify-center px-4 pb-6 lg:px-5">
        <h2 className="max-w-[19rem] text-center text-[36px] leading-[1.05] text-black sm:text-[42px] lg:text-[46px]">
          What best describes you?
        </h2>
      </div>

      <div className="space-y-5 px-5 pb-10">
        {TALISPROS_START_SEGMENTS.map((segment) => (
          <Link
            key={segment.title}
            href={segment.href}
            className="group block border border-[#dedede] bg-white px-4 py-6 text-center transition-[border-width,border-color] hover:border-2 hover:border-black"
          >
            <h3 className="mb-5 text-[22px] leading-snug text-black sm:text-[24px]">
              {segment.title}
            </h3>
            <Image
              src="/images/talispros/click-icon.png"
              alt=""
              width={56}
              height={56}
              className="mx-auto mb-5 h-14 w-14 object-contain"
            />
            <p className="text-[12px] leading-[22px] text-black">{segment.description}</p>
          </Link>
        ))}
      </div>
    </aside>
  );
}
