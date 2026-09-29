import HideStorefrontChrome from "@/components/HideStorefrontChrome";
import NotFoundView from "@/components/NotFoundView";

/**
 * Root not-found for notFound() calls that bubble here, and (without
 * global-not-found) for unmatched URLs. Still wrapped by root layout /
 * RootShell, so HideStorefrontChrome drops navbar, cart, and Talisbot.
 */
export default function NotFound() {
  return (
    <HideStorefrontChrome>
      <NotFoundView />
    </HideStorefrontChrome>
  );
}
