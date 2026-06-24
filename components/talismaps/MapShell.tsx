"use client";

import dynamic from "next/dynamic";
import { useState, useMemo, useCallback } from "react";
import { PanelRightOpen, PanelRightClose, ChevronDown } from "lucide-react";
import SearchOverlay from "./SearchOverlay";
import CategoryFilter from "./CategoryFilter";
import SidePanel from "./SidePanel";
import type { TalisMapsPin, TalisMapsCategory } from "@/lib/talismaps";

const MapView = dynamic(() => import("./MapView"), { ssr: false });

interface MapShellProps {
  pins: TalisMapsPin[];
  categories: TalisMapsCategory[];
  ownerName: string;
  fastCode: string;
}

export default function MapShell({ pins, categories, ownerName, fastCode }: MapShellProps) {
  const [selectedPin, setSelectedPin] = useState<TalisMapsPin | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);

  const filteredPins = useMemo(() => {
    let result = pins;
    if (categoryFilter) {
      result = result.filter((p) => p.categorySlug === categoryFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }
    return result;
  }, [pins, categoryFilter, searchQuery]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setSelectedPin(null);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery(null);
  }, []);

  const handleSelectPin = useCallback((pin: TalisMapsPin | null) => {
    setSelectedPin(pin);
    if (pin) {
      setMobilePanelOpen(true);
    }
  }, []);

  const handleCategoryFilter = useCallback((slug: string | null) => {
    setCategoryFilter(slug);
    setSelectedPin(null);
  }, []);

  const firstPin = pins.length > 0 ? pins[0] : null;
  const mapCenter: [number, number] | undefined = firstPin
    ? [firstPin.latitude, firstPin.longitude]
    : undefined;

  return (
    <div className="fixed inset-0 flex flex-col">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-[500] px-4 pt-3 pb-2 pointer-events-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 pointer-events-auto">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <SearchOverlay onSearch={handleSearch} onClear={handleClearSearch} />
            <div className="hidden sm:flex">
              <CategoryFilter
                categories={categories}
                selected={categoryFilter}
                onSelect={handleCategoryFilter}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="hidden sm:block text-xs text-white font-mono bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-md">
              {fastCode}
            </span>
            <button
              type="button"
              onClick={() => setPanelOpen(!panelOpen)}
              className="hidden lg:flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-3 py-2 shadow-md border border-neutral-200 text-xs text-neutral-600 hover:text-neutral-900 transition-all"
            >
              {panelOpen ? (
                <PanelRightClose className="w-4 h-4" />
              ) : (
                <PanelRightOpen className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">{panelOpen ? "Hide" : "Pins"}</span>
            </button>
          </div>
        </div>
        {/* Mobile category filter */}
        <div className="sm:hidden mt-2 pointer-events-auto overflow-x-auto">
          <CategoryFilter
            categories={categories}
            selected={categoryFilter}
            onSelect={handleCategoryFilter}
          />
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapView
          pins={filteredPins}
          selectedPin={selectedPin}
          onSelectPin={handleSelectPin}
          center={mapCenter}
        />

        {/* Desktop left panel */}
        <div
          className={`absolute top-0 left-0 bottom-0 z-[400] transition-transform duration-300 ease-in-out hidden lg:block ${
            panelOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          style={{ width: 360 }}
        >
          <div className="h-full pt-16 pb-2 pl-2">
            <div className="h-full rounded-xl overflow-hidden shadow-xl border border-neutral-200">
              <SidePanel
                pins={filteredPins}
                selectedPin={selectedPin}
                onSelectPin={handleSelectPin}
                onClose={() => setSelectedPin(null)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile bottom sheet */}
      <div className="lg:hidden">
        {/* Pull tab */}
        {!mobilePanelOpen && (
          <button
            type="button"
            onClick={() => setMobilePanelOpen(true)}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[600] bg-white rounded-full shadow-lg border border-neutral-200 px-5 py-2.5 flex items-center gap-2 text-sm text-neutral-700"
          >
            <ChevronDown className="w-4 h-4 rotate-180" />
            {selectedPin ? selectedPin.name : `${filteredPins.length} pin${filteredPins.length !== 1 ? "s" : ""}`}
          </button>
        )}

        {mobilePanelOpen && (
          <div className="fixed inset-0 z-[700]">
            <div className="absolute inset-0 bg-black/20" onClick={() => setMobilePanelOpen(false)} />
            <div
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl"
              style={{ maxHeight: "75vh" }}
            >
              <div className="flex items-center justify-center pt-2 pb-1">
                <button
                  type="button"
                  onClick={() => setMobilePanelOpen(false)}
                  className="w-10 h-1 bg-neutral-300 rounded-full"
                />
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: "calc(75vh - 24px)" }}>
                <SidePanel
                  pins={filteredPins}
                  selectedPin={selectedPin}
                  onSelectPin={handleSelectPin}
                  onClose={() => { setSelectedPin(null); setMobilePanelOpen(false); }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Search results indicator */}
      {searchQuery && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[450] bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-md border border-neutral-200 text-xs text-neutral-600 flex items-center gap-2">
          <span>
            {filteredPins.length} result{filteredPins.length !== 1 ? "s" : ""} for &ldquo;{searchQuery}&rdquo;
          </span>
          <button
            type="button"
            onClick={handleClearSearch}
            className="text-neutral-400 hover:text-neutral-600 font-medium"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
