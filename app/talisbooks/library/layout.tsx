/**
 * Bookshelf-only chrome for /talisbooks/library.
 * Intentionally excludes the Talisbooks™ dashboard sidebar —
 * dashboard opens only after successful registration.
 */
export default function TalisBooksLibraryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      <main className="mx-auto w-full max-w-[80rem] px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
