export default function FastCodeSidebarCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-base font-semibold text-neutral-900 mb-1">FAST Code™</h3>
      <p className="text-xs text-neutral-500 mb-4">Generate your marketplace gateway.</p>
      <div className="overflow-hidden rounded-xl bg-white">
        <iframe
          src="/fast-code"
          title="Generate FAST Code"
          className="w-full h-[720px] border-0 rounded-xl bg-white"
        />
      </div>
    </div>
  );
}
