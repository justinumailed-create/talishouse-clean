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
    return (
      <button
        onClick={onClick}
        className={`
          relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300 cursor-pointer
          ${isSelected 
            ? "border-black ring-2 ring-black/10" 
            : "border-gray-200 hover:border-gray-400"
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
        relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300 cursor-pointer
        ${isSelected 
          ? "border-black ring-2 ring-black/20 shadow-md" 
          : "border-gray-200 hover:border-gray-400"
        }
      `}
    >
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src={image}
          alt={alt}
          fill
          className={`object-cover transition-all duration-500 ease-out ${isSelected ? 'scale-105' : 'hover:scale-110'}`}
          unoptimized={true}
        />
      </div>
      {showLabel && (
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/70 via-black/50 to-transparent">
          <span className="text-xs font-semibold text-white uppercase tracking-wider block">
            {alt}
          </span>
        </div>
      )}
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-black rounded-full flex items-center justify-center shadow-lg border-2 border-white">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
      <div className={`
        absolute inset-0 border-2 rounded-xl transition-opacity duration-300 pointer-events-none
        ${isSelected ? 'border-black' : 'border-transparent'}
      `} />
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
        relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300 cursor-pointer
        ${isSelected 
          ? "border-black ring-2 ring-black/20 shadow-md" 
          : "border-gray-200 hover:border-gray-400"
        }
      `}
    >
      <div 
        className="w-full h-full transition-transform duration-300 hover:scale-110"
        style={{ backgroundColor: color }}
      />
      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-black rounded-full flex items-center justify-center shadow-lg border-2 border-white">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </button>
  );
}

export function ProductConfigurator({ selectedOptions, onOptionChange }: ProductConfiguratorProps) {
  const handleToggle = (category: string, option: string) => {
    if (selectedOptions[category] === option) {
      onOptionChange(category, "");
    } else {
      onOptionChange(category, option);
    }
  };

  return (
    <div className="space-y-8">
      {/* ROOFING - SEGMENTED CONTROL */}
      <div className="space-y-3">
        <p className="text-[15px] font-semibold text-gray-900">Roofing, Gutter & Windows</p>
        <div className="flex p-1 bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
          {roofingOptions.map((option) => (
            <button
              key={option}
              onClick={() => handleToggle("Roofing, Gutter & Windows Colour", option)}
              className={`flex-1 py-3 text-sm font-medium transition-all duration-200 rounded-lg ${
                selectedOptions["Roofing, Gutter & Windows Colour"] === option
                  ? "bg-black text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* KITCHEN - VISUAL IMAGE GRID */}
      <div className="space-y-4">
        <p className="text-[15px] font-semibold text-gray-900">Kitchen Style</p>
        <p className="text-xs text-gray-500 -mt-2">Click to select, click again to deselect</p>
        <div className="grid grid-cols-3 gap-3">
          {kitchenOptions.map((option) => (
            <OptionCard
              key={option.id}
              image={option.image}
              alt={option.label}
              isSelected={selectedOptions["Kitchen Style"] === option.id}
              onClick={() => handleToggle("Kitchen Style", option.id)}
            />
          ))}
        </div>
      </div>

      {/* BATH - VISUAL IMAGE GRID */}
      <div className="space-y-4">
        <p className="text-[15px] font-semibold text-gray-900">Bath Style</p>
        <p className="text-xs text-gray-500 -mt-2">Click to select, click again to deselect</p>
        <div className="grid grid-cols-3 gap-3">
          {bathOptions.map((option) => (
            <OptionCard
              key={option.id}
              image={option.image}
              alt={option.label}
              isSelected={selectedOptions["Bath Style"] === option.id}
              onClick={() => handleToggle("Bath Style", option.id)}
            />
          ))}
        </div>
      </div>

      {/* FLOORING - MATERIAL SECTION */}
      <div className="space-y-4">
        <p className="text-[15px] font-semibold text-gray-900">Flooring Material</p>
        <p className="text-xs text-gray-500 -mt-2">Click to select, click again to deselect</p>
        <div className="grid grid-cols-2 gap-4">
          {flooringMaterials.map((material) => (
            <OptionCard
              key={material.id}
              image={material.image}
              alt={material.label}
              isSelected={selectedOptions["Flooring Material"] === material.id}
              onClick={() => handleToggle("Flooring Material", material.id)}
              showLabel={true}
            />
          ))}
        </div>
      </div>

      {/* FLOORING - COLOUR SECTION (VISUAL ONLY) */}
      <div className="space-y-4">
        <p className="text-[15px] font-semibold text-gray-900">Flooring Style</p>
        <p className="text-xs text-gray-500 -mt-2">Click to select, click again to deselect</p>
        <div className="grid grid-cols-5 gap-3">
          {flooringColors.map((color) => (
            <ColorSwatch
              key={color.id}
              color={color.color}
              isSelected={selectedOptions["Flooring Colour"] === color.id}
              onClick={() => handleToggle("Flooring Colour", color.id)}
            />
          ))}
        </div>
      </div>

      {/* SIDING - OPTION SELECTION */}
      <div className="space-y-4">
        <p className="text-[15px] font-semibold text-gray-900">Siding Options</p>
        <p className="text-xs text-gray-500 -mt-2">Click to select, click again to deselect</p>
        <div className="flex gap-3 flex-wrap">
          {[
            { id: "vinyl", label: "Vinyl", color: "#e8e4df" },
            { id: "metal", label: "Metal", color: "#4a4a4a" },
            { id: "fiber-cement", label: "Fiber Cement", color: "#c4b8a8" },
            { id: "wood", label: "Wood", color: "#8b7355" },
            { id: "composite", label: "Composite", color: "#6b5b4f" },
            { id: "monochrome", label: "Monochrome", color: "#2d2d2d" },
          ].map((siding) => (
            <button
              key={siding.id}
              type="button"
              onClick={() => handleToggle("Siding Options", siding.id)}
              title={siding.label}
              className={`w-10 h-10 rounded-full border-2 transition ${
                selectedOptions["Siding Options"] === siding.id
                  ? "border-black scale-110"
                  : "border-gray-300 hover:border-gray-400"
              }`}
              style={{ backgroundColor: siding.color }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}