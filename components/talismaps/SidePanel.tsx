"use client";

import { X, MapPin, Phone, Mail, Globe, ExternalLink } from "lucide-react";
import type { TalisMapsPin } from "@/lib/talismaps";

interface SidePanelProps {
  pins: TalisMapsPin[];
  selectedPin: TalisMapsPin | null;
  onSelectPin: (pin: TalisMapsPin | null) => void;
  onClose: () => void;
}

export default function SidePanel({ pins, selectedPin, onSelectPin, onClose }: SidePanelProps) {
  if (selectedPin) {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="flex items-center justify-between p-4 border-b border-neutral-100">
          <h2 className="text-sm font-semibold text-neutral-900 truncate">{selectedPin.name}</h2>
          <button type="button" onClick={onClose} className="text-neutral-400 hover:text-neutral-600 flex-shrink-0 ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: selectedPin.categoryColor }}
            />
            <span className="text-xs font-medium text-neutral-500">{selectedPin.categoryName || "Uncategorized"}</span>
            {selectedPin.featured && (
              <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Featured</span>
            )}
          </div>

          {selectedPin.description && (
            <p className="text-sm text-neutral-600 leading-relaxed">{selectedPin.description}</p>
          )}

          <div className="space-y-2">
            {selectedPin.address && (
              <div className="flex items-start gap-2.5 text-sm text-neutral-500">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-neutral-400" />
                <span>
                  {selectedPin.address}
                  {selectedPin.city && `, ${selectedPin.city}`}
                  {selectedPin.province && `, ${selectedPin.province}`}
                </span>
              </div>
            )}
            {selectedPin.phone && (
              <a href={`tel:${selectedPin.phone}`} className="flex items-center gap-2.5 text-sm text-blue-600 hover:text-blue-700">
                <Phone className="w-4 h-4 flex-shrink-0 text-neutral-400" />
                {selectedPin.phone}
              </a>
            )}
            {selectedPin.email && (
              <a href={`mailto:${selectedPin.email}`} className="flex items-center gap-2.5 text-sm text-blue-600 hover:text-blue-700">
                <Mail className="w-4 h-4 flex-shrink-0 text-neutral-400" />
                {selectedPin.email}
              </a>
            )}
            {selectedPin.website && (
              <a
                href={selectedPin.website.startsWith("http") ? selectedPin.website : `https://${selectedPin.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-sm text-blue-600 hover:text-blue-700"
              >
                <Globe className="w-4 h-4 flex-shrink-0 text-neutral-400" />
                <span className="truncate">{selectedPin.website}</span>
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
              </a>
            )}
          </div>
        </div>
        <div className="p-3 border-t border-neutral-100">
          <button
            type="button"
            onClick={() => onSelectPin(null)}
            className="w-full text-center text-xs text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            Back to all pins
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b border-neutral-100">
        <h2 className="text-sm font-semibold text-neutral-900">Pins</h2>
        <p className="text-xs text-neutral-400 mt-0.5">{pins.length} location{pins.length !== 1 ? "s" : ""}</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {pins.length === 0 ? (
          <div className="p-4 text-center text-xs text-neutral-400">No pins match your search or filters.</div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {pins.map((pin) => (
              <button
                key={pin.id}
                type="button"
                onClick={() => onSelectPin(pin)}
                className="w-full text-left p-4 hover:bg-neutral-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span
                    className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                    style={{ backgroundColor: pin.categoryColor }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-neutral-900 truncate">{pin.name}</span>
                      {pin.featured && (
                        <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full flex-shrink-0">
                          Featured
                        </span>
                      )}
                    </div>
                    {(pin.address || pin.city) && (
                      <p className="text-xs text-neutral-400 mt-0.5 truncate">
                        {pin.address && `${pin.address}, `}{pin.city}
                      </p>
                    )}
                    <span className="text-[11px] text-neutral-400 mt-1 block">
                      {pin.categoryName || "Uncategorized"}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
