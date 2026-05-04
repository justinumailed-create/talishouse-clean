"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useCart, SHIPPING_CLEARANCE, BUILD_AND_PRICE } from "@/context/CartContext";
import ProductLayout from "@/components/ProductLayout";
import { ProductConfigurator } from "@/components/ProductConfigurator";
import { getModelsByCategory, getDefaultModel, type CategoryModel } from "@/lib/products";
import { getAddonsForProduct, addonsRecord } from "@/lib/config/addons";
import SuccessToast from "@/components/SuccessToast";
import { formatCAD } from "@/utils/currency";

const CATEGORY_CONFIG = {
  recreational: {
    name: "Talishouse™ 400 and 800",
    slug: "400",
    image: "/images/talishouse-400.svg",
    size: "talishouse-400",
    description: `400 - 800 sq.ft.. Permanent or mobile installation (on wheeled platforms. Mobile installation may negate the need for Building Permits in many Canadian jurisdictions).  
Up in a day, finished in a week.  
Characterization: it includes an efficiency kitchen and four-piece bath, however, the number of bedrooms is size dependent.  
Open concept kitchen - living - dining areas.  
Furniture is added to taste after completion.`,
    productId: "talishouse-400",
  },
  residential: {
    name: "Talishouse™ 1,600 - 2,400 - 3,200",
    slug: "residential",
    image: "/images/talishouse/residential/hero.png",
    size: "talishouse-residential",
    description: `1,600 - 2,400 - 3200 sq.ft.. Permanent installation only (on screw piles, piers or slabs). Three bedrooms, two baths standard. Open concept kitchen - living - dining areas. Module arrangement: parallel, off-set parallel or L-shaped. Up in a week, finished in a month.  
Characterization: it includes an efficiency kitchen and four-piece bath, however, the number of bedrooms is size dependent.  
Open concept kitchen - living - dining areas.  
Furniture is added to taste after completion.`,
    productId: "talishouse-residential",
  },
};

type CategoryType = "recreational" | "residential";

function TalishouseContent() {
  const searchParams = useSearchParams();
  const productParam = searchParams.get("product");
  
  const category: CategoryType = productParam === "residential" ? "residential" : "recreational";
  const config = CATEGORY_CONFIG[category];
  const models = getModelsByCategory(category);
  const defaultModel = getDefaultModel(category)!;
  
  const [selectedModel, setSelectedModel] = useState<CategoryModel | null>(defaultModel);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedAddons, setSelectedAddons] = useState<Record<string, boolean>>({});
  const [wholesaleRequested, setWholesaleRequested] = useState(false);
  const [leaseToOwnRequested, setLeaseToOwnRequested] = useState(false);
  const [success, setSuccess] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    const param = searchParams.get("product");
    const newCategory: CategoryType = param === "residential" ? "residential" : "recreational";
    const newModels = getModelsByCategory(newCategory);
    const newDefault = newModels[0];
    if (newDefault && newDefault.id !== selectedModel?.id) {
      setSelectedModel(newDefault);
      setSelectedOptions({});
      setSelectedAddons({});
    }
  }, [searchParams]);

  const toggleOption = (cat: string, option: string) => {
    setSelectedOptions((prev) => ({ ...prev, [cat]: option }));
  };

  const toggleAddon = (addonId: string) => {
    setSelectedAddons((prev) => ({ ...prev, [addonId]: !prev[addonId] }));
  };

  const getAddonPrice = (addonId: string): number => {
    const addon = addonsRecord[addonId];
    return addon ? addon.price : 0;
  };

  const calculateTotal = (): number => {
    let total = selectedModel?.price || 0;
    Object.keys(selectedAddons).forEach((addonId) => {
      if (selectedAddons[addonId]) {
        total += getAddonPrice(addonId);
      }
    });
    return total;
  };

  const handleAddToCart = () => {
    const total = calculateTotal();
    const selectedAddonNames = Object.keys(selectedAddons)
      .filter((id) => selectedAddons[id])
      .map((id) => addonsRecord[id]?.name)
      .filter(Boolean);

    if (!selectedModel) return;

    const configSummary = {
      model: selectedModel?.name || "",
      ...selectedOptions,
      addons: selectedAddonNames.join(", ")
    };
    
    addToCart({
      id: `talishouse-${category}-${selectedModel.id}`,
      name: selectedModel.name,
      price: total,
      image: config.image,
      options: selectedOptions,
      addons: selectedAddonNames,
      wholesaleRequested,
      leaseToOwnRequested,
      // @ts-ignore
      metadata: configSummary
    });
    setSuccess(true);
  };

  const productAddons = getAddonsForProduct(config.productId);

  return (
    <>
      <SuccessToast
        show={success}
        message="Quote requested successfully"
        onClose={() => setSuccess(false)}
      />
      <ProductLayout
      productName={config.name}
      productImage={config.image}
      productSize={config.size}
      aboutContent={config.description}
      >
        <h1 className="text-2xl font-semibold text-gray-900">
          {selectedModel?.name || 'Select a Model'}
        </h1>

        {/* MODEL SELECTOR */}
        <div className="mt-3 mb-1">
          <div className="grid grid-cols-2 gap-2">
            {models.map((model) => (
              <button
                key={model.id}
                onClick={() => {
                  if (selectedModel?.id === model.id) {
                    setSelectedModel(null);
                  } else {
                    setSelectedModel(model);
                  }
                }}
                className={`p-4 rounded-xl border text-sm font-medium transition-all duration-200 hover:scale-[1.02] hover:shadow-md ${
                  selectedModel?.id === model.id
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                }`}
              >
                {model.name.replace("Talishouse™ ", "")}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 mb-4 border-b border-gray-100 pb-6">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Initial Estimated Price</p>
          <div className="mb-3">
            <p className="text-[11px] font-medium text-gray-400">Build & Price: {formatCAD(BUILD_AND_PRICE)}</p>
            <hr className="border-t border-gray-200 my-3" />
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-[11px] font-semibold text-amber-800">Shipping & Customs Clearance: {formatCAD(SHIPPING_CLEARANCE)}</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-4">
            {formatCAD(calculateTotal() + SHIPPING_CLEARANCE + BUILD_AND_PRICE)}
          </p>
          
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Deposit (5% of total)</span>
              <span className="text-lg font-bold text-black">
                {formatCAD((calculateTotal() + SHIPPING_CLEARANCE + BUILD_AND_PRICE) * 0.05)}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* LEASE TO OWN PREVIEW */}
          <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-100/50">
            <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider mb-3">Lease-to-Own Estimate</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-blue-900">
                {formatCAD(((calculateTotal() + SHIPPING_CLEARANCE + BUILD_AND_PRICE) * 0.6) / 60)}
              </span>
              <span className="text-sm font-medium text-blue-700">/ month</span>
            </div>
            <p className="text-[11px] text-blue-600/80 mt-2 leading-relaxed">
              *Estimated based on 60 months with 50% down payment and 5% admin fee. Subject to OAC.
            </p>
          </div>
          <ProductConfigurator
            selectedOptions={selectedOptions}
            onOptionChange={toggleOption}
          />

          {productAddons.length > 0 && (
            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-sm uppercase tracking-wide text-gray-500 mb-4">
                Available Add-Ons
              </h3>
              <div className="space-y-3">
                {productAddons.map((addon) => (
                  <button
                    key={addon.id}
                    onClick={() => toggleAddon(addon.id)}
                    className={`w-full p-4 rounded-xl border text-sm font-medium transition duration-200 flex items-center justify-between ${
                      selectedAddons[addon.id]
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300"
                    }`}
                  >
                    <div>
                      <p className={`font-medium ${selectedAddons[addon.id] ? "text-white" : "text-gray-900"}`}>{addon.name}</p>
                      <p className={`text-xs mt-0.5 ${selectedAddons[addon.id] ? "text-white/70" : "text-gray-500"}`}>{addon.description}</p>
                    </div>
                    <span className={`font-semibold ${selectedAddons[addon.id] ? "text-white" : "text-gray-900"}`}>
                      +{formatCAD(addon.price)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="wholesale"
                checked={wholesaleRequested}
                onChange={(e) => setWholesaleRequested(e.target.checked)}
                className="h-4 w-4 text-black border-gray-300 rounded focus:ring-black cursor-pointer"
              />
              <label
                htmlFor="wholesale"
                className="ml-3 text-sm text-gray-700 cursor-pointer"
              >
                Request Wholesale Terms
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="leaseToOwn"
                checked={leaseToOwnRequested}
                onChange={(e) => setLeaseToOwnRequested(e.target.checked)}
                className="h-4 w-4 text-black border-gray-300 rounded focus:ring-black cursor-pointer"
              />
              <label
                htmlFor="leaseToOwn"
                className="ml-3 text-sm text-gray-700 cursor-pointer"
              >
                Request Lease-To-Own
              </label>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            className="btn-primary w-full text-lg font-semibold"
          >
            Request a Quote
          </button>

          <div className="text-center">
            <a
              href="/lease-to-own"
              className="text-xs text-gray-500 hover:text-black underline"
            >
              Interested in financing? Learn about Lease-to-Own →
            </a>
          </div>
        </div>
      </ProductLayout>
    </>
  );
}

export default function TalishousePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <TalishouseContent />
    </Suspense>
  );
}