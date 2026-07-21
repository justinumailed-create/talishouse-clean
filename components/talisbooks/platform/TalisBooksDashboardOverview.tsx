import Link from "next/link";
import {
  BookOpen,
  FileEdit,
  FileText,
  Image,
  Shapes,
  Users,
} from "lucide-react";
import { TALISBOOKS_PRODUCT_NAME } from "@/lib/talisbooks/constants";
import { TALISBOOKS_ROUTES } from "@/lib/talisbooks/routes";
import type { TalisBooksDashboardData } from "@/lib/talisbooks/types";

interface TalisBooksDashboardOverviewProps {
  data: TalisBooksDashboardData;
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">{label}</p>
        <Icon className="h-4 w-4 text-neutral-400" />
      </div>
      <p className="mt-2 text-3xl font-semibold text-neutral-900">{value}</p>
    </div>
  );
}

function ActivityList({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: TalisBooksDashboardData["latestBooks"];
  emptyLabel: string;
}) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-neutral-900">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-500">{emptyLabel}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-neutral-900">{item.title}</p>
                <p className="truncate text-xs text-neutral-500">{item.subtitle}</p>
              </div>
              {item.badge ? (
                <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
                  {item.badge}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function TalisBooksDashboardOverview({
  data,
}: TalisBooksDashboardOverviewProps) {
  const { stats, latestBooks, recentPages, recentPublishEvents } = data;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
            Command Center
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
            {TALISBOOKS_PRODUCT_NAME} Dashboard
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-500">
            Architecture scaffold for digital books — books, pages, templates, images,
            layouts, authors, and publish workflows.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={TALISBOOKS_ROUTES.DASHBOARD_BOOKS}
            className="inline-flex items-center rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-50"
          >
            View Books
          </Link>
          <Link
            href={TALISBOOKS_ROUTES.EDITOR}
            className="inline-flex items-center rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
          >
            Open Editor
          </Link>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Books" value={stats.totalBooks} icon={BookOpen} />
        <MetricCard label="Published" value={stats.publishedBooks} icon={FileEdit} />
        <MetricCard label="Pages" value={stats.totalPages} icon={FileText} />
        <MetricCard label="Authors" value={stats.totalAuthors} icon={Users} />
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Drafts" value={stats.draftBooks} icon={FileEdit} />
        <MetricCard label="In Review" value={stats.inReviewBooks} icon={FileEdit} />
        <MetricCard label="Templates" value={stats.totalTemplates} icon={Shapes} />
        <MetricCard label="Images" value={stats.totalImages} icon={Image} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ActivityList
          title="Latest Books"
          items={latestBooks}
          emptyLabel="No books yet — architecture is ready."
        />
        <ActivityList
          title="Recent Pages"
          items={recentPages}
          emptyLabel="No pages yet."
        />
        <ActivityList
          title="Publish Activity"
          items={recentPublishEvents}
          emptyLabel="No publish events yet."
        />
      </div>
    </div>
  );
}
