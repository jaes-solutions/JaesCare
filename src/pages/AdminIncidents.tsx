import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Download,
  Eye,
  FileText,
  Plus,
  Search,
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import AdminSidebar from "../components/AdminSidebar";
import Navbar from "../components/Navbar";

type IncidentRecord = {
  id: number;
  resident_name: string;
  staff_name: string;
  category: string;
  subcategory: string;
  incident_description: string;
  outcome: string;
  created_at: string;
};

const AdminIncidents: React.FC = () => {
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedIncident, setSelectedIncident] =
    useState<IncidentRecord | null>(null);
  const [adminName, setAdminName] = useState("Admin");

  useEffect(() => {
    const loadAdminName = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", session.user.id)
        .single();

      if (profile?.full_name) {
        setAdminName(profile.full_name);
      }
    };

    loadAdminName();
  }, []);

  // Fetch incidents for the logged in admin's organisation
  useEffect(() => {
    let mounted = true;

    const loadIncidents = async () => {
      setLoading(true);
      setError(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        if (mounted) {
          setIncidents([]);
          setLoading(false);
        }
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", session.user.id)
        .single();

      if (profileError || !profile?.organization_id) {
        if (mounted) {
          setError("Unable to determine organisation.");
          setIncidents([]);
          setLoading(false);
        }
        return;
      }

      const { data, error } = await supabase
        .from("incidents")
        .select("*")
        .eq("organization_id", profile.organization_id)
        .order("created_at", { ascending: false });

      if (!mounted) return;

      if (error) {
        setError("Failed to fetch incidents.");
        setIncidents([]);
      } else {
        setIncidents(data || []);
      }

      setLoading(false);
    };

    loadIncidents();

    return () => {
      mounted = false;
    };
  }, []);

  // Filtered incidents by search term
  const filteredIncidents = useMemo(() => {
    if (!searchTerm.trim()) return incidents;
    const term = searchTerm.toLowerCase();
    return incidents.filter(
      (incident) =>
        incident.resident_name?.toLowerCase().includes(term) ||
        incident.staff_name?.toLowerCase().includes(term) ||
        incident.category?.toLowerCase().includes(term) ||
        incident.subcategory?.toLowerCase().includes(term),
    );
  }, [incidents, searchTerm]);

  // Summary stats
  const totalIncidents = incidents.length;
  const uniqueCategories = useMemo(
    () => new Set(incidents.map((i) => i.category)).size,
    [incidents],
  );
  const thisMonthCount = useMemo(() => {
    const now = new Date();
    return incidents.filter((i) => {
      const d = new Date(i.created_at);
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    }).length;
  }, [incidents]);

  // PDF download function
  function downloadIncidentPdf(incident: IncidentRecord) {
    const html = `
      <html>
      <head>
        <title>Incident #${incident.id}</title>
        <style>
          body { font-family: sans-serif; padding: 2rem; background: #fff; color: #222; }
          h1 { font-size: 2rem; margin-bottom: 1.5rem; }
          .section { margin-bottom: 1.2rem; }
          .label { font-weight: bold; display: inline-block; width: 170px; }
          .desc { margin-top: 1rem; white-space: pre-wrap; }
          .header { margin-bottom: 2rem; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Incident Report #${incident.id}</h1>
        </div>
        <div class="section"><span class="label">Resident Name:</span> ${incident.resident_name}</div>
        <div class="section"><span class="label">Staff Name:</span> ${incident.staff_name}</div>
        <div class="section"><span class="label">Category:</span> ${incident.category}</div>
        <div class="section"><span class="label">Subcategory:</span> ${incident.subcategory}</div>
        <div class="section"><span class="label">Outcome:</span> ${incident.outcome}</div>
        <div class="section"><span class="label">Date:</span> ${new Date(incident.created_at).toLocaleString()}</div>
        <div class="section desc"><span class="label">Incident Description:</span><br/>${incident.incident_description}</div>
      </body>
      </html>
    `;
    const win = window.open("", "_blank", "width=800,height=900");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      // Wait for render, then print
      setTimeout(() => {
        win.print();
      }, 300);
    }
  }

  return (
    <div className="min-h-screen bg-[#050a11]">
      <AdminSidebar onLogout={() => {}} />

      <div className="lg:ml-[260px] min-h-screen">
        <Navbar name={adminName} role="Admin" />

        <main className="pt-32 px-4 md:px-6 pb-6 text-white">
          <div className="max-w-7xl mr-auto ml-0">
            {/* Header Card */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
              <div className="bg-[#0b1018] border border-[#1e2632] rounded-[24px] px-6 py-5 shadow">
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  Incident Management
                </h1>
                <p className="text-sky-400 mt-2 text-base">
                  Review, track and export resident incident reports.
                </p>
              </div>

              <div className="flex justify-end">
                <Link
                  to="/incidentReporting"
                  className="inline-flex items-center bg-sky-400 hover:bg-sky-500 text-[#050a11] font-semibold px-5 py-3 rounded-[24px] shadow transition"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  New Incident
                </Link>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            <div className="bg-[#11161d] border border-[#1e2632] rounded-[24px] px-6 py-6 flex items-center">
              <FileText className="w-8 h-8 text-sky-400 mr-4" />
              <div>
                <div className="text-2xl font-bold">{totalIncidents}</div>
                <div className="text-slate-400">Total Incidents</div>
              </div>
            </div>
            <div className="bg-[#11161d] border border-[#1e2632] rounded-[24px] px-6 py-6 flex items-center">
              <AlertTriangle className="w-8 h-8 text-sky-400 mr-4" />
              <div>
                <div className="text-2xl font-bold">{uniqueCategories}</div>
                <div className="text-slate-400">Categories</div>
              </div>
            </div>
            <div className="bg-[#11161d] border border-[#1e2632] rounded-[24px] px-6 py-6 flex items-center">
              <Download className="w-8 h-8 text-sky-400 mr-4" />
              <div>
                <div className="text-2xl font-bold">{thisMonthCount}</div>
                <div className="text-slate-400">This Month</div>
              </div>
            </div>
          </div>

          {/* Main Card */}
          <div className="bg-[#0b1018] border border-[#1e2632] rounded-[24px] px-4 py-6 shadow">
            {/* Search Bar */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex items-center w-full md:w-1/3 bg-[#11161d] border border-[#232d3a] rounded-[24px] px-4 py-2">
                <Search className="w-5 h-5 text-slate-400 mr-2" />
                <input
                  className="bg-transparent outline-none w-full text-white placeholder:text-slate-400"
                  placeholder="Search resident, staff, category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  type="text"
                />
              </div>
            </div>

            {/* Loading */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-20">
                <svg
                  className="animate-spin h-10 w-10 text-sky-400 mb-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  ></path>
                </svg>
                <div className="text-slate-400 text-lg">
                  Loading incidents...
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-center text-red-400 py-8 justify-center">
                {error}
              </div>
            )}

            {/* Empty State */}
            {!loading && filteredIncidents.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20">
                <AlertTriangle className="w-16 h-16 text-slate-600 mb-4" />
                <div className="text-slate-400 text-xl font-semibold">
                  No incidents found
                </div>
              </div>
            )}

            {/* Table */}
            {!loading && filteredIncidents.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#1e2632]">
                  <thead>
                    <tr className="text-left text-slate-400 text-sm">
                      <th className="py-3 px-2">Resident</th>
                      <th className="py-3 px-2">Staff</th>
                      <th className="py-3 px-2">Category</th>
                      <th className="py-3 px-2">Outcome</th>
                      <th className="py-3 px-2">Date</th>
                      <th className="py-3 px-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIncidents.map((incident) => (
                      <tr
                        key={incident.id}
                        className="hover:bg-[#11161d] transition"
                      >
                        <td className="py-3 px-2 font-medium text-white">
                          {incident.resident_name}
                        </td>
                        <td className="py-3 px-2">{incident.staff_name}</td>
                        <td className="py-3 px-2">{incident.category}</td>
                        <td className="py-3 px-2">{incident.outcome}</td>
                        <td className="py-3 px-2">
                          {new Date(incident.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-2">
                          <button
                            className="inline-flex items-center px-3 py-1.5 rounded-[16px] bg-sky-400 hover:bg-sky-500 text-[#050a11] font-semibold mr-2"
                            title="View"
                            onClick={() => setSelectedIncident(incident)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </button>
                          <button
                            className="inline-flex items-center px-3 py-1.5 rounded-[16px] bg-[#11161d] border border-sky-400 text-sky-400 hover:bg-sky-400 hover:text-[#050a11] font-semibold transition"
                            title="Download PDF"
                            onClick={() => downloadIncidentPdf(incident)}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            PDF
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Details Panel */}
            {selectedIncident && (
              <div className="mt-8 bg-[#11161d] border border-[#232d3a] rounded-[24px] px-6 py-6 shadow-lg relative">
                <button
                  className="absolute top-4 right-4 text-slate-400 hover:text-sky-400 text-lg"
                  onClick={() => setSelectedIncident(null)}
                  title="Close"
                >
                  ×
                </button>
                <h2 className="text-xl font-bold mb-4 text-white">
                  Incident #{selectedIncident.id} Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-base">
                  <div>
                    <span className="text-slate-400">Resident Name:</span>
                    <div className="text-white font-semibold">
                      {selectedIncident.resident_name}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Staff Name:</span>
                    <div className="text-white font-semibold">
                      {selectedIncident.staff_name}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Category:</span>
                    <div className="text-white">
                      {selectedIncident.category}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Subcategory:</span>
                    <div className="text-white">
                      {selectedIncident.subcategory}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Outcome:</span>
                    <div className="text-white">{selectedIncident.outcome}</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Date:</span>
                    <div className="text-white">
                      {new Date(selectedIncident.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <span className="text-slate-400">Incident Description:</span>
                  <div className="bg-[#0b1018] border border-[#232d3a] rounded-[16px] px-4 py-3 mt-2 text-white whitespace-pre-wrap">
                    {selectedIncident.incident_description}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminIncidents;
