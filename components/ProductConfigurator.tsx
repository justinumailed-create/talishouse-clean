"use client";

import { useState } from "react";

const roofingOptions = [
  "Bright, white & white",
  "Dark, dark & dark"
];

const kitchenOptions = [
  "KC-01",
  "KC-02",
  "KC-03",
  "KC-04",
  "KC-05",
  "KC-06"
];

const bathOptions = [
  "TL-01",
  "TL-02",
  "TL-03",
  "TL-04",
  "TL-05",
  "TL-06"
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
    <div className="space-y-6">
      {/* ROOFING - SEGMENTED CONTROL */}
      <div className="space-y-2">
        <p className="text-sm text-gray-600">Roofing, Gutter & Windows</p>
        <div className="flex rounded-xl border border-gray-200 overflow-hidden">
          {roofingOptions.map((option) => (
            <button
              key={option}
              onClick={() => onOptionChange("Roofing, Gutter & Windows Colour", option)}
              className={`flex-1 py-3 text-sm font-medium transition duration-200 hover:scale-[1.02] ${
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

      {/* KITCHEN - GRID BUTTONS */}
      <div className="space-y-2">
        <p className="text-sm text-gray-600">Kitchen Style</p>
        <div className="grid grid-cols-3 gap-3">
          {kitchenOptions.map((item) => (
            <button
              key={item}
              onClick={() => onOptionChange("Kitchen Style", item)}
              className={`p-3 rounded-xl border text-sm font-medium transition duration-200 hover:scale-[1.02] ${
                selectedOptions["Kitchen Style"] === item
                  ? "border-[#0070ba] bg-[#0070ba]/10 text-[#0070ba]"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* BATH - GRID BUTTONS */}
      <div className="space-y-2">
        <p className="text-sm text-gray-600">Bath Style</p>
        <div className="grid grid-cols-3 gap-3">
          {bathOptions.map((item) => (
            <button
              key={item}
              onClick={() => onOptionChange("Bath Style", item)}
              className={`p-3 rounded-xl border text-sm font-medium transition duration-200 hover:scale-[1.02] ${
                selectedOptions["Bath Style"] === item
                  ? "border-[#0070ba] bg-[#0070ba]/10 text-[#0070ba]"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* FLOORING - VISUAL SELECTOR */}
      <div className="space-y-2">
        <p className="text-sm text-gray-600">Flooring</p>
        <div className="grid grid-cols-2 gap-3">
          {flooringOptions.map((item) => (
            <button
              key={item.name}
              onClick={() => onOptionChange("Flooring Colour", item.name)}
              className={`flex items-center gap-3 p-3 rounded-xl border transition duration-200 hover:scale-[1.02] ${
                selectedOptions["Flooring Colour"] === item.name
                  ? "border-[#0070ba] bg-[#0070ba]/10"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div
                className="w-6 h-6 rounded-full border"
                style={{ background: item.color }}
              />
              <span className="text-sm text-gray-700">{item.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* SIDING - INPUT */}
      <div className="space-y-2">
        <p className="text-sm text-gray-600">Siding Colour Code</p>
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
