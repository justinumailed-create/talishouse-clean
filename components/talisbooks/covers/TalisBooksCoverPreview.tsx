import type { CSSProperties } from "react";
import {
  TALISBOOKS_COVER_ASPECT_RATIO,
  TALISBOOKS_COVER_MARGIN_RATIO,
  type TalisBooksCoverContent,
  type TalisBooksCoverTemplateDefinition,
} from "@/lib/talisbooks/covers";

interface TalisBooksCoverPreviewProps {
  template: TalisBooksCoverTemplateDefinition;
  content: TalisBooksCoverContent;
  className?: string;
  selected?: boolean;
}

function coverStyleVars(template: TalisBooksCoverTemplateDefinition): CSSProperties {
  return {
    "--tb-cover-margin-top": `${template.margins.top * 100}%`,
    "--tb-cover-margin-bottom": `${template.margins.bottom * 100}%`,
    "--tb-cover-title-weight": String(template.typography.titleWeight),
    "--tb-cover-title-tracking": template.typography.titleTracking,
    "--tb-cover-subtitle-weight": String(template.typography.subtitleWeight),
    "--tb-cover-subtitle-tracking": template.typography.subtitleTracking,
    "--tb-cover-aspect": TALISBOOKS_COVER_ASPECT_RATIO,
    aspectRatio: TALISBOOKS_COVER_ASPECT_RATIO,
  } as CSSProperties;
}

function TitleBlock({
  template,
  content,
  tone,
}: {
  template: TalisBooksCoverTemplateDefinition;
  content: TalisBooksCoverContent;
  tone: "light" | "dark" | "inverse";
}) {
  const caseClass =
    template.typography.titleCase === "uppercase" ? "talisbooks-cover__title--upper" : "";

  return (
    <div
      className={[
        "talisbooks-cover__copy",
        `talisbooks-cover__copy--title-${template.titleAlign}`,
        `talisbooks-cover__copy--subtitle-${template.subtitleAlign}`,
        `talisbooks-cover__copy--${tone}`,
      ].join(" ")}
    >
      <h2 className={`talisbooks-cover__title ${caseClass}`}>{content.title}</h2>
      <p className="talisbooks-cover__subtitle">{content.subtitle}</p>
    </div>
  );
}

export default function TalisBooksCoverPreview({
  template,
  content,
  className,
  selected = false,
}: TalisBooksCoverPreviewProps) {
  const heroStyle: CSSProperties = content.heroImageUrl
    ? { backgroundImage: `url(${content.heroImageUrl})` }
    : { backgroundImage: template.previewGradient };

  const topText =
    template.titlePlacement === "top-band" ||
    template.titlePlacement === "top-left-bottom-right";
  const bottomText =
    template.titlePlacement === "bottom-band" ||
    template.titlePlacement === "top-left-bottom-right";
  const heroText =
    template.titlePlacement === "hero-center" ||
    template.titlePlacement === "hero-lower-left";

  return (
    <article
      className={[
        template.cssClasses,
        selected ? "talisbooks-cover--selected" : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={coverStyleVars(template)}
      data-cover-id={template.id}
      data-margin-ratio={TALISBOOKS_COVER_MARGIN_RATIO}
      aria-label={`${template.name} cover template`}
    >
      <div className="talisbooks-cover__margin talisbooks-cover__margin--top">
        {topText ? (
          template.titlePlacement === "top-left-bottom-right" ? (
            <div className="talisbooks-cover__copy talisbooks-cover__copy--title-left talisbooks-cover__copy--dark">
              <h2 className="talisbooks-cover__title">{content.title}</h2>
            </div>
          ) : (
            <TitleBlock template={template} content={content} tone="dark" />
          )
        ) : null}
      </div>

      <div
        className="talisbooks-cover__hero"
        style={heroStyle}
        role={content.heroImageUrl ? "img" : undefined}
        aria-label={content.heroImageUrl ? (content.heroImageAlt ?? content.title) : undefined}
      >
        <span className="talisbooks-cover__hero-scrim" aria-hidden="true" />

        {heroText ? (
          <div
            className={[
              "talisbooks-cover__hero-content",
              template.titlePlacement === "hero-center"
                ? "talisbooks-cover__hero-content--center"
                : "talisbooks-cover__hero-content--lower-left",
            ].join(" ")}
          >
            <TitleBlock template={template} content={content} tone="inverse" />
          </div>
        ) : null}
      </div>

      <div className="talisbooks-cover__margin talisbooks-cover__margin--bottom">
        {bottomText ? (
          template.titlePlacement === "top-left-bottom-right" ? (
            <div className="talisbooks-cover__copy talisbooks-cover__copy--subtitle-right talisbooks-cover__copy--dark">
              <p className="talisbooks-cover__subtitle">{content.subtitle}</p>
            </div>
          ) : (
            <TitleBlock template={template} content={content} tone="dark" />
          )
        ) : null}
      </div>
    </article>
  );
}
