"use client";

import { useState } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { supabase } from "@/lib/supabase";

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "test";
console.log("PAYPAL CLIENT ID:", PAYPAL_CLIENT_ID);

interface PayPalButtonProps {
  amount: number;
  productName: string;
  userName: string;
  onSuccess?: () => void;
}

export default function PayPalButton({
  amount,
  productName,
  userName,
  onSuccess,
}: PayPalButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const savePayment = async (transactionId: string) => {
    try {
      const payload = {
        product_name: productName,
        amount: amount,
        user_name: userName,
        status: "completed",
      };
      console.log("PAYPAL PAYMENT INSERT - Payload:", JSON.stringify(payload, null, 2));

      const { error } = await supabase.from("payments").insert([payload]);
      if (error) {
        console.error("PAYPAL PAYMENT INSERT ERROR:", JSON.stringify(error, null, 2));
      } else {
        console.log("PAYPAL PAYMENT INSERT SUCCESS");
      }
    } catch (err) {
      console.error("Payment save failed:", err);
    }
  };

  return (
    <PayPalScriptProvider options={{ "client-id": PAYPAL_CLIENT_ID, currency: "CAD", intent: "capture" }}>
      <div className="space-y-3">
        <PayPalButtons
          style={{ layout: "vertical", color: "blue", shape: "rect" }}
          createOrder={(data, actions) => {
            return actions.order.create({
              intent: "CAPTURE",
              purchase_units: [{
                description: productName,
                amount: {
                  currency_code: "CAD",
                  value: amount.toString(),
                },
              }],
            });
          }}
          onApprove={async (data, actions) => {
            setLoading(true);
            try {
              if (actions.order) {
                const details = await actions.order.capture();
                await savePayment(details.id || "");
                onSuccess?.();
              }
            } catch (err: any) {
              console.warn("Payment capture failed:", err?.message || err);
              setError("Payment failed. Please try again.");
            } finally {
              setLoading(false);
            }
          }}
          onError={(err: any) => {
            console.warn("PayPal error:", err?.message || err);
            setError("Payment failed. Please try again.");
          }}
        />
        {loading && (
          <p className="text-center text-sm text-gray-500">Processing payment...</p>
        )}
        {error && (
          <p className="text-center text-sm text-red-600">{error}</p>
        )}
      </div>
    </PayPalScriptProvider>
  );
}
