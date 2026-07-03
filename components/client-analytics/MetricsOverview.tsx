"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useSpring, useTransform } from "framer-motion";
import {
  ChevronDown,
  Mail,
  MessageSquare,
  Share2,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import type { ClientMarketingMetric } from "@/lib/client-marketing-service";
import {
  formatReportDate,
  formatReportDateNumeric,
  formatReportDateShort,
} from "@/lib/format-report-date";

const PIPELINE_LABELS: Record<string, string> = {
  prospecting: "Prospecting",
  active: "Active",
  nurturing: "Nurturing",
  under_contract: "Under Contract",
  closed: "Closed",
};

const PIPELINE_COLORS: Record<string, string> = {
  prospecting: "bg-slate-500",
  active: "bg-emerald-500",
  nurturing: "bg-amber-500",
  under_contract: "bg-blue-500",
  closed: "bg-neutral-500",
};

type MetricKey =
  | "facebookImpressions"
  | "instagramImpressions"
  | "totalReach"
  | "emailsReceived"
  | "textsReceived";

interface MetricCardConfig {
  key: MetricKey;
  label: string;
  icon: typeof Share2;
  color: string;
  hoverColor: string;
  accent: string;
  barColor: string;
}

const METRIC_CARDS: MetricCardConfig[] = [
  {
    key: "facebookImpressions",
    label: "Facebook Impressions",
    icon: Share2,
    color: "bg-blue-50 border-blue-200",
    hoverColor: "hover:border-blue-400 hover:bg-blue-100/80",
    accent: "text-blue-600",
    barColor: "bg-blue-500",
  },
  {
    key: "instagramImpressions",
    label: "Instagram Impressions",
    icon: Sparkles,
    color: "bg-pink-50 border-pink-200",
    hoverColor: "hover:border-pink-400 hover:bg-pink-100/80",
    accent: "text-pink-600",
    barColor: "bg-pink-500",
  },
  {
    key: "totalReach",
    label: "Total Reach",
    icon: Users,
    color: "bg-purple-50 border-purple-200",
    hoverColor: "hover:border-purple-400 hover:bg-purple-100/80",
    accent: "text-purple-600",
    barColor: "bg-purple-500",
  },
  {
    key: "emailsReceived",
    label: "Emails Received",
    icon: Mail,
    color: "bg-green-50 border-green-200",
    hoverColor: "hover:border-green-400 hover:bg-green-100/80",
    accent: "text-green-600",
    barColor: "bg-green-600",
  },
  {
    key: "textsReceived",
    label: "Texts Received",
    icon: MessageSquare,
    color: "bg-yellow-50 border-yellow-200",
    hoverColor: "hover:border-yellow-400 hover:bg-yellow-100/80",
    accent: "text-yellow-700",
    barColor: "bg-yellow-500",
  },
];

function formatPipelineStatus(status: string): string {
  return PIPELINE_LABELS[status] ?? status.replace(/_/g, " ");
}

function AnimatedValue({ value }: { value: number }) {
  const spring = useSpring(0, { stiffness: 90, damping: 18 });
  const display = useTransform(spring, (current) =>
    Math.round(current).toLocaleString("en-US")
  );

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span>{display}</motion.span>;
}

function getTrend(
  history: ClientMarketingMetric[],
  key: MetricKey
): { delta: number; percent: number | null } | null {
  if (history.length < 2) return null;
  const current = history[history.length - 1][key];
  const previous = history[history.length - 2][key];
  const delta = current - previous;
  const percent =
    previous === 0 ? (current > 0 ? 100 : null) : Math.round((delta / previous) * 100);
  return { delta, percent };
}

function MiniBarChart({
  history,
  metricKey,
  barColor,
}: {
  history: ClientMarketingMetric[];
  metricKey: MetricKey;
  barColor: string;
}) {
  const values = history.map((entry) => entry[metricKey]);
  const max = Math.max(...values, 1);

  return (
    <div className="flex items-end gap-1.5 h-16 mt-3">
      {history.map((entry) => {
        const value = entry[metricKey];
        const height = Math.max(8, Math.round((value / max) * 100));
        return (
          <div key={entry.id} className="flex-1 flex flex-col items-center gap-1">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${height}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 16 }}
              className={`w-full rounded-md ${barColor} min-h-[6px]`}
              title={`${formatReportDate(entry.reportDate)}: ${value.toLocaleString("en-US")}`}
            />
            <span className="text-[10px] text-neutral-400">
              {formatReportDateNumeric(entry.reportDate)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

interface MetricsOverviewProps {
  metrics: ClientMarketingMetric | null;
  history?: ClientMarketingMetric[];
}

export default function MetricsOverview({
  metrics,
  history = [],
}: MetricsOverviewProps) {
  const [expandedKey, setExpandedKey] = useState<MetricKey | null>(null);
  const pipelineStatus = metrics?.pipelineStatus ?? "active";

  const shareOfReach = useMemo(() => {
    if (!metrics || metrics.totalReach === 0) return null;
    return {
      facebook: Math.round((metrics.facebookImpressions / metrics.totalReach) * 100),
      instagram: Math.round((metrics.instagramImpressions / metrics.totalReach) * 100),
    };
  }, [metrics]);

  return (
    <div>
      <div className="flex items-end justify-between gap-4 mb-4">
        <h2 className="text-lg font-semibold text-neutral-900">Marketing Performance</h2>
        {metrics?.reportDate ? (
          <p className="text-xs text-neutral-400">
            Updated {formatReportDateShort(metrics.reportDate)}
          </p>
        ) : null}
      </div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.06 } },
        }}
      >
        {METRIC_CARDS.map((card) => {
          const Icon = card.icon;
          const value = metrics?.[card.key] ?? null;
          const trend = getTrend(history, card.key);
          const isExpanded = expandedKey === card.key;
          const share =
            card.key === "facebookImpressions"
              ? shareOfReach?.facebook
              : card.key === "instagramImpressions"
                ? shareOfReach?.instagram
                : null;

          return (
            <motion.button
              key={card.key}
              type="button"
              layout
              variants={{
                hidden: { opacity: 0, y: 16 },
                visible: { opacity: 1, y: 0 },
              }}
              whileHover={{ y: -3, scale: 1.01 }}
              whileTap={{ scale: 0.985 }}
              onClick={() =>
                setExpandedKey((current) => (current === card.key ? null : card.key))
              }
              className={`rounded-xl border p-5 text-left transition-colors cursor-pointer shadow-sm hover:shadow-md ${card.color} ${card.hoverColor} ${
                isExpanded ? "ring-2 ring-neutral-900/10 shadow-md" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/70 ${card.accent}`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    {card.label}
                  </p>
                </div>
                <motion.span
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  className="text-neutral-400"
                >
                  <ChevronDown className="h-4 w-4" />
                </motion.span>
              </div>

              <div className="mt-3 flex items-end justify-between gap-3">
                <p className="text-3xl font-bold text-neutral-900 tabular-nums">
                  {value === null ? "—" : <AnimatedValue value={value} />}
                </p>
                {trend && trend.delta !== 0 ? (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                      trend.delta > 0
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {trend.delta > 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {trend.percent !== null
                      ? `${trend.delta > 0 ? "+" : ""}${trend.percent}%`
                      : `${trend.delta > 0 ? "+" : ""}${trend.delta}`}
                  </span>
                ) : null}
              </div>

              <AnimatePresence initial={false}>
                {isExpanded ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 mt-4 border-t border-black/5">
                      {share !== null ? (
                        <p className="text-xs text-neutral-500 mb-2">
                          {share}% of total reach
                        </p>
                      ) : null}
                      {history.length > 1 ? (
                        <>
                          <p className="text-xs font-medium text-neutral-500 mb-1">
                            Last {history.length} days
                          </p>
                          <MiniBarChart
                            history={history}
                            metricKey={card.key}
                            barColor={card.barColor}
                          />
                        </>
                      ) : (
                        <p className="text-xs text-neutral-500">
                          More daily updates will unlock trend charts here.
                        </p>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <p className="text-xs text-neutral-400 mt-3">Tap for trend details</p>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}

        <motion.div
          layout
          variants={{
            hidden: { opacity: 0, y: 16 },
            visible: { opacity: 1, y: 0 },
          }}
          whileHover={{ y: -3 }}
          className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
        >
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">
            Pipeline Status
          </p>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-40 ${PIPELINE_COLORS[pipelineStatus] ?? "bg-neutral-500"}`}
              />
              <span
                className={`relative inline-flex h-2.5 w-2.5 rounded-full ${PIPELINE_COLORS[pipelineStatus] ?? "bg-neutral-500"}`}
              />
            </span>
            <span className="inline-flex items-center rounded-full bg-neutral-900 px-3 py-1 text-sm font-medium text-white">
              {formatPipelineStatus(pipelineStatus)}
            </span>
          </div>
          {metrics?.reportDate ? (
            <p className="text-xs text-neutral-400 mt-4">
              Tracking since {formatReportDate(metrics.reportDate)}
            </p>
          ) : null}
        </motion.div>
      </motion.div>

      {!metrics ? (
        <p className="text-sm text-neutral-500">
          No metrics posted yet. Your marketing manager will update this dashboard daily.
        </p>
      ) : null}
    </div>
  );
}
