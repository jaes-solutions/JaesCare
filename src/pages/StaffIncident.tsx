import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import StaffSidebar from "../components/StaffSidebar";
import Navbar from "../components/Navbar";
import { User, FileText, Search, Plus } from "lucide-react";

interface Shift {
  id: string;
  staff_id: string;
  patient_id: string;
  organization_id: string;
  status: string;
  start_time: string;
  end_time: string;
  patient_name: string;
}

interface Incident {
  id: string;
  category: string;
  incident_date: string;
  incident_time: string;
  status?: string;
  resident_name: string;
  staff_name: string;
  staff_id: string;
  patient_id: string;
  incident_description: string;
  created_at: string;
}

const CARD_STYLE =
  "rounded-2xl border border-black/10 dark:border-white/[0.06] bg-white dark:bg-[#060b12]/95 shadow-xl p-6 flex flex-col gap-2";
const CARD_HEADER_STYLE = "text-slate-600 dark:text-slate-300 text-xs mb-1";
const CARD_TITLE_STYLE =
  "font-semibold text-base text-slate-900 dark:text-slate-100";

const formatUKTime = (date?: string, timeOnly = false) => {
  if (!date) return "-";

  return new Date(date).toLocaleString("en-GB", {
    timeZone: "Europe/London",
    day: timeOnly ? undefined : "2-digit",
    month: timeOnly ? undefined : "2-digit",
    year: timeOnly ? undefined : "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const StaffIncident: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [search, setSearch] = useState("");
  const [totalIncidents, setTotalIncidents] = useState(0);
  const navigate = useNavigate();
  const [staffName, setStaffName] = useState("");
  const [staffRole, setStaffRole] = useState("");
  // Fetch user and active shift on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;
      if (!session || !session.user) {
        setActiveShift(null);
        setLoading(false);
        return;
      }
      // Fetch staff profile for navbar
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", session.user.id)
        .single();
      if (!profileError && profile) {
        setStaffName(profile.full_name ?? "");
        setStaffRole(profile.role ?? "");
      }
      // Today's date (used by the shifts table)
      const today = new Date().toISOString().split("T")[0];
      // Query for active shift
      const { data: shiftData, error: shiftError } = await supabase
        .from("shifts")
        .select("*")
        .eq("staff_id", session.user.id)
        .eq("shift_date", today)
        .eq("status", "active")
        .maybeSingle();
      if (shiftError || !shiftData) {
        setActiveShift(null);
        setLoading(false);
        return;
      }
      setActiveShift(shiftData as Shift);
      setLoading(false);
    };
    fetchInitialData();
  }, []);

  // Fetch incidents when active shift changes
  useEffect(() => {
    const fetchIncidents = async () => {
      if (!activeShift) {
        setIncidents([]);
        setTotalIncidents(0);
        return;
      }
      // Only for assigned patient and organization
      const { data: incidentData, error: incidentError } = await supabase
        .from("incidents")
        .select("*")
        .eq("patient_id", activeShift.patient_id)
        .eq("organization_id", activeShift.organization_id)
        .order("created_at", { ascending: false });
      if (incidentError || !incidentData) {
        setIncidents([]);
        setTotalIncidents(0);
        return;
      }
      setIncidents(incidentData as Incident[]);
      setTotalIncidents(incidentData.length);
    };
    if (activeShift) {
      fetchIncidents();
    }
  }, [activeShift]);

  // Filter incidents by search
  const filteredIncidents = useMemo(() => {
    if (!search) return incidents;
    const lower = search.toLowerCase();
    return incidents.filter((i) => {
      return (
        (i.category && i.category.toLowerCase().includes(lower)) ||
        (i.incident_description &&
          i.incident_description.toLowerCase().includes(lower)) ||
        (i.status && i.status.toLowerCase().includes(lower)) ||
        (i.incident_date && i.incident_date.includes(lower))
      );
    });
  }, [search, incidents]);

  // Truncate description
  const truncate = (text: string, len: number = 80) =>
    text.length > len ? text.slice(0, len) + "…" : text;

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white dark:bg-[#03060b] transition-colors">
        <StaffSidebar onLogout={() => supabase.auth.signOut()} />

        <div className="flex-1 flex flex-col min-h-screen lg:pl-64 xl:pl-64">
          <Navbar name={staffName} role={staffRole} />

          <main className="flex-1 flex items-center justify-center px-4 md:px-8 lg:px-10 xl:px-12 pt-24 pb-8 max-w-7xl mx-auto w-full">
            <div className="flex flex-col items-center gap-6">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 rounded-full border-4 border-sky-200 dark:border-sky-900" />
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-sky-400 border-r-emerald-300 animate-spin" />
                <div className="absolute inset-3 rounded-full border-4 border-transparent border-b-sky-300 border-l-emerald-400 animate-spin [animation-direction:reverse] [animation-duration:1.5s]" />
              </div>

              <p className="text-gray-600 dark:text-gray-400">
                Loading data, please wait...
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white dark:bg-[#03060b] transition-colors">
      <StaffSidebar onLogout={() => supabase.auth.signOut()} />
      <div className="flex-1 flex flex-col min-h-screen lg:pl-64 xl:pl-64">
        <Navbar name={staffName} role={staffRole} />
        <main className="flex-1 w-full px-4 md:px-8 lg:px-10 xl:px-12 pt-24 pb-8 max-w-7xl mx-auto">
          {!activeShift ? (
            <div className="flex flex-col items-center justify-center h-96">
              <div className={`${CARD_STYLE} items-center w-full max-w-md`}>
                <FileText className="text-3xl text-sky-400 mb-2" />
                <div className="font-semibold text-lg mb-1 text-slate-800 dark:text-slate-100">
                  No active shift
                </div>
                <div className="text-slate-600 dark:text-slate-300 text-center">
                  Incident reporting is only available during an active shift.
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Page header */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                    Incident Reporting
                  </h1>
                  <div className="text-slate-600 dark:text-slate-300">
                    View and report incidents for your current resident.
                  </div>
                </div>
                <button
                  className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-semibold px-5 py-2 rounded-lg shadow transition disabled:opacity-50"
                  onClick={() => navigate("/staffIncidentReporting")}
                >
                  <Plus /> Report Incident
                </button>
              </div>
              {/* Summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className={CARD_STYLE}>
                  <div className={CARD_HEADER_STYLE}>
                    <User className="inline mr-1 text-sky-400" />
                    Assigned Resident
                  </div>
                  <div className={CARD_TITLE_STYLE}>
                    {activeShift.patient_name}
                  </div>
                </div>

                <div className={CARD_STYLE}>
                  <div className={CARD_HEADER_STYLE}>
                    <FileText className="inline mr-1 text-sky-400" />
                    Total Incidents for the Resident
                  </div>
                  <div className={CARD_TITLE_STYLE}>{totalIncidents}</div>
                </div>
              </div>
              {/* Search box */}
              <div className="flex items-center mb-6">
                <div className="relative w-full max-w-sm">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Search />
                  </span>
                  <input
                    type="text"
                    className="pl-10 pr-4 py-2 rounded-lg border border-black/10 dark:border-white/[0.06] bg-white dark:bg-[#060b12]/95 text-slate-900 dark:text-slate-100 w-full focus:ring-2 focus:ring-sky-400 outline-none transition"
                    placeholder="Search incidents…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              {/* Incident list */}
              {filteredIncidents.length === 0 ? (
                <div
                  className={`${CARD_STYLE} items-center max-w-lg mx-auto mt-8`}
                >
                  <FileText className="text-2xl text-sky-400 mb-2" />
                  <div className="font-semibold text-base text-slate-800 dark:text-slate-100 mb-1">
                    No incidents have been reported for this resident during the
                    current shift.
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {filteredIncidents.map((incident) => (
                    <div
                      key={incident.id}
                      className={`${CARD_STYLE} border-l-4 border-sky-400`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-sky-600 dark:text-sky-400 text-lg">
                            {incident.category}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {incident.status ? (
                              <span className="bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded-full font-medium">
                                {incident.status}
                              </span>
                            ) : null}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 dark:text-slate-500">
                          {formatUKTime(incident.incident_date)}
                          {incident.incident_time
                            ? " · " + incident.incident_time.slice(0, 5)
                            : ""}
                        </div>
                      </div>
                      <div className="mt-2 text-slate-800 dark:text-slate-100">
                        {truncate(incident.incident_description, 160)}
                      </div>
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mt-4 text-xs text-slate-500 dark:text-slate-400">
                        <span>
                          Reported by:{" "}
                          <span className="font-medium">
                            {incident.staff_name}
                          </span>
                        </span>
                        <span>
                          Resident:{" "}
                          <span className="font-medium">
                            {incident.resident_name}
                          </span>
                        </span>
                        <span>
                          Created: {formatUKTime(incident.created_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default StaffIncident;
