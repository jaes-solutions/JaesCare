import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import AdminSidebar from "../components/AdminSidebar";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";

export default function AdminPatients() {
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [adminName, setAdminName] = useState("Admin");
  const [checkinCount, setCheckinCount] = useState(0);
  const [patientCheckins, setPatientCheckins] = useState<any[]>([]);
  const [patientHandovers, setPatientHandovers] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  const [checkinSearch, setCheckinSearch] = useState("");

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    if (selectedPatient) {
      loadPatientSummary();
    }
  }, [selectedPatient]);

  const loadPatients = async () => {
    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, organization_id")
        .eq("id", session.user.id)
        .single();

      if (profileError || !profile?.organization_id) {
        console.error("Unable to determine organization", profileError);
        setPatients([]);
        setLoading(false);
        return;
      }

      if (profile?.full_name) {
        setAdminName(profile.full_name);
      }

      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
          *,
          patient_details (*)
        `,
        )
        .eq("role", "patient")
        .eq("organization_id", profile.organization_id)
        .order("full_name");

      if (!error && data) {
        setPatients(data);

        if (data.length > 0) {
          setSelectedPatient(data[0]);
        }
      }
    }

    setLoading(false);
  };

  const savePatientDetails = async () => {
    if (!selectedPatient) return;

    const { error } = await supabase.from("patient_details").upsert({
      profile_id: selectedPatient.id,
      ...(selectedPatient.patient_details || {}),
    });

    if (error) {
      alert("Failed to save patient details");
      return;
    }

    setIsEditing(false);
    alert("Patient details saved successfully");
  };

  const loadPatientSummary = async () => {
    if (!selectedPatient) return;

    try {
      const { count: totalCheckins } = await supabase
        .from("checkins")
        .select("*", { count: "exact", head: true })
        .eq("patient_id", selectedPatient.id);

      setCheckinCount(totalCheckins || 0);

      const { data: checkins } = await supabase
        .from("checkins")
        .select("*")
        .eq("patient_id", selectedPatient.id)
        .order("submitted_at", { ascending: false });

      setPatientCheckins(checkins || []);

      // Load handovers for the patient, filtered by admin's organization
      // 1. Get session
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        setPatientHandovers([]);
        return;
      }
      // 2. Get admin profile to get organization_id
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", session.user.id)
        .single();
      if (profileError || !profile?.organization_id) {
        setPatientHandovers([]);
        return;
      }
      // 3. Query handovers where shift.patient_id and shift.organization_id match
      const { data: residentShifts } = await supabase
        .from("shifts")
        .select("id")
        .eq("organization_id", profile.organization_id)
        .eq("patient_id", selectedPatient.id);

      if (!residentShifts || residentShifts.length === 0) {
        setPatientHandovers([]);
        return;
      }

      const shiftIds = residentShifts.map((shift) => shift.id);

      const { data: handovers } = await supabase
        .from("handovers")
        .select(
          `
            *,
            shifts!handovers_shift_id_fkey (
              patient_id,
              organization_id,
              shift_date,
              start_time,
              end_time,
              staff_name
            )
          `,
        )
        .in("shift_id", shiftIds)
        .order("created_at", { ascending: false });

      setPatientHandovers(handovers || []);

      const { data: shifts } = await supabase
        .from("shifts")
        .select("*")
        .eq("patient_id", selectedPatient.id)
        .order("shift_date", { ascending: true });

      if (shifts && shifts.length > 0) {
        // removed assignedStaffCount, upcomingShift, compliance state updates future ref
      } else {
        // removed assignedStaffCount, upcomingShift, compliance state updates
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const calculateAge = (dob?: string) => {
    if (!dob) return null;

    const birthDate = new Date(dob);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  const formatUKTime = (date?: string) => {
    if (!date) return "-";

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

  const filteredCheckins = patientCheckins.filter((checkin) => {
    const q = checkinSearch.trim().toLowerCase();
    if (!q) return true;

    const values = [
      checkin.staff_name,
      checkin.patient_name,
      checkin.status,
      checkin.wellbeing_notes,
      checkin.mood_notes,
      checkin.hydration_notes,
      checkin.safety_notes,
      checkin.engagement_notes,
      checkin.mobility_notes,
      checkin.medication_notes,
      checkin.privacy_notes,
      checkin.support_notes,
      checkin.safeguarding_notes,
      formatUKTime(checkin.submitted_at),
      formatUKTime(checkin.scheduled_time),
      formatUKTime(checkin.created_at),
    ];

    return values.some((v) =>
      String(v ?? "")
        .toLowerCase()
        .includes(q),
    );
  });

  return (
    <div className="min-h-screen bg-white dark:bg-[#050a11] text-black dark:text-white transition-colors duration-300">
      <AdminSidebar onLogout={handleLogout} />
      <Navbar name={adminName} role="Admin" />

      <div className="lg:ml-[280px]">
        <div className="pt-32 px-4 md:px-6 pb-6">
          <div className="max-w-[1600px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                  Resident Management
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  View resident profiles, care activity and assigned staff.
                </p>
              </div>

              <div className="px-5 py-3 rounded-2xl bg-sky-400/10 border border-sky-400/20">
                <p className="text-sky-300 text-center text-sm">
                  Total Residents
                </p>
                <p className="text-2xl text-center font-bold">
                  {patients.length}
                </p>
              </div>
            </div>

            <div>
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
                <div className="grid grid-cols-1 xl:grid-cols-[220px_minmax(0,1fr)] gap-6 items-start">
                  <div className="xl:sticky xl:top-[120px] rounded-[18px] border border-black/10 dark:border-white/10 bg-white dark:bg-[#070c14] p-3 h-fit min-h-[300px]">
                    <h3 className="text-base font-semibold mb-3">Residents</h3>
                    <div className="space-y-2 h-full overflow-y-auto pr-2">
                      {patients.map((patient) => (
                        <button
                          key={patient.id}
                          onClick={() => setSelectedPatient(patient)}
                          className={`w-full text-left p-2.5 rounded-xl transition-all border text-sm ${
                            selectedPatient?.id === patient.id
                              ? "bg-sky-400 text-black border-sky-300 shadow-lg"
                              : "bg-white dark:bg-[#0b1018] border-black/10 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-[#161d28] hover:border-sky-400/20"
                          }`}
                        >
                          {patient.full_name || "Unnamed Patient"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-6 min-w-0 overflow-hidden">
                    <div className="rounded-[24px] border border-black/10 dark:border-white/10 bg-white dark:bg-[#070c14] p-8 overflow-hidden min-w-0 max-w-full">
                      {selectedPatient ? (
                        <>
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                            <div>
                              <h2 className="text-2xl md:text-3xl font-bold">
                                {selectedPatient.full_name}
                              </h2>
                              <p className="text-gray-600 dark:text-gray-400 mt-1">
                                Resident Profile
                              </p>
                            </div>
                            <div className="flex gap-3">
                              {!isEditing ? (
                                <button
                                  onClick={() => setIsEditing(true)}
                                  className="h-[44px] px-5 rounded-xl bg-sky-400 text-black font-medium hover:opacity-90 transition-all"
                                >
                                  Edit Resident
                                </button>
                              ) : (
                                <button
                                  onClick={savePatientDetails}
                                  className="h-[44px] px-5 rounded-xl bg-emerald-500 text-white font-medium hover:opacity-90 transition-all"
                                >
                                  Save Changes
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="xl:sticky xl:top-[120px] z-20 border-black/10 dark:border-white/10 bg-white dark:bg-[#070c14] mb-8 pb-4">
                            <div className="flex gap-2 overflow-x-auto">
                              {[
                                { id: "info", label: "Info" },
                                { id: "checkins", label: "Check-ins" },
                                { id: "handover", label: "Handover" },
                              ].map((tab) => (
                                <button
                                  key={tab.id}
                                  onClick={() => setActiveTab(tab.id)}
                                  className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                                    activeTab === tab.id
                                      ? "bg-sky-400 text-black"
                                      : "bg-white dark:bg-[#0b1018] text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
                                  }`}
                                >
                                  {tab.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {activeTab === "info" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {[
                                { label: "First Name", key: "first_name" },
                                { label: "Last Name", key: "last_name" },
                                {
                                  label: "Date of Birth",
                                  key: "date_of_birth",
                                },
                                { label: "Gender", key: "gender" },
                                { label: "Ethnicity", key: "ethnicity" },
                                { label: "Religion", key: "religion" },
                                { label: "Phone", key: "phone" },
                                { label: "Email", key: "email" },
                                { label: "NHS Number", key: "nhs_number" },
                                {
                                  label: "IDDSI Diet Level",
                                  key: "iddsi_level",
                                },
                                {
                                  label: "Resuscitation Status",
                                  key: "resuscitation_status",
                                },
                                {
                                  label: "Emergency Contact Name",
                                  key: "emergency_contact_name",
                                },
                                {
                                  label: "Emergency Contact Relationship",
                                  key: "emergency_contact_relationship",
                                },
                                {
                                  label: "Emergency Contact Phone",
                                  key: "emergency_contact_phone",
                                },
                                {
                                  label: "Emergency Contact Email",
                                  key: "emergency_contact_email",
                                },
                                { label: "GP Name", key: "gp_name" },
                                { label: "GP Phone", key: "gp_phone" },
                                { label: "Allergies", key: "allergies" },
                              ].map((field) => (
                                <div
                                  key={field.key}
                                  className="rounded-2xl bg-gray-50 dark:bg-[#0b1018] border border-black/10 dark:border-white/10 p-5"
                                >
                                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                                    {field.label}
                                  </p>
                                  {isEditing ? (
                                    field.key === "email" ? (
                                      <input
                                        value={
                                          selectedPatient.email ||
                                          selectedPatient.patient_details
                                            ?.email ||
                                          ""
                                        }
                                        onChange={(e) =>
                                          setSelectedPatient({
                                            ...selectedPatient,
                                            email: e.target.value,
                                          })
                                        }
                                        className="w-full bg-white dark:bg-[#11161d] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-black dark:text-white"
                                      />
                                    ) : field.key === "date_of_birth" ? (
                                      <input
                                        type="date"
                                        value={
                                          selectedPatient.patient_details
                                            ?.date_of_birth || ""
                                        }
                                        onChange={(e) =>
                                          setSelectedPatient({
                                            ...selectedPatient,
                                            patient_details: {
                                              ...selectedPatient.patient_details,
                                              date_of_birth: e.target.value,
                                            },
                                          })
                                        }
                                        className="w-full bg-white dark:bg-[#11161d] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-black dark:text-white"
                                      />
                                    ) : (
                                      <input
                                        value={
                                          selectedPatient.patient_details?.[
                                            field.key
                                          ] || ""
                                        }
                                        onChange={(e) =>
                                          setSelectedPatient({
                                            ...selectedPatient,
                                            patient_details: {
                                              ...selectedPatient.patient_details,
                                              [field.key]: e.target.value,
                                            },
                                          })
                                        }
                                        className="w-full bg-white dark:bg-[#11161d] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-black dark:text-white"
                                      />
                                    )
                                  ) : (
                                    <p className="text-white">
                                      {field.key === "date_of_birth"
                                        ? selectedPatient.patient_details
                                            ?.date_of_birth
                                          ? `${selectedPatient.patient_details.date_of_birth} (${calculateAge(selectedPatient.patient_details.date_of_birth)} years)`
                                          : "-"
                                        : field.key === "email"
                                          ? selectedPatient.email ||
                                            selectedPatient.patient_details
                                              ?.email ||
                                            "-"
                                          : selectedPatient.patient_details?.[
                                              field.key
                                            ] || "-"}
                                    </p>
                                  )}
                                </div>
                              ))}

                              <div className="rounded-2xl bg-gray-50 dark:bg-[#0b1018] border border-black/10 dark:border-white/10 p-5 md:col-span-2">
                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                                  Address
                                </p>
                                {isEditing ? (
                                  <textarea
                                    value={
                                      selectedPatient.patient_details
                                        ?.address || ""
                                    }
                                    onChange={(e) =>
                                      setSelectedPatient({
                                        ...selectedPatient,
                                        patient_details: {
                                          ...selectedPatient.patient_details,
                                          address: e.target.value,
                                        },
                                      })
                                    }
                                    className="w-full bg-white dark:bg-[#11161d] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 min-h-[120px] text-black dark:text-white"
                                  />
                                ) : (
                                  <p>
                                    {selectedPatient.patient_details?.address ||
                                      "-"}
                                  </p>
                                )}
                              </div>

                              <div className="rounded-2xl bg-gray-50 dark:bg-[#0b1018] border border-black/10 dark:border-white/10 p-5 md:col-span-2">
                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                                  Medical Conditions
                                </p>
                                {isEditing ? (
                                  <textarea
                                    value={
                                      selectedPatient.patient_details
                                        ?.medical_conditions || ""
                                    }
                                    onChange={(e) =>
                                      setSelectedPatient({
                                        ...selectedPatient,
                                        patient_details: {
                                          ...selectedPatient.patient_details,
                                          medical_conditions: e.target.value,
                                        },
                                      })
                                    }
                                    className="w-full bg-white dark:bg-[#11161d] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 min-h-[120px] text-black dark:text-white"
                                  />
                                ) : (
                                  <p>
                                    {selectedPatient.patient_details
                                      ?.medical_conditions || "-"}
                                  </p>
                                )}
                              </div>

                              {/* Abilities */}
                              <div className="rounded-2xl bg-gray-50 dark:bg-[#0b1018] border border-black/10 dark:border-white/10 p-5 md:col-span-2">
                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                                  Abilities
                                </p>
                                {isEditing ? (
                                  <textarea
                                    value={
                                      selectedPatient.patient_details
                                        ?.abilities || ""
                                    }
                                    onChange={(e) =>
                                      setSelectedPatient({
                                        ...selectedPatient,
                                        patient_details: {
                                          ...selectedPatient.patient_details,
                                          abilities: e.target.value,
                                        },
                                      })
                                    }
                                    className="w-full bg-white dark:bg-[#11161d] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 min-h-[120px] text-black dark:text-white"
                                  />
                                ) : (
                                  <p>
                                    {selectedPatient.patient_details
                                      ?.abilities || "-"}
                                  </p>
                                )}
                              </div>

                              {/* Communication Needs */}
                              <div className="rounded-2xl bg-gray-50 dark:bg-[#0b1018] border border-black/10 dark:border-white/10 p-5 md:col-span-2">
                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                                  Communication Needs
                                </p>
                                {isEditing ? (
                                  <textarea
                                    value={
                                      selectedPatient.patient_details
                                        ?.communication_needs || ""
                                    }
                                    onChange={(e) =>
                                      setSelectedPatient({
                                        ...selectedPatient,
                                        patient_details: {
                                          ...selectedPatient.patient_details,
                                          communication_needs: e.target.value,
                                        },
                                      })
                                    }
                                    className="w-full bg-white dark:bg-[#11161d] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 min-h-[120px] text-black dark:text-white"
                                  />
                                ) : (
                                  <p>
                                    {selectedPatient.patient_details
                                      ?.communication_needs || "-"}
                                  </p>
                                )}
                              </div>

                              {/* Mobility Status */}
                              <div className="rounded-2xl bg-gray-50 dark:bg-[#0b1018] border border-black/10 dark:border-white/10 p-5 md:col-span-2">
                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                                  Mobility Status
                                </p>
                                {isEditing ? (
                                  <textarea
                                    value={
                                      selectedPatient.patient_details
                                        ?.mobility_status || ""
                                    }
                                    onChange={(e) =>
                                      setSelectedPatient({
                                        ...selectedPatient,
                                        patient_details: {
                                          ...selectedPatient.patient_details,
                                          mobility_status: e.target.value,
                                        },
                                      })
                                    }
                                    className="w-full bg-white dark:bg-[#11161d] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 min-h-[120px] text-black dark:text-white"
                                  />
                                ) : (
                                  <p>
                                    {selectedPatient.patient_details
                                      ?.mobility_status || "-"}
                                  </p>
                                )}
                              </div>

                              <div className="rounded-2xl bg-gray-50 dark:bg-[#0b1018] border border-black/10 dark:border-white/10 p-5 md:col-span-2">
                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                                  Notes
                                </p>
                                {isEditing ? (
                                  <textarea
                                    value={
                                      selectedPatient.patient_details?.notes ||
                                      ""
                                    }
                                    onChange={(e) =>
                                      setSelectedPatient({
                                        ...selectedPatient,
                                        patient_details: {
                                          ...selectedPatient.patient_details,
                                          notes: e.target.value,
                                        },
                                      })
                                    }
                                    className="w-full bg-white dark:bg-[#11161d] border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 min-h-[120px] text-black dark:text-white"
                                  />
                                ) : (
                                  <p>
                                    {selectedPatient.patient_details?.notes ||
                                      "-"}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {activeTab === "checkins" && (
                            <div className="space-y-6">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="text-2xl font-bold">
                                    Resident Check-ins
                                  </h3>
                                  <p className="text-gray-400 mt-1">
                                    Complete history for this patient
                                  </p>
                                </div>
                                <div className="px-5 py-3 rounded-2xl bg-sky-400/10 border border-sky-400/20">
                                  <p className="text-sky-300 text-sm">
                                    Total Check-ins
                                  </p>
                                  <p className="text-2xl font-bold">
                                    {checkinCount}
                                  </p>
                                </div>
                              </div>
                              {/* Info banner */}
                              <div className="mb-4 rounded-2xl border border-sky-400/20 bg-sky-400/10 px-5 py-3 flex items-center justify-between gap-4">
                                <div>
                                  <p className="text-sky-300 font-semibold">
                                    Resident Care History
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    View every submitted check-in for this
                                    resident. Scroll horizontally to see all
                                    recorded care categories.
                                  </p>
                                </div>
                              </div>
                              <div className="mb-5">
                                <div className="relative">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 pointer-events-none"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
                                  </svg>
                                  <input
                                    type="text"
                                    value={checkinSearch}
                                    onChange={(e) =>
                                      setCheckinSearch(e.target.value)
                                    }
                                    placeholder="Search by staff, status, date, notes..."
                                    className="w-full rounded-2xl border border-sky-400/20 bg-white dark:bg-[#0b1018] pl-12 pr-5 py-3 text-black dark:text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
                                  />
                                </div>
                              </div>
                              <div className="w-full overflow-hidden">
                                <div
                                  className="rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0f1722] shadow-xl overflow-hidden"
                                  style={{
                                    WebkitOverflowScrolling: "touch",
                                    width: "100%",
                                    maxWidth: "100%",
                                  }}
                                >
                                  <div className="overflow-x-auto overflow-y-auto max-h-[650px]">
                                    {filteredCheckins.length === 0 ? (
                                      <div className="p-8 text-center text-gray-600 dark:text-gray-400">
                                        No check-ins match your search.
                                      </div>
                                    ) : (
                                      <table className="min-w-max w-max text-sm border-separate border-spacing-0">
                                        <thead className="sticky top-0 z-20 bg-slate-100 dark:bg-[#182230] backdrop-blur">
                                          <tr>
                                            <th className="px-4 py-3 text-left border-b border-black/10 dark:border-white/10 text-gray-600 dark:text-gray-400 whitespace-nowrap uppercase tracking-wider text-xs font-semibold bg-slate-100 dark:bg-[#182230]">
                                              Staff Name
                                            </th>
                                            <th className="px-4 py-3 text-left border-b border-black/10 dark:border-white/10 text-gray-600 dark:text-gray-400 whitespace-nowrap uppercase tracking-wider text-xs font-semibold bg-slate-100 dark:bg-[#182230]">
                                              Resident Name
                                            </th>
                                            <th className="px-4 py-3 text-left border-b border-black/10 dark:border-white/10 text-gray-600 dark:text-gray-400 whitespace-nowrap uppercase tracking-wider text-xs font-semibold bg-slate-100 dark:bg-[#182230]">
                                              Date Submitted
                                            </th>
                                            <th className="px-4 py-3 text-left border-b border-black/10 dark:border-white/10 text-gray-600 dark:text-gray-400 whitespace-nowrap uppercase tracking-wider text-xs font-semibold bg-slate-100 dark:bg-[#182230]">
                                              Scheduled Time
                                            </th>
                                            <th className="px-4 py-3 text-left border-b border-black/10 dark:border-white/10 text-gray-600 dark:text-gray-400 whitespace-nowrap uppercase tracking-wider text-xs font-semibold bg-slate-100 dark:bg-[#182230]">
                                              Created At
                                            </th>
                                            <th className="px-4 py-3 text-left border-b border-black/10 dark:border-white/10 text-gray-600 dark:text-gray-400 whitespace-nowrap uppercase tracking-wider text-xs font-semibold bg-slate-100 dark:bg-[#182230]">
                                              Status
                                            </th>
                                            <th className="px-4 py-3 text-left border-b border-black/10 dark:border-white/10 text-gray-600 dark:text-gray-400 whitespace-nowrap uppercase tracking-wider text-xs font-semibold bg-slate-100 dark:bg-[#182230]">
                                              Wellbeing
                                            </th>
                                            <th className="px-4 py-3 text-left border-b border-black/10 dark:border-white/10 text-gray-600 dark:text-gray-400 whitespace-nowrap uppercase tracking-wider text-xs font-semibold bg-slate-100 dark:bg-[#182230]">
                                              Wellbeing Notes
                                            </th>
                                            <th className="px-4 py-3 text-left border-b border-black/10 dark:border-white/10 text-gray-600 dark:text-gray-400 whitespace-nowrap uppercase tracking-wider text-xs font-semibold bg-slate-100 dark:bg-[#182230]">
                                              Mood
                                            </th>
                                            <th className="px-4 py-3 text-left border-b border-black/10 dark:border-white/10 text-gray-600 dark:text-gray-400 whitespace-nowrap uppercase tracking-wider text-xs font-semibold bg-slate-100 dark:bg-[#182230]">
                                              Mood Notes
                                            </th>
                                            <th className="px-4 py-3 text-left border-b border-black/10 dark:border-white/10 text-gray-600 dark:text-gray-400 whitespace-nowrap uppercase tracking-wider text-xs font-semibold bg-slate-100 dark:bg-[#182230]">
                                              Hydration
                                            </th>
                                            <th className="px-4 py-3 text-left border-b border-black/10 dark:border-white/10 text-gray-600 dark:text-gray-400 whitespace-nowrap uppercase tracking-wider text-xs font-semibold bg-slate-100 dark:bg-[#182230]">
                                              Hydration Notes
                                            </th>
                                            <th className="px-4 py-3 text-left border-b border-black/10 dark:border-white/10 text-gray-600 dark:text-gray-400 whitespace-nowrap uppercase tracking-wider text-xs font-semibold bg-slate-100 dark:bg-[#182230]">
                                              Safety
                                            </th>
                                            <th className="px-4 py-3 text-left border-b border-black/10 dark:border-white/10 text-gray-600 dark:text-gray-400 whitespace-nowrap uppercase tracking-wider text-xs font-semibold bg-slate-100 dark:bg-[#182230]">
                                              Safety Notes
                                            </th>
                                            <th className="px-4 py-3 text-left border-b border-black/10 dark:border-white/10 text-gray-600 dark:text-gray-400 whitespace-nowrap uppercase tracking-wider text-xs font-semibold bg-slate-100 dark:bg-[#182230]">
                                              Engagement
                                            </th>
                                            <th className="px-4 py-3 text-left border-b border-black/10 dark:border-white/10 text-gray-600 dark:text-gray-400 whitespace-nowrap uppercase tracking-wider text-xs font-semibold bg-slate-100 dark:bg-[#182230]">
                                              Engagement Notes
                                            </th>
                                            <th className="px-4 py-3 text-left border-b border-black/10 dark:border-white/10 text-gray-600 dark:text-gray-400 whitespace-nowrap uppercase tracking-wider text-xs font-semibold bg-slate-100 dark:bg-[#182230]">
                                              Mobility
                                            </th>
                                            <th className="px-4 py-3 text-left border-b border-black/10 dark:border-white/10 text-gray-600 dark:text-gray-400 whitespace-nowrap uppercase tracking-wider text-xs font-semibold bg-slate-100 dark:bg-[#182230]">
                                              Mobility Notes
                                            </th>
                                            <th className="px-4 py-3 text-left border-b border-black/10 dark:border-white/10 text-gray-600 dark:text-gray-400 whitespace-nowrap uppercase tracking-wider text-xs font-semibold bg-slate-100 dark:bg-[#182230]">
                                              Medication
                                            </th>
                                            <th className="px-4 py-3 text-left border-b border-black/10 dark:border-white/10 text-gray-600 dark:text-gray-400 whitespace-nowrap uppercase tracking-wider text-xs font-semibold bg-slate-100 dark:bg-[#182230]">
                                              Medication Notes
                                            </th>
                                            <th className="px-4 py-3 text-left border-b border-black/10 dark:border-white/10 text-gray-600 dark:text-gray-400 whitespace-nowrap uppercase tracking-wider text-xs font-semibold bg-slate-100 dark:bg-[#182230]">
                                              Privacy
                                            </th>
                                            <th className="px-4 py-3 text-left border-b border-black/10 dark:border-white/10 text-gray-600 dark:text-gray-400 whitespace-nowrap uppercase tracking-wider text-xs font-semibold bg-slate-100 dark:bg-[#182230]">
                                              Privacy Notes
                                            </th>
                                            <th className="px-4 py-3 text-left border-b border-black/10 dark:border-white/10 text-gray-600 dark:text-gray-400 whitespace-nowrap uppercase tracking-wider text-xs font-semibold bg-slate-100 dark:bg-[#182230]">
                                              Support
                                            </th>
                                            <th className="px-4 py-3 text-left border-b border-black/10 dark:border-white/10 text-gray-600 dark:text-gray-400 whitespace-nowrap uppercase tracking-wider text-xs font-semibold bg-slate-100 dark:bg-[#182230]">
                                              Support Notes
                                            </th>
                                            <th className="px-4 py-3 text-left border-b border-white/10 text-gray-400 whitespace-nowrap uppercase tracking-wider text-xs font-semibold bg-slate-100 dark:bg-[#182230]">
                                              Safeguarding
                                            </th>
                                            <th className="px-4 py-3 text-left border-b border-white/10 text-gray-400 whitespace-nowrap uppercase tracking-wider text-xs font-semibold bg-slate-100 dark:bg-[#182230]">
                                              Safeguarding Notes
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {filteredCheckins.map((checkin) => (
                                            <tr
                                              key={checkin.id}
                                              className="even:bg-black/[0.02] dark:even:bg-white/[0.02] hover:bg-sky-400/5 transition-colors"
                                            >
                                              <td className="px-4 py-3 border-b border-black/10 dark:border-white/5 whitespace-nowrap align-top text-gray-800 dark:text-gray-100 hover:bg-sky-50 dark:hover:bg-sky-400/5 transition-colors">
                                                {checkin.staff_name || "-"}
                                              </td>
                                              <td className="px-4 py-3 border-b border-black/10 dark:border-white/5 whitespace-nowrap align-top text-gray-800 dark:text-gray-100 hover:bg-sky-50 dark:hover:bg-sky-400/5 transition-colors">
                                                {checkin.patient_name || "-"}
                                              </td>
                                              <td className="px-4 py-3 border-b border-black/10 dark:border-white/5 whitespace-nowrap align-top text-gray-800 dark:text-gray-100 hover:bg-sky-50 dark:hover:bg-sky-400/5 transition-colors">
                                                {formatUKTime(
                                                  checkin.submitted_at,
                                                )}
                                              </td>
                                              <td className="px-4 py-3 border-b border-black/10 dark:border-white/5 whitespace-nowrap align-top text-gray-800 dark:text-gray-100 hover:bg-sky-50 dark:hover:bg-sky-400/5 transition-colors">
                                                {formatUKTime(
                                                  checkin.scheduled_time,
                                                )}
                                              </td>
                                              <td className="px-4 py-3 border-b border-black/10 dark:border-white/5 whitespace-nowrap align-top text-gray-800 dark:text-gray-100 hover:bg-sky-50 dark:hover:bg-sky-400/5 transition-colors">
                                                {formatUKTime(
                                                  checkin.created_at,
                                                )}
                                              </td>
                                              <td className="px-4 py-3 border-b border-black/10 dark:border-white/5 whitespace-nowrap align-top text-gray-800 dark:text-gray-100 hover:bg-sky-50 dark:hover:bg-sky-400/5 transition-colors">
                                                {checkin.status || "-"}
                                              </td>
                                              <td className="px-4 py-3 border-b border-black/10 dark:border-white/5 whitespace-nowrap align-top text-gray-800 dark:text-gray-100 hover:bg-sky-50 dark:hover:bg-sky-400/5 transition-colors">
                                                {Array.isArray(
                                                  checkin.wellbeing,
                                                )
                                                  ? checkin.wellbeing.join(", ")
                                                  : "-"}
                                              </td>
                                              <td className="px-4 py-3 border-b border-black/10 dark:border-white/5 whitespace-nowrap align-top text-gray-800 dark:text-gray-100 hover:bg-sky-50 dark:hover:bg-sky-400/5 transition-colors">
                                                {checkin.wellbeing_notes || "-"}
                                              </td>
                                              <td className="px-4 py-3 border-b border-black/10 dark:border-white/5 whitespace-nowrap align-top text-gray-800 dark:text-gray-100 hover:bg-sky-50 dark:hover:bg-sky-400/5 transition-colors">
                                                {Array.isArray(checkin.mood)
                                                  ? checkin.mood.join(", ")
                                                  : "-"}
                                              </td>
                                              <td className="px-4 py-3 border-b border-black/10 dark:border-white/5 whitespace-nowrap align-top text-gray-800 dark:text-gray-100 hover:bg-sky-50 dark:hover:bg-sky-400/5 transition-colors">
                                                {checkin.mood_notes || "-"}
                                              </td>
                                              <td className="px-4 py-3 border-b border-black/10 dark:border-white/5 whitespace-nowrap align-top text-gray-800 dark:text-gray-100 hover:bg-sky-50 dark:hover:bg-sky-400/5 transition-colors">
                                                {Array.isArray(
                                                  checkin.hydration,
                                                )
                                                  ? checkin.hydration.join(", ")
                                                  : "-"}
                                              </td>
                                              <td className="px-4 py-3 border-b border-black/10 dark:border-white/5 whitespace-nowrap align-top text-gray-800 dark:text-gray-100 hover:bg-sky-50 dark:hover:bg-sky-400/5 transition-colors">
                                                {checkin.hydration_notes || "-"}
                                              </td>
                                              <td className="px-4 py-3 border-b border-black/10 dark:border-white/5 whitespace-nowrap align-top text-gray-800 dark:text-gray-100 hover:bg-sky-50 dark:hover:bg-sky-400/5 transition-colors">
                                                {Array.isArray(checkin.safety)
                                                  ? checkin.safety.join(", ")
                                                  : "-"}
                                              </td>
                                              <td className="px-4 py-3 border-b border-black/10 dark:border-white/5 whitespace-nowrap align-top text-gray-800 dark:text-gray-100 hover:bg-sky-50 dark:hover:bg-sky-400/5 transition-colors">
                                                {checkin.safety_notes || "-"}
                                              </td>
                                              <td className="px-4 py-3 border-b border-black/10 dark:border-white/5 whitespace-nowrap align-top text-gray-800 dark:text-gray-100 hover:bg-sky-50 dark:hover:bg-sky-400/5 transition-colors">
                                                {Array.isArray(
                                                  checkin.engagement,
                                                )
                                                  ? checkin.engagement.join(
                                                      ", ",
                                                    )
                                                  : "-"}
                                              </td>
                                              <td className="px-4 py-3 border-b border-black/10 dark:border-white/5 whitespace-nowrap align-top text-gray-800 dark:text-gray-100 hover:bg-sky-50 dark:hover:bg-sky-400/5 transition-colors">
                                                {checkin.engagement_notes ||
                                                  "-"}
                                              </td>
                                              <td className="px-4 py-3 border-b border-black/10 dark:border-white/5 whitespace-nowrap align-top text-gray-800 dark:text-gray-100 hover:bg-sky-50 dark:hover:bg-sky-400/5 transition-colors">
                                                {Array.isArray(checkin.mobility)
                                                  ? checkin.mobility.join(", ")
                                                  : "-"}
                                              </td>
                                              <td className="px-4 py-3 border-b border-black/10 dark:border-white/5 whitespace-nowrap align-top text-gray-800 dark:text-gray-100 hover:bg-sky-50 dark:hover:bg-sky-400/5 transition-colors">
                                                {checkin.mobility_notes || "-"}
                                              </td>
                                              <td className="px-4 py-3 border-b border-black/10 dark:border-white/5 whitespace-nowrap align-top text-gray-800 dark:text-gray-100 hover:bg-sky-50 dark:hover:bg-sky-400/5 transition-colors">
                                                {Array.isArray(
                                                  checkin.medication,
                                                )
                                                  ? checkin.medication.join(
                                                      ", ",
                                                    )
                                                  : "-"}
                                              </td>
                                              <td className="px-4 py-3 border-b border-black/10 dark:border-white/5 whitespace-nowrap align-top text-gray-800 dark:text-gray-100 hover:bg-sky-50 dark:hover:bg-sky-400/5 transition-colors">
                                                {checkin.medication_notes ||
                                                  "-"}
                                              </td>
                                              <td className="px-4 py-3 border-b border-black/10 dark:border-white/5 whitespace-nowrap align-top text-gray-800 dark:text-gray-100 hover:bg-sky-50 dark:hover:bg-sky-400/5 transition-colors">
                                                {Array.isArray(checkin.privacy)
                                                  ? checkin.privacy.join(", ")
                                                  : "-"}
                                              </td>
                                              <td className="px-4 py-3 border-b border-black/10 dark:border-white/5 whitespace-nowrap align-top text-gray-800 dark:text-gray-100 hover:bg-sky-50 dark:hover:bg-sky-400/5 transition-colors">
                                                {checkin.privacy_notes || "-"}
                                              </td>
                                              <td className="px-4 py-3 border-b border-black/10 dark:border-white/5 whitespace-nowrap align-top text-gray-800 dark:text-gray-100 hover:bg-sky-50 dark:hover:bg-sky-400/5 transition-colors">
                                                {Array.isArray(checkin.support)
                                                  ? checkin.support.join(", ")
                                                  : "-"}
                                              </td>
                                              <td className="px-4 py-3 border-b border-black/10 dark:border-white/5 whitespace-nowrap align-top text-gray-800 dark:text-gray-100 hover:bg-sky-50 dark:hover:bg-sky-400/5 transition-colors">
                                                {checkin.support_notes || "-"}
                                              </td>
                                              <td className="px-4 py-3 border-b border-white/5 whitespace-nowrap align-top text-gray-800 dark:text-gray-100 hover:bg-sky-50 dark:hover:bg-sky-400/5 transition-colors">
                                                {Array.isArray(
                                                  checkin.safeguarding,
                                                )
                                                  ? checkin.safeguarding.join(
                                                      ", ",
                                                    )
                                                  : "-"}
                                              </td>
                                              <td className="px-4 py-3 border-b border-white/5 whitespace-nowrap align-top text-gray-800 dark:text-gray-100 hover:bg-sky-50 dark:hover:bg-sky-400/5 transition-colors">
                                                {checkin.safeguarding_notes ||
                                                  "-"}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {activeTab === "handover" && (
                            <div className="space-y-6">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="text-2xl font-bold">
                                    Resident Handovers
                                  </h3>
                                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                                    Complete handover history for this resident
                                  </p>
                                </div>

                                <div className="px-5 py-3 rounded-2xl bg-sky-400/10 border border-sky-400/20">
                                  <p className="text-sky-300 text-sm">
                                    Total Handovers
                                  </p>
                                  <p className="text-2xl font-bold">
                                    {patientHandovers.length}
                                  </p>
                                </div>
                              </div>

                              {patientHandovers.length === 0 ? (
                                <div className="rounded-2xl bg-gray-50 dark:bg-[#0b1018] border border-black/10 dark:border-white/10 p-8 text-center text-gray-600 dark:text-gray-400">
                                  No handovers recorded for this resident.
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  {patientHandovers.map((handover) => (
                                    <div
                                      key={handover.id}
                                      className="rounded-2xl bg-gray-50 dark:bg-[#0b1018] border border-black/10 dark:border-white/10 p-6"
                                    >
                                      <div className="flex flex-wrap gap-6 mb-6 pb-4 border-b border-black/10 dark:border-white/10">
                                        <div>
                                          <p className="text-gray-600 dark:text-gray-400 text-xs">
                                            Submitted
                                          </p>
                                          <p>
                                            {formatUKTime(handover.created_at)}
                                          </p>
                                        </div>

                                        <div>
                                          <p className="text-gray-600 dark:text-gray-400 text-xs">
                                            Staff
                                          </p>
                                          <p>
                                            {handover.shifts?.staff_name || "-"}
                                          </p>
                                        </div>

                                        <div>
                                          <p className="text-gray-600 dark:text-gray-400 text-xs">
                                            Shift Date
                                          </p>
                                          <p>
                                            {handover.shifts?.shift_date || "-"}
                                          </p>
                                        </div>

                                        <div>
                                          <p className="text-gray-600 dark:text-gray-400 text-xs">
                                            Shift Time
                                          </p>
                                          <p>
                                            {handover.shifts?.start_time || "-"}{" "}
                                            - {handover.shifts?.end_time || "-"}
                                          </p>
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                          <p className="text-sky-300 text-sm mb-1">
                                            Wellbeing Summary
                                          </p>
                                          <p>
                                            {handover.wellbeing_summary || "-"}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-sky-300 text-sm mb-1">
                                            Care Summary
                                          </p>
                                          <p>{handover.care_summary || "-"}</p>
                                        </div>
                                        <div>
                                          <p className="text-sky-300 text-sm mb-1">
                                            Concerns & Incidents
                                          </p>
                                          <p>
                                            {handover.concerns_incidents || "-"}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-sky-300 text-sm mb-1">
                                            Escalations
                                          </p>
                                          <p>{handover.escalations || "-"}</p>
                                        </div>
                                        <div>
                                          <p className="text-sky-300 text-sm mb-1">
                                            Family Communication
                                          </p>
                                          <p>
                                            {handover.family_communication ||
                                              "-"}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-sky-300 text-sm mb-1">
                                            Baseline Changes
                                          </p>
                                          <p>
                                            {handover.baseline_changes || "-"}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-sky-300 text-sm mb-1">
                                            Recommendations
                                          </p>
                                          <p>
                                            {handover.recommendations || "-"}
                                          </p>
                                        </div>
                                      </div>

                                      <div className="mt-4 pt-4 border-t border-black/10 dark:border-white/10">
                                        <p className="text-sky-300 text-sm mb-1">
                                          Detailed Notes
                                        </p>
                                        <p>{handover.detailed_notes || "-"}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-gray-600 dark:text-gray-400">
                          Select a resident
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
