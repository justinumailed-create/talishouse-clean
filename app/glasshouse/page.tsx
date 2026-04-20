"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProductLayout from "@/components/ProductLayout";
import { useCart } from "@/context/CartContext";
import { ProductConfigurator } from "@/components/ProductConfigurator";
import { getModelsByCategory, getDefaultModel } from "@/lib/products";
import { getAddonsForProduct, addonsRecord } from "@/lib/config/addons";
import SuccessToast from "@/components/SuccessToast";
import { formatCAD } from "@/utils/currency";

const SHIPPING_CLEARANCE = 10000;
const BUILD_AND_PRICE = 1950;
const TAX_RATE = 0.14;

export default function GlasshousePage() {
  const router = useRouter();
  const allModels = getModelsByCategory("glasshouse");
  const models = allModels.filter(m => m.id === "160" || m.id === "200");
  
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedModel, setSelectedModel] = useState<any>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedAddons, setSelectedAddons] = useState<Record<string, boolean>>({});
  const [splitsCost, setSplitsCost] = useState(0);
  const [wholesaleRequested, setWholesaleRequested] = useState(false);
  const [leaseToOwnRequested, setLeaseToOwnRequested] = useState(false);
  const [success, setSuccess] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    const defaultModel = getDefaultModel("glasshouse");
    setSelectedModel(defaultModel);
  }, []);

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
    const base = calculateBase();
    const addons = calculateAddons();
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
      id: `glasshouse-${selectedModel.id}`,
      name: selectedModel.name,
      price: final,
      image: getProductImage(),
      options: selectedOptions,
      addons: selectedAddonNames,
      wholesaleRequested,
      leaseToOwnRequested,
      metadata: configSummary
    });
    setSuccess(true);
  };

  const productAddons = getAddonsForProduct("glasshouse-200").filter(
    addon => addon.name !== "Interior Finish Pack"
  );

  const getProductImage = () => {
    if (!selectedModel) return "/images/glasshouse/hero.png";
    if (selectedModel.name.includes("160")) {
      return "/images/glasshouse/hero.png";
    }
    if (selectedModel.name.includes("200")) {
      return "/images/glasshouse/models/200.png";
    }
    return "/images/glasshouse/hero.png";
  };

  if (!selectedModel) return null;

  return (
    <>
      <SuccessToast
        show={success}
        message="Quote requested successfully"
        onClose={() => setSuccess(false)}
      />
      <ProductLayout
        productName="Glasshouse™ 160 and 200"
        productImage={getProductImage()}
        productSize="glasshouse-200"
        aboutContent={`160 sq.ft & 200 sq.ft., one, two or three sides glass.  
Open concept, three season rated.  
Permanent installation only, deck or pergola optional.  
Up in a day, finished in a week.  
Characterization: it is finished open space. Dividing walls, amenities and furniture are added to taste after completion.`}
      >
        <h1 className="text-2xl font-semibold text-gray-900">
          {selectedModel?.name || 'Select a Model'}
        </h1>

        {/* STEP INDICATOR */}
        <div className="flex items-center gap-2 mt-4 mb-6">
          {[1, 2, 3, 4, 5].map((step) => (
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
                  {model.name.replace("Glasshouse™ ", "")}
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
                <li>• Steel frame structure</li>
                <li>• Glass panels (one, two, or three sides)</li>
                <li>• Hardware and instructions</li>
                <li>• Up to 5 units per sea-can</li>
              </ul>
            </div>
            <ProductConfigurator
              selectedOptions={selectedOptions}
              onOptionChange={toggleOption}
              hideSections={true}
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
          </div>
        )}

        {/* STEP 5: FINAL UPSELL */}
        {currentStep === 5 && (
          <div className="space-y-4">
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

            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Deposit (5%)</span>
                <span className="text-lg font-bold text-black">
                  {formatCAD(calculateTotalWithUpsell() * 0.05)}
                </span>
              </div>
            </div>

            {leaseToOwnRequested && (
              <div className="p-5 rounded-2xl bg-blue-50/50 border border-blue-100/50">
                <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider mb-3">Lease-to-Own Estimate</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-blue-900">
                    {formatCAD((calculateTotalWithUpsell() * 0.6) / 60)}
                  </span>
                  <span className="text-sm font-medium text-blue-700">/ month</span>
                </div>
                <p className="text-[11px] text-blue-600/80 mt-2 leading-relaxed">
                  *Estimated based on 60 months with 50% down payment and 5% admin fee. Subject to OAC.
                </p>
              </div>
            )}
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
          
          {currentStep < 5 ? (
            currentStep === 4 ? (
              <button
                onClick={() => router.push("/checkout")}
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
            )
          ) : (
            <div className="space-y-3 flex-1">
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="wholesale"
                    checked={wholesaleRequested}
                    onChange={(e) => setWholesaleRequested(e.target.checked)}
                    className="h-4 w-4 text-black border-gray-300 rounded focus:ring-black cursor-pointer"
                  />
                  <label htmlFor="wholesale" className="ml-3 text-sm text-gray-700 cursor-pointer">
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
                  <label htmlFor="leaseToOwn" className="ml-3 text-sm text-gray-700 cursor-pointer">
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
            </div>
          )}
        </div>
      </ProductLayout>
    </>
  );
}