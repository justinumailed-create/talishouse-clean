"use client";

import { useState } from "react";
import ProductLayout from "@/components/ProductLayout";
import { useCart } from "@/context/CartContext";
import { ProductConfigurator } from "@/components/ProductConfigurator";
import {
  glasshouseModels,
  glasshouseFamily,
  type ProductModel,
} from "@/lib/products";
import { getAddonsForProduct, addonsRecord } from "@/lib/config/addons";
import { productFamilies } from "@/lib/productFamilies";

export const dynamic = "force-dynamic";

export default function GlasshousePage() {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedAddons, setSelectedAddons] = useState<Record<string, boolean>>({});
  const [wholesaleRequested, setWholesaleRequested] = useState(false);
  const { addToCart } = useCart();

  const model = glasshouseModels[0] as ProductModel;

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
    let total = model?.price || 0;
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
      id: `${model.id}-${Object.entries(selectedOptions).map(([, v]) => v).join("-")}-${Object.entries(selectedAddons).filter(([,v]) => v).map(([k]) => k).join("-")}`,
      name: `${model.name}${wholesaleRequested ? " (Wholesale/Lease-to-Own)" : ""}`,
      price: total,
      image: model?.image || "/images/glasshouse-200.jpeg",
      options: selectedOptions,
      addons: selectedAddonNames,
      wholesaleRequested,
    });
  };

  const productAddons = getAddonsForProduct(model.id);

  return (
    <ProductLayout
      productName={model?.name || "Glasshouse™"}
      productImage={model?.image || ""}
      productSize="glasshouse-200"
      familyDescription={
        glasshouseFamily?.gridDescription ||
        productFamilies?.glasshouse?.gridDescription ||
        model?.description ||
        "Modern glass living spaces with natural light."
      }
      aboutContent={model?.description || ""}
    >
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tighter text-gray-900">
          {model.name}
        </h1>

        <div className="mt-2">
          <p className="text-xl text-gray-900 font-bold">
            CAD ${model.price.toLocaleString()}
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
            ADD TO CART — {model.name} — CAD ${calculateTotal().toLocaleString()}
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
