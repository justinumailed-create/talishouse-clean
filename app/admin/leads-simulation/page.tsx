"use client";

import { useState, useEffect, useRef } from "react";
import { supabase, safeInsertLead } from "@/lib/supabase";
import { ToastContainer, useToast } from "@/components/Toast";
import Link from "next/link";

interface Associate {
  id: string;
  name: string | null;
  fast_code: string | null;
}

interface ImportedLead {
  name: string;
  email: string;
  phone: string;
  location: string;
  interest: string;
  price_range: string;
  fast_code: string;
  associate_name: string;
}

const SAMPLE_LEADS = [
  { name: "Sarah Mitchell", email: "sarah.mitchell@gmail.com", phone: "416-555-0123", location: "Toronto, ON", interest: "Purchase", price_range: "$400k-$600k" },
  { name: "Michael Chen", email: "mchen@outlook.com", phone: "647-555-0456", location: "Vancouver, BC", interest: "Lease-to-Own", price_range: "$300k-$500k" },
  { name: "Jessica Williams", email: "jwilliams@yahoo.com", phone: "604-555-0789", location: "Calgary, AB", interest: "Investment", price_range: "$500k-$800k" },
  { name: "David Thompson", email: "dthompson@icloud.com", phone: "403-555-0234", location: "Montreal, QC", interest: "First Home", price_range: "$250k-$400k" },
  { name: "Amanda Rodriguez", email: "arodriguez@hotmail.com", phone: "514-555-0567", location: "Ottawa, ON", interest: "Upgrade", price_range: "$600k-$900k" },
];

export default function LeadsSimulationPage() {
  const [associates, setAssociates] = useState<Associate[]>([]);
  const [selectedAssociateId, setSelectedAssociateId] = useState<string>("random");
  const [importedLeads, setImportedLeads] = useState<ImportedLead[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [totalLeadsCount, setTotalLeadsCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toasts, dismissToast, success, error } = useToast();

  useEffect(() => {
    fetchAssociates();
    fetchLeadsCount();
  }, []);

  const fetchAssociates = async () => {
    const { data } = await supabase
      .from("users")
      .select("id, name, fast_code")
      .eq("role", "associate")
      .eq("is_page_enabled", true);
    
    if (data) {
      setAssociates(data);
    }
  };

  const fetchLeadsCount = async () => {
    const { count } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true });
    
    setTotalLeadsCount(count || 0);
  };

  const getRandomAssociate = (): Associate | null => {
    if (associates.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * associates.length);
    return associates[randomIndex];
  };

  const parseCSV = (text: string): ImportedLead[] => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];
    
    const headers = lines[0].toLowerCase().split(",").map(h => h.trim());
    const leads: ImportedLead[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map(v => v.trim());
      if (values.length < headers.length) continue;
      
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });
      
      const associate = selectedAssociateId === "random" 
        ? getRandomAssociate() 
        : associates.find(a => a.id === selectedAssociateId);
      
      if (!row.name || !row.email) continue;
      
      leads.push({
        name: row.name || "",
        email: row.email || "",
        phone: row.phone || "",
        location: row.location || "",
        interest: row.interest || "",
        price_range: row.price_range || "",
        fast_code: associate?.fast_code || "DEFAULT",
        associate_name: associate?.name || "Unknown",
      });
    }
    
    return leads;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    
    try {
      const text = await file.text();
      const leads = parseCSV(text);
      
      if (leads.length === 0) {
        error("No valid leads found in CSV. Check format.");
        setIsProcessing(false);
        return;
      }

      const insertPromises = leads.map(lead => 
        safeInsertLead({
          name: lead.name,
          phone: lead.phone,
          location: lead.location || "unknown",
          source: "simulation",
          status: "new",
          deal_status: "pending",
          fast_code: lead.fast_code || null,
          project_value: parsePriceRange(lead.price_range) || null,
          commission_rate: null,
          split_percentage: null,
        }).catch(err => {
          console.error("LEAD FAIL FULL:", JSON.stringify(err, null, 2));
        })
      );

      await Promise.all(insertPromises);
      setImportedLeads(leads);
      success(`${leads.length} leads imported successfully!`);
      fetchLeadsCount();
    } catch (err) {
      console.error("File read error:", err);
      error("Failed to import leads. Check console for details.");
    }
    
    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const parsePriceRange = (priceRange: string): number => {
    const match = priceRange.match(/\$?([\d,]+)/);
    if (match) {
      const num = match[1].replace(/,/g, "");
      return parseInt(num) * 1000;
    }
    return 0;
  };

  const simulateNewLeads = async () => {
    if (associates.length === 0) {
      error("No associates available. Create an associate first.");
      return;
    }

    setIsSimulating(true);
    
    try {
      const selectedLeads = SAMPLE_LEADS.map(lead => {
        const associate = selectedAssociateId === "random"
          ? getRandomAssociate()
          : associates.find(a => a.id === selectedAssociateId);
        
        return {
          ...lead,
          fast_code: associate?.fast_code || "DEFAULT",
          associate_name: associate?.name || "Unknown",
        };
      });

      const insertPromises = selectedLeads.map(lead => 
        safeInsertLead({
          name: lead.name,
          phone: lead.phone,
          location: lead.location || "unknown",
          source: "simulation",
          status: "new",
          deal_status: "pending",
          fast_code: lead.fast_code || null,
          project_value: parsePriceRange(lead.price_range) || null,
          commission_rate: null,
          split_percentage: null,
        }).catch(err => {
          console.error("LEAD FAIL FULL:", JSON.stringify(err, null, 2));
        })
      );

      await Promise.all(insertPromises);
      setImportedLeads(selectedLeads);
      success(`${selectedLeads.length} demo leads created successfully!`);
      fetchLeadsCount();
    } catch (err) {
      console.error("Simulate error:", err);
      error("Failed to simulate leads. Check console for details.");
    }
    
    setIsSimulating(false);
  };

  const downloadSampleCSV = () => {
    const csv = `name,email,phone,location,interest,price_range
Sarah Mitchell,sarah.mitchell@gmail.com,416-555-0123,Toronto ON,Mortgage,$400k-$600k
Michael Chen,mchen@outlook.com,647-555-0456,Vancouver BC,Lease-to-Own,$300k-$500k
Jessica Williams,jwilliams@yahoo.com,604-555-0789,Calgary AB,Purchase,$500k-$800k
David Thompson,dthompson@icloud.com,403-555-0234,Montreal QC,Investment,$250k-$400k
Amanda Rodriguez,arodriguez@hotmail.com,514-555-0567,Ottawa ON,First Home,$600k-$900k`;

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample_leads.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-container">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Leads Simulation</h1>
          <p className="text-gray-500 mt-1">Import demo leads or generate simulated Zillow-style leads</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Total Simulation Leads</p>
          <p className="text-2xl font-bold text-[#1E4ED8]">{totalLeadsCount}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Import Section */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Import Leads from CSV</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Assign to Associate</label>
            <select
              value={selectedAssociateId}
              onChange={(e) => setSelectedAssociateId(e.target.value)}
              className="input"
            >
              <option value="random">Random Associate</option>
              {associates.map(assoc => (
                <option key={assoc.id} value={assoc.id}>
                  {assoc.name} ({assoc.fast_code})
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Upload CSV File</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={isProcessing}
              className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#1E4ED8] file:text-white file:font-medium file:cursor-pointer hover:file:bg-[#005ea6]"
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm font-medium mb-2">CSV Format Required:</p>
            <code className="text-xs text-gray-600 block">
              name,email,phone,location,interest,price_range
            </code>
          </div>

          <button
            onClick={downloadSampleCSV}
            className="btn-secondary w-full"
          >
            Download Sample CSV
          </button>
        </div>

        {/* Simulate Section */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Quick Simulation</h2>
          <p className="text-sm text-gray-600 mb-4">
            Generate 5 realistic Zillow-style mortgage leads instantly. Leads will be assigned to the selected associate or randomly distributed.
          </p>

          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <p className="text-sm font-medium text-blue-800 mb-2">Sample Leads Include:</p>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Realistic Canadian names and emails</li>
              <li>• Valid phone number formats</li>
              <li>• Various price ranges ($250k - $900k)</li>
              <li>• Different interest types</li>
            </ul>
          </div>

          <button
            onClick={simulateNewLeads}
            disabled={isSimulating || associates.length === 0}
            className="btn-primary w-full"
          >
            {isSimulating ? "Creating..." : "Simulate 5 New Leads"}
          </button>

          {associates.length === 0 && (
            <p className="text-sm text-amber-600 mt-2">
              Create an associate first to enable lead simulation.
            </p>
          )}
        </div>
      </div>

      {/* Imported Leads Table */}
      {importedLeads.length > 0 && (
        <div className="card mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Imported Leads</h2>
            <button
              onClick={() => setImportedLeads([])}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Location</th>
                  <th>Interest</th>
                  <th>Price Range</th>
                  <th>Assigned To</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {importedLeads.map((lead, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="font-medium">{lead.name}</td>
                    <td className="text-gray-600">{lead.email}</td>
                    <td className="text-gray-600">{lead.phone}</td>
                    <td className="text-gray-600">{lead.location}</td>
                    <td>
                      <span className="badge badge-info">{lead.interest}</span>
                    </td>
                    <td className="text-gray-600">{lead.price_range}</td>
                    <td>
                      <Link 
                        href={`/associate/${lead.fast_code}`}
                        className="text-[#1E4ED8] hover:underline"
                        target="_blank"
                      >
                        {lead.associate_name}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="card mt-6">
        <h2 className="text-lg font-semibold mb-4">About Lead Simulation</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-medium mb-2">CSV Import</h3>
            <p className="text-sm text-gray-600">
              Upload a CSV file with leads to import them into the system. Each lead will be assigned to the selected associate.
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-2">Quick Simulation</h3>
            <p className="text-sm text-gray-600">
              Instantly generate 5 realistic Canadian mortgage leads. Perfect for demoing the lead flow without real data.
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-2">Tracking</h3>
            <p className="text-sm text-gray-600">
              All simulated leads appear in the Leads section and are attributed to the assigned associate.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
