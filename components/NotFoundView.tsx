/**
 * Shared 404 body for app/not-found and app/global-not-found.
 * Uses a plain <a> so it also works when global-not-found bypasses the App Router
 * (next/link has no router context there).
 */
export default function NotFoundView({
  title = "Page not found",
  description = "The page you are looking for does not exist or has been moved.",
  homeHref = "/",
  homeLabel = "Back to home",
}: {
  title?: string;
  description?: string;
  homeHref?: string;
  homeLabel?: string;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-16 bg-white">
      <div className="text-center max-w-md">
        <p className="text-6xl font-semibold text-neutral-200 mb-4">404</p>
        <h1 className="text-2xl font-semibold text-neutral-900 mb-2">{title}</h1>
        <p className="text-sm text-neutral-500 mb-8">{description}</p>
        <a
          href={homeHref}
          className="inline-flex items-center justify-center rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 transition-colors"
        >
          {homeLabel}
        </a>
      </div>
    </div>
  );
}
