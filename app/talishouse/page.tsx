"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/context/CartContext";
import ProductLayout from "@/components/ProductLayout";
import { ProductConfigurator } from "@/components/ProductConfigurator";
import { getModelsByCategory, getDefaultModel, type CategoryModel } from "@/lib/products";
import { getAddonsForProduct, addonsRecord } from "@/lib/config/addons";

const CATEGORY_CONFIG = {
  recreational: {
    name: "Talishouse™ Recreational",
    slug: "420",
    image: "/images/talishouse-420.png",
    size: "talishouse-420",
    description: `Talishouse™ Recreational : The flexible modular home system:
- 21' x 20' steel structures assembled in one day and move-in ready in one week.
- Two bedrooms, one bath, open concept living-dining-kitchen.
- Scalable from single units to multi-unit developments.
- Retail, Wholesale and Lease-To-Own purchasing terms.`,
    productId: "talishouse-420",
  },
  residential: {
    name: "Talishouse™ Residential",
    slug: "residential",
    image: "/images/talishouse-850.png",
    size: "talishouse-residential",
    description: `Talishouse™ Residential : Scalable living solutions:
- Multi-unit residential developments
- 21' x 20' steel structures assembled in one day
- Two bedrooms, one bath, open concept living-dining-kitchen
- From single units to complete communities
- Retail, Wholesale and Lease-To-Own purchasing terms.`,
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
  
  const [selectedModel, setSelectedModel] = useState<CategoryModel>(defaultModel);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedAddons, setSelectedAddons] = useState<Record<string, boolean>>({});
  const [wholesaleRequested, setWholesaleRequested] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    const param = searchParams.get("product");
    const newCategory: CategoryType = param === "residential" ? "residential" : "recreational";
    const newModels = getModelsByCategory(newCategory);
    const newDefault = newModels[0];
    if (newDefault && newDefault.id !== selectedModel.id) {
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
    let total = selectedModel.price || 0;
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

    addToCart({
      id: `talishouse-${category}-${selectedModel.id}`,
      name: selectedModel.name,
      price: total,
      image: config.image,
      options: selectedOptions,
      addons: selectedAddonNames,
      wholesaleRequested,
    });
  };

  const productAddons = getAddonsForProduct(config.productId);

  return (
    <ProductLayout
      productName={config.name}
      productImage={config.image}
      productSize={config.size}
      familyDescription={config.description}
      aboutContent={`${selectedModel.name}: ${config.description.split(':')[1]?.split('.')[0] || 'Modern modular living solution'}`}
    >
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tighter text-gray-900">
          {selectedModel.name}
        </h1>

        {/* MODEL SELECTOR */}
        <div className="mt-4 mb-2">
          <div className="grid grid-cols-2 gap-2">
            {models.map((model) => (
              <button
                key={model.id}
                onClick={() => setSelectedModel(model)}
                className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                  selectedModel.id === model.id
                    ? "border-[#0070ba] bg-[#0070ba]/10 text-[#0070ba]"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                }`}
              >
                {model.name.replace("Talishouse™ ", "")}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-2xl text-gray-900 font-bold">
            CAD ${selectedModel.price.toLocaleString()}
          </p>
        </div>

        <div className="mt-6 space-y-6">
          <ProductConfigurator
            selectedOptions={selectedOptions}
            onOptionChange={toggleOption}
          />

          {productAddons.length > 0 && (
            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                Available Add-Ons
              </h3>
              <div className="space-y-3">
                {productAddons.map((addon) => (
                  <button
                    key={addon.id}
                    onClick={() => toggleAddon(addon.id)}
                    className={`w-full p-4 rounded-xl border text-sm font-medium transition duration-200 flex items-center justify-between hover:scale-[1.01] ${
                      selectedAddons[addon.id]
                        ? "border-[#0070ba] bg-[#0070ba]/10"
                        : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div>
                      <p className="font-medium text-gray-900">{addon.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{addon.description}</p>
                    </div>
                    <span className="text-gray-900 font-semibold">
                      +CAD ${addon.price.toLocaleString()}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

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
              className="ml-3 text-xs text-gray-700 cursor-pointer"
            >
              Wholesale pricing requested
            </label>
          </div>

          <button
            onClick={handleAddToCart}
            className="btn-primary w-full"
          >
            ADD TO CART — {selectedModel.name} — CAD ${calculateTotal().toLocaleString()}
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
      </div>
    </ProductLayout>
  );
}

export default function TalishousePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <TalishouseContent />
    </Suspense>
  );
}