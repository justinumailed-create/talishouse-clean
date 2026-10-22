import Link from "next/link";

/** Team Leader avatars for working-page CTAs (Aisha → Register, Webster → Plan). */
export const AISHA_AVATAR_SRC = "/images/mapsites/aisha-c.webp";
export const WEBSTER_AVATAR_SRC = "/talisu/webster-team-leader-v2.jpg";

/**
 * Pill link with a round Team Leader photo, used on the beige working pages:
 * Catalogue "Plan your Project" (Webster) and Mapsites "Register a Mapsite" (Aisha).
 */
export default function WorkingPageCtaLink({
  href,
  label,
  avatarSrc,
  avatarAlt,
  testId,
}: {
  href: string;
  label: string;
  avatarSrc: string;
  avatarAlt: string;
  testId?: string;
}) {
  return (
    <Link
      href={href}
      data-testid={testId}
      className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#046BD9]/40 bg-white py-1 pl-1 pr-4 text-[14px] font-semibold text-[#046BD9] shadow-sm transition hover:bg-[#046BD9] hover:text-white"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={avatarSrc}
        alt={avatarAlt}
        width={28}
        height={28}
        className="h-7 w-7 rounded-full object-cover object-top"
      />
      {label}
      <span aria-hidden>→</span>
    </Link>
  );
}

/**
 * Same pill as WorkingPageCtaLink, as a submit button for a form elsewhere on
 * the page (Mapsites "Build Mapsite Demo", Ralf Oct 18).
 */
export function WorkingPageCtaButton({
  form,
  label,
  avatarSrc,
  avatarAlt,
  testId,
  disabled,
}: {
  form: string;
  label: string;
  avatarSrc: string;
  avatarAlt: string;
  testId?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      form={form}
      disabled={disabled}
      data-testid={testId}
      className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#046BD9]/40 bg-white py-1 pl-1 pr-4 text-[14px] font-semibold text-[#046BD9] shadow-sm transition hover:bg-[#046BD9] hover:text-white disabled:opacity-50"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={avatarSrc}
        alt={avatarAlt}
        width={28}
        height={28}
        className="h-7 w-7 rounded-full object-cover object-top"
      />
      {label}
      <span aria-hidden>→</span>
    </button>
  );
}
