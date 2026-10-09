export default function MarketingUnauthorizedPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center px-5">
      <div className="text-center max-w-sm">
        <h1 className="text-xl font-semibold text-neutral-900 mb-2">Access Denied</h1>
        <p className="text-sm text-neutral-500">
          The Marketing Manager portal requires a Global Admin FAST Code session.
          Sign in at /admin/login.
        </p>
      </div>
    </div>
  );
}
