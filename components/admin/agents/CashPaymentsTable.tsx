"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { reverseCashPaymentAction } from "@/app/admin/agents/actions";
import type { ManualPaymentRecord } from "@/lib/manual-payments";

export default function CashPaymentsTable({
  payments,
  canReverse = false,
  agentNames = {},
}: {
  payments: ManualPaymentRecord[];
  canReverse?: boolean;
  agentNames?: Record<string, string>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (payments.length === 0) {
    return <p className="text-sm text-neutral-500">No cash payments recorded.</p>;
  }

  function reverse(payment: ManualPaymentRecord) {
    const note = window.prompt(
      `Reverse CA$${payment.amountCad.toFixed(2)} cash for ${payment.fastCode}? Optional reason:`,
      "",
    );
    if (note === null) return;
    setError(null);
    startTransition(async () => {
      const result = await reverseCashPaymentAction({ paymentId: payment.id, note });
      if (!result.ok) setError(result.error);
      router.refresh();
    });
  }

  return (
    <div className="overflow-x-auto">
      {error ? <p className="mb-2 text-sm text-red-600">{error}</p> : null}
      <table className="min-w-full text-sm">
        <thead className="text-left text-xs uppercase text-neutral-500">
          <tr>
            <th className="px-3 py-2">FAST Code</th>
            <th className="px-3 py-2">Amount</th>
            <th className="px-3 py-2">Paid on</th>
            <th className="px-3 py-2">Recorded by</th>
            <th className="px-3 py-2">Note</th>
            <th className="px-3 py-2">Status</th>
            {canReverse ? <th className="px-3 py-2" /> : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200">
          {payments.map((payment) => (
            <tr key={payment.id}>
              <td className="px-3 py-2 font-mono uppercase">{payment.fastCode}</td>
              <td className="px-3 py-2">CA${payment.amountCad.toFixed(2)}</td>
              <td className="px-3 py-2">{payment.paidOn}</td>
              <td className="px-3 py-2">
                {payment.recordedByAgentId && agentNames[payment.recordedByAgentId]
                  ? `${agentNames[payment.recordedByAgentId]} (agent)`
                  : payment.recordedBy}
              </td>
              <td className="px-3 py-2 text-neutral-600">{payment.note || "—"}</td>
              <td className="px-3 py-2">
                {payment.status === "reversed" ? (
                  <span className="text-red-600" title={payment.reversalNote || undefined}>
                    reversed by {payment.reversedBy}
                  </span>
                ) : (
                  <span className="text-green-700">recorded</span>
                )}
              </td>
              {canReverse ? (
                <td className="px-3 py-2">
                  {payment.status === "recorded" ? (
                    <button type="button" disabled={pending} onClick={() => reverse(payment)}
                      className="text-sm text-red-600 underline disabled:opacity-50">
                      Reverse
                    </button>
                  ) : null}
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
