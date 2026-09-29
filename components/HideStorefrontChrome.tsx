import { STOREFRONT_CHROME_CLASS } from "@/lib/storefront-chrome";

export { STOREFRONT_CHROME_CLASS };

const HIDE_STYLE = `.${STOREFRONT_CHROME_CLASS}{display:none!important}`;

/**
 * Drop Talishouse navbar, cart, and Talisbot on 404 / not-found surfaces.
 * SSR-safe: a style tag hides `.th-storefront-chrome` from first paint while
 * RootShell still wraps the page (avoids client-only unmount / hydration mismatch).
 */
export default function HideStorefrontChrome({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: HIDE_STYLE }} />
      {children}
    </>
  );
}
