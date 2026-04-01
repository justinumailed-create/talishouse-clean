"use client";

import { useState } from "react";
import ProductLayout from "@/components/ProductLayout";
import { SelectionCard } from "@/components/ui/SelectionCard";
import {
  talistownsFamily,
  talistownsModels,
} from "@/lib/products";
import { getAddonsForProduct, addonsRecord } from "@/lib/config/addons";
import { productFamilies } from "@/lib/productFamilies";
import { useCart } from "@/context/CartContext";

export default function TalistownsPage() {
  const [selectedAddons, setSelectedAddons] = useState<Record<string, boolean>>({});
  const { addToCart } = useCart();

  const model = talistownsModels[0];

  const bundlePrice = 2 * 39950 + 8950;

  const toggleAddon = (addonId: string) => {
    setSelectedAddons((prev) => ({ ...prev, [addonId]: !prev[addonId] }));
  };

  const getAddonPrice = (addonId: string): number => {
    const addon = addonsRecord[addonId];
    return addon ? addon.price : 0;
  };

  const calculateTotal = (): number => {
    let total = bundlePrice;
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
      id: `talistowns-${Object.entries(selectedAddons).filter(([,v]) => v).map(([k]) => k).join("-")}`,
      name: `${talistownsFamily?.name || productFamilies?.talistowns?.name || "TalisTowns™"} Bundle`,
      price: total,
      image: talistownsFamily?.image || productFamilies?.talistowns?.image || "/images/talistowns.jpg",
      options: {},
      addons: selectedAddonNames,
    });
  };

  const productAddons = getAddonsForProduct("talistowns");

  return (
    <ProductLayout
      productName={talistownsFamily?.name || productFamilies?.talistowns?.name || "TalisTowns™"}
      productImage={talistownsFamily?.image || productFamilies?.talistowns?.image || ""}
      productSize="talistowns"
      familyDescription={
        talistownsFamily?.gridDescription ||
        productFamilies?.talistowns?.gridDescription ||
        "Community development system using multiple Talishouse™ units."
      }
      aboutContent={
        talistownsFamily?.gridDescription ||
        productFamilies?.talistowns?.gridDescription ||
        "Scalable from single structures to complete communities."
      }
    >
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tighter text-gray-900">
          {talistownsFamily?.name || productFamilies?.talistowns?.name || "TalisTowns™"} Bundle
        </h1>

        <div className="mt-4">
          <p className="text-2xl text-gray-900 font-bold">
            CAD ${bundlePrice.toLocaleString()}
          </p>
        </div>

        <div className="mt-6 space-y-6">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs text-gray-600 mb-3">
              Selecting TalisTowns™ automatically adds 2 x Talishouse™ 420 and
              1 x Gable Roof to the cart. Optional compatible add-ons can be layered
              on top.
            </p>
          </div>

          {productAddons.length > 0 && (
            <div className="border-b border-gray-100 pb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                Available Add-Ons
              </h3>
              <div className="space-y-3">
                {productAddons.map((addon) => (
                  <SelectionCard
                    key={addon.id}
                    label={addon.name}
                    description={addon.description}
                    price={addon.price}
                    selected={!!selectedAddons[addon.id]}
                    onClick={() => toggleAddon(addon.id)}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="py-4 text-center space-y-1">
            <p className="text-sm text-gray-600">Just add ambition</p>
            <p className="text-sm text-gray-600">Moonlighting is lucrative</p>
          </div>

          <button
            onClick={handleAddToCart}
            className="btn-primary w-full text-lg"
          >
            ADD TO CART — CAD ${calculateTotal().toLocaleString()}
          </button>
        </div>
      </div>
    </ProductLayout>
  );
}
