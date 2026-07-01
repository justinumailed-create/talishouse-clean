import Link from "next/link";
import Image from "next/image";
import { MousePointerClick } from "lucide-react";

const SEGMENTS = [
  {
    title: '"I am a Licensed Real Estate Professional."',
    href: "/talispros/register?market=listings",
    bullets: [
      "I want my Mapsite™ to establish service floors for real estate fees and listing term lengths.",
      "I want Talispros PMC to promote my real estate listings, globally.",
    ],
  },
  {
    title: '"I represent Talishouse™ Homes & Cottages, locally."',
    href: "/talispros/register?market=homes",
    bullets: [
      "I want my Mapsite™ to identify new tiny home objects or projects, globally.",
      "I want Talispros PMC to promote fractional ownership opportunities.",
    ],
  },
  {
    title: '"I am a For-Sale-By-Owner selling something special."',
    href: "/talispros/register?market=fsbos",
    bullets: [
      "I want my Mapsite™ help me avoid expensive real estate fees and commitments.",
      "I want Talispros PMC to extend my FSBO advertising reach, globally.",
    ],
  },
];

export default function TalisprosStartPage() {
  return (
    <div className="min-h-screen bg-white text-neutral-900 overflow-x-hidden">
      <header className="bg-white border-b border-neutral-200">
        <div className="px-6 py-10 sm:py-12 text-center">
          <Image
            src="/logo.png"
            alt="TalisPros PMC"
            width={48}
            height={48}
            className="mx-auto mb-5 h-12 w-12 object-contain"
            priority
          />
          <h1 className="text-3xl sm:text-4xl font-light tracking-[0.35em] text-neutral-900 uppercase">
            Talispros PMC
          </h1>
          <p className="mt-3 text-sm sm:text-base font-light tracking-[0.2em] text-neutral-400 uppercase">
            Prospect - Manage - Colaborate
          </p>
        </div>
      </header>

      <section className="w-full overflow-hidden bg-neutral-50">
        <div className="relative mx-auto w-full max-w-[1200px]">
          <Image
            src="/images/glasshouse/hero-hd.webp"
            alt="Glasshouse™ cabin in the forest"
            width={2400}
            height={1348}
            priority
            className="block w-full h-auto max-w-full"
            sizes="100vw"
          />
        </div>
      </section>

      <section className="px-6 sm:px-[75px] py-8 sm:py-12">
        <h2 className="text-2xl sm:text-4xl font-medium text-center tracking-tight mb-8 sm:mb-10">
          What best describes you?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SEGMENTS.map((segment) => (
            <Link
              key={segment.title}
              href={segment.href}
              className="h-full border border-[#d9d9d9] px-4 py-5 text-center flex flex-col"
            >
              <h3 className="text-lg sm:text-xl leading-snug font-semibold mb-4 min-h-[4.5rem]">
                {segment.title}
              </h3>
              <MousePointerClick className="mx-auto h-10 w-10 mb-4" strokeWidth={1.8} />
              <ul className="list-disc text-left text-sm sm:text-base leading-relaxed pl-5 space-y-2.5">
                {segment.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
