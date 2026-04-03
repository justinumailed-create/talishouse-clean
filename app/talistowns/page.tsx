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
import SuccessToast from "@/components/SuccessToast";

export default function TalistownsPage() {
  const [selectedAddons, setSelectedAddons] = useState<Record<string, boolean>>({});
  const [wholesaleRequested, setWholesaleRequested] = useState(false);
  const [leaseToOwnRequested, setLeaseToOwnRequested] = useState(false);
  const [success, setSuccess] = useState(false);
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
      wholesaleRequested,
      leaseToOwnRequested,
    });
    setSuccess(true);
  };

  const productAddons = getAddonsForProduct("talistowns");

  return (
    <>
      <SuccessToast
        show={success}
        message="Quote requested successfully"
        onClose={() => setSuccess(false)}
      />
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
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          {talistownsFamily?.name || productFamilies?.talistowns?.name || "TalisTowns™"} Bundle
        </h1>

        <p className="text-xl font-bold text-gray-900">
          CAD ${bundlePrice.toLocaleString()}
        </p>

        <div className="space-y-6">
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <p className="text-sm text-gray-600">
              Selecting TalisTowns™ automatically adds 2 x Talishouse™ 400 and
              1 x Gable Roof to the cart. Optional compatible add-ons can be layered
              on top.
            </p>
          </div>

          {productAddons.length > 0 && (
            <div>
              <h3 className="text-sm uppercase tracking-wide text-gray-500 mb-4">
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
                Request wholesale pricing
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
                Request lease-to-own
              </label>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            className="btn-primary w-full text-lg font-semibold"
          >
            Request a Quote
          </button>
        </div>
      </div>
      </ProductLayout>
    </>
  );
}
