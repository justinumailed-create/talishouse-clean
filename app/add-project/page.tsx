"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAssociate } from "@/context/AssociateContext";

export default function AddProjectPage() {
  const router = useRouter();
  const { fastCode, associateId } = useAssociate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const location = formData.get("location") as string;

    if (!name || !phone || !location) {
      setError("All fields are required");
      setLoading(false);
      return;
    }

    const data = {
      name,
      phone,
      location,
      fast_code: fastCode || "DIRECT",
      source: "add-project",
      status: "new",
      associate_id: associateId,
    };

    console.log("Submitting lead:", JSON.stringify(data, null, 2));

    const { data: insertData, error: insertError } = await supabase
      .from("leads")
      .insert([data])
      .select()
      .single();

    if (insertError) {
      console.error("INSERT ERROR:", insertError?.message || insertError);
      const errorMessage = 
        insertError?.message ||
        insertError?.details ||
        insertError?.hint ||
        "Unknown insert error";
      setError(`Creation failed: ${errorMessage}`);
      setLoading(false);
      return;
    }

    console.log("Lead created:", JSON.stringify(insertData, null, 2));
    router.push("/project-received");
  }

  return (
    <div className="min-h-[70vh] bg-white py-12">
      <div className="mx-auto max-w-md">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tighter uppercase text-gray-900">
            ADD YOUR PROJECT
          </h1>
        </div>

        <section className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
          <div className="flex items-center justify-between bg-black px-6 py-5 text-white">
            <p className="text-sm font-bold uppercase tracking-[0.25em]">
              SUBMIT DETAILS
            </p>
            <Link
              href="/"
              className="text-xl leading-none text-white/70 transition hover:text-white"
              aria-label="Close add project"
            >
              ×
            </Link>
          </div>

          <div className="p-6 sm:p-8">
            <p className="text-sm text-gray-500 mb-6 italic">
              Projects must be non-political and in good taste by generally accepted standards. We look forward to working with you.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">
                  Name
                </span>
                <input
                  required
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  className="w-full rounded-2xl border border-gray-200 px-4 py-4 text-sm text-gray-900 outline-none transition focus:border-black"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">
                  Location
                </span>
                <input
                  required
                  type="text"
                  name="location"
                  placeholder="City, State"
                  className="w-full rounded-2xl border border-gray-200 px-4 py-4 text-sm text-gray-900 outline-none transition focus:border-black"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">
                  Mobile Phone
                </span>
                <input
                  required
                  type="tel"
                  name="phone"
                  placeholder="(555) 000-0000"
                  className="w-full rounded-2xl border border-gray-200 px-4 py-4 text-sm text-gray-900 outline-none transition focus:border-black"
                />
              </label>

              {error && (
                <p className="text-sm text-red-600 text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-[#1279c9] px-6 py-4 text-xs font-bold uppercase tracking-[0.28em] text-white transition hover:bg-[#0f6bb1] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Submitting..." : "SUBMIT"}
              </button>
            </form>
          </div>
        </section>

        <p className="text-center text-xs text-gray-500 mt-6">
          Talishouse Homes & Cottages start at $58.50 per sq.ft.. Typically they are up in a day and move-in ready in a week. Lease-To-Own is available, OAC.
        </p>
      </div>
    </div>
  );
}
