"use client";

import { useState } from "react";
import ProductLayout from "@/components/ProductLayout";
import { useCart } from "@/context/CartContext";
import { ProductConfigurator } from "@/components/ProductConfigurator";
import { getModelsByCategory } from "@/lib/products";
import { getAddonsForProduct, addonsRecord } from "@/lib/config/addons";
import SuccessToast from "@/components/SuccessToast";
import { formatCAD } from "@/utils/currency";

export default function TalishouseRecreationalPage() {
  const allModels = getModelsByCategory("recreational");
  const models = allModels.filter(m => m.id === "talishouse-400" || m.id === "talishouse-800");
  
  const [selectedModel, setSelectedModel] = useState<any>(models[0]);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedAddons, setSelectedAddons] = useState<Record<string, boolean>>({});
  const [wholesaleRequested, setWholesaleRequested] = useState(false);
  const [leaseToOwnRequested, setLeaseToOwnRequested] = useState(false);
  const [success, setSuccess] = useState(false);
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
    let total = selectedModel?.price || 0;
    Object.keys(selectedAddons).forEach((addonId) => {
      if (selectedAddons[addonId]) {
        total += getAddonPrice(addonId);
      }
    });
    return total;
  };

  const handleAddToCart = () => {
    if (!selectedModel) return;
    const total = calculateTotal();
    const selectedAddonNames = Object.keys(selectedAddons)
      .filter((id) => selectedAddons[id])
      .map((id) => addonsRecord[id]?.name)
      .filter(Boolean);

    addToCart({
      id: `talishouse-recreational-${selectedModel.id}`,
      name: selectedModel.name,
      price: total,
      image: selectedModel.image,
      options: selectedOptions,
      addons: selectedAddonNames,
      wholesaleRequested,
      leaseToOwnRequested,
    });
    setSuccess(true);
  };

  const productAddons = getAddonsForProduct("talishouse-400");

  if (!selectedModel) return null;

  return (
    <>
      <SuccessToast
        show={success}
        message="Quote requested successfully"
        onClose={() => setSuccess(false)}
      />
      <ProductLayout
        productName="Talishouse™ Recreational"
        productImage={selectedModel.image}
        productSize={selectedModel.id}
        familyDescription={`Talishouse™ Recreational : The flexible modular home system:
- 21' x 20' steel structures assembled in one day and move-in ready in one week.
- Two bedrooms, one bath, open concept living-dining-kitchen.
- Scalable from single units to multi-unit developments.
- Retail, Wholesale and Lease-To-Own purchasing terms.`}
        aboutContent={`Talishouse™ Recreational: Modern modular living for flexible lifestyles.
21' x 20' steel structures featuring open concept design.
Perfect for cottages, home offices, or investment properties.`}
      >
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-6">
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

        <p className="text-2xl font-bold text-gray-900">
          {formatCAD(calculateTotal())}
        </p>
        <p className="text-xs text-gray-500">CAD 58.50 per sq.ft. from</p>

        <div className="space-y-8">
          <ProductConfigurator
            selectedOptions={selectedOptions}
            onOptionChange={toggleOption}
          />

          {productAddons.length > 0 && (
            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-sm uppercase tracking-wide text-gray-500">
                Available Add-Ons
              </h3>
              <div className="space-y-3 mt-4">
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
              className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
            >
              Interested in financing? Learn about Lease-to-Own →
            </a>
          </div>
        </div>
      </div>
      </ProductLayout>
    </>
  );
}
