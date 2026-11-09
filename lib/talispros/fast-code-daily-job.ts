import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin, isSupabaseAdminConfigured } from "@/lib/supabaseAdmin";
import { SALES_ASSOCIATE_LOGINS } from "@/lib/talispros/fast-code-slots";
import { RESERVED_FAST_CODES, pickLeastLoaded, proposeFastCode } from "@/lib/talispros/fast-code-tracker";
import { recordFastCodeUpdate } from "@/lib/talispros/fast-code-tracker-server";
import { ANCHOR_TOWNS, googleCustomSearch, googlePlacesKey, searchMarket } from "@/lib/talispros/google-sourcing";
import { websiteHost } from "@/lib/talispros/prospect-markets";
import {
  assignedCopy,
  postTalisbotCard,
  progressCopy,
  resultCopy,
} from "@/lib/talispros/admin-talisbot-messages";
import { systemMapsiteOpeningZoom } from "@/lib/talispros/system-mapsite-zoom";
import { saveSystemMapsiteOpeningZoom } from "@/lib/talispros/system-mapsite-zoom-server";
import { resolveBrokerageWebsiteUrl } from "@/lib/talisbooks/blocked-listing-sources";
import {
  isSystemListingEbookBuild,
  refreshSystemEbookFromBrokerageWebsite,
} from "@/lib/talisbooks/brokerage-site-listing-images";
import { hasCompletedMapSiteActivationPayment } from "@/lib/talispros/mapsite-payment";

/**
 * Daily FAST Code job (Vercel cron 00:30 UTC = 06:00 IST, plus "Run now").
 *  1. Refresh: re-read each tracked brokerage's own website (MLS® numbers it
 *     shows) and log new/removed listings. eBook photos, when refreshed, come
 *     from that same brokerage website. Google is used for place and page
 *     counts only. Realtor.ca and its CDN are never requested.
 *  1b. Sourcing: Google Places Text Search in the next anchor-town markets
 *     (Ralf's parameters, lib/talispros/prospect-markets.ts) → review queue.
 *  2. Assign: approved sourcing-queue prospects get a person-initials FAST Code
 *     from the decision maker's first+last name (never brokerage words) that
 *     collides with nothing (codes, Mapsites, build requests, reserved) and go
 *     to the less-loaded sales associate. Without a decision-maker name the
 *     proposed_code stays null ("Code pending").
 * Every candidate needs admin approval; fields Google does not give
 * (decision maker, position, cell, email) stay blank ("to research").
 */

function db(): SupabaseClient {
  return getSupabaseAdmin() as unknown as SupabaseClient;
}

const UA = "Mozilla/5.0 (compatible; TalisprosDailyCheck/1.0; +https://www.talispros.com)";

async function fetchWithTimeout(url: string, init: RequestInit = {}, ms = 10000): Promise<Response | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal, redirect: "follow", cache: "no-store" });
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** MLS® numbers mentioned on a page (e.g. "MLS® #202412345", "MLS: E1234567"). */
export function extractMlsNumbers(html: string): string[] {
  const text = html.replace(/<[^>]+>/g, " ").replace(/&reg;|®/g, "®").replace(/&nbsp;|\s+/g, " ");
  const out = new Set<string>();
  const re = /MLS®?\s*(?:#|No\.?|number|Num\.?)?\s*:?\s*#?\s*([A-Z]{0,2}\d{6,9})\b/gi;
  for (const m of text.matchAll(re)) out.add(m[1]!.toUpperCase());
  return [...out];
}

async function fetchText(url: string): Promise<{ status: number; html: string }> {
  const res = await fetchWithTimeout(url, { headers: { "user-agent": UA, accept: "text/html" } }, 8000);
  if (!res) return { status: 0, html: "" };
  const html = res.ok ? (await res.text().catch(() => "")).slice(0, 1_500_000) : "";
  return { status: res.status, html };
}

/** Brokerage's own website: homepage plus up to 3 same-site listing pages it links to. */
async function scanBrokerageSite(url: string): Promise<{ status: number; ids: string[]; pages: number }> {
  const home = await fetchText(url);
  if (!home.html) return { status: home.status, ids: [], pages: 0 };
  const ids = new Set(extractMlsNumbers(home.html));
  let host: string;
  try {
    host = new URL(url).host;
  } catch {
    return { status: home.status, ids: [...ids], pages: 1 };
  }
  const links = new Set<string>();
  for (const m of home.html.matchAll(/href=["']([^"'#]+)["']/gi)) {
    if (!/listing|propert|inscription|for-sale|a-vendre/i.test(m[1]!)) continue;
    try {
      const u = new URL(m[1]!, url);
      if (u.host === host) links.add(u.toString());
    } catch {
      /* ignore */
    }
    if (links.size >= 3) break;
  }
  let pages = 1;
  for (const link of links) {
    const page = await fetchText(link);
    if (page.html) {
      pages++;
      for (const id of extractMlsNumbers(page.html)) ids.add(id);
    }
  }
  return { status: home.status, ids: [...ids], pages };
}

/** Optional: Google Programmable Search count of MLS® pages on the brokerage domain. */
async function customSearchCount(host: string): Promise<number | null> {
  const cse = googleCustomSearch();
  if (!cse) return null;
  const q = encodeURIComponent(`site:${host} MLS`);
  const res = await fetchWithTimeout(`https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(cse.key)}&cx=${encodeURIComponent(cse.cx)}&q=${q}`);
  if (!res?.ok) return null;
  const json = (await res.json().catch(() => ({}))) as { searchInformation?: { totalResults?: string } };
  const n = Number(json.searchInformation?.totalResults);
  return Number.isFinite(n) ? n : null;
}

export const MARKETS_PER_RUN = 3;

export interface SourcingSummary {
  markets: { market: string; found: number; added: number; duplicates: number; error?: string }[];
  added: number;
  duplicates: number;
  franchisesSkipped: number;
  errors: string[];
  keyEnv: string | null;
  customSearch: boolean;
  nextMarketIndex?: number;
}

/** Next markets in east→west order, continuing from the last run. */
async function sourceFromGoogle(s: SourcingSummary): Promise<void> {
  const key = googlePlacesKey();
  s.keyEnv = key?.envName ?? null;
  s.customSearch = Boolean(googleCustomSearch());
  if (!key) {
    s.errors.push("No Google Places key on the server");
    return;
  }
  const { data: last } = await db()
    .from("fast_code_job_runs")
    .select("summary")
    .not("finished_at", "is", null)
    .order("started_at", { ascending: false })
    .limit(20);
  let start = 0;
  for (const r of (last ?? []) as { summary: { sourcing?: SourcingSummary } | null }[]) {
    const n = r.summary?.sourcing?.nextMarketIndex;
    if (typeof n === "number") {
      start = n;
      break;
    }
  }
  const [{ data: q }, { data: maps }] = await Promise.all([
    db().from("prospect_queue").select("google_place_id, website"),
    db().from("mapsites").select("broker_url"),
  ]);
  const places = new Set<string>();
  const hosts = new Set<string>();
  for (const r of (q ?? []) as { google_place_id: string | null; website: string | null }[]) {
    if (r.google_place_id) places.add(r.google_place_id);
    const h = websiteHost(r.website);
    if (h) hosts.add(h);
  }
  for (const r of (maps ?? []) as { broker_url: string | null }[]) {
    const h = websiteHost(r.broker_url);
    if (h) hosts.add(h);
  }
  let i = start % ANCHOR_TOWNS.length;
  for (let n = 0; n < MARKETS_PER_RUN; n++, i = (i + 1) % ANCHOR_TOWNS.length) {
    const town = ANCHOR_TOWNS[i]!;
    const res = await searchMarket(town);
    s.franchisesSkipped += res.skippedFranchise;
    const row = { market: res.market, found: res.candidates.length, added: 0, duplicates: 0, error: res.error };
    if (res.error) s.errors.push(`${res.market}: ${res.error}`);
    for (const c of res.candidates) {
      const host = websiteHost(c.website);
      if (places.has(c.placeId) || (host && hosts.has(host))) {
        row.duplicates++;
        continue;
      }
      const prospect = {
        brokerage: c.name,
        contact_name: null,
        office_address: c.address,
        town: town.town,
        province: town.province,
        website: c.website,
        office_phone: c.phone,
        source_url: c.mapsUri,
        google_place_id: c.placeId,
        market: res.market,
        market_rank: c.rank,
        rating: c.rating,
        rating_count: c.ratingCount,
        latitude: c.lat,
        longitude: c.lng,
        sourced_by: "google-places",
        research_notes: `Google Places: ${c.rating ?? "–"}★ (${c.ratingCount ?? 0} reviews). Decision maker, position, cell and email: to research.`,
        status: "pending",
      };
      const latitude = typeof c.lat === "number" ? c.lat : null;
      const openingZoom = latitude == null ? null : systemMapsiteOpeningZoom(latitude);
      let { error } = await db()
        .from("prospect_queue")
        .insert(openingZoom == null ? prospect : { ...prospect, opening_zoom: openingZoom });
      if (error && /opening_zoom/i.test(error.message)) {
        ({ error } = await db().from("prospect_queue").insert(prospect));
      }
      if (error) {
        if (/duplicate/i.test(error.message)) row.duplicates++;
        else s.errors.push(`${c.name}: ${error.message}`);
        continue;
      }
      places.add(c.placeId);
      if (host) hosts.add(host);
      row.added++;
    }
    s.added += row.added;
    s.duplicates += row.duplicates;
    s.markets.push(row);
    if (res.error && /40[13]|PERMISSION|API_KEY|REQUEST_DENIED/i.test(res.error)) {
      // Access problem: retry the same market next time.
      i = (i + 1) % ANCHOR_TOWNS.length;
      s.nextMarketIndex = start % ANCHOR_TOWNS.length;
      return;
    }
  }
  s.nextMarketIndex = i;
}

export interface DailyJobSummary {
  refreshed: number;
  listingChanges: number;
  websitesScanned: number;
  sourcing: SourcingSummary;
  brokerSitesDown: string[];
  assigned: { code: string; agent: string; brokerage: string }[];
  pendingReview: number;
  errors: string[];
}

async function refreshCodes(summary: DailyJobSummary): Promise<void> {
  const { data } = await db()
    .from("fast_code_status")
    .select("fast_code, mapsite_id, agent_id, website_listing_ids, mapsites(broker_url, website, status)");
  const rows = (data ?? []) as {
    fast_code: string;
    mapsite_id: string | null;
    agent_id: string | null;
    website_listing_ids: string[] | null;
    mapsites:
      | { broker_url: string | null; website: string | null; status: string | null }
      | { broker_url: string | null; website: string | null; status: string | null }[]
      | null;
  }[];
  for (const row of rows) {
    const m = Array.isArray(row.mapsites) ? row.mapsites[0] : row.mapsites;
    const now = new Date().toISOString();
    const update: Record<string, unknown> = { last_refreshed_at: now };
    const details: Record<string, unknown> = {};
    // Brokerage's own website only. Realtor.ca hosts are never fetched.
    const brokerageWebsite = resolveBrokerageWebsiteUrl(m?.broker_url, m?.website);
    if ((m?.broker_url || m?.website) && !brokerageWebsite) {
      console.warn(
        `[fast-code-daily-job] ${row.fast_code}: brokerage website is a blocked listing source; ebook images left unchanged`,
      );
      summary.errors.push(`${row.fast_code.toUpperCase()}: skipped a blocked listing website`);
    }
    if (brokerageWebsite) {
      const scan = await scanBrokerageSite(brokerageWebsite);
      update.broker_site_status = scan.status;
      details.brokerSite = scan.status;
      if (!scan.status || scan.status >= 400) summary.brokerSitesDown.push(row.fast_code.toUpperCase());
      if (scan.pages) {
        summary.websitesScanned++;
        const before = row.website_listing_ids;
        const prev = new Set(before ?? []);
        const next = new Set(scan.ids);
        const added = scan.ids.filter((id) => !prev.has(id));
        const removed = (before ?? []).filter((id) => !next.has(id));
        update.website_listing_ids = scan.ids;
        update.listings_count = scan.ids.length;
        update.listings_source_status = "website";
        details.websiteListings = scan.ids.length;
        const host = websiteHost(brokerageWebsite);
        const cseCount = host ? await customSearchCount(host) : null;
        if (cseCount !== null) details.googleSitePages = cseCount;
        if (before && (added.length || removed.length)) {
          summary.listingChanges++;
          await recordFastCodeUpdate({
            fastCode: row.fast_code,
            agentId: row.agent_id,
            mapsiteId: row.mapsite_id,
            eventType: "listings",
            note: `Brokerage website: ${added.length} new, ${removed.length} removed MLS® numbers`,
            details: { added: added.slice(0, 20), removed: removed.slice(0, 20), source: "website" },
            createdBy: "daily-job",
          });
          const paymentReceived = await hasCompletedMapSiteActivationPayment({
            fastCode: row.fast_code,
            mapsiteId: row.mapsite_id,
            reconcileFromStripe: false,
          });
          const systemEbook = isSystemListingEbookBuild({
            fastCode: row.fast_code,
            mapsiteStatus: m?.status,
            paymentReceived,
          });
          let ebookImages: { updated: boolean; imageCount: number } = {
            updated: false,
            imageCount: 0,
          };
          if (systemEbook) {
            try {
              ebookImages = await refreshSystemEbookFromBrokerageWebsite({
                fastCode: row.fast_code,
                mapsiteId: row.mapsite_id,
                brokerUrl: m?.broker_url,
                website: m?.website,
              });
            } catch (error) {
              const message = error instanceof Error ? error.message : String(error);
              console.warn(
                `[fast-code-daily-job] ${row.fast_code}: brokerage ebook refresh failed; images left unchanged`,
                message,
              );
              summary.errors.push(`${row.fast_code.toUpperCase()}: ebook refresh failed`);
            }
          }
          await recordFastCodeUpdate({
            fastCode: row.fast_code,
            agentId: row.agent_id,
            mapsiteId: row.mapsite_id,
            eventType: "ebook",
            note: ebookImages.updated
              ? "Listings changed: eBook photos refreshed from the brokerage website"
              : "Listings changed: eBook pages need a refresh",
            details: {
              added: added.length,
              removed: removed.length,
              imageSource: ebookImages.updated ? "brokerage-website" : "unchanged",
              imageCount: ebookImages.imageCount,
            },
            createdBy: "daily-job",
          });
        }
      }
    }
    await db().from("fast_code_status").update(update).eq("fast_code", row.fast_code);
    await recordFastCodeUpdate({
      fastCode: row.fast_code,
      agentId: row.agent_id,
      mapsiteId: row.mapsite_id,
      eventType: "refresh",
      details,
      createdBy: "daily-job",
    });
    summary.refreshed++;
  }
}

/** Every code already in use anywhere, lower-cased. */
export async function loadTakenCodes(): Promise<Set<string>> {
  const taken = new Set<string>(RESERVED_FAST_CODES);
  const add = (rows: unknown, key: string) => {
    for (const r of (rows ?? []) as Record<string, unknown>[]) {
      const v = r[key];
      if (typeof v === "string" && v.trim()) taken.add(v.trim().toLowerCase());
    }
  };
  const [codes, maps, reqs, queue, status] = await Promise.all([
    db().from("fast_codes").select("code"),
    db().from("mapsites").select("fast_code"),
    db().from("build_requests").select("requested_fast_code"),
    db().from("prospect_queue").select("proposed_code"),
    db().from("fast_code_status").select("fast_code"),
  ]);
  add(codes.data, "code");
  add(maps.data, "fast_code");
  add(reqs.data, "requested_fast_code");
  add(queue.data, "proposed_code");
  add(status.data, "fast_code");
  return taken;
}

export async function assignApproved(summary: DailyJobSummary): Promise<void> {
  const { data: agents } = await db()
    .from("agent_admins")
    .select("id, login_id, name, status")
    .in("login_id", SALES_ASSOCIATE_LOGINS as unknown as string[]);
  const active = ((agents ?? []) as { id: string; login_id: string; name: string; status: string }[]).filter(
    (a) => a.status === "active",
  );
  if (!active.length) return;
  const [{ data: statusRows }, { data: queueRows }] = await Promise.all([
    db().from("fast_code_status").select("agent_id"),
    db().from("prospect_queue").select("id, brokerage, contact_name, assigned_agent_id, proposed_code, status, latitude"),
  ]);
  const load = new Map(active.map((a) => [a.id, 0]));
  for (const r of (statusRows ?? []) as { agent_id: string | null }[]) if (r.agent_id && load.has(r.agent_id)) load.set(r.agent_id, load.get(r.agent_id)! + 1);
  const queue = (queueRows ?? []) as { id: string; brokerage: string; contact_name: string | null; assigned_agent_id: string | null; proposed_code: string | null; status: string; latitude: number | null }[];
  for (const q of queue) if (q.status === "approved" && q.assigned_agent_id && load.has(q.assigned_agent_id)) load.set(q.assigned_agent_id, load.get(q.assigned_agent_id)! + 1);
  summary.pendingReview = queue.filter((q) => q.status === "pending").length;

  const taken = await loadTakenCodes();
  for (const q of queue.filter((x) => x.status === "approved" && (!x.proposed_code || !x.assigned_agent_id))) {
    const pick = pickLeastLoaded(active.map((a) => ({ id: a.id, count: load.get(a.id) ?? 0, name: a.name })));
    if (!pick) break;

    let code = q.proposed_code?.trim().toLowerCase() || null;
    if (!code) {
      code = proposeFastCode(q.contact_name, taken);
      if (!code) {
        // Decision-maker name required for a code; still assign an agent if missing.
        if (!q.assigned_agent_id) {
          const { error } = await db()
            .from("prospect_queue")
            .update({ assigned_agent_id: pick.id })
            .eq("id", q.id);
          if (error) summary.errors.push(`assign ${q.brokerage}: ${error.message}`);
          else {
            load.set(pick.id, pick.count + 1);
            summary.errors.push(`code pending for ${q.brokerage}: decision maker name needed`);
          }
        }
        continue;
      }
    }

    taken.add(code);
    load.set(pick.id, (load.get(pick.id) ?? pick.count) + 1);
    const { error } = await db()
      .from("prospect_queue")
      .update({ proposed_code: code, assigned_agent_id: q.assigned_agent_id || pick.id })
      .eq("id", q.id);
    if (error) {
      summary.errors.push(`assign ${q.brokerage}: ${error.message}`);
      continue;
    }
    const agentId = q.assigned_agent_id || pick.id;
    const agentName = active.find((a) => a.id === agentId)?.name ?? pick.name;
    await recordFastCodeUpdate({
      fastCode: code,
      agentId,
      eventType: "assigned",
      stage: "new",
      note: `${q.brokerage} → ${agentName}`,
      details: { queueId: q.id },
      createdBy: "daily-job",
    });
    summary.assigned.push({ code: code.toUpperCase(), agent: agentName, brokerage: q.brokerage });
    if (typeof q.latitude === "number") {
      await saveSystemMapsiteOpeningZoom(code, q.latitude).catch(() => undefined);
    }
  }
}

export async function runFastCodeDailyJob(triggeredBy: string): Promise<DailyJobSummary> {
  const summary: DailyJobSummary = {
    refreshed: 0,
    listingChanges: 0,
    websitesScanned: 0,
    sourcing: { markets: [], added: 0, duplicates: 0, franchisesSkipped: 0, errors: [], keyEnv: null, customSearch: false },
    brokerSitesDown: [],
    assigned: [],
    pendingReview: 0,
    errors: [],
  };
  if (!isSupabaseAdminConfigured()) {
    summary.errors.push("database not configured");
    return summary;
  }
  const { data: run } = await db().from("fast_code_job_runs").insert({ triggered_by: triggeredBy }).select("id").single();

  // Peek next markets for the progress card (same rotation as sourceFromGoogle).
  const peekTowns: string[] = [];
  try {
    const { data: last } = await db()
      .from("fast_code_job_runs")
      .select("summary")
      .not("finished_at", "is", null)
      .order("started_at", { ascending: false })
      .limit(20);
    let start = 0;
    for (const r of (last ?? []) as { summary: { sourcing?: { nextMarketIndex?: number } } | null }[]) {
      const n = r.summary?.sourcing?.nextMarketIndex;
      if (typeof n === "number") {
        start = n;
        break;
      }
    }
    for (let n = 0, i = start % ANCHOR_TOWNS.length; n < MARKETS_PER_RUN && ANCHOR_TOWNS.length; n++, i = (i + 1) % ANCHOR_TOWNS.length) {
      const t = ANCHOR_TOWNS[i]!;
      peekTowns.push(`${t.town}, ${t.province}`);
    }
  } catch {
    /* progress card is best-effort */
  }
  await postTalisbotCard({
    type: "progress",
    i18n: progressCopy(peekTowns),
    metadata: { triggeredBy, towns: peekTowns, jobRunId: (run as { id?: string } | null)?.id ?? null },
    createdBy: "talisbot",
  }).catch(() => undefined);

  try {
    await refreshCodes(summary);
  } catch (e) {
    summary.errors.push(`refresh: ${e instanceof Error ? e.message : String(e)}`);
  }
  try {
    await sourceFromGoogle(summary.sourcing);
  } catch (e) {
    summary.sourcing.errors.push(`sourcing: ${e instanceof Error ? e.message : String(e)}`);
  }
  try {
    await assignApproved(summary);
  } catch (e) {
    summary.errors.push(`assign: ${e instanceof Error ? e.message : String(e)}`);
  }
  if (run?.id) {
    await db()
      .from("fast_code_job_runs")
      .update({ finished_at: new Date().toISOString(), summary })
      .eq("id", (run as { id: string }).id);
  }

  const marketLabels = (summary.sourcing.markets ?? []).map((m) => m.market);
  await postTalisbotCard({
    type: "result",
    i18n: resultCopy(summary.sourcing.added ?? 0, marketLabels),
    metadata: {
      triggeredBy,
      added: summary.sourcing.added,
      markets: marketLabels,
      jobRunId: (run as { id?: string } | null)?.id ?? null,
    },
    createdBy: "talisbot",
  }).catch(() => undefined);

  if (summary.assigned.length) {
    await postTalisbotCard({
      type: "assigned",
      i18n: assignedCopy(summary.assigned),
      metadata: { triggeredBy, assigned: summary.assigned },
      createdBy: "talisbot",
    }).catch(() => undefined);
  }

  return summary;
}
