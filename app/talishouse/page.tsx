"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/context/CartContext";
import ProductLayout from "@/components/ProductLayout";
import { ProductConfigurator } from "@/components/ProductConfigurator";
import {
  talishouseModels,
  talishouseFamily,
  type Bundle,
} from "@/lib/products";
import { getAddonsForProduct, addonsRecord } from "@/lib/config/addons";
import { productFamilies } from "@/lib/productFamilies";

const EXPECTED_CATEGORY_PREFIX = "talishouse";

const PRODUCT_SLUG_MAP: Record<string, string> = {
  "420": "talishouse-420",
  "residential": "talishouse-residential",
  "talishouse-420": "talishouse-420",
  "talishouse-residential": "talishouse-residential",
};

function resolveProductId(param: string | null): string {
  if (!param) return "talishouse-420";
  const mapped = PRODUCT_SLUG_MAP[param];
  if (mapped && talishouseModels.some((m) => m.id === mapped)) {
    return mapped;
  }
  if (talishouseModels.some((m) => m.id === param)) {
    return param;
  }
  return "talishouse-420";
}

function TalishouseContent() {
  const searchParams = useSearchParams();
  const productParam = searchParams.get("product");
  
  const resolvedModelId = resolveProductId(productParam);
  console.log("Opening product:", resolvedModelId);
  
  const [selectedModelId, setSelectedModelId] = useState<string>(resolvedModelId);
  const [selectedBundleId, setSelectedBundleId] = useState<string>("residential-800");
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedAddons, setSelectedAddons] = useState<Record<string, boolean>>({});
  const [wholesaleRequested, setWholesaleRequested] = useState(false);
  const { addToCart } = useCart();

  const currentProduct = talishouseModels.find((m) => m.id === selectedModelId);

  useEffect(() => {
    const param = searchParams.get("product");
    const resolved = resolveProductId(param);
    if (resolved && resolved !== selectedModelId) {
      setSelectedModelId(resolved);
      setSelectedOptions({});
      setSelectedAddons({});
    }
  }, [searchParams, selectedModelId]);

  if (!currentProduct) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">Product not found</p>
      </div>
    );
  }

  if (!currentProduct.category.startsWith(EXPECTED_CATEGORY_PREFIX)) {
    throw new Error(`Product layout mismatch: expected ${EXPECTED_CATEGORY_PREFIX}, got ${currentProduct.category}`);
  }

  const selectedBundle = currentProduct.bundles?.find((b: Bundle) => b.id === selectedBundleId);
  const calculatedPrice = selectedBundle 
    ? selectedBundle.units * selectedBundle.basePrice
    : currentProduct.price;

  const toggleOption = (category: string, option: string) => {
    setSelectedOptions((prev) => ({ ...prev, [category]: option }));
  };

  const toggleAddon = (addonId: string) => {
    setSelectedAddons((prev) => ({ ...prev, [addonId]: !prev[addonId] }));
  };

  const getAddonPrice = (addonId: string): number => {
    const addon = addonsRecord[addonId];
    return addon ? addon.price : 0;
  };

  const calculateTotal = (): number => {
    let total = calculatedPrice;
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

    const productName = selectedBundle 
      ? `${selectedBundle.name} (${selectedBundle.units} units)`
      : currentProduct.name;

    addToCart({
      id: `${currentProduct.id}-${selectedBundleId}-${Object.entries(selectedOptions).map(([, v]) => v).join("-")}-${Object.entries(selectedAddons).filter(([,v]) => v).map(([k]) => k).join("-")}`,
      name: `${productName}${wholesaleRequested ? " (Wholesale)" : ""}`,
      price: total,
      image: currentProduct?.image || "/images/talishouse-420.png",
      options: selectedOptions,
      addons: selectedAddonNames,
      wholesaleRequested,
    });
  };

  const productAddons = getAddonsForProduct(currentProduct.id);

  const filteredBundles = currentProduct.bundles || [];

  return (
    <ProductLayout
      productName={currentProduct?.name || "Talishouse™"}
      productImage={currentProduct?.image || ""}
      familyDescription={
        talishouseFamily?.gridDescription ||
        productFamilies?.talishouse?.gridDescription ||
        currentProduct?.description ||
        "Flexible modular housing solutions designed for modern living."
      }
      aboutContent={currentProduct?.description || ""}
    >
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold tracking-tighter text-gray-900">
            {currentProduct.name}
          </h1>
        </div>

        {filteredBundles.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
              Select Bundle Size
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {filteredBundles.map((bundle: Bundle) => (
                <button
                  key={bundle.id}
                  onClick={() => setSelectedBundleId(bundle.id)}
                  className={`p-4 rounded-xl border text-sm font-medium transition duration-200 hover:scale-[1.01] ${
                    selectedBundleId === bundle.id
                      ? "border-[#0070ba] bg-[#0070ba]/10 text-[#0070ba]"
                      : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {bundle.name.replace("Talishouse™ ", "")}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mb-6">
          <p className="text-2xl text-gray-900 font-bold">
            CAD ${calculatedPrice.toLocaleString()}
          </p>
          {selectedBundle && (
            <p className="text-xs text-gray-500">
              {selectedBundle.units} x CAD ${selectedBundle.basePrice.toLocaleString()}
            </p>
          )}
        </div>

        <div className="space-y-6">
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
            className="btn-primary w-full text-lg"
          >
            ADD TO CART — CAD ${calculateTotal().toLocaleString()}
          </button>

          <a
            href={`/lease-to-own?productId=${currentProduct.id}`}
            className="block w-full text-center btn-secondary"
          >
            Start Lease-to-Own →
          </a>
        </div>
      </div>
    </ProductLayout>
  );
}

export default function TalishousePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    }>
      <TalishouseContent />
    </Suspense>
  );
}
