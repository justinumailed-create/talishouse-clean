"use client";

import { motion } from "framer-motion";
import type { TalisMapsVisitorTrendPoint } from "@/lib/talismaps/types";

interface TalisMapsVisitorTrendProps {
  points: TalisMapsVisitorTrendPoint[];
  totalVisitors: number;
}

export default function TalisMapsVisitorTrend({
  points,
  totalVisitors,
}: TalisMapsVisitorTrendProps) {
  const max = Math.max(...points.map((point) => point.count), 1);
  const hasData = points.some((point) => point.count > 0);

  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-neutral-100 px-6 py-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
            Analytics
          </p>
          <h2 className="mt-1 text-lg font-semibold text-neutral-900">Visitor Trend</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Map views across your published Talismaps™ network.
          </p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-neutral-400">
            Total Visitors
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-neutral-900">
            {totalVisitors.toLocaleString("en-US")}
          </p>
        </div>
      </div>

      <div className="px-6 py-6">
        {hasData ? (
          <div className="flex h-36 items-end gap-2 sm:gap-3">
            {points.map((point, index) => {
              const height = Math.max(10, Math.round((point.count / max) * 100));
              return (
                <div key={point.date} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                  <motion.div
                    initial={{ height: 0, opacity: 0.4 }}
                    animate={{ height: `${height}%`, opacity: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 120,
                      damping: 18,
                      delay: index * 0.04,
                    }}
                    className="w-full min-h-[8px] rounded-t-xl bg-gradient-to-t from-neutral-900 to-neutral-600"
                    title={`${point.label}: ${point.count.toLocaleString("en-US")}`}
                  />
                  <div className="text-center">
                    <p className="text-[11px] font-medium tabular-nums text-neutral-700">
                      {point.count.toLocaleString("en-US")}
                    </p>
                    <p className="text-[10px] text-neutral-400">{point.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex h-36 items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50/80">
            <p className="text-sm text-neutral-500">
              Visitor analytics will appear here once maps receive traffic.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
