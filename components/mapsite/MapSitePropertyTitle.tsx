interface MapSitePropertyTitleProps {
  title: string;
}

export default function MapSitePropertyTitle({ title }: MapSitePropertyTitleProps) {
  return (
    <section className="bg-[#f8f8f7] border-b border-neutral-200">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 sm:py-12">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-neutral-900">
          {title}
        </h1>
      </div>
    </section>
  );
}
