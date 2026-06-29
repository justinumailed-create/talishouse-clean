"use client";

const COMING_SOON_CONTROLS = [
  { id: "pinColor", label: "Pin Color", type: "color" as const },
  { id: "pinBorder", label: "Pin Border", type: "select" as const },
  { id: "pinIcon", label: "Pin Icon", type: "select" as const },
  { id: "pinLabel", label: "Pin Label", type: "text" as const },
  { id: "customLogo", label: "Custom Logo", type: "file" as const },
  { id: "whiteCenterMarker", label: "White Center Marker", type: "toggle" as const },
  { id: "categoryBadge", label: "Category Badge", type: "select" as const },
  { id: "animatedMarker", label: "Animated Marker", type: "toggle" as const },
];

export default function TalisMapsComingSoonCard() {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-neutral-900 tracking-tight">
        Coming Soon in TalisMaps™
      </h3>
      <p className="text-xs text-neutral-500 mt-1 mb-4">
        Available in a future TalisMaps™ update.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {COMING_SOON_CONTROLS.map((control) => (
          <div key={control.id} className="opacity-60">
            <label className="text-xs font-medium text-neutral-500 mb-1.5 block">
              {control.label}
            </label>

            {control.type === "color" && (
              <input
                type="color"
                disabled
                value="#1f2937"
                className="h-11 w-full rounded-xl border border-neutral-200 bg-white cursor-not-allowed"
              />
            )}

            {control.type === "select" && (
              <select
                disabled
                className="w-full h-11 px-4 bg-white border border-neutral-200 text-sm text-neutral-400 rounded-xl cursor-not-allowed"
              >
                <option>Coming soon</option>
              </select>
            )}

            {control.type === "text" && (
              <input
                type="text"
                disabled
                placeholder="Coming soon"
                className="w-full h-11 px-4 bg-white border border-neutral-200 text-sm text-neutral-400 rounded-xl cursor-not-allowed"
              />
            )}

            {control.type === "file" && (
              <div className="w-full h-11 px-4 flex items-center rounded-xl border border-dashed border-neutral-300 text-sm text-neutral-400 bg-white cursor-not-allowed">
                Upload coming soon
              </div>
            )}

            {control.type === "toggle" && (
              <label className="flex items-center gap-3 h-11 px-4 rounded-xl border border-neutral-200 bg-white cursor-not-allowed">
                <input type="checkbox" disabled className="w-4 h-4 rounded border-neutral-300" />
                <span className="text-sm text-neutral-400">Disabled</span>
              </label>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
