"use client";

import { useState } from "react";
import ProductLayout from "@/components/ProductLayout";
import { useCart } from "@/context/CartContext";
import { ProductConfigurator } from "@/components/ProductConfigurator";
import { getModelsByCategory, getDefaultModel, PRODUCT_CATEGORIES } from "@/lib/products";
import { getAddonsForProduct, addonsRecord } from "@/lib/config/addons";

export const dynamic = "force-dynamic";

export default function GlasshousePage() {
  const models = getModelsByCategory("glasshouse");
  const defaultModel = getDefaultModel("glasshouse")!;
  
  const [selectedModel, setSelectedModel] = useState(defaultModel);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedAddons, setSelectedAddons] = useState<Record<string, boolean>>({});
  const [wholesaleRequested, setWholesaleRequested] = useState(false);
  const { addToCart } = useCart();

  const toggleOption = (category: string, option: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [category]: option,
    }));
  };

  const toggleAddon = (addonId: string) => {
    setSelectedAddons((prev) => ({
      ...prev,
      [addonId]: !prev[addonId],
    }));
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
      id: `glasshouse-${selectedModel.id}-${Object.entries(selectedOptions).map(([, v]) => v).join("-")}`,
      name: selectedModel.name,
      price: total,
      image: "/images/glasshouse-200.jpeg",
      options: selectedOptions,
      addons: selectedAddonNames,
      wholesaleRequested,
    });
  };

  const productAddons = getAddonsForProduct("glasshouse-200");

  return (
    <ProductLayout
      productName="Glasshouse™"
      productImage="/images/glasshouse-200.jpeg"
      productSize="glasshouse-200"
      familyDescription={`Glasshouse™ : The quick start option:
- Up to five units shipped together with up to five optional deck platforms in one sea-can container.
- Size and appearance: 10 x 20 ft. each, one, two or three sides glass.
- Most commonly arranged L-shaped, U-shaped or parallel.
- Most suitable as "VIEW" cottages, for own use, or in short term rental applications.
- Retail, Wholesale and Lease-To-Own purchasing terms.`}
      aboutContent={`Glasshouse™: Modern glass living spaces with natural light.
8' x 20' or 10' x 20' steel structures featuring one, two or three sides glass.
Great as short-term rental cottages with a view or home offices.`}
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
                {model.name.replace("Glasshouse™ ", "")}
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