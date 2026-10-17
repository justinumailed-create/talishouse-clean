"use client";

import { useLocale, useT } from "@/lib/i18n/client";
import {
  CATALOGUE_SPEC_SERVICES,
  catalogueSpecById,
  catalogueSpecPrice,
  catalogueSpecSize,
} from "@/lib/talisu/catalogue-specs";

/**
 * Catalogue spec sheet (T-House / T-Dome / G-House): Ralf's photo on the left,
 * spec panel as HTML on the right so the price reads in CAD.
 */
export default function CatalogueSpecPage({ specId }: { specId: string }) {
  const c = useT().catalogueUi;
  const locale = useLocale() === "de" ? "de" : "en";
  const spec = catalogueSpecById(specId);
  if (!spec) return null;
  return (
    <article className="catalogue-spec" data-testid={`catalogue-spec-${spec.id}`}>
      <div className="catalogue-spec__photo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={spec.photo} alt={`Talishouse™ ${spec.name}`} draggable={false} decoding="async" />
      </div>
      <div className="catalogue-spec__panel">
        <h2 className="catalogue-spec__title">{spec.name} Specs.</h2>
        <p className="catalogue-spec__size">{catalogueSpecSize(spec, locale)}</p>
        <p className="catalogue-spec__small">
          {spec.includesKind === "mayInclude" ? c.specMayInclude : c.specIncludes}
        </p>
        <div className="catalogue-spec__rooms">
          {spec.rooms[locale].map((room) => (
            <p key={room}>{room}</p>
          ))}
        </div>
        <ul className="catalogue-spec__notes">
          {spec.notes[locale].map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
        <p className="catalogue-spec__price" data-testid="catalogue-spec-price">
          {catalogueSpecPrice(spec, { from: c.specFrom, perSqft: c.specPerSqft })}
        </p>
        <p className="catalogue-spec__optional">{c.specOptional}</p>
        <p className="catalogue-spec__where">{c.specWhereAvailable}</p>
        <ul className="catalogue-spec__services">
          {CATALOGUE_SPEC_SERVICES[locale].map((service) => (
            <li key={service}>{service}</li>
          ))}
        </ul>
      </div>
    </article>
  );
}
