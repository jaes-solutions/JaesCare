import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import AdminSidebar from "../components/AdminSidebar";
import Navbar from "../components/Navbar";
import { formatUKDateTime } from "../lib/time";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ---------------------------------------------------------------------------
// Date filtering helpers
// ---------------------------------------------------------------------------

type DateFilter = "all" | "week" | "month" | "year" | "custom";

const DATE_FILTER_LABEL: Record<DateFilter, string> = {
  all: "All Time",
  week: "This Week",
  month: "This Month",
  year: "This Year",
  custom: "Custom Range",
};

function matchesDateFilter(
  dateStr: string | undefined | null,
  filter: DateFilter,
  from?: string,
  to?: string,
): boolean {
  if (!dateStr) return filter === "all";

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return false;

  if (filter === "custom") {
    if (from) {
      const start = new Date(from);
      start.setHours(0, 0, 0, 0);
      if (date < start) return false;
    }

    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      if (date > end) return false;
    }

    return true;
  }

  if (filter === "all") return true;

  const now = new Date();

  if (filter === "year") {
    return date.getFullYear() === now.getFullYear();
  }

  if (filter === "month") {
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth()
    );
  }

  const startOfWeek = new Date(now);
  const day = startOfWeek.getDay();
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  startOfWeek.setDate(startOfWeek.getDate() + diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  return date >= startOfWeek && date < endOfWeek;
}
function DateFilterSelect({
  value,
  onChange,
}: {
  value: DateFilter;
  onChange: (value: DateFilter) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as DateFilter)}
      className="rounded-xl border border-black/10 dark:border-white/[0.06] bg-white dark:bg-[#060b12]/95 px-4 py-3 text-black dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
    >
      <option value="all">All Time</option>
      <option value="week">This Week</option>
      <option value="month">This Month</option>
      <option value="year">This Year</option>
      <option value="custom">Custom Range</option>
    </select>
  );
}

// ---------------------------------------------------------------------------
// PDF export helpers
// ---------------------------------------------------------------------------

function downloadListPdf(
  title: string,
  subtitle: string,
  columns: string[],
  rows: (string | number)[][],
  filename: string,
) {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text(title, 14, 16);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(subtitle, 14, 23);

  autoTable(doc, {
    startY: 29,
    head: [columns],
    body:
      rows.length > 0
        ? rows
        : [["No records found", ...columns.slice(1).map(() => "")]],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [14, 165, 233] },
  });

  doc.save(filename);
}

function downloadRecordPdf(
  title: string,
  fields: { label: string; value: any }[],
  filename: string,
) {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text(title, 14, 16);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated: ${formatUKDateTime(new Date().toISOString())}`, 14, 23);

  autoTable(doc, {
    startY: 29,
    head: [["Field", "Value"]],
    body: fields.map((f) => [
      f.label,
      f.value === null || f.value === undefined || f.value === ""
        ? "—"
        : typeof f.value === "object"
          ? JSON.stringify(f.value)
          : String(f.value),
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [14, 165, 233] },
  });

  doc.save(filename);
}

function slugify(value: string) {
  return (value || "record")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Small reusable "Download PDF" button
function DownloadPdfButton({
  onClick,
  label = "Download PDF",
  small = false,
}: {
  onClick: () => void;
  label?: string;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onClick();
      }}
      className={`inline-flex items-center gap-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition text-sky-600 dark:text-sky-300 font-medium ${
        small ? "px-3 py-1.5 text-xs" : "px-4 py-3 text-sm whitespace-nowrap"
      }`}
    >
      <svg
        className={small ? "w-3.5 h-3.5" : "w-4 h-4"}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16"
        />
      </svg>
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdminStaff() {
  const [staff, setStaff] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<any | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState("Admin");
  const [activeTab, setActiveTab] = useState<
    "info" | "shifts" | "checkins" | "handovers" | "documents" | "training"
  >("info");

  const [organizationId, setOrganizationId] = useState("");
  const [staffShifts, setStaffShifts] = useState<any[]>([]);
  const [staffCheckins, setStaffCheckins] = useState<any[]>([]);
  const [staffHandovers, setStaffHandovers] = useState<any[]>([]);
  const [searchShifts, setSearchShifts] = useState("");
  const [searchCheckins, setSearchCheckins] = useState("");
  const [searchHandovers, setSearchHandovers] = useState("");

  // Date filters, independent per tab
  const [filterShifts, setFilterShifts] = useState<DateFilter>("all");
  const [filterCheckins, setFilterCheckins] = useState<DateFilter>("all");
  const [filterHandovers, setFilterHandovers] = useState<DateFilter>("all");
  const [shiftFrom, setShiftFrom] = useState("");
  const [shiftTo, setShiftTo] = useState("");

  const [checkinFrom, setCheckinFrom] = useState("");
  const [checkinTo, setCheckinTo] = useState("");

  const [handoverFrom, setHandoverFrom] = useState("");
  const [handoverTo, setHandoverTo] = useState("");

  // Explicit search triggers for custom date filters
  const [shiftSearchTick, setShiftSearchTick] = useState(0);
  const [checkinSearchTick, setCheckinSearchTick] = useState(0);
  const [handoverSearchTick, setHandoverSearchTick] = useState(0);
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

  const formatUKTime = (date?: string) => formatUKDateTime(date);

  // Helper used for both the "hours worked" summary calc and filtering
  const shiftHours = (shift: any) => {
    if (!shift.start_time || !shift.end_time) return 0;

    const [startHour, startMinute] = shift.start_time
      .slice(0, 5)
      .split(":")
      .map(Number);
    const [endHour, endMinute] = shift.end_time
      .slice(0, 5)
      .split(":")
      .map(Number);
    const start = startHour * 60 + startMinute;
    let end = endHour * 60 + endMinute;

    if (end <= start) {
      end += 24 * 60;
    }

    const hours = (end - start) / 60;
    return hours > 0 ? hours : 0;
  };

  // Derived values for staff summary (Info tab) — unfiltered, all-time
  const completedShifts = staffShifts.filter(
    (shift) => shift.status?.toLowerCase() === "completed",
  );

  const totalHoursWorked = completedShifts.reduce(
    (total, shift) => total + shiftHours(shift),
    0,
  );

  // -------------------------------------------------------------------------
  // Filtered lists (search + date filter combined), memoized per tab
  // -------------------------------------------------------------------------

  const filteredShifts = useMemo(() => {
    const q = searchShifts.toLowerCase();
    return staffShifts.filter((shift) => {
      const matchesSearch =
        (shift.patient_name || "").toLowerCase().includes(q) ||
        (shift.shift_date || "").toLowerCase().includes(q) ||
        (shift.status || "").toLowerCase().includes(q);

      const matchesDate = matchesDateFilter(
        shift.shift_date || shift.created_at,
        filterShifts,
        shiftFrom,
        shiftTo,
      );

      return matchesSearch && matchesDate;
    });
  }, [
    staffShifts,
    searchShifts,
    filterShifts,
    shiftFrom,
    shiftTo,
    shiftSearchTick,
  ]);

  const filteredCompletedShifts = useMemo(
    () =>
      filteredShifts.filter(
        (shift) => shift.status?.toLowerCase() === "completed",
      ),
    [filteredShifts],
  );

  const filteredTotalHoursWorked = useMemo(
    () =>
      filteredCompletedShifts.reduce(
        (total, shift) => total + shiftHours(shift),
        0,
      ),
    [filteredCompletedShifts],
  );

  const filteredCheckins = useMemo(() => {
    const q = searchCheckins.toLowerCase();
    return staffCheckins.filter((checkin) => {
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
          if (typeof value === "string") return value.toLowerCase();
          try {
            return JSON.stringify(value).toLowerCase();
          } catch {
            return String(value).toLowerCase();
          }
        })
        .join(" ");

      const matchesSearch = searchable.includes(q);
      const matchesDate = matchesDateFilter(
        checkin.submitted_at,
        filterCheckins,
        checkinFrom,
        checkinTo,
      );

      return matchesSearch && matchesDate;
    });
  }, [
    staffCheckins,
    searchCheckins,
    filterCheckins,
    checkinFrom,
    checkinTo,
    checkinSearchTick,
  ]);

  const filteredHandovers = useMemo(() => {
    const q = searchHandovers.toLowerCase();
    return staffHandovers.filter((handover) => {
      const matchesSearch =
        (handover.patient_name || "").toLowerCase().includes(q) ||
        (handover.concerns_incidents || "").toLowerCase().includes(q) ||
        (handover.wellbeing_summary || "").toLowerCase().includes(q);

      const matchesDate = matchesDateFilter(
        handover.created_at,
        filterHandovers,
        handoverFrom,
        handoverTo,
      );

      return matchesSearch && matchesDate;
    });
  }, [
    staffHandovers,
    searchHandovers,
    filterHandovers,
    handoverFrom,
    handoverTo,
    handoverSearchTick,
  ]);

  // -------------------------------------------------------------------------
  // PDF export actions
  // -------------------------------------------------------------------------

  const exportShiftsPdf = () => {
    const name = selectedStaff?.full_name || "Staff";
    downloadListPdf(
      `Shifts — ${name}`,
      `${DATE_FILTER_LABEL[filterShifts]} · ${filteredShifts.length} shift(s) · ${filteredTotalHoursWorked.toFixed(1)} hrs worked (completed)`,
      ["Resident", "Date", "Start", "End", "Status"],
      filteredShifts.map((s) => [
        s.patient_name || "—",
        s.shift_date || "—",
        s.start_time || "—",
        s.end_time || "—",
        s.status || "—",
      ]),
      `shifts-${slugify(name)}-${filterShifts}.pdf`,
    );
  };

  const exportShiftPdf = (shift: any) => {
    const name = selectedStaff?.full_name || "Staff";
    downloadRecordPdf(
      `Shift — ${shift.patient_name || "Resident"}`,
      [
        { label: "Staff", value: name },
        { label: "Resident", value: shift.patient_name },
        { label: "Date", value: shift.shift_date },
        { label: "Start", value: shift.start_time },
        { label: "End", value: shift.end_time },
        { label: "Status", value: shift.status },
      ],
      `shift-${slugify(shift.patient_name || "resident")}-${shift.shift_date || shift.id}.pdf`,
    );
  };

  const formatValue = (value: any) => {
    if (value == null || value === "") return "—";
    if (Array.isArray(value)) return value.join(", ");
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  const exportCheckinsPdf = () => {
    const name = selectedStaff?.full_name || "Staff";

    downloadListPdf(
      `Check-ins — ${name}`,
      `${DATE_FILTER_LABEL[filterCheckins]} · ${filteredCheckins.length} check-in(s)`,
      [
        "Resident",
        "Submitted",
        "Status",
        "Wellbeing",
        "Mood",
        "Hydration",
        "Safety",
        "Engagement",
        "Mobility",
        "Medication",
        "Privacy",
        "Support",
        "Safeguarding",
      ],
      filteredCheckins.map((c) => [
        c.patient_name || "—",
        formatUKTime(c.submitted_at),
        c.status || "—",
        formatValue(c.wellbeing),
        formatValue(c.mood),
        formatValue(c.hydration),
        formatValue(c.safety),
        formatValue(c.engagement),
        formatValue(c.mobility),
        formatValue(c.medication),
        formatValue(c.privacy),
        formatValue(c.support),
        formatValue(c.safeguarding),
      ]),
      `checkins-${slugify(name)}-${filterCheckins}.pdf`,
    );
  };

  const exportCheckinPdf = (checkin: any) => {
    const name = selectedStaff?.full_name || "Staff";

    downloadRecordPdf(
      `Check-in — ${checkin.patient_name || "Resident"}`,
      [
        { label: "Staff", value: name },
        { label: "Resident", value: checkin.patient_name },
        { label: "Completed", value: formatUKTime(checkin.submitted_at) },
        {
          label: "Scheduled Time",
          value: formatUKTime(checkin.scheduled_time),
        },
        { label: "Status", value: checkin.status },

        { label: "Wellbeing", value: formatValue(checkin.wellbeing) },
        { label: "Wellbeing Notes", value: checkin.wellbeing_notes },

        { label: "Mood", value: formatValue(checkin.mood) },
        { label: "Mood Notes", value: checkin.mood_notes },

        { label: "Hydration", value: formatValue(checkin.hydration) },
        { label: "Hydration Notes", value: checkin.hydration_notes },

        { label: "Safety", value: formatValue(checkin.safety) },
        { label: "Safety Notes", value: checkin.safety_notes },

        { label: "Engagement", value: formatValue(checkin.engagement) },
        { label: "Engagement Notes", value: checkin.engagement_notes },

        { label: "Mobility", value: formatValue(checkin.mobility) },
        { label: "Mobility Notes", value: checkin.mobility_notes },

        { label: "Medication", value: formatValue(checkin.medication) },
        { label: "Medication Notes", value: checkin.medication_notes },

        { label: "Privacy", value: formatValue(checkin.privacy) },
        { label: "Privacy Notes", value: checkin.privacy_notes },

        { label: "Support", value: formatValue(checkin.support) },
        { label: "Support Notes", value: checkin.support_notes },

        { label: "Safeguarding", value: formatValue(checkin.safeguarding) },
        { label: "Safeguarding Notes", value: checkin.safeguarding_notes },
      ],
      `checkin-${slugify(checkin.patient_name || "resident")}-${checkin.id}.pdf`,
    );
  };
  const exportHandoversPdf = () => {
    const name = selectedStaff?.full_name || "Staff";
    downloadListPdf(
      `Handovers — ${name}`,
      `${DATE_FILTER_LABEL[filterHandovers]} · ${filteredHandovers.length} handover(s)`,
      ["Resident", "Submitted", "Wellbeing", "Concerns / Incidents"],
      filteredHandovers.map((h) => [
        h.patient_name || "—",
        formatUKTime(h.created_at) || "—",
        h.wellbeing_summary || "—",
        h.concerns_incidents || "—",
      ]),
      `handovers-${slugify(name)}-${filterHandovers}.pdf`,
    );
  };

  const exportHandoverPdf = (handover: any) => {
    const name = selectedStaff?.full_name || "Staff";
    downloadRecordPdf(
      `Handover — ${handover.patient_name || "Resident"}`,
      [
        { label: "Staff", value: name },
        { label: "Resident", value: handover.patient_name },
        { label: "Submitted", value: formatUKTime(handover.created_at) },
        { label: "Wellbeing", value: handover.wellbeing_summary },
        { label: "Care Summary", value: handover.care_summary },
        { label: "Concerns / Incidents", value: handover.concerns_incidents },
        { label: "Escalations", value: handover.escalations },
        { label: "Family Communication", value: handover.family_communication },
        { label: "Recommendations", value: handover.recommendations },
      ],
      `handover-${slugify(handover.patient_name || "resident")}-${handover.id}.pdf`,
    );
  };

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
                        { key: "documents", label: "Documents" },
                        { key: "training", label: "Training" },
                      ].map((tab) => (
                        <button
                          key={tab.key}
                          onClick={() =>
                            setActiveTab(
                              tab.key as
                                | "info"
                                | "shifts"
                                | "checkins"
                                | "handovers"
                                | "documents"
                                | "training",
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
                        <div className="flex flex-col gap-3">
                          <div className="flex flex-col md:flex-row gap-3">
                            <input
                              type="text"
                              value={searchShifts}
                              onChange={(e) => setSearchShifts(e.target.value)}
                              placeholder="Search shifts..."
                              className="flex-1 rounded-xl border border-black/10 dark:border-white/[0.06] bg-white dark:bg-[#060b12]/95 px-4 py-3 text-black dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
                            />

                            <DateFilterSelect
                              value={filterShifts}
                              onChange={setFilterShifts}
                            />

                            <DownloadPdfButton onClick={exportShiftsPdf} />
                          </div>

                          {filterShifts === "custom" && (
                            <div className="flex gap-3 flex-wrap items-center">
                              <input
                                type="date"
                                value={shiftFrom}
                                onChange={(e) => setShiftFrom(e.target.value)}
                                className="rounded-xl border border-black/10 dark:border-white/[0.06] bg-white dark:bg-[#060b12]/95 px-4 py-3"
                                onClick={(e) => e.currentTarget.showPicker?.()}
                              />

                              <input
                                type="date"
                                value={shiftTo}
                                onChange={(e) => setShiftTo(e.target.value)}
                                className="rounded-xl border border-black/10 dark:border-white/[0.06] bg-white dark:bg-[#060b12]/95 px-4 py-3"
                                onClick={(e) => e.currentTarget.showPicker?.()}
                              />
                              <button
                                type="button"
                                onClick={() => setShiftSearchTick((v) => v + 1)}
                                className="rounded-xl bg-sky-500 hover:bg-sky-600 text-white px-6 py-3 font-medium transition"
                              >
                                Search
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Summary based on current filter */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <SummaryStat
                            label="Shifts Shown"
                            value={filteredShifts.length}
                          />
                          <SummaryStat
                            label="Completed Shifts"
                            value={filteredCompletedShifts.length}
                          />
                          <SummaryStat
                            label="Total Hours Worked"
                            value={`${filteredTotalHoursWorked.toFixed(1)} hrs`}
                          />
                        </div>

                        <div className="space-y-4">
                          {filteredShifts.map((shift) => (
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

                                  <DownloadPdfButton
                                    small
                                    label="PDF"
                                    onClick={() => exportShiftPdf(shift)}
                                  />

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
                                <InfoCard title="End" value={shift.end_time} />
                                <InfoCard title="Status" value={shift.status} />
                              </div>
                            </details>
                          ))}

                          {filteredShifts.length === 0 && (
                            <div className="rounded-2xl border border-dashed border-black/10 dark:border-white/[0.06] p-10 text-center text-gray-500 dark:text-gray-400">
                              No shifts found for this filter.
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {activeTab === "checkins" && (
                      <div className="space-y-5">
                        <div className="flex flex-col md:flex-row gap-3">
                          <input
                            type="text"
                            value={searchCheckins}
                            onChange={(e) => setSearchCheckins(e.target.value)}
                            placeholder="Search check-ins..."
                            className="flex-1 rounded-xl border border-black/10 dark:border-white/[0.06] bg-white dark:bg-[#060b12]/95 px-4 py-3 text-black dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
                          />

                          <DateFilterSelect
                            value={filterCheckins}
                            onChange={setFilterCheckins}
                          />

                          <DownloadPdfButton onClick={exportCheckinsPdf} />
                        </div>

                        {filterCheckins === "custom" && (
                          <div className="flex gap-3 flex-wrap items-center">
                            <input
                              type="date"
                              value={checkinFrom}
                              onChange={(e) => setCheckinFrom(e.target.value)}
                              className="rounded-xl border border-black/10 dark:border-white/[0.06] bg-white dark:bg-[#060b12]/95 px-4 py-3"
                              onClick={(e) => e.currentTarget.showPicker?.()}
                            />

                            <input
                              type="date"
                              value={checkinTo}
                              onChange={(e) => setCheckinTo(e.target.value)}
                              className="rounded-xl border border-black/10 dark:border-white/[0.06] bg-white dark:bg-[#060b12]/95 px-4 py-3"
                              onClick={(e) => e.currentTarget.showPicker?.()}
                            />
                            <button
                              type="button"
                              onClick={() => setCheckinSearchTick((v) => v + 1)}
                              className="rounded-xl bg-sky-500 hover:bg-sky-600 text-white px-6 py-3 font-medium transition"
                            >
                              Search
                            </button>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <SummaryStat
                            label="Check-ins Shown"
                            value={filteredCheckins.length}
                          />
                          <SummaryStat
                            label="Filter"
                            value={DATE_FILTER_LABEL[filterCheckins]}
                          />
                        </div>

                        <div className="space-y-4">
                          {filteredCheckins.map((checkin) => (
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

                                  <DownloadPdfButton
                                    small
                                    label="PDF"
                                    onClick={() => exportCheckinPdf(checkin)}
                                  />

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

                              <div className="border-t border-black/10 dark:border-white/[0.06] p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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

                                <InfoCard
                                  title="Wellbeing"
                                  value={
                                    Array.isArray(checkin.wellbeing)
                                      ? checkin.wellbeing.join(", ")
                                      : checkin.wellbeing
                                        ? JSON.stringify(checkin.wellbeing)
                                        : "—"
                                  }
                                />
                                <InfoCard
                                  title="Wellbeing Notes"
                                  value={checkin.wellbeing_notes}
                                />

                                <InfoCard
                                  title="Mood"
                                  value={
                                    Array.isArray(checkin.mood)
                                      ? checkin.mood.join(", ")
                                      : checkin.mood
                                        ? JSON.stringify(checkin.mood)
                                        : "—"
                                  }
                                />
                                <InfoCard
                                  title="Mood Notes"
                                  value={checkin.mood_notes}
                                />

                                <InfoCard
                                  title="Hydration"
                                  value={
                                    Array.isArray(checkin.hydration)
                                      ? checkin.hydration.join(", ")
                                      : checkin.hydration
                                        ? JSON.stringify(checkin.hydration)
                                        : "—"
                                  }
                                />
                                <InfoCard
                                  title="Hydration Notes"
                                  value={checkin.hydration_notes}
                                />

                                <InfoCard
                                  title="Safety"
                                  value={
                                    Array.isArray(checkin.safety)
                                      ? checkin.safety.join(", ")
                                      : checkin.safety
                                        ? JSON.stringify(checkin.safety)
                                        : "—"
                                  }
                                />
                                <InfoCard
                                  title="Safety Notes"
                                  value={checkin.safety_notes}
                                />

                                <InfoCard
                                  title="Engagement"
                                  value={
                                    Array.isArray(checkin.engagement)
                                      ? checkin.engagement.join(", ")
                                      : checkin.engagement
                                        ? JSON.stringify(checkin.engagement)
                                        : "—"
                                  }
                                />
                                <InfoCard
                                  title="Engagement Notes"
                                  value={checkin.engagement_notes}
                                />

                                <InfoCard
                                  title="Mobility"
                                  value={
                                    Array.isArray(checkin.mobility)
                                      ? checkin.mobility.join(", ")
                                      : checkin.mobility
                                        ? JSON.stringify(checkin.mobility)
                                        : "—"
                                  }
                                />
                                <InfoCard
                                  title="Mobility Notes"
                                  value={checkin.mobility_notes}
                                />

                                <InfoCard
                                  title="Medication"
                                  value={
                                    Array.isArray(checkin.medication)
                                      ? checkin.medication.join(", ")
                                      : checkin.medication
                                        ? JSON.stringify(checkin.medication)
                                        : "—"
                                  }
                                />
                                <InfoCard
                                  title="Medication Notes"
                                  value={checkin.medication_notes}
                                />

                                <InfoCard
                                  title="Privacy"
                                  value={
                                    Array.isArray(checkin.privacy)
                                      ? checkin.privacy.join(", ")
                                      : checkin.privacy
                                        ? JSON.stringify(checkin.privacy)
                                        : "—"
                                  }
                                />
                                <InfoCard
                                  title="Privacy Notes"
                                  value={checkin.privacy_notes}
                                />

                                <InfoCard
                                  title="Support"
                                  value={
                                    Array.isArray(checkin.support)
                                      ? checkin.support.join(", ")
                                      : checkin.support
                                        ? JSON.stringify(checkin.support)
                                        : "—"
                                  }
                                />
                                <InfoCard
                                  title="Support Notes"
                                  value={checkin.support_notes}
                                />

                                <InfoCard
                                  title="Safeguarding"
                                  value={
                                    Array.isArray(checkin.safeguarding)
                                      ? checkin.safeguarding.join(", ")
                                      : checkin.safeguarding
                                        ? JSON.stringify(checkin.safeguarding)
                                        : "—"
                                  }
                                />
                                <InfoCard
                                  title="Safeguarding Notes"
                                  value={checkin.safeguarding_notes}
                                />
                              </div>
                            </details>
                          ))}

                          {filteredCheckins.length === 0 && (
                            <div className="rounded-2xl border border-dashed border-black/10 dark:border-white/[0.06] p-10 text-center text-gray-500 dark:text-gray-400">
                              No check-ins found for this filter.
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {activeTab === "handovers" && (
                      <div className="space-y-5">
                        <div className="flex flex-col md:flex-row gap-3">
                          <input
                            type="text"
                            value={searchHandovers}
                            onChange={(e) => setSearchHandovers(e.target.value)}
                            placeholder="Search handovers..."
                            className="flex-1 rounded-xl border border-black/10 dark:border-white/[0.06] bg-white dark:bg-[#060b12]/95 px-4 py-3 text-black dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
                          />

                          <DateFilterSelect
                            value={filterHandovers}
                            onChange={setFilterHandovers}
                          />
                          {filterHandovers === "custom" && (
                            <div className="flex gap-3 flex-wrap items-center">
                              <input
                                type="date"
                                value={handoverFrom}
                                onChange={(e) =>
                                  setHandoverFrom(e.target.value)
                                }
                                className="rounded-xl border border-black/10 dark:border-white/[0.06] bg-white dark:bg-[#060b12]/95 px-4 py-3"
                                onClick={(e) => e.currentTarget.showPicker?.()}
                              />

                              <input
                                type="date"
                                value={handoverTo}
                                onChange={(e) => setHandoverTo(e.target.value)}
                                className="rounded-xl border border-black/10 dark:border-white/[0.06] bg-white dark:bg-[#060b12]/95 px-4 py-3"
                                onClick={(e) => e.currentTarget.showPicker?.()}
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setHandoverSearchTick((v) => v + 1)
                                }
                                className="rounded-xl bg-sky-500 hover:bg-sky-600 text-white px-6 py-3 font-medium transition"
                              >
                                Search
                              </button>
                            </div>
                          )}
                          <DownloadPdfButton onClick={exportHandoversPdf} />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <SummaryStat
                            label="Handovers Shown"
                            value={filteredHandovers.length}
                          />
                          <SummaryStat
                            label="Filter"
                            value={DATE_FILTER_LABEL[filterHandovers]}
                          />
                        </div>

                        <div className="space-y-4">
                          {filteredHandovers.map((handover) => (
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

                                  <DownloadPdfButton
                                    small
                                    label="PDF"
                                    onClick={() => exportHandoverPdf(handover)}
                                  />

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

                          {filteredHandovers.length === 0 && (
                            <div className="rounded-2xl border border-dashed border-black/10 dark:border-white/[0.06] p-10 text-center text-gray-500 dark:text-gray-400">
                              No handovers found for this filter.
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {activeTab === "documents" && (
                      <div className="rounded-2xl border border-black/10 dark:border-white/10 p-8 text-center text-gray-500 dark:text-gray-400">
                        Documents module coming soon.
                      </div>
                    )}

                    {activeTab === "training" && (
                      <div className="rounded-2xl border border-black/10 dark:border-white/10 p-8 text-center text-gray-500 dark:text-gray-400">
                        Training module coming soon.
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

function SummaryStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#070c14] px-5 py-4">
      <p className="text-xs uppercase tracking-wide text-sky-500 font-semibold mb-1">
        {label}
      </p>
      <p className="text-xl font-bold text-black dark:text-white">{value}</p>
    </div>
  );
}
