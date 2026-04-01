"use client";

import { useState } from "react";
import Image from "next/image";

const roofingOptions = [
  "Bright, white & white",
  "Dark, dark & dark"
];

const kitchenOptions = [
  { id: "KC01", label: "Bright White", image: "/images/kitchen/KC01.png" },
  { id: "KC02", label: "Classic White", image: "/images/kitchen/KC02.png" },
  { id: "KC03", label: "Modern White", image: "/images/kitchen/KC03.png" },
  { id: "KC04", label: "Warm Wood", image: "/images/kitchen/KC04.png" },
  { id: "KC05", label: "Dark Modern", image: "/images/kitchen/KC05.png" },
  { id: "KC06", label: "Minimalist", image: "/images/kitchen/KC06.png" },
];

const bathOptions = [
  { id: "TL01", label: "Option 1", image: "/images/bath/TL01.png" },
  { id: "TL02", label: "Option 2", image: "/images/bath/TL02.png" },
  { id: "TL03", label: "Option 3", image: "/images/bath/TL03.png" },
  { id: "TL04", label: "Option 4", image: "/images/bath/TL04.png" },
  { id: "TL05", label: "Option 5", image: "/images/bath/TL05.png" },
  { id: "TL06", label: "Option 6", image: "/images/bath/TL06.png" },
];

const flooringMaterials = [
  { id: "vinyl", label: "Vinyl", image: "/images/flooring/VINYL.png" },
  { id: "spc", label: "SPC", image: "/images/flooring/SPC.png" },
];

flooringMaterials.forEach((mat: { label: string; image: string }) => {
  console.log(`Flooring material: ${mat.label} -> ${mat.image}`);
});

console.log("Flooring material paths:", flooringMaterials.map(m => m.image));

const flooringColors = [
  { id: "ash", color: "#cfcfcf" },
  { id: "grey", color: "#6b6b6b" },
  { id: "pine", color: "#f2e6d8" },
  { id: "palm", color: "#c49a6c" },
  { id: "maple", color: "#d2a679" },
];

interface ProductConfiguratorProps {
  selectedOptions: Record<string, string>;
  onOptionChange: (category: string, option: string) => void;
}

function OptionCard({ 
  image, 
  alt, 
  isSelected, 
  onClick,
  showLabel
}: { 
  image?: string; 
  alt: string; 
  isSelected: boolean; 
  onClick: () => void;
  showLabel?: boolean;
}) {
  if (!image) {
    console.error(`Flooring image not found: ${image || 'undefined'}`);
    return (
      <button
        onClick={onClick}
        className={`
          relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200
          ${isSelected 
            ? "border-[#0070ba] ring-2 ring-[#0070ba]/30 scale-[1.02]" 
            : "border-gray-200 hover:border-gray-400 hover:scale-[1.01]"
          }
        `}
      >
        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
          <span className="text-gray-400 text-xs">No image</span>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`
        relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200
        ${isSelected 
          ? "border-[#0070ba] ring-2 ring-[#0070ba]/30 scale-[1.02]" 
          : "border-gray-200 hover:border-gray-400 hover:scale-[1.01]"
        }
      `}
    >
      <Image
        src={image}
        alt={alt}
        fill
        className="object-cover"
        unoptimized={true}
      />
      {showLabel && (
        <div className="absolute inset-x-0 bottom-0 bg-black/50 backdrop-blur-sm p-2">
          <span className="text-[10px] uppercase tracking-wider font-bold text-white block text-center">
            {alt}
          </span>
        </div>
      )}
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-[#0070ba] rounded-full flex items-center justify-center shadow-lg border-2 border-white">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </button>
  );
}

function ColorSwatch({ 
  color, 
  isSelected, 
  onClick 
}: { 
  color: string; 
  isSelected: boolean; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200
        ${isSelected 
          ? "border-[#0070ba] ring-2 ring-[#0070ba]/30 scale-[1.02]" 
          : "border-gray-200 hover:border-gray-400 hover:scale-[1.01]"
        }
      `}
    >
      <div 
        className="w-full h-full"
        style={{ backgroundColor: color }}
      />
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-[#0070ba] rounded-full flex items-center justify-center shadow-lg border-2 border-white">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </button>
  );
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
          {kitchenOptions.map((option) => (
            <OptionCard
              key={option.id}
              image={option.image}
              alt={option.label}
              isSelected={selectedOptions["Kitchen Style"] === option.id}
              onClick={() => onOptionChange("Kitchen Style", option.id)}
            />
          ))}
        </div>
      </div>

      {/* BATH - VISUAL IMAGE GRID */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-900">Bath Style</p>
        <div className="grid grid-cols-3 gap-3">
          {bathOptions.map((option) => (
            <OptionCard
              key={option.id}
              image={option.image}
              alt={option.label}
              isSelected={selectedOptions["Bath Style"] === option.id}
              onClick={() => onOptionChange("Bath Style", option.id)}
            />
          ))}
        </div>
      </div>

      {/* FLOORING - MATERIAL SECTION */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-900">Flooring Material</p>
        <div className="grid grid-cols-2 gap-3">
          {flooringMaterials.map((material) => (
            <OptionCard
              key={material.id}
              image={material.image}
              alt={material.label}
              isSelected={selectedOptions["Flooring Material"] === material.id}
              onClick={() => onOptionChange("Flooring Material", material.id)}
              showLabel={true}
            />
          ))}
        </div>
      </div>

      {/* FLOORING - COLOUR SECTION (VISUAL ONLY) */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-900">Flooring Style</p>
        <div className="grid grid-cols-3 gap-3">
          {flooringColors.map((color) => (
            <ColorSwatch
              key={color.id}
              color={color.color}
              isSelected={selectedOptions["Flooring Colour"] === color.id}
              onClick={() => onOptionChange("Flooring Colour", color.id)}
            />
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