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
  const contactLine = [page.agentPhone, page.agentEmail].filter(Boolean).join(" · ");
  const summaryLine = [page.agentName, contactLine].filter(Boolean).join(", ");

  return (
    <div className="talisbooks-viewer-page talisbooks-viewer-page--agent-summary">
      <div
        className="talisbooks-viewer-page__summary-brand-banner"
        style={
          page.brokerageLogoUrl
            ? { backgroundImage: `url(${page.brokerageLogoUrl})` }
            : undefined
        }
      />
      <div className="talisbooks-viewer-page__summary-template-body">
        <div
          className="talisbooks-viewer-page__summary-template-photo"
          style={
            page.agentPhotoUrl
              ? { backgroundImage: `url(${page.agentPhotoUrl})` }
              : undefined
          }
        />
        <p className="talisbooks-viewer-page__summary-template-agent">
          {summaryLine || "Agent Image, Name & Contact Info"}
        </p>
        <p className="talisbooks-viewer-page__summary-template-slogan">
          {page.slogan || "Slogan"}
        </p>
      </div>
    </div>
  );
}

function PropertyContentPageView({ page }: { page: TalisBooksViewerPage }) {
  const layout = page.layout ?? "caption";
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
  return (
    <div className="talisbooks-viewer-page talisbooks-viewer-page--teb-cover">
      <div className="talisbooks-viewer-page__teb-band talisbooks-viewer-page__teb-band--top">
        <h2 className="talisbooks-viewer-page__teb-title">{page.title}</h2>
      </div>
      <div
        className="talisbooks-viewer-page__teb-hero"
        style={
          page.heroImageUrl
            ? { backgroundImage: `url(${page.heroImageUrl})` }
            : {
                backgroundImage:
                  "linear-gradient(145deg, #1c1917 0%, #44403c 48%, #a8a29e 100%)",
              }
        }
      />
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
