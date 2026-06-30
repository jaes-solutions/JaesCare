import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import AdminSidebar from "../components/AdminSidebar";
import Navbar from "../components/Navbar";

export default function AdminStaff() {
  const [staff, setStaff] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<any | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState("Admin");
  const [activeTab, setActiveTab] = useState<
    "info" | "shifts" | "checkins" | "handovers"
  >("info");

  const [organizationId, setOrganizationId] = useState("");
  const [staffShifts, setStaffShifts] = useState<any[]>([]);
  const [staffCheckins, setStaffCheckins] = useState<any[]>([]);
  const [staffHandovers, setStaffHandovers] = useState<any[]>([]);
  const [searchShifts, setSearchShifts] = useState("");
  const [searchCheckins, setSearchCheckins] = useState("");
  const [searchHandovers, setSearchHandovers] = useState("");

  useEffect(() => {
    loadStaff();
  }, []);

  useEffect(() => {
    if (!selectedStaff || !organizationId) return;

    loadStaffShifts(selectedStaff.id, organizationId);
    loadStaffCheckins(selectedStaff.id, organizationId);
    loadStaffHandovers(selectedStaff.id, organizationId);
  }, [selectedStaff, organizationId]);

  const loadStaff = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id, full_name")
      .eq("id", user.id)
      .single();

    if (profile?.full_name) {
      setAdminName(profile.full_name);
    }
    if (profile?.organization_id) {
      setOrganizationId(profile.organization_id);
    }

    if (profileError || !profile?.organization_id) {
      console.error(profileError);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "staff")
      .eq("organization_id", profile.organization_id)
      .order("full_name");

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setStaff(data || []);

    if (data && data.length > 0) {
      setSelectedStaff(data[0]);
    }

    setLoading(false);
  };

  const loadStaffShifts = async (staffId: string, organizationId: string) => {
    const { data, error } = await supabase
      .from("shifts")
      .select("*")
      .eq("staff_id", staffId)
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setStaffShifts(data || []);
  };

  const loadStaffCheckins = async (staffId: string, organizationId: string) => {
    const { data, error } = await supabase
      .from("checkins")
      .select("*")
      .eq("staff_id", staffId)
      .eq("organization_id", organizationId)
      .order("submitted_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setStaffCheckins(data || []);
  };

  const loadStaffHandovers = async (
    staffId: string,
    organizationId: string,
  ) => {
    const { data, error } = await supabase
      .from("handovers")
      .select("*")
      .eq("staff_id", staffId)
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setStaffHandovers(data || []);
  };

  const saveStaff = async () => {
    if (!selectedStaff) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: selectedStaff.full_name,
        phone: selectedStaff.phone,
        address: selectedStaff.address,
        emergency_contact_name: selectedStaff.emergency_contact_name,
        emergency_contact_phone: selectedStaff.emergency_contact_phone,
        gender: selectedStaff.gender,
      })
      .eq("id", selectedStaff.id);

    if (error) {
      alert("Failed to update staff");
      return;
    }

    alert("Staff updated successfully");
    setEditing(false);
    loadStaff();
  };

  const formatUKTime = (date?: string) => {
    if (!date) return "—";

    return new Date(date).toLocaleString("en-GB", {
      timeZone: "Europe/London",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  // Derived values for staff summary (Info tab)
  const completedShifts = staffShifts.filter(
    (shift) => shift.status?.toLowerCase() === "completed",
  );

  const totalHoursWorked = completedShifts.reduce((total, shift) => {
    if (!shift.start_time || !shift.end_time) return total;

    const start = new Date(`1970-01-01T${shift.start_time}`);
    const end = new Date(`1970-01-01T${shift.end_time}`);

    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return total + (hours > 0 ? hours : 0);
  }, 0);

  return (
    <div className="min-h-screen bg-white dark:bg-[#03060b]">
      <AdminSidebar
        onLogout={() => {
          localStorage.clear();
          window.location.href = "/";
        }}
      />

      <div className="lg:ml-[280px] min-h-screen">
        <Navbar name={adminName} role="admin" />

        <div className="pt-24 px-6 pb-6 max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
            {/* Left Side: Titles */}
            <div>
              <h1 className="text-3xl font-bold text-black dark:text-white mb-1">
                Staff Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-base">
                View staff profiles, shifts, check-ins and handovers.
              </p>
            </div>
            {/* Right Side: Summary Card */}
            <div className="rounded-2xl bg-white dark:bg-[#070c14] border border-black/10 dark:border-white/10 px-6 py-4 flex flex-col items-center min-w-[140px] shadow-sm">
              <span className="text-xs uppercase text-sky-300 dark:text-sky-300 font-semibold tracking-wide mb-1">
                Total Staff
              </span>
              <span className="text-2xl font-bold text-black dark:text-white">
                {staff.length}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="min-h-[70vh] flex items-center justify-center">
              <div className="flex flex-col items-center">
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 rounded-full border-4 border-sky-400/20" />

                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-sky-400 border-r-emerald-400 animate-spin" />

                  <div className="absolute inset-[10px] rounded-full border-4 border-transparent border-b-sky-300 border-l-emerald-300 animate-spin [animation-direction:reverse] [animation-duration:1.5s]" />
                </div>

                <h3 className="mt-6 text-2xl font-bold text-black dark:text-white">
                  Preparing data..
                </h3>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-6 min-h-[calc(100vh-180px)]">
              <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#070c14] overflow-hidden">
                <div className="p-4 border-b border-black/10 dark:border-white/10 font-semibold">
                  Staff
                </div>

                <div className="overflow-y-auto max-h-[calc(100vh-260px)]">
                  {staff.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => setSelectedStaff(member)}
                      className={`w-full text-left p-4 border-b border-black/5 dark:border-white/5 transition ${selectedStaff?.id === member.id ? "bg-blue-50 dark:bg-blue-500/10" : "hover:bg-black/5 dark:hover:bg-white/5"}`}
                    >
                      <p className="font-medium text-black dark:text-white">
                        {member.full_name}
                      </p>

                      <p className="text-sm text-gray-500">
                        {member.role || "Staff"}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#070c14] p-6 overflow-x-hidden">
                {selectedStaff ? (
                  <div className="space-y-6">
                    <div className="border-b border-black/10 dark:border-white/10 pb-5">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div>
                          <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-semibold">
                            Staff Profile
                          </p>

                          <h2 className="mt-1 text-3xl font-bold text-black dark:text-white">
                            {selectedStaff.full_name}
                          </h2>

                          <p className="mt-2 text-gray-500">
                            {selectedStaff.role}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditing(!editing)}
                            className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 transition text-white font-medium"
                          >
                            {editing ? "Cancel" : "Edit Staff"}
                          </button>

                          {editing && (
                            <button
                              onClick={saveStaff}
                              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 transition text-white font-medium"
                            >
                              Save
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 border-b border-black/10 dark:border-white/10 pb-4">
                      {[
                        { key: "info", label: "Info" },
                        { key: "shifts", label: "Shifts" },
                        { key: "checkins", label: "Check-ins" },
                        { key: "handovers", label: "Handovers" },
                      ].map((tab) => (
                        <button
                          key={tab.key}
                          onClick={() =>
                            setActiveTab(
                              tab.key as
                                | "info"
                                | "shifts"
                                | "checkins"
                                | "handovers",
                            )
                          }
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                            activeTab === tab.key
                              ? "bg-sky-500 text-white"
                              : "bg-black/5 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/10"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {activeTab === "info" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InfoCard
                          title="Full Name"
                          value={selectedStaff.full_name}
                          editable={editing}
                          onChange={(v: string) =>
                            setSelectedStaff({ ...selectedStaff, full_name: v })
                          }
                        />
                        <InfoCard title="Email" value={selectedStaff.email} />
                        <InfoCard title="Role" value={selectedStaff.role} />
                        <InfoCard
                          title="Phone"
                          value={selectedStaff.phone}
                          editable={editing}
                          onChange={(v: string) =>
                            setSelectedStaff({ ...selectedStaff, phone: v })
                          }
                        />
                        <InfoCard
                          title="Address"
                          value={selectedStaff.address}
                          editable={editing}
                          onChange={(v: string) =>
                            setSelectedStaff({ ...selectedStaff, address: v })
                          }
                        />
                        <InfoCard
                          title="Emergency Contact"
                          value={selectedStaff.emergency_contact_name}
                          editable={editing}
                          onChange={(v: string) =>
                            setSelectedStaff({
                              ...selectedStaff,
                              emergency_contact_name: v,
                            })
                          }
                        />
                        <InfoCard
                          title="Emergency Phone"
                          value={selectedStaff.emergency_contact_phone}
                          editable={editing}
                          onChange={(v: string) =>
                            setSelectedStaff({
                              ...selectedStaff,
                              emergency_contact_phone: v,
                            })
                          }
                        />
                        <InfoCard
                          title="Gender"
                          value={selectedStaff.gender}
                          editable={editing}
                          onChange={(v: string) =>
                            setSelectedStaff({ ...selectedStaff, gender: v })
                          }
                        />
                        <InfoCard
                          title="Created"
                          value={formatUKTime(selectedStaff.created_at)}
                        />
                        {/* Additional staff summary info */}
                        <InfoCard
                          title="DBS Check"
                          value={selectedStaff.dbs_check ?? "Not Recorded"}
                        />
                        <InfoCard
                          title="Completed Shifts"
                          value={completedShifts.length}
                        />
                        <InfoCard
                          title="Total Hours Worked"
                          value={`${totalHoursWorked.toFixed(1)} hrs`}
                        />
                      </div>
                    )}

                    {activeTab === "shifts" && (
                      <div className="space-y-5">
                        <input
                          type="text"
                          value={searchShifts}
                          onChange={(e) => setSearchShifts(e.target.value)}
                          placeholder="Search shifts..."
                          className="w-full rounded-xl border border-black/10 dark:border-white/[0.06] bg-white dark:bg-[#060b12]/95 px-4 py-3 text-black dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
                        />

                        <div className="space-y-4">
                          {staffShifts
                            .filter((shift) => {
                              const q = searchShifts.toLowerCase();
                              return (
                                (shift.patient_name || "")
                                  .toLowerCase()
                                  .includes(q) ||
                                (shift.shift_date || "")
                                  .toLowerCase()
                                  .includes(q) ||
                                (shift.status || "").toLowerCase().includes(q)
                              );
                            })
                            .map((shift) => (
                              <details
                                key={shift.id}
                                className="group rounded-2xl border border-black/10 dark:border-white/[0.06] bg-white dark:bg-[#060b12]/95 overflow-hidden transition-all duration-200"
                              >
                                <summary className="cursor-pointer list-none px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                  <div>
                                    <p className="font-semibold text-black dark:text-white">
                                      {shift.patient_name || "Resident"}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      {shift.shift_date || "No date"}
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-3 self-end md:self-auto">
                                    <span className="text-sm font-medium text-sky-500">
                                      {shift.status || "Active"}
                                    </span>

                                    <svg
                                      className="w-5 h-5 text-gray-400 transition-transform duration-200 group-open:rotate-180"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 9l-7 7-7-7"
                                      />
                                    </svg>
                                  </div>
                                </summary>

                                <div className="border-t border-black/10 dark:border-white/[0.06] p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  <InfoCard
                                    title="Resident"
                                    value={shift.patient_name}
                                  />
                                  <InfoCard
                                    title="Date"
                                    value={shift.shift_date}
                                  />
                                  <InfoCard
                                    title="Start"
                                    value={shift.start_time}
                                  />
                                  <InfoCard
                                    title="End"
                                    value={shift.end_time}
                                  />
                                  <InfoCard
                                    title="Status"
                                    value={shift.status}
                                  />
                                </div>
                              </details>
                            ))}

                          {staffShifts.length === 0 && (
                            <div className="rounded-2xl border border-dashed border-black/10 dark:border-white/[0.06] p-10 text-center text-gray-500 dark:text-gray-400">
                              No shifts assigned to this staff member.
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {activeTab === "checkins" && (
                      <div className="space-y-5">
                        <input
                          type="text"
                          value={searchCheckins}
                          onChange={(e) => setSearchCheckins(e.target.value)}
                          placeholder="Search check-ins..."
                          className="w-full rounded-xl border border-black/10 dark:border-white/[0.06] bg-white dark:bg-[#060b12]/95 px-4 py-3 text-black dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
                        />

                        <div className="space-y-4">
                          {staffCheckins
                            .filter((checkin) => {
                              const q = searchCheckins.toLowerCase();

                              const searchable = [
                                checkin.patient_name,
                                checkin.status,
                                checkin.mood,
                                checkin.notes,
                                checkin.observations,
                                checkin.comments,
                                checkin.submitted_at,
                                formatUKTime(checkin.submitted_at),
                              ]
                                .map((value) => {
                                  if (value == null) return "";
                                  if (typeof value === "string")
                                    return value.toLowerCase();
                                  try {
                                    return JSON.stringify(value).toLowerCase();
                                  } catch {
                                    return String(value).toLowerCase();
                                  }
                                })
                                .join(" ");

                              return searchable.includes(q);
                            })
                            .map((checkin) => (
                              <details
                                key={checkin.id}
                                className="group rounded-2xl border border-black/10 dark:border-white/[0.06] bg-white dark:bg-[#060b12]/95 overflow-hidden transition-all duration-200"
                              >
                                <summary className="cursor-pointer list-none px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                  <div>
                                    <p className="font-semibold text-black dark:text-white">
                                      {checkin.patient_name || "Resident"}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      {formatUKTime(checkin.submitted_at)}
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-3 self-end md:self-auto">
                                    <span className="text-sm font-medium text-sky-500">
                                      {checkin.status || "Completed"}
                                    </span>

                                    <svg
                                      className="w-5 h-5 text-gray-400 transition-transform duration-200 group-open:rotate-180"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 9l-7 7-7-7"
                                      />
                                    </svg>
                                  </div>
                                </summary>

                                <div className="border-t border-black/10 dark:border-white/[0.06] p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <InfoCard
                                    title="Resident"
                                    value={checkin.patient_name}
                                  />
                                  <InfoCard
                                    title="Completed"
                                    value={formatUKTime(checkin.submitted_at)}
                                  />
                                  <InfoCard
                                    title="Status"
                                    value={checkin.status}
                                  />
                                  <InfoCard title="Mood" value={checkin.mood} />
                                  <InfoCard
                                    title="Hydration"
                                    value={checkin.hydration}
                                  />
                                  <InfoCard
                                    title="Mobility"
                                    value={checkin.mobility}
                                  />
                                  <InfoCard
                                    title="Medication"
                                    value={checkin.medication}
                                  />
                                  <InfoCard
                                    title="Observations"
                                    value={
                                      typeof (
                                        checkin.notes ??
                                        checkin.observations ??
                                        checkin.comments
                                      ) === "object"
                                        ? JSON.stringify(
                                            checkin.notes ??
                                              checkin.observations ??
                                              checkin.comments,
                                          )
                                        : (checkin.notes ??
                                          checkin.observations ??
                                          checkin.comments)
                                    }
                                  />
                                </div>
                              </details>
                            ))}

                          {staffCheckins.length === 0 && (
                            <div className="rounded-2xl border border-dashed border-black/10 dark:border-white/[0.06] p-10 text-center text-gray-500 dark:text-gray-400">
                              No check-ins completed by this staff member.
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {activeTab === "handovers" && (
                      <div className="space-y-5">
                        <input
                          type="text"
                          value={searchHandovers}
                          onChange={(e) => setSearchHandovers(e.target.value)}
                          placeholder="Search handovers..."
                          className="w-full rounded-xl border border-black/10 dark:border-white/[0.06] bg-white dark:bg-[#060b12]/95 px-4 py-3 text-black dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
                        />

                        <div className="space-y-4">
                          {staffHandovers
                            .filter((handover) => {
                              const q = searchHandovers.toLowerCase();
                              return (
                                (handover.patient_name || "")
                                  .toLowerCase()
                                  .includes(q) ||
                                (handover.concerns_incidents || "")
                                  .toLowerCase()
                                  .includes(q) ||
                                (handover.wellbeing_summary || "")
                                  .toLowerCase()
                                  .includes(q)
                              );
                            })
                            .map((handover) => (
                              <details
                                key={handover.id}
                                className="group rounded-2xl border border-black/10 dark:border-white/[0.06] bg-white dark:bg-[#060b12]/95 overflow-hidden transition-all duration-200"
                              >
                                <summary className="cursor-pointer list-none px-5 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:bg-sky-50 dark:hover:bg-sky-500/5 transition-colors">
                                  <div>
                                    <p className="font-semibold text-black dark:text-white">
                                      {handover.patient_name || "Resident"}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      {formatUKTime(handover.created_at)}
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-3 self-end md:self-auto">
                                    <span className="text-sm font-medium text-emerald-500">
                                      Submitted
                                    </span>

                                    <svg
                                      className="w-5 h-5 text-gray-400 transition-transform duration-200 group-open:rotate-180"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 9l-7 7-7-7"
                                      />
                                    </svg>
                                  </div>
                                </summary>

                                <div className="border-t border-black/10 dark:border-white/[0.06] p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <InfoCard
                                    title="Resident"
                                    value={handover.patient_name}
                                  />
                                  <InfoCard
                                    title="Submitted"
                                    value={formatUKTime(handover.created_at)}
                                  />
                                  <InfoCard
                                    title="Wellbeing"
                                    value={handover.wellbeing_summary}
                                  />
                                  <InfoCard
                                    title="Care Summary"
                                    value={handover.care_summary}
                                  />
                                  <InfoCard
                                    title="Concerns / Incidents"
                                    value={handover.concerns_incidents}
                                  />
                                  <InfoCard
                                    title="Escalations"
                                    value={handover.escalations}
                                  />
                                  <InfoCard
                                    title="Family Communication"
                                    value={handover.family_communication}
                                  />
                                  <InfoCard
                                    title="Recommendations"
                                    value={handover.recommendations}
                                  />
                                </div>
                              </details>
                            ))}

                          {staffHandovers.length === 0 && (
                            <div className="rounded-2xl border border-dashed border-black/10 dark:border-white/[0.06] p-10 text-center text-gray-500 dark:text-gray-400">
                              No handovers submitted by this staff member.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    Select a staff member
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ title, value, editable = false, onChange }: any) {
  return (
    <div className="rounded-xl border border-black/10 dark:border-white/10 p-4">
      <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
        {title}
      </p>

      {editable ? (
        <input
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
          className="w-full bg-transparent border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-black dark:text-white"
        />
      ) : (
        <p className="text-black dark:text-white font-medium break-words">
          {value || "—"}
        </p>
      )}
    </div>
  );
}
