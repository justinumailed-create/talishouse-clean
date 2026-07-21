"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Building2,
  Download,
  Eye,
  FileEdit,
  GitBranch,
  Home,
  Map,
  MapPin,
  QrCode,
  Sparkles,
  Users,
} from "lucide-react";
import TalisMapsActivityPanel from "./TalisMapsActivityPanel";
import TalisMapsMetricCard from "./TalisMapsMetricCard";
import TalisMapsVisitorTrend from "./TalisMapsVisitorTrend";
import { TALISMAPS_PRODUCT_NAME } from "@/lib/talismaps/constants";
import { TALISMAPS_ROUTES } from "@/lib/talismaps/routes";
import type { TalisMapsDashboardData } from "@/lib/talismaps/types";

interface TalisMapsDashboardOverviewProps {
  data: TalisMapsDashboardData;
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0 },
};

export default function TalisMapsDashboardOverview({
  data,
}: TalisMapsDashboardOverviewProps) {
  const { stats, latestMaps, recentPinUpdates, recentImports, visitorTrend } = data;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
            Command Center
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
            {TALISMAPS_PRODUCT_NAME} Dashboard
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-500">
            The command center for every map — monitor publishing, pins, visitors,
            account networks, and recent platform activity across TalisMaps™.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={TALISMAPS_ROUTES.DASHBOARD_MAPS}
            className="inline-flex items-center rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-50"
          >
            View Maps
          </Link>
          <Link
            href={TALISMAPS_ROUTES.EDITOR}
            className="inline-flex items-center rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
          >
            Open Editor
          </Link>
        </div>
      </div>

      <motion.div
        className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants}>
          <TalisMapsMetricCard label="Maps" value={stats.totalMaps} icon={Map} tone="blue" />
        </motion.div>
        <motion.div variants={itemVariants}>
          <TalisMapsMetricCard label="Pins" value={stats.totalPins} icon={MapPin} tone="violet" />
        </motion.div>
        <motion.div variants={itemVariants}>
          <TalisMapsMetricCard
            label="Published Maps"
            value={stats.publishedMaps}
            icon={Eye}
            tone="emerald"
            hint="Live across the network"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <TalisMapsMetricCard
            label="Draft Maps"
            value={stats.draftMaps}
            icon={FileEdit}
            tone="amber"
            hint="Awaiting publish"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <TalisMapsMetricCard
            label="Visitors"
            value={stats.visitors}
            icon={Users}
            tone="cyan"
            hint="Total map views"
          />
        </motion.div>
      </motion.div>

      <motion.div
        className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants}>
          <TalisMapsMetricCard
            label="QR Scans"
            value={stats.qrScans}
            icon={QrCode}
            tone="rose"
            hint="Tracked scan events"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <TalisMapsMetricCard
            label="Active Listings"
            value={stats.activeListings}
            icon={Home}
            tone="indigo"
            hint="Property pins"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <TalisMapsMetricCard
            label="Root Accounts"
            value={stats.rootAccounts}
            icon={Building2}
            tone="slate"
            hint="Primary map owners"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <TalisMapsMetricCard
            label="Derivative Accounts"
            value={stats.derivativeAccounts}
            icon={GitBranch}
            tone="blue"
            hint="Network child maps"
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <TalisMapsMetricCard
            label="Adpro PINs"
            value={stats.adproPins}
            icon={Sparkles}
            tone="amber"
            hint="Professional placements"
          />
        </motion.div>
      </motion.div>

      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <TalisMapsVisitorTrend points={visitorTrend} totalVisitors={stats.visitors} />
      </motion.div>

      <section className="mb-2">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
              Recent Activity
            </p>
            <h2 className="mt-1 text-lg font-semibold text-neutral-900">
              Latest platform movement
            </h2>
          </div>
          <Link
            href={TALISMAPS_ROUTES.DASHBOARD_ANALYTICS}
            className="text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
          >
            View Analytics →
          </Link>
        </div>

        <motion.div
          className="grid gap-4 xl:grid-cols-3"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} className="min-h-[320px]">
            <TalisMapsActivityPanel
              title="Latest Maps"
              description="Recently updated map instances"
              icon={Map}
              items={latestMaps}
              emptyTitle="No maps yet"
              emptyDescription="Maps will appear here as soon as TalisMaps™ instances are created."
            />
          </motion.div>
          <motion.div variants={itemVariants} className="min-h-[320px]">
            <TalisMapsActivityPanel
              title="Recent PIN Updates"
              description="Latest pin changes across maps"
              icon={MapPin}
              items={recentPinUpdates}
              emptyTitle="No pin activity yet"
              emptyDescription="Pin updates will surface here once locations are added or edited."
            />
          </motion.div>
          <motion.div variants={itemVariants} className="min-h-[320px]">
            <TalisMapsActivityPanel
              title="Recent Imports"
              description="Atlist and bulk import events"
              icon={Download}
              items={recentImports}
              emptyTitle="No imports yet"
              emptyDescription="Import activity will appear here when migrations and bulk uploads run."
            />
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
