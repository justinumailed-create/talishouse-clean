import { Lato } from "next/font/google";

const latoBold = Lato({
  subsets: ["latin"],
  weight: ["700"],
});

interface MapSitePanelHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
  titleClassName?: string;
  useLatoBold?: boolean;
}

const baseContainerClass =
  "px-5 sm:px-6 py-4 border-b shrink-0";
const defaultContainerClass = `${baseContainerClass} border-neutral-200 bg-white`;
const baseTitleClass =
  "text-base sm:text-lg font-semibold tracking-tight text-center leading-snug";
const defaultTitleClass = `${baseTitleClass} text-neutral-900`;

export default function MapSitePanelHeader({
  title,
  subtitle,
  className,
  titleClassName,
  useLatoBold = false,
}: MapSitePanelHeaderProps) {
  return (
    <div
      className={
        className
          ? `${baseContainerClass} ${className}`
          : defaultContainerClass
      }
    >
      <h2
        className={
          titleClassName
            ? `${useLatoBold ? "text-base sm:text-lg font-bold tracking-tight text-center leading-snug" : baseTitleClass} ${useLatoBold ? latoBold.className : ""} ${titleClassName}`
            : defaultTitleClass
        }
      >
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-1 text-xs sm:text-sm text-neutral-500 text-center leading-snug">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
