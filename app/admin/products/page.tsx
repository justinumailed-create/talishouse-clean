"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

const VALID_PRODUCT_IDS = [
  "glasshouse-160",
  "glasshouse-200",
  "talishouse-400",
  "talishouse-800",
  "talishouse-1600",
  "talistowns",
];

const PRODUCT_NAMES: Record<string, string> = {
  "glasshouse-160": "Glasshouse™ 160",
  "glasshouse-200": "Glasshouse™ 200",
  "talishouse-400": "Talishouse™ 400",
  "talishouse-800": "Talishouse™ 800",
  "talishouse-1600": "2x Talishouse™ 800",
  "talistowns": "TalisTowns™ Bundle",
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Record<string, { price: number | null; image_url: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("id, price, image_url");
    
    if (data) {
      const map: Record<string, { price: number | null; image_url: string }> = {};
      data.forEach((p) => {
        if (VALID_PRODUCT_IDS.includes(p.id)) {
          map[p.id] = { price: p.price, image_url: p.image_url || "" };
        }
      });
      setProducts(map);
    }
    setLoading(false);
  };

  const handlePriceChange = (id: string, value: string) => {
    const price = value === "" ? null : parseInt(value, 10);
    setProducts((prev) => ({ ...prev, [id]: { ...prev[id], price } }));
  };

  const handleImageChange = (id: string, value: string) => {
    setProducts((prev) => ({ ...prev, [id]: { ...prev[id], image_url: value } }));
  };

  const handleSave = async (id: string) => {
    setSaving(id);
    const product = products[id];
    
    const { error } = await supabase
      .from("products")
      .upsert({ 
        id, 
        price: product?.price, 
        image_url: product?.image_url 
      }, { onConflict: "id" });

    if (error) {
      alert("Failed to save: " + error.message);
    } else {
      alert("Saved successfully!");
    }
    setSaving(null);
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Product Pricing</h1>
      <p className="text-sm text-gray-600 mb-6">
        Override price and image for each product. These values will appear on the catalog page.
      </p>

      <div className="overflow-x-auto">
        <table className="min-w-full border">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium">Product</th>
              <th className="px-4 py-2 text-left text-sm font-medium">ID</th>
              <th className="px-4 py-2 text-left text-sm font-medium">Price ($)</th>
              <th className="px-4 py-2 text-left text-sm font-medium">Image URL</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {VALID_PRODUCT_IDS.map((id) => (
              <tr key={id} className="border-t">
                <td className="px-4 py-3 font-medium">{PRODUCT_NAMES[id]}</td>
                <td className="px-4 py-3 text-gray-500 text-sm">{id}</td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    value={products[id]?.price ?? ""}
                    onChange={(e) => handlePriceChange(id, e.target.value)}
                    placeholder="Use default"
                    className="border rounded px-2 py-1 w-32"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={products[id]?.image_url ?? ""}
                    onChange={(e) => handleImageChange(id, e.target.value)}
                    placeholder="Use default"
                    className="border rounded px-2 py-1 w-64"
                  />
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleSave(id)}
                    disabled={saving === id}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving === id ? "Saving..." : "Save"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}