"use client";

import { Children, useEffect, useState, type ReactNode } from "react";
import AdviserLayout from "@/components/talisu/AdviserLayout";
import { useT } from "@/lib/i18n/client";
import {
  PERSONAL_HOME_DRAFT_EVENT,
  type PersonalHomeDraft,
} from "@/lib/talispros/personal-home";

const TITLE =
  "mt-2 mb-0! text-[34px] font-semibold leading-[1.15] tracking-[-0.03em] text-neutral-950! sm:mt-3 sm:text-[48px] sm:leading-[1.1]";

type PersonalHomeBodyProps = {
  kicker: string;
  headline: string;
  contactName: string;
  ownerName: string;
  imageSrc: string;
  imageAlt: string;
  media?: ReactNode;
  mediaFit?: "map" | "cover";
  children: ReactNode;
};

/** Right-hand copy. An open editor can preview a headline and contact name before saving. */
export default function PersonalHomeBody({
  kicker,
  headline,
  contactName,
  ownerName,
  imageSrc,
  imageAlt,
  media,
  mediaFit,
  children,
}: PersonalHomeBodyProps) {
  const { personalHome } = useT();
  const [draft, setDraft] = useState<PersonalHomeDraft | null>(null);

  useEffect(() => {
    const onDraft = (event: Event) => {
      const detail = (event as CustomEvent<PersonalHomeDraft>).detail;
      if (!detail) return;
      setDraft(detail);
    };
    window.addEventListener(PERSONAL_HOME_DRAFT_EVENT, onDraft);
    return () => window.removeEventListener(PERSONAL_HOME_DRAFT_EVENT, onDraft);
  }, []);

  const shownHeadline = (draft ? draft.headline : headline).trim();
  const typedContact = (draft ? draft.contactName : contactName).trim();
  const shownContact = typedContact || ownerName.trim();
  const parts = Children.toArray(children);

  return (
    <AdviserLayout
      testId="personal-home"
      imageSrc={imageSrc}
      imageAlt={imageAlt}
      imagePosition="center 22%"
      kicker={kicker}
      title={shownHeadline}
      titleClassName={TITLE}
      media={media}
      mediaFit={mediaFit}
      split="home"
    >
      {parts[0]}
      {shownContact ? (
        <section className="mt-6 max-w-[60ch]" data-testid="personal-home-contact">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
            {personalHome.contactHeading}
          </h2>
          <p className="mt-2 text-[15px] font-medium text-neutral-950 sm:text-[16px]" data-testid="personal-home-contact-value">
            {shownContact}
          </p>
        </section>
      ) : null}
      {parts.slice(1)}
    </AdviserLayout>
  );
}
