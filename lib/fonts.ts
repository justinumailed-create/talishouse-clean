import { Libre_Baskerville, Poppins } from "next/font/google";

/**
 * One Poppins instance for the whole app. Nested layouts used to call
 * next/font again, which preloaded the same five weights a second time.
 */
export const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  adjustFontFallback: true,
  preload: true,
  variable: "--font-poppins",
});

/** Homepage display face. The hero photo is the LCP element, so this is not preloaded. */
export const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  adjustFontFallback: true,
  preload: false,
});
