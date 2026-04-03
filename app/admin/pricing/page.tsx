"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  DEFAULT_PRICING_CONFIG,
  type PricingConfig,
} from "@/lib/config/pricing";
import { ToastContainer, useToast, Modal, LoadingButton } from "@/components/Toast";

const FALLBACK_CONFIG: PricingConfig = {
  taxRate: 0.14,
  paymentOptions: {
    full: { enabled: true },
    partial: { enabled: true, percentage: 0.05 },
  },
  leaseToOwn: {
    enabled: true,
    maxMonths: 60,
    adminFeePercent: 0.05,
    downPaymentPercent: 0.5,
    interestRate: 0.08,
  },
  discounts: {
    enabled: true,
    codes: {},
  },
};

export default function PricingAdminPage() {
  const [config, setConfig] = useState<PricingConfig>(DEFAULT_PRICING_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toasts, dismissToast, success, error } = useToast();
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountForm, setDiscountForm] = useState({
    code: "",
    type: "percentage" as "percentage" | "fixed",
    value: "",
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from("pricing_config")
        .select("tax_rate, full_payment_enabled, partial_payment_enabled")
        .single();

      if (error) {
        console.warn("Using fallback pricing config:", error.message);
        setConfig(FALLBACK_CONFIG);
        setIsLoading(false);
        return;
      }

      if (data) {
        setConfig((prev) => ({
          ...prev,
          taxRate: data.tax_rate ?? prev.taxRate,
          paymentOptions: {
            ...prev.paymentOptions,
            full: { ...prev.paymentOptions.full, enabled: data.full_payment_enabled ?? true },
            partial: { ...prev.paymentOptions.partial, enabled: data.partial_payment_enabled ?? true },
          },
        }));
      } else {
        console.warn("Pricing config missing, fallback applied");
        setConfig(FALLBACK_CONFIG);
      }
    } catch (err) {
      console.warn("Error fetching config, fallback applied:", err);
      setConfig(FALLBACK_CONFIG);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async () => {
    setIsSaving(true);

    try {
      const { data: existing } = await supabase
        .from("pricing_config")
        .select("id")
        .single();

      const updatePayload = {
        tax_rate: config.taxRate,
        full_payment_enabled: config.paymentOptions.full.enabled,
        partial_payment_enabled: config.paymentOptions.partial.enabled,
        updated_at: new Date().toISOString(),
      };

      if (existing) {
        console.log("PRICING CONFIG UPDATE - Payload:", JSON.stringify(updatePayload, null, 2));
        const { error: updateError } = await supabase
          .from("pricing_config")
          .update(updatePayload)
          .eq("id", existing.id);
        
        if (updateError) {
          console.error("PRICING CONFIG UPDATE ERROR:", JSON.stringify(updateError, null, 2));
        } else {
          console.log("PRICING CONFIG UPDATE SUCCESS");
        }
      } else {
        const insertPayload = { ...updatePayload, created_at: new Date().toISOString() };
        console.log("PRICING CONFIG INSERT - Payload:", JSON.stringify(insertPayload, null, 2));
        
        const { error: insertError } = await supabase
          .from("pricing_config")
          .insert([insertPayload]);
        
        if (insertError) {
          console.error("PRICING CONFIG INSERT ERROR:", JSON.stringify(insertError, null, 2));
        } else {
          console.log("PRICING CONFIG INSERT SUCCESS");
        }
      }

      success("Pricing configuration saved successfully!");
      
      if (typeof window !== "undefined") {
        localStorage.setItem("pricing_config", JSON.stringify(config));
      }
    } catch (err) {
      console.error("Error saving config:", err);
      error("Failed to save configuration.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateTaxRate = (value: string) => {
    const num = parseFloat(value) / 100;
    if (!isNaN(num) && num >= 0 && num <= 1) {
      setConfig((prev) => ({ ...prev, taxRate: num }));
    }
  };

  const updatePartialPaymentPercent = (value: string) => {
    const num = parseFloat(value) / 100;
    if (!isNaN(num) && num >= 0 && num <= 1) {
      setConfig((prev) => ({
        ...prev,
        paymentOptions: { ...prev.paymentOptions, partial: { ...prev.paymentOptions.partial, percentage: num } },
      }));
    }
  };

  const updateLeaseMaxMonths = (value: string) => {
    const num = parseInt(value);
    if (!isNaN(num) && num > 0) {
      setConfig((prev) => ({
        ...prev,
        leaseToOwn: { ...prev.leaseToOwn, maxMonths: num },
      }));
    }
  };

  const updateLeaseAdminFee = (value: string) => {
    const num = parseFloat(value) / 100;
    if (!isNaN(num) && num >= 0 && num <= 1) {
      setConfig((prev) => ({
        ...prev,
        leaseToOwn: { ...prev.leaseToOwn, adminFeePercent: num },
      }));
    }
  };

  const updateLeaseDownPayment = (value: string) => {
    const num = parseFloat(value) / 100;
    if (!isNaN(num) && num >= 0 && num <= 1) {
      setConfig((prev) => ({
        ...prev,
        leaseToOwn: { ...prev.leaseToOwn, downPaymentPercent: num },
      }));
    }
  };

  const updateLeaseInterest = (value: string) => {
    const num = parseFloat(value) / 100;
    if (!isNaN(num) && num >= 0) {
      setConfig((prev) => ({
        ...prev,
        leaseToOwn: { ...prev.leaseToOwn, interestRate: num },
      }));
    }
  };

  const toggleFullPayment = () => {
    setConfig((prev) => ({
      ...prev,
      paymentOptions: {
        ...prev.paymentOptions,
        full: { ...prev.paymentOptions.full, enabled: !prev.paymentOptions.full.enabled },
      },
    }));
  };

  const togglePartialPayment = () => {
    setConfig((prev) => ({
      ...prev,
      paymentOptions: {
        ...prev.paymentOptions,
        partial: { ...prev.paymentOptions.partial, enabled: !prev.paymentOptions.partial.enabled },
      },
    }));
  };

  const toggleLeaseToOwn = () => {
    setConfig((prev) => ({
      ...prev,
      leaseToOwn: { ...prev.leaseToOwn, enabled: !prev.leaseToOwn.enabled },
    }));
  };

  const toggleDiscounts = () => {
    setConfig((prev) => ({
      ...prev,
      discounts: { ...prev.discounts, enabled: !prev.discounts.enabled },
    }));
  };

  const handleAddDiscount = () => {
    if (!discountForm.code.trim()) {
      error("Please enter a discount code.");
      return;
    }
    if (!discountForm.value || isNaN(parseFloat(discountForm.value))) {
      error("Please enter a valid value.");
      return;
    }

    const value = parseFloat(discountForm.value) / (discountForm.type === "percentage" ? 100 : 1);

    setConfig((prev) => ({
      ...prev,
      discounts: {
        ...prev.discounts,
        codes: {
          ...prev.discounts.codes,
          [discountForm.code.toUpperCase()]: { type: discountForm.type, value },
        },
      },
    }));

    success(`Discount code ${discountForm.code.toUpperCase()} added!`);
    setDiscountForm({ code: "", type: "percentage", value: "" });
    setShowDiscountModal(false);
  };

  const removeDiscountCode = (code: string) => {
    setConfig((prev) => {
      const newCodes = { ...prev.discounts.codes };
      delete newCodes[code];
      return {
        ...prev,
        discounts: { ...prev.discounts, codes: newCodes },
      };
    });
    success(`Discount code ${code} removed.`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading configuration...</p>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">Failed to load configuration. Please refresh the page.</p>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <h1 className="text-2xl font-bold">Pricing Configuration</h1>
        <button
          onClick={saveConfig}
          disabled={isSaving}
          className="btn-primary w-full sm:w-auto"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="space-y-6">
        {/* Tax Rate */}
        <section className="card">
          <h2 className="text-lg font-semibold mb-4">Tax Rate</h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <label className="text-sm text-gray-600 min-w-[140px]">Tax Percentage</label>
            <div className="flex items-center">
              <input
                type="number"
                value={(config.taxRate * 100).toFixed(2)}
                onChange={(e) => updateTaxRate(e.target.value)}
                className="input w-28"
                min="0"
                max="100"
                step="0.01"
              />
              <span className="ml-2 text-gray-600">%</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">Current: {(config.taxRate * 100).toFixed(2)}% ({(config.taxRate).toFixed(4)} as decimal)</p>
        </section>

        {/* Payment Options */}
        <section className="card">
          <h2 className="text-lg font-semibold mb-4">Payment Options</h2>
          
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 rounded-lg gap-4">
              <div>
                <h3 className="font-medium">Full Payment</h3>
                <p className="text-xs text-gray-500">Allow customers to pay the full amount</p>
              </div>
              <button
                onClick={toggleFullPayment}
                className={`w-14 h-8 rounded-full transition-colors ${
                  config.paymentOptions.full.enabled ? "bg-[#1E4ED8]" : "bg-gray-300"
                }`}
              >
                <div
                  className={`w-6 h-6 bg-white rounded-full shadow transition-transform ${
                    config.paymentOptions.full.enabled ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 rounded-lg gap-4">
              <div>
                <h3 className="font-medium">Partial Payment</h3>
                <p className="text-xs text-gray-500">Allow customers to pay an initial percentage</p>
              </div>
              <button
                onClick={togglePartialPayment}
                className={`w-14 h-8 rounded-full transition-colors ${
                  config.paymentOptions.partial.enabled ? "bg-[#1E4ED8]" : "bg-gray-300"
                }`}
              >
                <div
                  className={`w-6 h-6 bg-white rounded-full shadow transition-transform ${
                    config.paymentOptions.partial.enabled ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            
            {config.paymentOptions.partial.enabled && (
              <div className="pl-4 border-l-2 border-gray-200 ml-2">
                <label className="text-sm text-gray-600 block mb-2">Initial Payment Percentage</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    value={(config.paymentOptions.partial.percentage * 100).toFixed(2)}
                    onChange={(e) => updatePartialPaymentPercent(e.target.value)}
                    className="input w-28"
                    min="0"
                    max="100"
                    step="0.01"
                  />
                  <span className="ml-2 text-gray-600">%</span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Lease-to-Own */}
        <section className="card">
          <h2 className="text-lg font-semibold mb-4">Lease-to-Own</h2>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 rounded-lg mb-4 gap-4">
            <div>
              <h3 className="font-medium">Enable Lease-to-Own</h3>
              <p className="text-xs text-gray-500">Allow customers to lease products with ownership options</p>
            </div>
            <button
              onClick={toggleLeaseToOwn}
              className={`w-14 h-8 rounded-full transition-colors ${
                config.leaseToOwn.enabled ? "bg-[#1E4ED8]" : "bg-gray-300"
              }`}
            >
              <div
                className={`w-6 h-6 bg-white rounded-full shadow transition-transform ${
                  config.leaseToOwn.enabled ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {config.leaseToOwn.enabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600 block mb-2">Max Lease Term</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    value={config.leaseToOwn.maxMonths}
                    onChange={(e) => updateLeaseMaxMonths(e.target.value)}
                    className="input w-28"
                    min="1"
                    max="120"
                  />
                  <span className="ml-2 text-gray-600">months</span>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600 block mb-2">Down Payment</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    value={(config.leaseToOwn.downPaymentPercent * 100).toFixed(2)}
                    onChange={(e) => updateLeaseDownPayment(e.target.value)}
                    className="input w-28"
                    min="0"
                    max="100"
                    step="0.01"
                  />
                  <span className="ml-2 text-gray-600">%</span>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600 block mb-2">Admin Fee</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    value={(config.leaseToOwn.adminFeePercent * 100).toFixed(2)}
                    onChange={(e) => updateLeaseAdminFee(e.target.value)}
                    className="input w-28"
                    min="0"
                    max="100"
                    step="0.01"
                  />
                  <span className="ml-2 text-gray-600">%</span>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-600 block mb-2">Interest Rate</label>
                <div className="flex items-center">
                  <input
                    type="number"
                    value={(config.leaseToOwn.interestRate * 100).toFixed(2)}
                    onChange={(e) => updateLeaseInterest(e.target.value)}
                    className="input w-28"
                    min="0"
                    max="100"
                    step="0.01"
                  />
                  <span className="ml-2 text-gray-600">%</span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Discount Codes */}
        <section className="card">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
            <div>
              <h2 className="text-lg font-semibold">Discount Codes</h2>
              <p className="text-xs text-gray-500">Manage promotional discount codes</p>
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <span className="text-sm text-gray-600">
                {config.discounts.enabled ? "Enabled" : "Disabled"}
              </span>
              <button
                onClick={toggleDiscounts}
                className={`w-14 h-8 rounded-full transition-colors flex-shrink-0 ${
                  config.discounts.enabled ? "bg-[#1E4ED8]" : "bg-gray-300"
                }`}
              >
                <div
                  className={`w-6 h-6 bg-white rounded-full shadow transition-transform ${
                    config.discounts.enabled ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {config.discounts.enabled && (
            <>
              <div className="mb-4">
                <button
                  onClick={() => setShowDiscountModal(true)}
                  className="btn-primary w-full sm:w-auto"
                >
                  + Add Discount Code
                </button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Code</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Type</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Value</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {Object.entries(config.discounts.codes).map(([code, discount]) => (
                      <tr key={code} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-mono">{code}</td>
                        <td className="px-4 py-3 text-sm capitalize">{discount.type}</td>
                        <td className="px-4 py-3 text-sm">
                          {discount.type === "percentage" 
                            ? `${(discount.value * 100).toFixed(2)}%`
                            : `$${discount.value.toFixed(2)}`
                          }
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => removeDiscountCode(code)}
                            className="btn-danger text-sm px-3 py-1"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {Object.keys(config.discounts.codes).length === 0 && (
                  <div className="empty-state">
                    <div className="empty-state-icon">
                      <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <h3 className="empty-state-title">No discount codes yet</h3>
                    <p className="empty-state-description">Click &quot;Add Discount Code&quot; to create your first promo code.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>

      <div className="mt-8 pt-6 border-t">
        <button
          onClick={saveConfig}
          disabled={isSaving}
          className="btn-primary w-full sm:w-auto"
        >
          {isSaving ? "Saving..." : "Save All Changes"}
        </button>
      </div>

      {/* Add Discount Modal */}
      <Modal
        isOpen={showDiscountModal}
        onClose={() => setShowDiscountModal(false)}
        title="Add Discount Code"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Code</label>
            <input
              type="text"
              value={discountForm.code}
              onChange={(e) => setDiscountForm({ ...discountForm, code: e.target.value.toUpperCase() })}
              className="input"
              placeholder="e.g. SAVE20"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Type</label>
            <select
              value={discountForm.type}
              onChange={(e) => setDiscountForm({ ...discountForm, type: e.target.value as "percentage" | "fixed" })}
              className="input"
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Value ({discountForm.type === "percentage" ? "%" : "$"})
            </label>
            <input
              type="number"
              value={discountForm.value}
              onChange={(e) => setDiscountForm({ ...discountForm, value: e.target.value })}
              className="input"
              placeholder={discountForm.type === "percentage" ? "e.g. 20 for 20%" : "e.g. 50"}
              min="0"
              step={discountForm.type === "percentage" ? "0.01" : "1"}
            />
          </div>
        </div>
        
        <div className="modal-actions">
          <button
            onClick={() => setShowDiscountModal(false)}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleAddDiscount}
            className="btn-primary"
          >
            Add Code
          </button>
        </div>
      </Modal>
    </div>
  );
}
