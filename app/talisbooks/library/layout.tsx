/**
 * Bookshelf-only chrome for /talisbooks/library.
 * Intentionally excludes the Talisbooks™ dashboard sidebar —
 * dashboard opens only after successful registration.
 * Blue TalisUMktsHeader is rendered by TalisBooksLibraryShell (full-bleed).
 */
export default function TalisBooksLibraryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-[#f5f5f7]">{children}</div>;
}
