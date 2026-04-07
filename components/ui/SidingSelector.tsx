"use client";

import { useState } from "react";

export interface SidingOption {
  code: string;
  name: string;
  color: string;
}

export const sidingOptions: SidingOption[] = [
  { code: "D-053", name: "Snow White", color: "#f5f5f5" },
  { code: "D-054", name: "Cream", color: "#f2e8d5" },
  { code: "D-055", name: "Sandstone", color: "#d4c4a8" },
  { code: "D-056", name: "Dove Gray", color: "#8b8680" },
  { code: "D-057", name: "Weathered Wood", color: "#6b5b4f" },
  { code: "D-058", name: "Charcoal", color: "#4a4a4a" },
  { code: "D-059", name: "Midnight", color: "#2d2d2d" },
  { code: "D-060", name: "Forest Green", color: "#3d5a45" },
  { code: "D-061", name: "Navy Blue", color: "#2c3e50" },
  { code: "D-062", name: "Barn Red", color: "#8b3a3a" },
];

interface SidingSelectorProps {
  selectedSiding: string;
  onSidingChange: (sidingCode: string) => void;
}

export function SidingSelector({ selectedSiding, onSidingChange }: SidingSelectorProps) {
  const handleToggle = (code: string) => {
    if (selectedSiding === code) {
      onSidingChange("");
    } else {
      onSidingChange(code);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-[15px] font-semibold text-gray-900">Siding Options</p>
      <p className="text-xs text-gray-500 -mt-2">Click to select, click again to deselect</p>
      <div className="grid grid-cols-5 gap-3">
        {sidingOptions.map((siding) => (
          <button
            key={siding.code}
            onClick={() => handleToggle(siding.code)}
            title={`${siding.name} (${siding.code})`}
            className={`
              relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300 cursor-pointer
              ${selectedSiding === siding.code
                ? "border-black ring-2 ring-black/20 shadow-md scale-105" 
                : "border-gray-200 hover:border-gray-400 hover:scale-105"
              }
            `}
          >
            <div 
              className="w-full h-full transition-transform duration-300"
              style={{ backgroundColor: siding.color }}
            />
            {selectedSiding === siding.code && (
              <div className="absolute top-2 right-2 w-5 h-5 bg-black rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
      {selectedSiding && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
          <p className="text-xs text-gray-600">
            <span className="font-semibold">{selectedSiding}</span>
            {" - "}
            {sidingOptions.find(s => s.code === selectedSiding)?.name}
          </p>
        </div>
      )}
    </div>
  );
}

export function getSidingName(code: string): string {
  const siding = sidingOptions.find(s => s.code === code);
  return siding ? siding.name : code;
}

export function getSidingColor(code: string): string {
  const siding = sidingOptions.find(s => s.code === code);
  return siding?.color || "#cccccc";
}
