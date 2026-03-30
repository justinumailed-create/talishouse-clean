"use client";

import { useState } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { supabase } from "@/lib/supabase";

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "test";

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
      const { error } = await supabase.from("payments").insert([{
        product_name: productName,
        amount: amount,
        user_name: userName,
        status: "completed",
      }]);

      if (error) {
        console.error("Error saving payment:", error);
      }
    } catch (err) {
      console.error("Error saving payment:", err);
    }
  };

  return (
    <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID }}>
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
                console.log("Payment captured:", details);
                await savePayment(details.id || "");
                onSuccess?.();
              }
            } catch (err) {
              console.error("Error capturing payment:", err);
              setError("Payment failed. Please try again.");
            } finally {
              setLoading(false);
            }
          }}
          onError={(err) => {
            console.error("PayPal error:", err);
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
