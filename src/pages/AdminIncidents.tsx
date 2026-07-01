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
import { formatUKDate, formatUKDateTime } from "../lib/time";

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
        <div class="section"><span class="label">Date:</span> ${formatUKDateTime(incident.created_at)}</div>
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
  if (loading) {
    return (
      <div className="flex min-h-screen bg-white dark:bg-[#03060b] transition-colors">
        <AdminSidebar onLogout={() => {}} />

        <div className="flex-1 flex flex-col min-h-screen lg:pl-64 xl:pl-64">
          <Navbar name={adminName} role="Admin" />

          <main className="flex-1 flex items-center justify-center px-4 md:px-8 lg:px-10 xl:px-12 pt-24 pb-8 max-w-7xl mx-auto w-full">
            <div className="flex flex-col items-center gap-6">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 rounded-full border-4 border-sky-200 dark:border-sky-900" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-sky-400 border-r-emerald-300 animate-spin" />
                <div className="absolute inset-3 rounded-full border-4 border-transparent border-b-sky-300 border-l-emerald-400 animate-spin [animation-direction:reverse] [animation-duration:1.5s]" />
              </div>

              <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Preparing data..
                </h2>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#050a11] transition-colors">
      <AdminSidebar onLogout={() => {}} />

      <div className="lg:ml-[260px] min-h-screen">
        <Navbar name={adminName} role="Admin" />

        <main className="pt-32 px-4 md:px-6 pb-6 text-slate-900 dark:text-white transition-colors">
          <div className="max-w-7xl mr-auto ml-0">
            {/* Header Card */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
              <div className="bg-white dark:bg-[#0b1018] border border-slate-200 dark:border-[#1e2632] rounded-[24px] px-6 py-5 shadow transition-colors">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white transition-colors">
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
            <div className="bg-white dark:bg-[#11161d] border border-slate-200 dark:border-[#1e2632] rounded-[24px] px-6 py-6 flex items-center transition-colors">
              <FileText className="w-8 h-8 text-sky-400 mr-4" />
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white transition-colors">
                  {totalIncidents}
                </div>
                <div className="text-slate-500 dark:text-slate-400 transition-colors">
                  Total Incidents
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-[#11161d] border border-slate-200 dark:border-[#1e2632] rounded-[24px] px-6 py-6 flex items-center transition-colors">
              <AlertTriangle className="w-8 h-8 text-sky-400 mr-4" />
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white transition-colors">
                  {uniqueCategories}
                </div>
                <div className="text-slate-500 dark:text-slate-400 transition-colors">
                  Categories
                </div>
              </div>
            </div>
          </div>

          {/* Main Card */}
          <div className="bg-white dark:bg-[#0b1018] border border-slate-200 dark:border-[#1e2632] rounded-[24px] px-4 py-6 shadow transition-colors">
            {/* Search Bar */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex items-center w-full md:w-1/3 bg-slate-100 dark:bg-[#11161d] border border-slate-200 dark:border-[#232d3a] rounded-[24px] px-4 py-2 transition-colors">
                <Search className="w-5 h-5 text-slate-500 dark:text-slate-400 mr-2" />
                <input
                  className="bg-transparent outline-none w-full text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 transition-colors"
                  placeholder="Search resident, staff, category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  type="text"
                />
              </div>
            </div>

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
                <div className="text-slate-500 dark:text-slate-400 text-xl font-semibold transition-colors">
                  No incidents found
                </div>
              </div>
            )}

            {/* Table */}
            {!loading && filteredIncidents.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-[#1e2632] transition-colors">
                  <thead>
                    <tr className="text-left text-slate-500 dark:text-slate-400 text-sm transition-colors">
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
                        className="hover:bg-slate-100 dark:hover:bg-[#11161d] transition-colors"
                      >
                        <td className="py-3 px-2 font-medium text-slate-900 dark:text-white transition-colors">
                          {incident.resident_name}
                        </td>
                        <td className="py-3 px-2 text-slate-900 dark:text-white transition-colors">
                          {incident.staff_name}
                        </td>
                        <td className="py-3 px-2 text-slate-900 dark:text-white transition-colors">
                          {incident.category}
                        </td>
                        <td className="py-3 px-2 text-slate-900 dark:text-white transition-colors">
                          {incident.outcome}
                        </td>
                        <td className="py-3 px-2 text-slate-900 dark:text-white transition-colors">
                          {formatUKDate(incident.created_at)}
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
                            className="inline-flex items-center px-3 py-1.5 rounded-[16px] bg-white dark:bg-[#11161d] border border-sky-400 text-sky-400 hover:bg-sky-400 hover:text-[#050a11] font-semibold transition-colors"
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
              <div className="mt-8 bg-white dark:bg-[#11161d] border border-slate-200 dark:border-[#232d3a] rounded-[24px] px-6 py-6 shadow-lg relative transition-colors">
                <button
                  className="absolute top-4 right-4 text-slate-500 dark:text-slate-400 hover:text-sky-400 text-lg transition-colors"
                  onClick={() => setSelectedIncident(null)}
                  title="Close"
                >
                  ×
                </button>
                <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white transition-colors">
                  Incident #{selectedIncident.id} Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-base">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 transition-colors">
                      Resident Name:
                    </span>
                    <div className="text-slate-900 dark:text-white font-semibold transition-colors">
                      {selectedIncident.resident_name}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 transition-colors">
                      Staff Name:
                    </span>
                    <div className="text-slate-900 dark:text-white font-semibold transition-colors">
                      {selectedIncident.staff_name}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 transition-colors">
                      Category:
                    </span>
                    <div className="text-slate-900 dark:text-white transition-colors">
                      {selectedIncident.category}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 transition-colors">
                      Subcategory:
                    </span>
                    <div className="text-slate-900 dark:text-white transition-colors">
                      {selectedIncident.subcategory}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 transition-colors">
                      Outcome:
                    </span>
                    <div className="text-slate-900 dark:text-white transition-colors">
                      {selectedIncident.outcome}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 transition-colors">
                      Date:
                    </span>
                    <div className="text-slate-900 dark:text-white transition-colors">
                      {formatUKDateTime(selectedIncident.created_at)}
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <span className="text-slate-500 dark:text-slate-400 transition-colors">
                    Incident Description:
                  </span>
                  <div className="bg-slate-50 dark:bg-[#0b1018] border border-slate-200 dark:border-[#232d3a] rounded-[16px] px-4 py-3 mt-2 text-slate-900 dark:text-white whitespace-pre-wrap transition-colors">
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
