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
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", session.user.id)
        .single();

      if (profile?.full_name) {
        setAdminName(profile.full_name);
      }
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
      .order("full_name");

    if (!error && data) {
      setPatients(data);

      if (data.length > 0) {
        setSelectedPatient(data[0]);
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

      // Load handovers for the patient
      const { data: handovers } = await supabase
        .from("handovers")
        .select(
          `
          *,
          shifts!handovers_shift_id_fkey (
            patient_id,
            shift_date,
            start_time,
            end_time,
            staff_name
          )
        `,
        )
        .eq("shifts.patient_id", selectedPatient.id)
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

  return (
    <div className="min-h-screen bg-[#050a11] text-white">
      <AdminSidebar onLogout={handleLogout} />

      <div className="lg:ml-[280px]">
        <Navbar name={adminName} role="Admin" />

        <div className="pt-32 px-6 pb-6">
          <div className="max-w-[1600px] mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold tracking-tight">
                  Patient Management
                </h1>
                <p className="text-gray-400 mt-2">
                  View patient profiles, care activity and assigned staff.
                </p>
              </div>

              <div className="px-5 py-3 rounded-2xl bg-sky-400/10 border border-sky-400/20">
                <p className="text-sky-300 text-sm">Total Patients</p>
                <p className="text-2xl font-bold">{patients.length}</p>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-[#0b1018] p-8 shadow-2xl">
              {loading ? (
                <p className="text-gray-400">Loading patients...</p>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-[200px_1fr] gap-6">
                  <div className="sticky top-[120px] rounded-[18px] border border-white/10 bg-[#11161d] p-3 h-[calc(100vh-160px)]">
                    <h3 className="text-base font-semibold mb-3">Patients</h3>
                    <div className="space-y-2 h-full overflow-y-auto pr-2">
                      {patients.map((patient) => (
                        <button
                          key={patient.id}
                          onClick={() => setSelectedPatient(patient)}
                          className={`w-full text-left p-2.5 rounded-xl transition-all border text-sm ${
                            selectedPatient?.id === patient.id
                              ? "bg-sky-400 text-black border-sky-300 shadow-lg"
                              : "bg-[#0b1018] border-white/5 hover:bg-[#161d28] hover:border-sky-400/20"
                          }`}
                        >
                          {patient.full_name || "Unnamed Patient"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-6">
                    <div className="rounded-[24px] border border-white/10 bg-[#11161d] p-8 overflow-visible">
                      {selectedPatient ? (
                        <>
                          <div className="flex items-center justify-between mb-8">
                            <div>
                              <h2 className="text-3xl font-bold">
                                {selectedPatient.full_name}
                              </h2>
                              <p className="text-gray-400 mt-1">
                                Patient Profile
                              </p>
                            </div>
                            <div className="flex gap-3">
                              {!isEditing ? (
                                <button
                                  onClick={() => setIsEditing(true)}
                                  className="h-[44px] px-5 rounded-xl bg-sky-400 text-black font-medium hover:opacity-90 transition-all"
                                >
                                  Edit Patient
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

                          <div className="sticky top-[120px] z-20 bg-[#11161d] border-b border-white/10 mb-8 pb-4">
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
                                      : "bg-[#0b1018] text-gray-400 hover:text-white"
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
                                  className="rounded-2xl bg-[#0b1018] border border-white/10 p-5"
                                >
                                  <p className="text-gray-400 text-sm mb-2">
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
                                        className="w-full bg-[#11161d] border border-white/10 rounded-xl px-4 py-3"
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
                                        className="w-full bg-[#11161d] border border-white/10 rounded-xl px-4 py-3"
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
                                        className="w-full bg-[#11161d] border border-white/10 rounded-xl px-4 py-3"
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

                              <div className="rounded-2xl bg-[#0b1018] border border-white/10 p-5 md:col-span-2">
                                <p className="text-gray-400 text-sm mb-2">
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
                                    className="w-full bg-[#11161d] border border-white/10 rounded-xl px-4 py-3 min-h-[120px]"
                                  />
                                ) : (
                                  <p>
                                    {selectedPatient.patient_details?.address ||
                                      "-"}
                                  </p>
                                )}
                              </div>

                              <div className="rounded-2xl bg-[#0b1018] border border-white/10 p-5 md:col-span-2">
                                <p className="text-gray-400 text-sm mb-2">
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
                                    className="w-full bg-[#11161d] border border-white/10 rounded-xl px-4 py-3 min-h-[120px]"
                                  />
                                ) : (
                                  <p>
                                    {selectedPatient.patient_details
                                      ?.medical_conditions || "-"}
                                  </p>
                                )}
                              </div>

                              {/* Abilities */}
                              <div className="rounded-2xl bg-[#0b1018] border border-white/10 p-5 md:col-span-2">
                                <p className="text-gray-400 text-sm mb-2">
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
                                    className="w-full bg-[#11161d] border border-white/10 rounded-xl px-4 py-3 min-h-[120px]"
                                  />
                                ) : (
                                  <p>
                                    {selectedPatient.patient_details
                                      ?.abilities || "-"}
                                  </p>
                                )}
                              </div>

                              {/* Communication Needs */}
                              <div className="rounded-2xl bg-[#0b1018] border border-white/10 p-5 md:col-span-2">
                                <p className="text-gray-400 text-sm mb-2">
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
                                    className="w-full bg-[#11161d] border border-white/10 rounded-xl px-4 py-3 min-h-[120px]"
                                  />
                                ) : (
                                  <p>
                                    {selectedPatient.patient_details
                                      ?.communication_needs || "-"}
                                  </p>
                                )}
                              </div>

                              {/* Mobility Status */}
                              <div className="rounded-2xl bg-[#0b1018] border border-white/10 p-5 md:col-span-2">
                                <p className="text-gray-400 text-sm mb-2">
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
                                    className="w-full bg-[#11161d] border border-white/10 rounded-xl px-4 py-3 min-h-[120px]"
                                  />
                                ) : (
                                  <p>
                                    {selectedPatient.patient_details
                                      ?.mobility_status || "-"}
                                  </p>
                                )}
                              </div>

                              <div className="rounded-2xl bg-[#0b1018] border border-white/10 p-5 md:col-span-2">
                                <p className="text-gray-400 text-sm mb-2">
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
                                    className="w-full bg-[#11161d] border border-white/10 rounded-xl px-4 py-3 min-h-[120px]"
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
                                    Patient Check-ins
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
                              <div className="w-full">
                                <div
                                  className="rounded-2xl border border-white/10 bg-[#0b1018] overflow-x-scroll overflow-y-hidden pb-4"
                                  style={{
                                    WebkitOverflowScrolling: "touch",
                                    width: "100%",
                                    maxWidth: "100%",
                                  }}
                                >
                                  {patientCheckins.length === 0 ? (
                                    <div className="p-8 text-center text-gray-400">
                                      No check-ins recorded for this patient.
                                    </div>
                                  ) : (
                                    <table
                                      className="text-sm"
                                      style={{ minWidth: "5000px" }}
                                    >
                                      <thead>
                                        <tr>
                                          <th className="px-4 py-3 text-left border-b border-white/10 text-gray-400 whitespace-nowrap">
                                            Staff Name
                                          </th>
                                          <th className="px-4 py-3 text-left border-b border-white/10 text-gray-400 whitespace-nowrap">
                                            Staff ID
                                          </th>
                                          <th className="px-4 py-3 text-left border-b border-white/10 text-gray-400 whitespace-nowrap">
                                            Shift ID
                                          </th>
                                          <th className="px-4 py-3 text-left border-b border-white/10 text-gray-400 whitespace-nowrap">
                                            Patient Name
                                          </th>
                                          <th className="px-4 py-3 text-left border-b border-white/10 text-gray-400 whitespace-nowrap">
                                            Date Submitted
                                          </th>
                                          <th className="px-4 py-3 text-left border-b border-white/10 text-gray-400 whitespace-nowrap">
                                            Scheduled Time
                                          </th>
                                          <th className="px-4 py-3 text-left border-b border-white/10 text-gray-400 whitespace-nowrap">
                                            Created At
                                          </th>
                                          <th className="px-4 py-3 text-left border-b border-white/10 text-gray-400 whitespace-nowrap">
                                            Status
                                          </th>
                                          <th className="px-4 py-3 text-left border-b border-white/10 text-gray-400 whitespace-nowrap">
                                            Wellbeing
                                          </th>
                                          <th className="px-4 py-3 text-left border-b border-white/10 text-gray-400 whitespace-nowrap">
                                            Wellbeing Notes
                                          </th>
                                          <th className="px-4 py-3 text-left border-b border-white/10 text-gray-400 whitespace-nowrap">
                                            Mood
                                          </th>
                                          <th className="px-4 py-3 text-left border-b border-white/10 text-gray-400 whitespace-nowrap">
                                            Mood Notes
                                          </th>
                                          <th className="px-4 py-3 text-left border-b border-white/10 text-gray-400 whitespace-nowrap">
                                            Hydration
                                          </th>
                                          <th className="px-4 py-3 text-left border-b border-white/10 text-gray-400 whitespace-nowrap">
                                            Hydration Notes
                                          </th>
                                          <th className="px-4 py-3 text-left border-b border-white/10 text-gray-400 whitespace-nowrap">
                                            Safety
                                          </th>
                                          <th className="px-4 py-3 text-left border-b border-white/10 text-gray-400 whitespace-nowrap">
                                            Safety Notes
                                          </th>
                                          <th className="px-4 py-3 text-left border-b border-white/10 text-gray-400 whitespace-nowrap">
                                            Engagement
                                          </th>
                                          <th className="px-4 py-3 text-left border-b border-white/10 text-gray-400 whitespace-nowrap">
                                            Engagement Notes
                                          </th>
                                          <th className="px-4 py-3 text-left border-b border-white/10 text-gray-400 whitespace-nowrap">
                                            Mobility
                                          </th>
                                          <th className="px-4 py-3 text-left border-b border-white/10 text-gray-400 whitespace-nowrap">
                                            Mobility Notes
                                          </th>
                                          <th className="px-4 py-3 text-left border-b border-white/10 text-gray-400 whitespace-nowrap">
                                            Medication
                                          </th>
                                          <th className="px-4 py-3 text-left border-b border-white/10 text-gray-400 whitespace-nowrap">
                                            Medication Notes
                                          </th>
                                          <th className="px-4 py-3 text-left border-b border-white/10 text-gray-400 whitespace-nowrap">
                                            Privacy
                                          </th>
                                          <th className="px-4 py-3 text-left border-b border-white/10 text-gray-400 whitespace-nowrap">
                                            Privacy Notes
                                          </th>
                                          <th className="px-4 py-3 text-left border-b border-white/10 text-gray-400 whitespace-nowrap">
                                            Support
                                          </th>
                                          <th className="px-4 py-3 text-left border-b border-white/10 text-gray-400 whitespace-nowrap">
                                            Support Notes
                                          </th>
                                          <th className="px-4 py-3 text-left border-b border-white/10 text-gray-400 whitespace-nowrap">
                                            Safeguarding
                                          </th>
                                          <th className="px-4 py-3 text-left border-b border-white/10 text-gray-400 whitespace-nowrap">
                                            Safeguarding Notes
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {patientCheckins.map((checkin) => (
                                          <tr key={checkin.id}>
                                            <td className="px-4 py-3 border-b border-white/5 whitespace-nowrap align-top">
                                              {checkin.staff_name || "-"}
                                            </td>
                                            <td className="px-4 py-3 border-b border-white/5 whitespace-nowrap align-top">
                                              {checkin.staff_id || "-"}
                                            </td>
                                            <td className="px-4 py-3 border-b border-white/5 whitespace-nowrap align-top">
                                              {checkin.shift_id || "-"}
                                            </td>
                                            <td className="px-4 py-3 border-b border-white/5 whitespace-nowrap align-top">
                                              {checkin.patient_name || "-"}
                                            </td>
                                            <td className="px-4 py-3 border-b border-white/5 whitespace-nowrap align-top">
                                              {checkin.submitted_at
                                                ? new Date(
                                                    checkin.submitted_at,
                                                  ).toLocaleString()
                                                : "-"}
                                            </td>
                                            <td className="px-4 py-3 border-b border-white/5 whitespace-nowrap align-top">
                                              {checkin.scheduled_time
                                                ? new Date(
                                                    checkin.scheduled_time,
                                                  ).toLocaleString()
                                                : "-"}
                                            </td>
                                            <td className="px-4 py-3 border-b border-white/5 whitespace-nowrap align-top">
                                              {checkin.created_at
                                                ? new Date(
                                                    checkin.created_at,
                                                  ).toLocaleString()
                                                : "-"}
                                            </td>
                                            <td className="px-4 py-3 border-b border-white/5 whitespace-nowrap align-top">
                                              {checkin.status || "-"}
                                            </td>
                                            <td className="px-4 py-3 border-b border-white/5 whitespace-nowrap align-top">
                                              {Array.isArray(checkin.wellbeing)
                                                ? checkin.wellbeing.join(", ")
                                                : "-"}
                                            </td>
                                            <td className="px-4 py-3 border-b border-white/5 whitespace-nowrap align-top">
                                              {checkin.wellbeing_notes || "-"}
                                            </td>
                                            <td className="px-4 py-3 border-b border-white/5 whitespace-nowrap align-top">
                                              {Array.isArray(checkin.mood)
                                                ? checkin.mood.join(", ")
                                                : "-"}
                                            </td>
                                            <td className="px-4 py-3 border-b border-white/5 whitespace-nowrap align-top">
                                              {checkin.mood_notes || "-"}
                                            </td>
                                            <td className="px-4 py-3 border-b border-white/5 whitespace-nowrap align-top">
                                              {Array.isArray(checkin.hydration)
                                                ? checkin.hydration.join(", ")
                                                : "-"}
                                            </td>
                                            <td className="px-4 py-3 border-b border-white/5 whitespace-nowrap align-top">
                                              {checkin.hydration_notes || "-"}
                                            </td>
                                            <td className="px-4 py-3 border-b border-white/5 whitespace-nowrap align-top">
                                              {Array.isArray(checkin.safety)
                                                ? checkin.safety.join(", ")
                                                : "-"}
                                            </td>
                                            <td className="px-4 py-3 border-b border-white/5 whitespace-nowrap align-top">
                                              {checkin.safety_notes || "-"}
                                            </td>
                                            <td className="px-4 py-3 border-b border-white/5 whitespace-nowrap align-top">
                                              {Array.isArray(checkin.engagement)
                                                ? checkin.engagement.join(", ")
                                                : "-"}
                                            </td>
                                            <td className="px-4 py-3 border-b border-white/5 whitespace-nowrap align-top">
                                              {checkin.engagement_notes || "-"}
                                            </td>
                                            <td className="px-4 py-3 border-b border-white/5 whitespace-nowrap align-top">
                                              {Array.isArray(checkin.mobility)
                                                ? checkin.mobility.join(", ")
                                                : "-"}
                                            </td>
                                            <td className="px-4 py-3 border-b border-white/5 whitespace-nowrap align-top">
                                              {checkin.mobility_notes || "-"}
                                            </td>
                                            <td className="px-4 py-3 border-b border-white/5 whitespace-nowrap align-top">
                                              {Array.isArray(checkin.medication)
                                                ? checkin.medication.join(", ")
                                                : "-"}
                                            </td>
                                            <td className="px-4 py-3 border-b border-white/5 whitespace-nowrap align-top">
                                              {checkin.medication_notes || "-"}
                                            </td>
                                            <td className="px-4 py-3 border-b border-white/5 whitespace-nowrap align-top">
                                              {Array.isArray(checkin.privacy)
                                                ? checkin.privacy.join(", ")
                                                : "-"}
                                            </td>
                                            <td className="px-4 py-3 border-b border-white/5 whitespace-nowrap align-top">
                                              {checkin.privacy_notes || "-"}
                                            </td>
                                            <td className="px-4 py-3 border-b border-white/5 whitespace-nowrap align-top">
                                              {Array.isArray(checkin.support)
                                                ? checkin.support.join(", ")
                                                : "-"}
                                            </td>
                                            <td className="px-4 py-3 border-b border-white/5 whitespace-nowrap align-top">
                                              {checkin.support_notes || "-"}
                                            </td>
                                            <td className="px-4 py-3 border-b border-white/5 whitespace-nowrap align-top">
                                              {Array.isArray(
                                                checkin.safeguarding,
                                              )
                                                ? checkin.safeguarding.join(
                                                    ", ",
                                                  )
                                                : "-"}
                                            </td>
                                            <td className="px-4 py-3 border-b border-white/5 whitespace-nowrap align-top">
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
                          )}

                          {activeTab === "handover" && (
                            <div className="space-y-6">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="text-2xl font-bold">
                                    Patient Handovers
                                  </h3>
                                  <p className="text-gray-400 mt-1">
                                    Complete handover history for this patient
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
                                <div className="rounded-2xl bg-[#0b1018] border border-white/10 p-8 text-center text-gray-400">
                                  No handovers recorded for this patient.
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  {patientHandovers.map((handover) => (
                                    <div
                                      key={handover.id}
                                      className="rounded-2xl bg-[#0b1018] border border-white/10 p-6"
                                    >
                                      <div className="flex flex-wrap gap-6 mb-6 pb-4 border-b border-white/10">
                                        <div>
                                          <p className="text-gray-400 text-xs">
                                            Submitted
                                          </p>
                                          <p>
                                            {handover.created_at
                                              ? new Date(
                                                  handover.created_at,
                                                ).toLocaleString()
                                              : "-"}
                                          </p>
                                        </div>

                                        <div>
                                          <p className="text-gray-400 text-xs">
                                            Staff
                                          </p>
                                          <p>
                                            {handover.shifts?.staff_name || "-"}
                                          </p>
                                        </div>

                                        <div>
                                          <p className="text-gray-400 text-xs">
                                            Shift Date
                                          </p>
                                          <p>
                                            {handover.shifts?.shift_date || "-"}
                                          </p>
                                        </div>

                                        <div>
                                          <p className="text-gray-400 text-xs">
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

                                      <div className="mt-4 pt-4 border-t border-white/10">
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
                        <p className="text-gray-400">Select a patient</p>
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
