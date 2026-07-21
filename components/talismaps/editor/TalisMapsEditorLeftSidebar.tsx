"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { TalisMapsEditorSidebarPanelId } from "@/lib/talismaps/editor/constants";
import { TALISMAPS_EDITOR_SIDEBAR_PANELS } from "@/lib/talismaps/editor/constants";
import { TALISMAPS_ROUTES } from "@/lib/talismaps/routes";
import EditorSidebarPanel from "./sidebar/EditorSidebarPanel";

interface TalisMapsEditorLeftSidebarProps {
  activePanel: TalisMapsEditorSidebarPanelId;
  onPanelChange: (panel: TalisMapsEditorSidebarPanelId) => void;
}

export default function TalisMapsEditorLeftSidebar({
  activePanel,
  onPanelChange,
}: TalisMapsEditorLeftSidebarProps) {
  return (
    <aside className="flex h-full w-[272px] shrink-0 border-r border-neutral-200/80 bg-white">
      <div className="flex w-[72px] shrink-0 flex-col border-r border-neutral-200/80 bg-neutral-50/80">
        <div className="border-b border-neutral-200/80 p-3">
          <Link
            href={TALISMAPS_ROUTES.DASHBOARD}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-neutral-500 transition-colors hover:bg-white hover:text-neutral-900"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
        <nav className="flex-1 space-y-1 p-2">
          {TALISMAPS_EDITOR_SIDEBAR_PANELS.map((item) => {
            const Icon = item.icon;
            const isActive = activePanel === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onPanelChange(item.id)}
                title={item.label}
                className={[
                  "flex h-11 w-full flex-col items-center justify-center rounded-xl text-[10px] font-medium transition-colors",
                  isActive
                    ? "bg-white text-neutral-900 shadow-sm"
                    : "text-neutral-500 hover:bg-white/70 hover:text-neutral-900",
                ].join(" ")}
              >
                <Icon className="mb-1 h-4 w-4" />
                <span className="truncate px-1">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="min-w-0 flex-1">
        <EditorSidebarPanel panelId={activePanel} />
      </div>
    </aside>
  );
}
