"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getPricingConfig, calculateLeaseToOwn } from "@/lib/utils/pricingEngine";
import { isAuthorized } from "@/lib/fast-code";
import { formatCAD } from "@/utils/currency";

interface LeaseProduct {
  id: string;
  name: string;
  price: number;
  available: boolean;
}

const PRODUCTS: LeaseProduct[] = [
  { id: "g160", name: "Glasshouse 160", price: 39950, available: true },
  { id: "g200", name: "Glasshouse 200", price: 49950, available: true },
  { id: "t400", name: "Talishouse 400", price: 79950, available: true },
  { id: "t800", name: "Talishouse 800", price: 119950, available: true },
  { id: "t1600", name: "Talishouse 1600", price: 199950, available: false },
  { id: "t2400", name: "Talishouse 2400", price: 249950, available: false },
  { id: "t3200", name: "Talishouse 3200", price: 299950, available: false },
];

const TERMS = [12, 24, 36, 48, 60];

function calculateMonthly(price: number, months: number): number {
  return Math.round(price / months);
}

function getValidTerms(price: number): { months: number; monthly: number }[] {
  return TERMS.map((months) => ({
    months,
    monthly: calculateMonthly(price, months),
  })).filter(({ monthly }) => monthly >= 500 && monthly <= 2000);
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

function LeaseToOwnPageContent() {
  const router = useRouter();
  const config = getPricingConfig();
  const searchParams = useSearchParams();
  
  const [authorized, setAuthorized] = useState<boolean | null>(null);

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

  useEffect(() => {
    setAuthorized(isAuthorized());
  }, []);

  useEffect(() => {
    if (authorized === false) {
      window.location.href = "/business-office";
    }
  }, [authorized]);

  useEffect(() => {
    const productParam = searchParams.get("product");
    if (productParam && PRODUCTS.find((p) => p.id === productParam)?.available) {
      setSelectedProduct(productParam);
    }
  }, [searchParams]);

  if (authorized === null) {
    return null;
  }

  const selectedProductData = PRODUCTS.find((p) => p.id === selectedProduct);
  const validTerms = selectedProductData ? getValidTerms(selectedProductData.price) : [];

  const calculateLease = (productId: string, duration: number) => {
    const product = PRODUCTS.find((p) => p.id === productId);
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
    const product = PRODUCTS.find((p) => p.id === productId);
    if (!product?.available) return;
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
    const product = PRODUCTS.find((p) => p.id === leaseState.productId);

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
              (PRODUCTS.find((p) => p.id === leaseState.productId)?.price || 1)) *
              100
          )
        )
      : 0;

  if (leaseState.status === "selecting") {
    return (
      <div className="w-full px-6 py-12">
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
            {PRODUCTS.map((product) => (
              <button
                key={product.id}
                onClick={() => handleProductSelect(product.id)}
                disabled={!product.available}
                className={`w-full p-6 rounded-2xl transition-all min-h-[48px] text-left border-2 ${
                  !product.available
                    ? "opacity-40 pointer-events-none border-gray-100 bg-white text-black"
                    : selectedProduct === product.id
                    ? "bg-black text-white border-black shadow-lg"
                    : "border-gray-100 hover:border-gray-300 bg-white text-black"
                }`}
              >
                <h3 className={`font-bold ${selectedProduct === product.id ? "text-white" : "text-black"}`}>{product.name}</h3>
                <p className={`text-sm font-medium mt-2 ${selectedProduct === product.id ? "text-white" : "text-black"}`}>
                  {product.available ? "INITIAL PAYMENT" : "NOT AVAILABLE"}
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
            {validTerms.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {validTerms.map(({ months, monthly }) => {
                  const leaseCalc = calculateLeaseToOwn({
                    totalAmount: selectedProductData.price,
                    months,
                    config,
                  });
                  return (
                    <button
                      key={months}
                      onClick={() => handleDurationSelect(months)}
                      className={`w-full min-h-[48px] p-4 rounded-xl border-2 text-center transition-all ${
                        selectedDuration === months
                          ? "bg-black text-white border-black shadow-md"
                          : "border-gray-100 hover:border-gray-300 bg-white text-black"
                      }`}
                    >
                      <p className="text-2xl font-bold">{months}</p>
                      <p className={`text-xs ${selectedDuration === months ? "text-white" : "text-gray-600"}`}>
                        months
                      </p>
                      <p className={`text-lg font-bold mt-2 ${selectedDuration === months ? "text-white" : "text-black"}`}>
                        {formatCAD(leaseCalc.monthlyPayment)}/mo
                      </p>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center border border-gray-200 rounded-xl bg-gray-50">
                <p className="text-gray-600 font-medium">Not Available for Lease-to-Own</p>
              </div>
            )}
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
                    {formatCAD(selectedProductData.price)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Term</p>
                  <p className="font-bold text-gray-900">{selectedDuration} months</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Monthly Payment</p>
                  <p className="font-bold text-gray-900">
                    {formatCAD(leaseState.monthlyPayment)}
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
    <div className="w-full px-6 py-12">
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
              : `Lease Active — ${PRODUCTS.find((p) => p.id === leaseState.productId)?.name || ""}`}
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
                {formatCAD(leaseState.totalPaid)}
              </p>
            </div>
            <div className="p-4 bg-white border border-gray-100 rounded-xl">
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                Remaining
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCAD(leaseState.remainingBalance)}
              </p>
            </div>
            <div className="p-4 bg-white border border-gray-100 rounded-xl">
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                Monthly Payment
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCAD(leaseState.monthlyPayment)}
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
              Make Payment — {formatCAD(leaseState.monthlyPayment)}
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

export default function LeaseToOwnPage() {
  return (
    <Suspense fallback={null}>
      <LeaseToOwnPageContent />
    </Suspense>
  );
}
