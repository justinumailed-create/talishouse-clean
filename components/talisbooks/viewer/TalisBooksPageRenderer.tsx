import { isMattedSpreadPage } from "@/lib/talisbooks/viewer/spread-layout";
import TalisBooksMapsPageView from "@/components/talisbooks/viewer/TalisBooksMapsPageView";
import {
  TALISBOOKS_COVER_TEMPLATES,
  type TalisBooksCoverTemplateId,
} from "@/lib/talisbooks/covers";
import TalisBooksCoverPreview from "@/components/talisbooks/covers/TalisBooksCoverPreview";
import type { TalisBooksViewerPage } from "@/lib/talisbooks/viewer";

interface TalisBooksPageRendererProps {
  page: TalisBooksViewerPage;
}

function resolveCoverTemplateId(id?: TalisBooksCoverTemplateId) {
  if (id && id in TALISBOOKS_COVER_TEMPLATES) {
    return id;
  }
  return "vista-overlay" as const;
}

function AgentIntroPageView({ page }: { page: TalisBooksViewerPage }) {
  return (
    <div className="talisbooks-viewer-page talisbooks-viewer-page--agent-intro">
      <div
        className="talisbooks-viewer-page__logo-band"
        style={
          page.brokerageLogoUrl
            ? { backgroundImage: `url(${page.brokerageLogoUrl})` }
            : undefined
        }
      >
        <div className="talisbooks-viewer-page__logo-scrim">
          <p className="talisbooks-viewer-page__logo-label">Brokerage</p>
          <p className="talisbooks-viewer-page__logo-name">{page.brokerageName}</p>
        </div>
      </div>

      <div className="talisbooks-viewer-page__agent-grid">
        <div className="talisbooks-viewer-page__portrait-col">
          <div
            className="talisbooks-viewer-page__portrait"
            style={
              page.agentPhotoUrl
                ? { backgroundImage: `url(${page.agentPhotoUrl})` }
                : undefined
            }
          />
          <p className="talisbooks-viewer-page__agent-name">{page.agentName}</p>
          {page.agentTitle ? (
            <p className="talisbooks-viewer-page__agent-role">{page.agentTitle}</p>
          ) : null}
          {page.agentPhone ? (
            <p className="talisbooks-viewer-page__agent-contact">{page.agentPhone}</p>
          ) : null}
          {page.agentEmail ? (
            <p className="talisbooks-viewer-page__agent-contact">{page.agentEmail}</p>
          ) : null}
        </div>

        <div className="talisbooks-viewer-page__mission-col">
          <p className="talisbooks-viewer-page__eyebrow">Slogan & Mission</p>
          {page.slogan ? (
            <h2 className="talisbooks-viewer-page__slogan">{page.slogan}</h2>
          ) : null}
          {page.mission ? (
            <p className="talisbooks-viewer-page__mission">{page.mission}</p>
          ) : null}
          {page.brokerageLine ? (
            <p className="talisbooks-viewer-page__meta">{page.brokerageLine}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function AgentSummaryPageView({ page }: { page: TalisBooksViewerPage }) {
  const brokerageLabel =
    page.brokerageName?.trim() || page.brokerageLine?.trim() || "Brokerage Name";
  const backgroundUrl = page.heroImageUrl?.trim() || "";

  return (
    <div
      className={[
        "talisbooks-viewer-page",
        "talisbooks-viewer-page--agent-summary",
        backgroundUrl ? "talisbooks-viewer-page--agent-summary-has-bg" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {backgroundUrl ? (
        <div
          className="talisbooks-viewer-page__summary-bg"
          style={{ backgroundImage: `url(${backgroundUrl})` }}
          aria-hidden="true"
        />
      ) : null}
      <div className="talisbooks-viewer-page__summary-content">
        <header className="talisbooks-viewer-page__summary-header">
          <div
            className="talisbooks-viewer-page__summary-header-logo"
            style={
              page.brokerageLogoUrl
                ? { backgroundImage: `url(${page.brokerageLogoUrl})` }
                : undefined
            }
            aria-hidden={!page.brokerageLogoUrl}
          />
          <p className="talisbooks-viewer-page__summary-header-name">
            {brokerageLabel}
          </p>
        </header>

        <div className="talisbooks-viewer-page__summary-agent">
          <div
            className="talisbooks-viewer-page__summary-agent-photo"
            style={
              page.agentPhotoUrl
                ? { backgroundImage: `url(${page.agentPhotoUrl})` }
                : undefined
            }
          />
          <div className="talisbooks-viewer-page__summary-agent-copy">
            <h2 className="talisbooks-viewer-page__summary-agent-name">
              {page.agentName?.trim() || "Agent Name"}
            </h2>
            {page.agentTitle?.trim() ? (
              <p className="talisbooks-viewer-page__summary-agent-title">
                {page.agentTitle.trim()}
              </p>
            ) : null}
            <div className="talisbooks-viewer-page__summary-agent-contacts">
              {page.agentPhone?.trim() ? (
                <p className="talisbooks-viewer-page__summary-agent-contact">
                  {page.agentPhone.trim()}
                </p>
              ) : null}
              {page.agentEmail?.trim() ? (
                <p className="talisbooks-viewer-page__summary-agent-contact">
                  {page.agentEmail.trim()}
                </p>
              ) : null}
            </div>
            {page.slogan?.trim() ? (
              <p className="talisbooks-viewer-page__summary-agent-slogan">
                {page.slogan.trim()}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdvertisementKicker({ page }: { page: TalisBooksViewerPage }) {
  if (!page.advertisement) return null;
  return (
    <p className="talisbooks-viewer-page__ad-kicker">
      {page.advertisementLabel?.trim() || "Advertisement"}
    </p>
  );
}

function FacingPageView({ page }: { page: TalisBooksViewerPage }) {
  const captionsEnabled = page.captionsEnabled === true;
  const skipped = page.captionSkipped === true;
  const captionText = skipped ? "" : page.title?.trim() || "";
  const showCaptionSlot = captionsEnabled;
  const imageUrl = page.heroImageUrl?.trim() || "";

  return (
    <div
      className={[
        "talisbooks-viewer-page",
        "talisbooks-viewer-page--facing",
        captionsEnabled ? "talisbooks-viewer-page--facing-captions" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <AdvertisementKicker page={page} />
      <div className="talisbooks-viewer-page__facing-stage">
        {imageUrl ? (
          <img
            className="talisbooks-viewer-page__facing-image"
            src={imageUrl}
            alt={page.title || "Property"}
            draggable={false}
          />
        ) : (
          <div className="talisbooks-viewer-page__facing-empty" aria-hidden="true" />
        )}
      </div>
      {showCaptionSlot ? (
        <div
          className={[
            "talisbooks-viewer-page__facing-caption",
            page.captionAlign === "left"
              ? "talisbooks-viewer-page__facing-caption--left"
              : "talisbooks-viewer-page__facing-caption--right",
            skipped || !captionText
              ? "talisbooks-viewer-page__facing-caption--empty"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {captionText ? <p>{captionText}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

function ContinuousSpreadPageView({ page }: { page: TalisBooksViewerPage }) {
  const captionsEnabled = page.captionsEnabled === true;
  const skipped = page.captionSkipped === true;
  const captionText = skipped ? "" : page.title?.trim() || "";
  const leaf = page.layout === "centerfold_right" ? "right" : "left";
  const imageUrl = page.spreadImageUrl?.trim() || page.heroImageUrl?.trim() || "";
  const showCaptionText = Boolean(captionText) && leaf === "left";

  return (
    <div
      className={[
        "talisbooks-viewer-page",
        "talisbooks-viewer-page--spread-mat",
        `talisbooks-viewer-page--spread-${leaf}`,
        captionsEnabled ? "talisbooks-viewer-page--spread-captions" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="talisbooks-viewer-page__spread-stage">
        {imageUrl ? (
          <img
            className="talisbooks-viewer-page__spread-image"
            src={imageUrl}
            alt={page.title || "Property spread"}
            draggable={false}
          />
        ) : (
          <div className="talisbooks-viewer-page__facing-empty" aria-hidden="true" />
        )}
      </div>
      {captionsEnabled ? (
        <div
          className={[
            "talisbooks-viewer-page__spread-caption",
            leaf === "right" || skipped || !captionText
              ? "talisbooks-viewer-page__spread-caption--empty"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {showCaptionText ? <p>{captionText}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

function GlobalContentPageView({ page }: { page: TalisBooksViewerPage }) {
  const leaf = page.brochureLeaf === "right" ? "right" : "left";
  const imageUrl = page.spreadImageUrl?.trim() || page.heroImageUrl?.trim() || "";
  return (
    <div
      className={[
        "talisbooks-viewer-page",
        "talisbooks-viewer-page--global-content",
        `talisbooks-viewer-page--spread-${leaf}`,
      ].join(" ")}
    >
      <AdvertisementKicker page={page} />
      <div className="talisbooks-viewer-page__global-hero">
        {imageUrl ? (
          <img
            className="talisbooks-viewer-page__global-spread-image"
            src={imageUrl}
            alt=""
            draggable={false}
          />
        ) : null}
        <div className="talisbooks-viewer-page__global-overlay">
          {page.title?.trim() ? (
            <p className="talisbooks-viewer-page__global-title">{page.title}</p>
          ) : null}
          {page.body?.trim() ? (
            <p className="talisbooks-viewer-page__global-caption">{page.body}</p>
          ) : null}
          {page.pricingLine?.trim() ? (
            <p className="talisbooks-viewer-page__global-price">{page.pricingLine}</p>
          ) : null}
          {page.disclaimer?.trim() ? (
            <p className="talisbooks-viewer-page__global-disclaimer">
              {page.disclaimer}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function CustomContentPageView({ page }: { page: TalisBooksViewerPage }) {
  return (
    <div className="talisbooks-viewer-page talisbooks-viewer-page--custom-content">
      <AdvertisementKicker page={page} />
      <div
        className="talisbooks-viewer-page__custom-logo"
        style={
          page.brokerageLogoUrl
            ? { backgroundImage: `url(${page.brokerageLogoUrl})` }
            : undefined
        }
        aria-hidden={!page.brokerageLogoUrl}
      />
      <p className="talisbooks-viewer-page__custom-name">
        {page.brokerageName?.trim() || page.title}
      </p>
      {page.agentName?.trim() ? (
        <p className="talisbooks-viewer-page__custom-agent">{page.agentName}</p>
      ) : null}
      {page.agentTitle?.trim() ? (
        <p className="talisbooks-viewer-page__custom-role">{page.agentTitle}</p>
      ) : null}
      {page.body?.trim() ? (
        <p className="talisbooks-viewer-page__custom-body">{page.body}</p>
      ) : null}
    </div>
  );
}

function PropertyContentPageView({ page }: { page: TalisBooksViewerPage }) {
  if (page.layout === "facing") {
    return <FacingPageView page={page} />;
  }
  if (isMattedSpreadPage(page)) {
    return <ContinuousSpreadPageView page={page} />;
  }
  if (page.layout === "global_content") {
    return <GlobalContentPageView page={page} />;
  }
  if (page.layout === "custom_content") {
    return <CustomContentPageView page={page} />;
  }

  const layout = page.layout ?? "caption";

  if (layout === "quote") {
    return (
      <div className="talisbooks-viewer-page talisbooks-viewer-page--quote">
        <div className="talisbooks-viewer-page__quote-frame">
          {page.title?.trim() ? (
            <p className="talisbooks-viewer-page__quote-eyebrow">{page.title}</p>
          ) : null}
          {page.body?.trim() ? (
            <p className="talisbooks-viewer-page__quote-body">{page.body}</p>
          ) : (
            <p className="talisbooks-viewer-page__quote-body talisbooks-viewer-page__quote-body--empty">
              Add an intro write-up…
            </p>
          )}
        </div>
      </div>
    );
  }

  const isBleed =
    layout === "full_bleed" ||
    layout === "centerfold_left" ||
    layout === "centerfold_right" ||
    layout === "parting";
  const isCenterfold =
    layout === "centerfold_left" || layout === "centerfold_right";
  const usesContinuousSpread = Boolean(isCenterfold && page.spreadImageUrl);
  const heroUrl = usesContinuousSpread ? page.spreadImageUrl : page.heroImageUrl;
  // One caption per centerfold — live on the right page only.
  const showCaption =
    Boolean(page.title?.trim() || page.body?.trim()) &&
    layout !== "centerfold_left";

  if (isBleed) {
    const exact = page.exactPdfPage === true;
    return (
      <div
        className={[
          "talisbooks-viewer-page",
          "talisbooks-viewer-page--property",
          "talisbooks-viewer-page--bleed",
          exact ? "talisbooks-viewer-page--exact-pdf" : "",
          layout === "centerfold_left" ? "talisbooks-viewer-page--fold-left" : "",
          layout === "centerfold_right" ? "talisbooks-viewer-page--fold-right" : "",
          usesContinuousSpread ? "talisbooks-viewer-page--fold-continuous" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div
          className="talisbooks-viewer-page__bleed-hero"
          style={
            heroUrl
              ? { backgroundImage: `url(${heroUrl})` }
              : {
                  backgroundImage:
                    "linear-gradient(145deg, #1c1917 0%, #44403c 48%, #a8a29e 100%)",
                }
          }
        />
        {!exact && showCaption ? (
          <div className="talisbooks-viewer-page__bleed-caption">
            {page.title?.trim() ? (
              <h2 className="talisbooks-viewer-page__title">{page.title}</h2>
            ) : null}
            {page.body?.trim() ? (
              <p className="talisbooks-viewer-page__body-text">{page.body}</p>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="talisbooks-viewer-page talisbooks-viewer-page--property">
      <div
        className="talisbooks-viewer-page__hero"
        style={
          page.heroImageUrl
            ? { backgroundImage: `url(${page.heroImageUrl})` }
            : {
                backgroundImage:
                  "linear-gradient(145deg, #1c1917 0%, #44403c 48%, #a8a29e 100%)",
              }
        }
      />
      <div className="talisbooks-viewer-page__caption">
        <h2 className="talisbooks-viewer-page__title">{page.title}</h2>
        {page.body ? <p className="talisbooks-viewer-page__body-text">{page.body}</p> : null}
      </div>
    </div>
  );
}

function TebCoverPageView({ page }: { page: TalisBooksViewerPage }) {
  // Self-service / pinned / PDF covers: full-bleed art only (no agent chrome).
  if (page.heroImageUrl?.trim()) {
    return (
      <div className="talisbooks-viewer-page talisbooks-viewer-page--bleed talisbooks-viewer-page--exact-pdf talisbooks-viewer-page--cover-art">
        <div
          className="talisbooks-viewer-page__bleed-hero"
          style={{ backgroundImage: `url(${page.heroImageUrl})` }}
        />
      </div>
    );
  }

  const agencyName = page.brokerageName?.trim() || page.brokerageLine?.trim();
  const agentName = page.agentName?.trim();
  const hasAgency = Boolean(page.brokerageLogoUrl?.trim() || agencyName);
  const hasAgent = Boolean(agentName || page.agentPhotoUrl?.trim());

  return (
    <div className="talisbooks-viewer-page talisbooks-viewer-page--teb-cover">
      <div className="talisbooks-viewer-page__teb-band talisbooks-viewer-page__teb-band--top">
        <h2 className="talisbooks-viewer-page__teb-title">{page.title}</h2>

        {hasAgency ? (
          <div className="talisbooks-viewer-page__teb-brand">
            {page.brokerageLogoUrl ? (
              <div
                className="talisbooks-viewer-page__teb-brand-logo"
                style={{ backgroundImage: `url(${page.brokerageLogoUrl})` }}
                aria-hidden="true"
              />
            ) : null}
            {agencyName ? (
              <p className="talisbooks-viewer-page__teb-brand-name">{agencyName}</p>
            ) : null}
          </div>
        ) : null}

        {hasAgent ? (
          <div className="talisbooks-viewer-page__teb-agent">
            {page.agentPhotoUrl ? (
              <div
                className="talisbooks-viewer-page__teb-agent-photo"
                style={{ backgroundImage: `url(${page.agentPhotoUrl})` }}
                aria-hidden="true"
              />
            ) : null}
            <div className="talisbooks-viewer-page__teb-agent-copy">
              {agentName ? (
                <p className="talisbooks-viewer-page__teb-agent-name">{agentName}</p>
              ) : null}
              {page.agentTitle?.trim() ? (
                <p className="talisbooks-viewer-page__teb-agent-title">
                  {page.agentTitle.trim()}
                </p>
              ) : null}
              {page.agentPhone?.trim() ? (
                <p className="talisbooks-viewer-page__teb-agent-contact">
                  {page.agentPhone.trim()}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <div className="talisbooks-viewer-page__teb-hero">
        <div
          className="talisbooks-viewer-page__teb-hero-fallback"
          aria-hidden="true"
        />
      </div>
      <div className="talisbooks-viewer-page__teb-band talisbooks-viewer-page__teb-band--bottom">
        <p className="talisbooks-viewer-page__teb-caption">
          {page.subtitle ?? page.address ?? ""}
        </p>
      </div>
    </div>
  );
}

export default function TalisBooksPageRenderer({ page }: TalisBooksPageRendererProps) {
  if (page.layout === "maps") {
    return <TalisBooksMapsPageView page={page} />;
  }

  if (page.layout === "facing") {
    return <FacingPageView page={page} />;
  }
  if (isMattedSpreadPage(page)) {
    return <ContinuousSpreadPageView page={page} />;
  }
  if (page.layout === "global_content") {
    return <GlobalContentPageView page={page} />;
  }
  if (page.layout === "custom_content") {
    return <CustomContentPageView page={page} />;
  }

  if (page.pageRole === "cover") {
    if (page.layout === "cover") {
      return <TebCoverPageView page={page} />;
    }
    const template = TALISBOOKS_COVER_TEMPLATES[resolveCoverTemplateId(page.coverTemplateId)];
    return (
      <div className="talisbooks-viewer-page talisbooks-viewer-page--cover">
        <TalisBooksCoverPreview
          template={template}
          content={{
            title: page.title,
            subtitle: page.subtitle ?? page.address ?? "",
            heroImageUrl: page.heroImageUrl ?? "",
            heroImageAlt: page.title,
          }}
        />
      </div>
    );
  }

  if (page.pageRole === "agent_brokerage") {
    if (page.layout === "agent_summary") {
      return <AgentSummaryPageView page={page} />;
    }
    return <AgentIntroPageView page={page} />;
  }

  return <PropertyContentPageView page={page} />;
}
