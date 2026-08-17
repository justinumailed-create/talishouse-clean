"use client";

import type { ReactNode } from "react";
import { Plus } from "lucide-react";
import TalisBooksImageField from "@/components/talisbooks/viewer/TalisBooksImageField";
import { isPermanentViewerPage } from "@/lib/talisbooks/permanent-pages";
import type { TalisBooksViewerPage, TalisBooksViewerPageLayout } from "@/lib/talisbooks/viewer";

const LAYOUT_OPTIONS: Array<{ value: TalisBooksViewerPageLayout; label: string }> = [
  { value: "caption", label: "Caption" },
  { value: "full_bleed", label: "Full bleed / advertising" },
  { value: "quote", label: "Quote / intro write-up" },
  { value: "centerfold_left", label: "Centerfold left" },
  { value: "centerfold_right", label: "Centerfold right" },
  { value: "parting", label: "Parting" },
  { value: "maps", label: "Maps" },
  { value: "cover", label: "Cover" },
  { value: "agent_intro", label: "Agent intro (brokerage scaffold)" },
  { value: "agent_summary", label: "Agent summary (brokerage scaffold)" },
  { value: "facing", label: "Facing page (matted image)" },
  { value: "custom_content", label: "Custom / root content" },
  { value: "global_content", label: "Global / Glasshouse content" },
];

interface TalisBooksViewerLiveEditorProps {
  leftPage: TalisBooksViewerPage | null;
  rightPage: TalisBooksViewerPage | null;
  bindingLabel: string;
  viewMode?: "spread" | "single";
  onUpdatePage: (pageId: string, patch: Partial<TalisBooksViewerPage>) => void;
  onAddPage?: (afterPageId: string | null) => void;
}

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="talisbooks-viewer-live-edit__field" htmlFor={id}>
      <span className="talisbooks-viewer-live-edit__label">{label}</span>
      {children}
    </label>
  );
}

function PageEditorCard({
  page,
  sideLabel,
  onUpdatePage,
}: {
  page: TalisBooksViewerPage;
  sideLabel: string;
  onUpdatePage: (pageId: string, patch: Partial<TalisBooksViewerPage>) => void;
}) {
  const layout = page.layout ?? "caption";
  const locked = isPermanentViewerPage(page);

  if (locked) {
    return (
      <section className="talisbooks-viewer-live-edit__card talisbooks-viewer-live-edit__card--locked">
        <header className="talisbooks-viewer-live-edit__card-head">
          <p className="talisbooks-viewer-live-edit__side">{sideLabel}</p>
          <p className="talisbooks-viewer-live-edit__page-meta">
            Page {page.pageNumber}
            {page.layout ? ` · ${page.layout.replaceAll("_", " ")}` : ""}
          </p>
        </header>
        <p className="talisbooks-viewer-live-edit__locked-title">
          {page.title || "Permanent page"}
        </p>
        <p className="talisbooks-viewer-live-edit__locked-note">
          Glasshouse™ brochure — permanent system page. Clients cannot edit this.
          Administrators can replace it globally later.
        </p>
      </section>
    );
  }

  const isPropertyLike =
    page.pageRole === "property_content" ||
    page.pageRole === "cover" ||
    layout === "cover" ||
    layout === "full_bleed" ||
    layout === "quote" ||
    layout === "caption" ||
    layout === "centerfold_left" ||
    layout === "centerfold_right" ||
    layout === "parting" ||
    layout === "maps";
  const isAgent =
    page.pageRole === "agent_brokerage" ||
    layout === "agent_intro" ||
    layout === "agent_summary";

  return (
    <section className="talisbooks-viewer-live-edit__card">
      <header className="talisbooks-viewer-live-edit__card-head">
        <p className="talisbooks-viewer-live-edit__side">{sideLabel}</p>
        <p className="talisbooks-viewer-live-edit__page-meta">
          Page {page.pageNumber}
          {page.layout ? ` · ${page.layout.replaceAll("_", " ")}` : ""}
        </p>
      </header>

      <Field id={`${page.id}-title`} label="Title">
        <input
          id={`${page.id}-title`}
          className="talisbooks-viewer-live-edit__input"
          value={page.title ?? ""}
          onChange={(event) => onUpdatePage(page.id, { title: event.target.value })}
        />
      </Field>

      {page.pageRole === "cover" || page.subtitle !== undefined ? (
        <Field id={`${page.id}-subtitle`} label="Subtitle">
          <input
            id={`${page.id}-subtitle`}
            className="talisbooks-viewer-live-edit__input"
            value={page.subtitle ?? ""}
            onChange={(event) => onUpdatePage(page.id, { subtitle: event.target.value })}
          />
        </Field>
      ) : null}

      <Field id={`${page.id}-body`} label="Body">
        <textarea
          id={`${page.id}-body`}
          className="talisbooks-viewer-live-edit__textarea"
          rows={4}
          value={page.body ?? ""}
          onChange={(event) => onUpdatePage(page.id, { body: event.target.value })}
        />
      </Field>

      {isPropertyLike ? (
        <>
          <Field id={`${page.id}-layout`} label="Layout">
            <select
              id={`${page.id}-layout`}
              className="talisbooks-viewer-live-edit__input"
              value={layout}
              onChange={(event) =>
                onUpdatePage(page.id, {
                  layout: event.target.value as TalisBooksViewerPageLayout,
                })
              }
            >
              {LAYOUT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>

          {layout !== "maps" && layout !== "quote" ? (
            <TalisBooksImageField
              id={`${page.id}-hero`}
              label="Page image"
              value={page.heroImageUrl ?? ""}
              onChange={(url) => onUpdatePage(page.id, { heroImageUrl: url })}
            />
          ) : null}

          {layout === "centerfold_left" || layout === "centerfold_right" ? (
            <TalisBooksImageField
              id={`${page.id}-spread`}
              label="Spread image"
              value={page.spreadImageUrl ?? ""}
              onChange={(url) => onUpdatePage(page.id, { spreadImageUrl: url })}
            />
          ) : null}

          {layout === "maps" ? (
            <>
              <Field id={`${page.id}-address`} label="Address">
                <input
                  id={`${page.id}-address`}
                  className="talisbooks-viewer-live-edit__input"
                  value={page.address ?? ""}
                  onChange={(event) =>
                    onUpdatePage(page.id, { address: event.target.value })
                  }
                />
              </Field>
              <Field id={`${page.id}-latitude`} label="Latitude">
                <input
                  id={`${page.id}-latitude`}
                  className="talisbooks-viewer-live-edit__input"
                  type="number"
                  step="any"
                  value={page.latitude ?? ""}
                  onChange={(event) =>
                    onUpdatePage(page.id, {
                      latitude: event.target.value
                        ? Number(event.target.value)
                        : undefined,
                    })
                  }
                />
              </Field>
              <Field id={`${page.id}-longitude`} label="Longitude">
                <input
                  id={`${page.id}-longitude`}
                  className="talisbooks-viewer-live-edit__input"
                  type="number"
                  step="any"
                  value={page.longitude ?? ""}
                  onChange={(event) =>
                    onUpdatePage(page.id, {
                      longitude: event.target.value
                        ? Number(event.target.value)
                        : undefined,
                    })
                  }
                />
              </Field>
              <Field id={`${page.id}-map-zoom`} label="Map zoom">
                <input
                  id={`${page.id}-map-zoom`}
                  className="talisbooks-viewer-live-edit__input"
                  type="number"
                  min={1}
                  max={20}
                  value={page.mapZoom ?? 14}
                  onChange={(event) =>
                    onUpdatePage(page.id, {
                      mapZoom: Number(event.target.value) || 14,
                    })
                  }
                />
              </Field>
            </>
          ) : null}
        </>
      ) : null}

      {isAgent ? (
        <>
          {layout === "agent_summary" ? (
            <TalisBooksImageField
              id={`${page.id}-back-cover-bg`}
              label="Back cover background"
              value={page.heroImageUrl ?? ""}
              onChange={(url) => onUpdatePage(page.id, { heroImageUrl: url })}
            />
          ) : null}
          <TalisBooksImageField
            id={`${page.id}-agent-photo`}
            label="Agent photo"
            value={page.agentPhotoUrl ?? ""}
            onChange={(url) => onUpdatePage(page.id, { agentPhotoUrl: url })}
          />
          <TalisBooksImageField
            id={`${page.id}-brokerage-logo`}
            label="Brokerage logo"
            value={page.brokerageLogoUrl ?? ""}
            onChange={(url) => onUpdatePage(page.id, { brokerageLogoUrl: url })}
          />
          <Field id={`${page.id}-agent-name`} label="Agent name">
            <input
              id={`${page.id}-agent-name`}
              className="talisbooks-viewer-live-edit__input"
              value={page.agentName ?? ""}
              onChange={(event) => onUpdatePage(page.id, { agentName: event.target.value })}
            />
          </Field>
          <Field id={`${page.id}-agent-phone`} label="Phone">
            <input
              id={`${page.id}-agent-phone`}
              className="talisbooks-viewer-live-edit__input"
              value={page.agentPhone ?? ""}
              onChange={(event) => onUpdatePage(page.id, { agentPhone: event.target.value })}
            />
          </Field>
          <Field id={`${page.id}-agent-email`} label="Email">
            <input
              id={`${page.id}-agent-email`}
              className="talisbooks-viewer-live-edit__input"
              value={page.agentEmail ?? ""}
              onChange={(event) => onUpdatePage(page.id, { agentEmail: event.target.value })}
            />
          </Field>
          <Field id={`${page.id}-slogan`} label="Slogan">
            <input
              id={`${page.id}-slogan`}
              className="talisbooks-viewer-live-edit__input"
              value={page.slogan ?? ""}
              onChange={(event) => onUpdatePage(page.id, { slogan: event.target.value })}
            />
          </Field>
          <Field id={`${page.id}-mission`} label="Mission">
            <textarea
              id={`${page.id}-mission`}
              className="talisbooks-viewer-live-edit__textarea"
              rows={3}
              value={page.mission ?? ""}
              onChange={(event) => onUpdatePage(page.id, { mission: event.target.value })}
            />
          </Field>
        </>
      ) : null}
    </section>
  );
}

export default function TalisBooksViewerLiveEditor({
  leftPage,
  rightPage,
  bindingLabel,
  viewMode = "spread",
  onUpdatePage,
  onAddPage,
}: TalisBooksViewerLiveEditorProps) {
  const hasPages = Boolean(leftPage || rightPage);
  const singleMode = viewMode === "single";
  const anchorPageId = (rightPage ?? leftPage)?.id ?? null;

  return (
    <aside className="talisbooks-viewer-live-edit" aria-label="Live page editing">
      <div className="talisbooks-viewer-live-edit__header">
        <p className="talisbooks-viewer-live-edit__eyebrow">Live edit</p>
        <h2 className="talisbooks-viewer-live-edit__title">Page editor</h2>
        <p className="talisbooks-viewer-live-edit__context">{bindingLabel}</p>
        {onAddPage ? (
          <button
            type="button"
            className="talisbooks-viewer-live-edit__add-page"
            onClick={() => onAddPage(anchorPageId)}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Add page
          </button>
        ) : null}
      </div>

      <div className="talisbooks-viewer-live-edit__scroll">
        {!hasPages ? (
          <div className="talisbooks-viewer-live-edit__empty-wrap">
            <p className="talisbooks-viewer-live-edit__empty">
              Open the book to edit the current {singleMode ? "page" : "spread"} live.
            </p>
            {onAddPage ? (
              <button
                type="button"
                className="talisbooks-viewer-live-edit__add-page"
                onClick={() => onAddPage(null)}
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                Add first page
              </button>
            ) : null}
          </div>
        ) : singleMode ? (
          leftPage ? (
            <PageEditorCard
              page={leftPage}
              sideLabel="Current page"
              onUpdatePage={onUpdatePage}
            />
          ) : (
            <p className="talisbooks-viewer-live-edit__empty">This page is blank.</p>
          )
        ) : (
          <>
            {leftPage ? (
              <PageEditorCard
                page={leftPage}
                sideLabel="Left page"
                onUpdatePage={onUpdatePage}
              />
            ) : (
              <p className="talisbooks-viewer-live-edit__empty">Left page is blank.</p>
            )}
            {rightPage ? (
              <PageEditorCard
                page={rightPage}
                sideLabel="Right page"
                onUpdatePage={onUpdatePage}
              />
            ) : (
              <p className="talisbooks-viewer-live-edit__empty">Right page is blank.</p>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
