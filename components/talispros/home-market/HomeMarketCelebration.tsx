"use client";

import { useEffect, useMemo, useRef } from "react";
import { useT } from "@/lib/i18n/client";
import { cleanFirstName } from "@/lib/talispros/home-market-flow";

const CONFETTI_COLORS = ["#046BD9", "#CC8800", "#16A34A", "#F59E0B", "#E11D48", "#FFFFFF"] as const;
const CONFETTI_COUNT = 72;
/** The moment closes by itself and lands on the Mapsite. */
export const HOME_MARKET_CELEBRATION_MS = 5200;

/** Small deterministic spread so every piece falls differently. */
function spread(index: number, salt: number): number {
  const x = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * "Congratulations" moment after Build Mapsite (Ralf, Nov 23): confetti and a
 * big banner, then the visitor lands on their Mapsite with the invitation to
 * register and place additional PINs. Aisha's call keeps running underneath.
 */
export default function HomeMarketCelebration({
  firstName,
  onDone,
}: {
  firstName: string;
  onDone: () => void;
}) {
  const t = useT().homeMarket;
  const name = cleanFirstName(firstName);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const pieces = useMemo(
    () =>
      Array.from({ length: CONFETTI_COUNT }, (_, index) => ({
        left: spread(index, 1) * 100,
        delay: spread(index, 2) * 1.6,
        duration: 2.6 + spread(index, 3) * 2.2,
        size: 7 + Math.round(spread(index, 4) * 7),
        drift: Math.round((spread(index, 5) - 0.5) * 160),
        spin: Math.round(360 + spread(index, 6) * 720),
        round: spread(index, 7) > 0.65,
        color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
      })),
    [],
  );

  useEffect(() => {
    buttonRef.current?.focus({ preventScroll: true });
    const timer = window.setTimeout(onDone, HOME_MARKET_CELEBRATION_MS);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDone();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [onDone]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="home-market-congrats-title"
      data-testid="home-market-celebration"
      className="home-market-celebration fixed inset-0 flex items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_40%,rgba(4,107,217,0.55),rgba(3,20,45,0.82))] px-5"
      style={{ zIndex: 95 }}
      onClick={onDone}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {pieces.map((piece, index) => (
          <span
            key={index}
            className="home-market-confetti absolute top-[-4vh] block"
            style={
              {
                left: `${piece.left}%`,
                width: piece.size,
                height: piece.round ? piece.size : Math.round(piece.size * 0.45),
                borderRadius: piece.round ? "9999px" : "2px",
                background: piece.color,
                animationDelay: `${piece.delay}s`,
                animationDuration: `${piece.duration}s`,
                "--confetti-drift": `${piece.drift}px`,
                "--confetti-spin": `${piece.spin}deg`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
      <div
        className="home-market-congrats-card relative w-full max-w-[34rem] rounded-[28px] bg-white px-7 py-9 text-center shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="m-0 text-[44px] leading-none" aria-hidden>
          🎉
        </p>
        <h2
          id="home-market-congrats-title"
          className="m-0 mt-3 bg-gradient-to-r from-[#046BD9] via-[#0a8fe0] to-[#CC8800] bg-clip-text text-[34px] font-bold leading-tight tracking-tight text-transparent sm:text-[42px]"
          style={{ color: "transparent", WebkitTextFillColor: "transparent" }}
        >
          {name ? t.congratsTitleName.replace("{name}", name) : t.congratsTitle}
        </h2>
        <p className="m-0 mt-3 text-[16px] leading-relaxed text-neutral-700 sm:text-[17px]" style={{ color: "#404040" }}>{t.congratsBody}</p>
        <button
          ref={buttonRef}
          type="button"
          onClick={onDone}
          data-testid="home-market-celebration-continue"
          className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-[#046BD9] px-7 text-[16px] font-semibold text-white shadow-[0_8px_18px_rgba(4,107,217,0.35)] transition hover:bg-[#0558b3]"
        >
          {t.congratsContinue}
        </button>
      </div>
    </div>
  );
}
