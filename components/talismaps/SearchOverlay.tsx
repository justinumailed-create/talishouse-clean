"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";

interface SearchOverlayProps {
  onSearch: (query: string) => void;
  onClear: () => void;
}

export default function SearchOverlay({ onSearch, onClear }: SearchOverlayProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  }

  function handleClear() {
    setQuery("");
    onClear();
    inputRef.current?.focus();
  }

  function handleClose() {
    setOpen(false);
    setQuery("");
    onClear();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-white rounded-full px-4 py-2.5 shadow-md border border-neutral-200 text-sm text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 transition-all"
      >
        <Search className="w-4 h-4" />
        <span>Search pins...</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[1000] flex items-start justify-center pt-[15vh] bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 w-full max-w-lg mx-4 overflow-hidden animate-fade-in">
            <form onSubmit={handleSubmit} className="flex items-center gap-3 px-4 py-3 border-b border-neutral-100">
              <Search className="w-5 h-5 text-neutral-400 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search pins by name or address..."
                className="flex-1 text-sm text-neutral-900 placeholder:text-neutral-400 bg-transparent outline-none border-none"
              />
              {query && (
                <button type="button" onClick={handleClear} className="text-neutral-400 hover:text-neutral-600">
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                className="bg-neutral-900 text-white text-xs font-medium px-4 py-1.5 rounded-full hover:bg-neutral-800 transition-colors"
              >
                Search
              </button>
              <button type="button" onClick={handleClose} className="text-neutral-400 hover:text-neutral-600 ml-1">
                <X className="w-5 h-5" />
              </button>
            </form>
            <div className="px-4 py-3 text-xs text-neutral-400">
              Search across all pins on this MapSite by name or location.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
