type RouteLoadingSkeletonProps = {
  variant?: "page" | "map" | "split";
};

/** Instant body placeholder while a server route is still rendering. */
export default function RouteLoadingSkeleton({ variant = "page" }: RouteLoadingSkeletonProps) {
  if (variant === "map") {
    return (
      <div className="flex min-h-dvh flex-col bg-white" aria-busy="true" aria-live="polite">
        <div className="h-14 shrink-0 animate-pulse bg-[#046bd9]" />
        <div className="grid min-h-0 flex-1 lg:grid-cols-[22rem_minmax(0,1fr)]">
          <div className="space-y-3 border-b border-neutral-200 p-4 lg:border-b-0 lg:border-r">
            <div className="h-6 w-2/3 animate-pulse rounded bg-neutral-200" />
            <div className="h-24 animate-pulse rounded-xl bg-neutral-100" />
            <div className="h-4 w-full animate-pulse rounded bg-neutral-100" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-neutral-100" />
          </div>
          <div className="min-h-[50vh] flex-1 animate-pulse bg-[#e7eef6]" />
        </div>
      </div>
    );
  }

  if (variant === "split") {
    return (
      <div className="flex min-h-dvh flex-col bg-white" aria-busy="true" aria-live="polite">
        <div className="h-14 shrink-0 animate-pulse bg-[#046bd9]" />
        <div className="grid min-h-0 flex-1 lg:grid-cols-[40%_60%]">
          <div className="space-y-4 p-8">
            <div className="mx-auto h-16 w-16 animate-pulse rounded-full bg-neutral-200" />
            <div className="mx-auto h-8 w-40 animate-pulse rounded bg-neutral-200" />
            <div className="h-12 animate-pulse rounded-xl bg-neutral-100" />
            <div className="h-12 animate-pulse rounded-xl bg-neutral-100" />
          </div>
          <div className="min-h-[42vh] animate-pulse bg-neutral-300" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-dvh w-full max-w-5xl space-y-4 px-4 py-8" aria-busy="true" aria-live="polite">
      <div className="h-8 w-48 animate-pulse rounded bg-neutral-200" />
      <div className="h-4 w-full animate-pulse rounded bg-neutral-100" />
      <div className="h-4 w-11/12 animate-pulse rounded bg-neutral-100" />
      <div className="h-4 w-4/5 animate-pulse rounded bg-neutral-100" />
      <div className="h-40 animate-pulse rounded-2xl bg-neutral-100" />
    </div>
  );
}
