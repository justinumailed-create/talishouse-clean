"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProductLayout from "@/components/ProductLayout";
import { useCart } from "@/context/CartContext";
import { ProductConfigurator } from "@/components/ProductConfigurator";
import { getModelsByCategory } from "@/lib/products";
import { getAddonsForProduct, addonsRecord } from "@/lib/config/addons";
import SuccessToast from "@/components/SuccessToast";
import { formatCAD } from "@/utils/currency";

const SHIPPING_CLEARANCE = 10000;
const BUILD_AND_PRICE = 1950;
const TAX_RATE = 0.14;

export default function TalishouseRecreationalPage() {
  const router = useRouter();
  const allModels = getModelsByCategory("recreational");
  const models = allModels.filter(m => m.id === "talishouse-400" || m.id === "talishouse-800");
  
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedModel, setSelectedModel] = useState<any>(models[0]);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedAddons, setSelectedAddons] = useState<Record<string, boolean>>({});
  const [splitsCost, setSplitsCost] = useState(0);
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

  const calculateBase = (): number => {
    return selectedModel?.price || 0;
  };

  const calculateAddons = (): number => {
    let total = 0;
    Object.keys(selectedAddons).forEach((addonId) => {
      if (selectedAddons[addonId]) {
        total += getAddonPrice(addonId);
      }
    });
    return total;
  };

  const calculateSubtotal = (): number => {
    return calculateBase() + calculateAddons();
  };

  const calculateFinal = (): number => {
    const subtotal = calculateSubtotal();
    const final = subtotal - splitsCost;
    return Math.max(0, final);
  };

  const calculateSubtotalWithUpsell = (): number => {
    return BUILD_AND_PRICE + calculateFinal() + SHIPPING_CLEARANCE;
  };

  const calculateTax = (): number => {
    return calculateSubtotalWithUpsell() * TAX_RATE;
  };

  const calculateTotalWithUpsell = (): number => {
    return calculateSubtotalWithUpsell() + calculateTax();
  };

  const canProceed = (): boolean => {
    if (currentStep === 1 && !selectedModel) return false;
    return true;
  };

  const handleAddToCart = () => {
    const final = calculateFinal();
    
    const selectedAddonNames = Object.keys(selectedAddons)
      .filter((id) => selectedAddons[id])
      .map((id) => addonsRecord[id]?.name)
      .filter(Boolean);

    const configSummary = {
      model: selectedModel.name,
      ...selectedOptions,
      addons: selectedAddonNames.join(", "),
      splitsApplied: splitsCost > 0 ? splitsCost : undefined
    };

    addToCart({
      id: `talishouse-recreational-${selectedModel.id}`,
      name: selectedModel.name,
      price: final,
      image: selectedModel.image,
      options: selectedOptions,
      addons: selectedAddonNames,
      wholesaleRequested,
      leaseToOwnRequested,
      metadata: configSummary
    });
    setSuccess(true);
  };

  const handleContinueToCheckout = () => {
    handleAddToCart();
    router.push("/checkout");
  };

  const productAddons = getAddonsForProduct(selectedModel.id);

  if (!selectedModel) return null;

  return (
    <>
      <SuccessToast
        show={success}
        message="Quote requested successfully"
        onClose={() => setSuccess(false)}
      />
      <ProductLayout
        productName="Talishouse™ 400 and 800"
        productImage={selectedModel.image}
        productSize={selectedModel.id}
        aboutContent={`400 - 800 sq.ft.. Permanent or mobile installation (on wheeled platforms. Mobile installation may negate the need for Building Permits in many Canadian jurisdictions).  
Up in a day, finished in a week.  
Characterization: it includes an efficiency kitchen and four-piece bath, however, the number of bedrooms is size dependent.  
Open concept kitchen - living - dining areas.  
Furniture is added to taste after completion.`}
      >
        <h1 className="text-2xl font-semibold text-gray-900">
          {selectedModel?.name || 'Select a Model'}
        </h1>

        {/* STEP INDICATOR */}
        <div className="flex items-center gap-2 mt-4 mb-6">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`flex-1 h-1 rounded-full transition-colors ${
                step <= currentStep ? "bg-gray-900" : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* STEP 1: PRODUCT TOGGLE */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Select Size</p>
            <div className="grid grid-cols-2 gap-2">
              {models.map((model) => (
                <button
                  key={model.id}
                  onClick={() => setSelectedModel(model)}
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
        )}

        {/* STEP 2: BASE CONFIGURATION */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-gray-100 bg-gray-50">
              <p className="text-sm text-gray-600">
                Base configuration included with your selection.
              </p>
              <ul className="mt-3 space-y-2 text-sm text-gray-500">
                <li>• 21' x 20' steel structure</li>
                <li>• Efficiency kitchen</li>
                <li>• Four-piece bath</li>
                <li>• Open concept living-dining-kitchen</li>
                <li>• One day assembly</li>
              </ul>
            </div>
            <ProductConfigurator
              selectedOptions={selectedOptions}
              onOptionChange={toggleOption}
            />
          </div>
        )}

        {/* STEP 3: ADD-ONS */}
        {currentStep === 3 && (
          <div className="space-y-4">
            {productAddons.length > 0 ? (
              <>
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Available Add-Ons</p>
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
              </>
            ) : (
              <div className="p-4 rounded-lg border border-gray-100 bg-gray-50">
                <p className="text-sm text-gray-500">No add-ons available for this product.</p>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: SPLITS INPUT */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">SPLITS Cost (Optional)</p>
            <div className="p-4 rounded-lg border border-gray-100 bg-gray-50">
              <p className="text-sm text-gray-600 mb-3">
                SPLITS is a cost reduction program. Enter your SPLITS code to deduct from the total.
              </p>
              <input
                type="number"
                value={splitsCost || ""}
                onChange={(e) => setSplitsCost(Number(e.target.value) || 0)}
                placeholder="Enter SPLITS amount"
                className="w-full p-3 rounded-lg border border-gray-200 text-sm"
              />
              <p className="text-xs text-gray-500 mt-2">
                Current deduction: {formatCAD(splitsCost)}
              </p>
            </div>

            <div className="p-4 rounded-lg border border-gray-100 bg-gray-50">
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Final Pricing</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Build & Price</span>
                  <span className="font-medium">{formatCAD(BUILD_AND_PRICE)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Base ({selectedModel?.name})</span>
                  <span className="font-medium">{formatCAD(calculateBase())}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Add-ons</span>
                  <span className="font-medium">{formatCAD(calculateAddons())}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping & Custom Clearance</span>
                  <span className="font-medium">{formatCAD(SHIPPING_CLEARANCE)}</span>
                </div>
                {splitsCost > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>SPLITS Deduction</span>
                    <span>-{formatCAD(splitsCost)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatCAD(calculateSubtotalWithUpsell())}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax (14%)</span>
                  <span className="font-medium">{formatCAD(calculateTax())}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total</span>
                  <span>{formatCAD(calculateTotalWithUpsell())}</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Deposit (5%)</span>
                  <span className="text-lg font-bold text-black">
                    {formatCAD(calculateTotalWithUpsell() * 0.05)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NAVIGATION */}
        <div className="flex gap-3 mt-6">
          {currentStep > 1 && (
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="flex-1 py-3 rounded-lg border border-gray-200 text-sm font-medium hover:bg-gray-50"
            >
              Back
            </button>
          )}
          
          {currentStep === 4 ? (
            <button
              onClick={handleContinueToCheckout}
              className="flex-1 py-3 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800"
            >
              Continue to Checkout
            </button>
          ) : (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceed()}
              className="flex-1 py-3 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
            >
              Continue
            </button>
          )}
        </div>
      </ProductLayout>
    </>
  );
}