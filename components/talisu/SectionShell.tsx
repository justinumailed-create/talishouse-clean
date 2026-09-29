export default function SectionShell({
  title,
  subtitle,
  children,
  light = false,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  light?: boolean;
}) {
  return (
    <div
      className={`mx-auto max-w-6xl px-4 py-10 sm:py-14 ${
        light ? "text-neutral-900" : ""
      }`}
    >
      <header className="mb-8 text-center sm:mb-10">
        <h1
          className={`text-3xl font-semibold tracking-tight sm:text-4xl ${
            light ? "text-neutral-900" : "text-white"
          }`}
        >
          {title}
        </h1>
        {subtitle ? (
          <p
            className={`mx-auto mt-3 max-w-2xl text-sm sm:text-base ${
              light ? "text-neutral-600" : "text-white/60"
            }`}
          >
            {subtitle}
          </p>
        ) : null}
      </header>
      {children}
    </div>
  );
}
