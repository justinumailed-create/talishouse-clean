export default function LegalHeader() {
  const showFranchise = true;

  if (!showFranchise) return null;

  return (
    <div className="w-full bg-black text-white text-center py-3 text-sm tracking-wide">
      TALISHOUSE™ OFFICIAL FRANCHISE
    </div>
  );
}
