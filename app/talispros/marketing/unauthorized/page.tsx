export default function MarketingUnauthorizedPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center px-5">
      <div className="text-center max-w-sm">
        <h1 className="text-xl font-semibold text-neutral-900 mb-2">Access Denied</h1>
        <p className="text-sm text-neutral-500">
          Your account is not authorized for the Marketing Manager portal. Contact an
          administrator to be added to the marketing manager allowlist.
        </p>
      </div>
    </div>
  );
}
