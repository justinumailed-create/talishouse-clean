"use client";

import { useState } from "react";
import Link from "next/link";
import { getPricingConfig, calculateLeaseToOwn } from "@/lib/utils/pricingEngine";

interface LeaseProduct {
  id: string;
  name: string;
  price: number;
  description: string;
}

const products: LeaseProduct[] = [
  {
    id: "talishouse-400",
    name: "Talishouse™ 400",
    price: 39950,
    description: "21' x 20' steel structure, two bedrooms, one bath, open concept living.",
  },
  {
    id: "talishouse-residential",
    name: "Talishouse™ Residential",
    price: 79950,
    description: "Expanded residential living with extra square footage.",
  },
];

function getAvailableDurations(maxMonths: number): number[] {
  const durations: number[] = [];
  for (let months = 12; months <= maxMonths; months += 12) {
    durations.push(months);
  }
  return durations;
}

interface LeaseState {
  productId: string | null;
  duration: number | null;
  monthlyPayment: number;
  totalPaid: number;
  remainingBalance: number;
  monthsRemaining: number;
  credits: number;
  status: "selecting" | "active" | "owned";
}

export default function LeaseToOwnPage() {
  const config = getPricingConfig();
  const availableDurations = getAvailableDurations(config.leaseToOwn.maxMonths);
  
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [leaseState, setLeaseState] = useState<LeaseState>({
    productId: null,
    duration: null,
    monthlyPayment: 0,
    totalPaid: 0,
    remainingBalance: 0,
    monthsRemaining: 0,
    credits: 0,
    status: "selecting",
  });

  const selectedProductData = products.find((p) => p.id === selectedProduct);

  const calculateLease = (productId: string, duration: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const leaseCalc = calculateLeaseToOwn({
      totalAmount: product.price,
      months: duration,
      config,
    });

    setLeaseState({
      productId,
      duration,
      monthlyPayment: Math.ceil(leaseCalc.monthlyPayment),
      totalPaid: 0,
      remainingBalance: product.price,
      monthsRemaining: duration,
      credits: 0,
      status: "active",
    });
  };

  const handleProductSelect = (productId: string) => {
    setSelectedProduct(productId);
    setSelectedDuration(null);
  };

  const handleDurationSelect = (duration: number) => {
    if (!selectedProduct) return;
    setSelectedDuration(duration);
    calculateLease(selectedProduct, duration);
  };

  const handleMakePayment = () => {
    if (leaseState.status === "owned") return;

    const monthly = leaseState.monthlyPayment;
    const newCredits = leaseState.credits + monthly;
    const product = products.find((p) => p.id === leaseState.productId);

    if (!product) return;

    if (newCredits >= product.price) {
      setLeaseState((prev) => ({
        ...prev,
        credits: product.price,
        totalPaid: newCredits,
        remainingBalance: 0,
        monthsRemaining: 0,
        status: "owned",
      }));
    } else {
      setLeaseState((prev) => ({
        ...prev,
        credits: newCredits,
        totalPaid: prev.totalPaid + monthly,
        remainingBalance: product.price - newCredits,
        monthsRemaining: prev.monthsRemaining - 1,
      }));
    }
  };

  const progressPercentage =
    leaseState.productId && leaseState.status !== "selecting"
      ? Math.min(
          100,
          Math.round(
            (leaseState.credits /
              (products.find((p) => p.id === leaseState.productId)?.price || 1)) *
              100
          )
        )
      : 0;

  if (leaseState.status === "selecting") {
    return (
      <div className="w-full max-w-none px-6 lg:px-[80px] py-12">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tighter uppercase text-gray-900">
            Lease-to-Own
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Build equity toward ownership with flexible monthly payments
          </p>
        </div>

        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            1. Select Your Product
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => handleProductSelect(product.id)}
                className={`w-full p-6 rounded-2xl transition-all min-h-[48px] text-left border-2 ${
                  selectedProduct === product.id
                    ? "bg-black text-white border-black shadow-lg"
                    : "border-gray-100 hover:border-gray-300 bg-white text-black"
                }`}
              >
                <h3 className={`font-bold ${selectedProduct === product.id ? "text-white" : "text-black"}`}>{product.name}</h3>
                <p className={`text-2xl font-bold mt-2 ${selectedProduct === product.id ? "text-white" : "text-black"}`}>
                  CAD ${product.price.toLocaleString()}
                </p>
                  <p className={`text-sm mt-2 ${selectedProduct === product.id ? "text-white" : "text-gray-600"}`}>
                  {product.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {selectedProductData && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              2. Select Payment Term
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {availableDurations.map((duration) => {
                const leaseCalc = calculateLeaseToOwn({
                  totalAmount: selectedProductData.price,
                  months: duration,
                  config,
                });
                return (
                  <button
                    key={duration}
                    onClick={() => handleDurationSelect(duration)}
                    className={`w-full min-h-[48px] p-4 rounded-xl border-2 text-center transition-all ${
                      selectedDuration === duration
                        ? "bg-black text-white border-black shadow-md"
                        : "border-gray-100 hover:border-gray-300 bg-white text-black"
                    }`}
                  >
                    <p className="text-2xl font-bold">{duration}</p>
                    <p className={`text-xs ${selectedDuration === duration ? "text-white" : "text-gray-600"}`}>
                      months
                    </p>
                    <p className={`text-lg font-bold mt-2 ${selectedDuration === duration ? "text-white" : "text-black"}`}>
                      CAD ${Math.ceil(leaseCalc.monthlyPayment).toLocaleString()}/mo
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {selectedDuration && selectedProductData && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              3. Review Your Lease
            </h2>
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Product</p>
                  <p className="font-bold text-gray-900">{selectedProductData.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Product Price</p>
                  <p className="font-bold text-gray-900">
                    CAD ${selectedProductData.price.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Term</p>
                  <p className="font-bold text-gray-900">{selectedDuration} months</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Monthly Payment</p>
                  <p className="font-bold text-gray-900">
                    CAD ${leaseState.monthlyPayment.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-4">
                  Once you complete all payments, ownership transfers to you.
                </p>
                <button
                  onClick={handleMakePayment}
                  className="w-full btn-primary text-lg"
                >
                  Start Lease — First Payment
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="text-center mt-8">
          <Link
            href="/business-office"
            className="text-sm text-gray-600 hover:text-black underline"
          >
            ← Back to Business Office
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none px-6 lg:px-[80px] py-12">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tighter uppercase text-gray-900">
          Your Lease
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Track your progress toward ownership
        </p>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
        <div
          className={`px-6 py-5 text-white ${
            leaseState.status === "owned" ? "bg-green-600" : "bg-black"
          }`}
        >
          <p className="text-sm font-bold uppercase tracking-[0.25em]">
            {leaseState.status === "owned"
              ? "✓ Owned"
              : `Lease Active — ${products.find((p) => p.id === leaseState.productId)?.name || ""}`}
          </p>
        </div>

        <div className="space-y-6 p-6 sm:p-8">
          <div>
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>Ownership Progress</span>
              <span>{progressPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  leaseState.status === "owned" ? "bg-green-500" : "bg-black"
                }`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-4 bg-white border border-gray-100 rounded-xl">
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                Total Paid
              </p>
              <p className="text-2xl font-bold text-gray-900">
                CAD ${leaseState.totalPaid.toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-white border border-gray-100 rounded-xl">
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                Remaining
              </p>
              <p className="text-2xl font-bold text-gray-900">
                CAD ${leaseState.remainingBalance.toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-white border border-gray-100 rounded-xl">
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                Monthly Payment
              </p>
              <p className="text-2xl font-bold text-gray-900">
                CAD ${leaseState.monthlyPayment.toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-white border border-gray-100 rounded-xl">
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                Months Left
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {leaseState.monthsRemaining}
              </p>
            </div>
          </div>

          {leaseState.status !== "owned" && (
            <button
              onClick={handleMakePayment}
              className="w-full btn-primary text-lg"
            >
              Make Payment — CAD ${leaseState.monthlyPayment.toLocaleString()}
            </button>
          )}

          {leaseState.status === "owned" && (
            <div className="text-center p-6 bg-green-50 rounded-xl">
              <p className="text-lg font-bold text-green-700">
                Congratulations!
              </p>
              <p className="text-sm text-green-600 mt-2">
                You now own this property. Contact us to schedule delivery and
                installation.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/lease-to-own"
          className="text-sm text-gray-600 hover:text-black underline"
        >
          ← Start a New Lease
        </Link>
      </div>
    </div>
  );
}
