"use client";

import { useState } from "react";
import Image from "next/image";

const roofingOptions = [
  "Bright, white & white",
  "Dark, dark & dark"
];

const kitchenOptions = [
  { id: "KC-01", label: "Option 1" },
  { id: "KC-02", label: "Option 2" },
  { id: "KC-03", label: "Option 3" },
  { id: "KC-04", label: "Option 4" },
  { id: "KC-05", label: "Option 5" },
  { id: "KC-06", label: "Option 6" },
];

const bathOptions = [
  { id: "TL-01", label: "Option 1" },
  { id: "TL-02", label: "Option 2" },
  { id: "TL-03", label: "Option 3" },
  { id: "TL-04", label: "Option 4" },
  { id: "TL-05", label: "Option 5" },
  { id: "TL-06", label: "Option 6" },
];

const flooringOptions = [
  { name: "Ash", color: "#cfcfcf" },
  { name: "Palm", color: "#d6b48a" },
  { name: "Nanyumu (grey)", color: "#8a8a8a" },
  { name: "Maple", color: "#e5c7a1" },
  { name: "White Pine", color: "#f1e9dc" }
];

interface ProductConfiguratorProps {
  selectedOptions: Record<string, string>;
  onOptionChange: (category: string, option: string) => void;
}

export function ProductConfigurator({ selectedOptions, onOptionChange }: ProductConfiguratorProps) {
  const [sidingCode, setSidingCode] = useState("");

  return (
    <div className="space-y-8">
      {/* ROOFING - SEGMENTED CONTROL */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-900">Roofing, Gutter & Windows</p>
        <div className="flex rounded-xl border border-gray-200 overflow-hidden">
          {roofingOptions.map((option) => (
            <button
              key={option}
              onClick={() => onOptionChange("Roofing, Gutter & Windows Colour", option)}
              className={`flex-1 py-3 text-sm font-medium transition duration-200 ${
                selectedOptions["Roofing, Gutter & Windows Colour"] === option
                  ? "bg-[linear-gradient(135deg,#0070ba,#1546a0)] text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* KITCHEN - VISUAL IMAGE GRID */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-900">Kitchen Style</p>
        <div className="grid grid-cols-3 gap-3">
          {kitchenOptions.map((item) => {
            const isSelected = selectedOptions["Kitchen Style"] === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onOptionChange("Kitchen Style", item.id)}
                className={`
                  relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200
                  ${isSelected 
                    ? "border-[#0070ba] ring-2 ring-[#0070ba]/30 scale-[1.02]" 
                    : "border-gray-200 hover:border-gray-400 hover:scale-[1.01]"
                  }
                `}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-xs font-medium ${isSelected ? "text-[#0070ba]" : "text-gray-500"}`}>
                    {item.label}
                  </span>
                </div>
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-[#0070ba] rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* BATH - VISUAL IMAGE GRID */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-900">Bath Style</p>
        <div className="grid grid-cols-3 gap-3">
          {bathOptions.map((item) => {
            const isSelected = selectedOptions["Bath Style"] === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onOptionChange("Bath Style", item.id)}
                className={`
                  relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200
                  ${isSelected 
                    ? "border-[#0070ba] ring-2 ring-[#0070ba]/30 scale-[1.02]" 
                    : "border-gray-200 hover:border-gray-400 hover:scale-[1.01]"
                  }
                `}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-xs font-medium ${isSelected ? "text-[#0070ba]" : "text-gray-500"}`}>
                    {item.label}
                  </span>
                </div>
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-[#0070ba] rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* FLOORING - VISUAL SELECTOR */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-900">Flooring</p>
        <div className="grid grid-cols-2 gap-3">
          {flooringOptions.map((item) => (
            <button
              key={item.name}
              onClick={() => onOptionChange("Flooring Colour", item.name)}
              className={`flex items-center gap-3 p-4 rounded-xl border transition duration-200 ${
                selectedOptions["Flooring Colour"] === item.name
                  ? "border-[#0070ba] bg-[#0070ba]/5"
                  : "border-gray-200 bg-white hover:border-gray-400"
              }`}
            >
              <div
                className="w-8 h-8 rounded-full border shadow-sm"
                style={{ background: item.color }}
              />
              <span className="text-sm font-medium text-gray-700">{item.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* SIDING - INPUT */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-900">Siding Colour Code</p>
        <input
          type="text"
          placeholder="Enter siding colour code"
          value={sidingCode}
          onChange={(e) => {
            setSidingCode(e.target.value);
            onOptionChange("Siding Options", e.target.value);
          }}
          className="
            w-full px-4 py-3 rounded-xl border border-gray-200
            focus:ring-2 focus:ring-[#0070ba]/20 focus:border-[#0070ba] outline-none
            text-sm text-gray-700 placeholder:text-gray-400
            transition duration-200
          "
        />
      </div>
    </div>
  );
}