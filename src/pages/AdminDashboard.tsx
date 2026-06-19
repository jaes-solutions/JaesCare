import { useEffect, useState } from "react";
import {
  Users,
  UserPlus,
  ClipboardList,
  ShieldCheck,
  Clock3,
  FileText,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Sidebar from "../components/AdminSidebar";
import Navbar from "../components/Navbar";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState("");
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("staff");
  const [staffList, setStaffList] = useState<any[]>([]);
  const [patientList, setPatientList] = useState<any[]>([]);
  const [shiftList, setShiftList] = useState<any[]>([]);
  const [checkinCount, setCheckinCount] = useState(0);

  const [selectedStaff, setSelectedStaff] = useState("");
  const [selectedPatient, setSelectedPatient] = useState("");
  const [shiftDate, setShiftDate] = useState("");
  const [shiftStart, setShiftStart] = useState("");
  const [shiftEnd, setShiftEnd] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const todayShifts = shiftList.filter((shift) => shift.shift_date === today);

  const activeShifts = todayShifts.filter(
    (shift) => (shift.status || "").toLowerCase() === "active",
  );

  const completedShifts = todayShifts.filter(
    (shift) => (shift.status || "").toLowerCase() === "completed",
  );

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        navigate("/login");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (error || !profile || profile.role !== "admin") {
        navigate("/login");
        return;
      }

      setAdminName(profile.full_name || "Admin");
      setOrganizationId(profile.organization_id || null);
      // Only get profiles belonging to this admin's organization
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, role")
        .eq("organization_id", profile.organization_id)
        .order("full_name", { ascending: true });

      if (profilesError) {
        console.error(profilesError);
        return;
      }

      const staffProfiles = (profiles || []).filter(
        (item) => item.role?.trim().toLowerCase() === "staff",
      );

      const patientProfiles = (profiles || []).filter(
        (item) => item.role?.trim().toLowerCase() === "patient",
      );

      setStaffList(staffProfiles);
      setPatientList(patientProfiles);

      // Only get shifts belonging to this admin's organization
      const { data: shifts, error: shiftsError } = await supabase
        .from("shifts")
        .select("*")
        .eq("organization_id", profile.organization_id)
        .order("shift_date", { ascending: false })
        .order("start_time", { ascending: false });

      if (shiftsError) {
        console.error(shiftsError);
      } else {
        setShiftList(shifts || []);
      }

      // Only count checkins belonging to this admin's organization
      const { count: totalCheckins, error: checkinsError } = await supabase
        .from("checkins")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", profile.organization_id);

      if (checkinsError) {
        console.error(checkinsError);
      } else {
        setCheckinCount(totalCheckins || 0);
      }
    } catch (err) {
      console.error(err);
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const scrollToCreateAccount = () => {
    document
      .getElementById("create-account-section")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToCreateShift = () => {
    document
      .getElementById("create-shift-section")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToShifts = () => {
    document
      .getElementById("all-shifts-section")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const createShift = async () => {
    try {
      if (!organizationId) {
        alert("No organization assigned to this admin");
        return;
      }
      const staff = staffList.find((s) => s.id === selectedStaff);
      const patient = patientList.find((p) => p.id === selectedPatient);

      if (!staff || !patient || !shiftDate || !shiftStart || !shiftEnd) {
        alert("Please fill all shift details");
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const selectedDate = new Date(`${shiftDate}T00:00:00`);

      let shiftStatus = "active";

      if (selectedDate > today) {
        shiftStatus = "upcoming";
      } else if (selectedDate < today) {
        shiftStatus = "completed";
      }

      const { error } = await supabase.from("shifts").insert({
        patient_id: patient.id,
        patient_name: patient.full_name,
        staff_id: staff.id,
        staff_name: staff.full_name,
        shift_date: shiftDate,
        start_time: shiftStart,
        end_time: shiftEnd,
        status: shiftStatus,
        organization_id: organizationId,
      });

      if (error) {
        console.error(error);
        alert("Failed to create shift");
        return;
      }

      alert("Shift created successfully");
      await checkAdminAccess();

      setSelectedStaff("");
      setSelectedPatient("");
      setShiftDate("");
      setShiftStart("");
      setShiftEnd("");
    } catch (err) {
      console.error(err);
    }
  };
  const createUser = async () => {
    try {
      if (!organizationId) {
        alert("No organization assigned to this admin");
        return;
      }

      const { count: organizationUsers } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId);

      if ((organizationUsers || 0) >= 5) {
        alert("User limit reached. This organisation can only have 5 users.");
        return;
      }

      const session = await supabase.auth.getSession();

      if (!session.data.session) {
        alert("No active session found");
        return;
      }

      const response = await fetch(
        "https://htsyturpzsuqgfssluhu.supabase.co/functions/v1/create-user",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.data.session.access_token}`,
          },
          // Pass the logged-in admin's organization_id so the Edge Function can save it on the new profile record.
          body: JSON.stringify({
            full_name: newName,
            email: newEmail,
            password: newPassword,
            role: newRole,
            organization_id: organizationId,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to create user");
        return;
      }

      alert("User created successfully");

      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setNewRole("staff");

      await checkAdminAccess();
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#03060b] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 rounded-full border-4 border-sky-200 dark:border-sky-900" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-sky-400 border-r-emerald-300 animate-spin" />
            <div className="absolute inset-3 rounded-full border-4 border-transparent border-b-sky-300 border-l-emerald-400 animate-spin [animation-direction:reverse] [animation-duration:1.5s]" />
          </div>

          <div className="text-center">
            <h2 className="text-xl font-semibold text-black dark:text-white mb-2">
              Preparing Dashboard
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Loading staff, shifts and system data...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#03060b] text-black dark:text-white flex overflow-x-hidden transition-colors duration-300">
      <Sidebar onLogout={handleLogout} />
      {/* MAIN CONTENT */}
      <div className="flex-1 w-full min-w-0 overflow-y-auto overflow-x-hidden lg:ml-[245px] min-h-screen bg-gray-50 dark:bg-[#03060b] pt-[78px]">
        <Navbar name={adminName} />
        {/* CONTENT */}
        <main className="w-full p-3 sm:p-5 lg:p-7 overflow-hidden">
          {/* HERO */}
          <div className="rounded-[20px] sm:rounded-[24px] border border-black/10 dark:border-white/10 bg-white dark:bg-[#070c14] p-4 sm:p-6 mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                <div className="w-24 h-24 rounded-full bg-sky-400/10 border border-sky-400/20 flex items-center justify-center">
                  <ShieldCheck size={42} className="text-sky-300" />
                </div>

                <div>
                  <p className="text-sky-300 text-[12px] mb-1.5">
                    System Status
                  </p>

                  <h2 className="text-[30px] font-semibold leading-none">
                    Active
                  </h2>

                  <p className="text-gray-600 dark:text-gray-500 text-[13px] mt-2">
                    All systems operational
                  </p>
                </div>
              </div>

              <div className="lg:border-l lg:border-black/10 dark:lg:border-white/10 lg:px-8">
                <div className="w-20 h-20 rounded-full bg-emerald-300/10 border border-emerald-300/20 flex items-center justify-center mb-4">
                  <Users size={34} className="text-emerald-300" />
                </div>

                <p className="text-gray-600 dark:text-gray-500 text-[13px] mb-1.5">
                  Total Active Staff
                </p>

                <h2 className="text-[30px] font-semibold leading-none text-emerald-300">
                  {staffList.length}
                </h2>
              </div>

              <div className="lg:border-l lg:border-black/10 dark:lg:border-white/10 lg:px-8">
                <div className="w-20 h-20 rounded-full bg-sky-400/10 border border-sky-400/20 flex items-center justify-center mb-4">
                  <Clock3 size={34} className="text-sky-300" />
                </div>

                <p className="text-gray-600 dark:text-gray-500 text-[13px] mb-1.5">
                  Active Check-ins
                </p>

                <h2 className="text-[30px] font-semibold leading-none">
                  {checkinCount}
                </h2>
              </div>
            </div>
          </div>

          {/* GRID */}
          <div className="grid grid-cols-1 xl:grid-cols-[1.5fr,0.9fr] gap-6">
            {/* LEFT */}
            <div className="space-y-8">
              {/* CREATE USER */}
              <div
                id="create-account-section"
                className="rounded-[20px] sm:rounded-[24px] border border-black/10 dark:border-white/10 bg-white dark:bg-[#070c14] p-4 sm:p-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-[20px] sm:text-[24px] font-semibold mb-1.5">
                      Create Account
                    </h2>

                    <p className="text-gray-600 dark:text-gray-500 text-[13px]">
                      Create staff and patient accounts securely.
                    </p>
                  </div>

                  <button className="h-[42px] px-4 rounded-[16px] border border-sky-400/20 text-sky-300 bg-sky-400/10">
                    User Management
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full h-[50px] rounded-[16px] border border-black/10 dark:border-white/10 bg-gray-100 dark:bg-[#11161d]/90 px-4 text-black dark:text-white outline-none"
                  />

                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Email Address"
                    className="w-full h-[50px] rounded-[16px] border border-black/10 dark:border-white/10 bg-gray-100 dark:bg-[#11161d]/90 px-4 text-black dark:text-white outline-none"
                  />

                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Temporary Password"
                    className="w-full h-[50px] rounded-[16px] border border-black/10 dark:border-white/10 bg-gray-100 dark:bg-[#11161d]/90 px-4 text-black dark:text-white outline-none"
                  />

                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full h-[50px] rounded-[16px] border border-black/10 dark:border-white/10 bg-gray-100 dark:bg-[#11161d]/90 px-4 text-black dark:text-white outline-none"
                  >
                    <option value="staff">Staff</option>
                    <option value="patient">Patient</option>
                  </select>
                </div>

                <button
                  onClick={createUser}
                  className="mt-6 w-full sm:w-auto h-[50px] px-8 rounded-[16px] bg-gradient-to-r from-sky-400 to-emerald-300 text-black font-semibold"
                >
                  Create Account
                </button>
              </div>

              <div
                id="create-shift-section"
                className="rounded-[20px] sm:rounded-[24px] border border-black/10 dark:border-white/10 bg-white dark:bg-[#070c14] p-4 sm:p-6"
              >
                <h2 className="text-[20px] sm:text-[24px] font-semibold mb-6">
                  Create Shift
                </h2>

                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  Select a staff member, patient, date and shift times using the
                  calendar and time pickers below.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select
                    value={selectedStaff}
                    onChange={(e) => setSelectedStaff(e.target.value)}
                    className="h-[50px] rounded-[16px] border border-black/10 dark:border-white/10 bg-gray-100 dark:bg-[#11161d] px-4"
                  >
                    <option value="">Select Staff</option>
                    {staffList.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.full_name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedPatient}
                    onChange={(e) => setSelectedPatient(e.target.value)}
                    className="h-[50px] rounded-[16px] border border-black/10 dark:border-white/10 bg-gray-100 dark:bg-[#11161d] px-4"
                  >
                    <option value="">Select Patient</option>
                    {patientList.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.full_name}
                      </option>
                    ))}
                  </select>

                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Shift Date
                    </label>
                    <input
                      type="date"
                      value={shiftDate}
                      onChange={(e) => setShiftDate(e.target.value)}
                      onClick={(e) => {
                        const input = e.currentTarget as HTMLInputElement & {
                          showPicker?: () => void;
                        };
                        input.showPicker?.();
                      }}
                      onFocus={(e) => {
                        const input = e.currentTarget as HTMLInputElement & {
                          showPicker?: () => void;
                        };
                        input.showPicker?.();
                      }}
                      className="w-full h-[56px] rounded-[16px] border border-sky-400/30 bg-gray-100 dark:bg-[#11161d] px-4 text-black dark:text-sky-300 font-semibold cursor-pointer dark:[color-scheme:dark] [color-scheme:light]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={shiftStart}
                      onChange={(e) => setShiftStart(e.target.value)}
                      onClick={(e) => {
                        const input = e.currentTarget as HTMLInputElement & {
                          showPicker?: () => void;
                        };
                        input.showPicker?.();
                      }}
                      onFocus={(e) => {
                        const input = e.currentTarget as HTMLInputElement & {
                          showPicker?: () => void;
                        };
                        input.showPicker?.();
                      }}
                      className="w-full h-[56px] rounded-[16px] border border-emerald-300/30 bg-gray-100 dark:bg-[#11161d] px-4 text-black dark:text-emerald-300 font-semibold cursor-pointer dark:[color-scheme:dark] [color-scheme:light]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={shiftEnd}
                      onChange={(e) => setShiftEnd(e.target.value)}
                      onClick={(e) => {
                        const input = e.currentTarget as HTMLInputElement & {
                          showPicker?: () => void;
                        };
                        input.showPicker?.();
                      }}
                      onFocus={(e) => {
                        const input = e.currentTarget as HTMLInputElement & {
                          showPicker?: () => void;
                        };
                        input.showPicker?.();
                      }}
                      className="w-full h-[56px] rounded-[16px] border border-yellow-400/30 bg-gray-100 dark:bg-[#11161d] px-4 text-black dark:text-yellow-300 font-semibold cursor-pointer dark:[color-scheme:dark] [color-scheme:light]"
                    />
                  </div>
                </div>

                <button
                  onClick={createShift}
                  className="mt-6 w-full sm:w-auto h-[50px] px-8 rounded-[16px] bg-gradient-to-r from-sky-400 to-emerald-300 text-black font-semibold"
                >
                  Create Shift
                </button>
              </div>

              {/* SHIFTS LIST */}
              <div
                id="all-shifts-section"
                className="rounded-[20px] sm:rounded-[24px] border border-black/10 dark:border-white/10 bg-white dark:bg-[#070c14] p-4 sm:p-6"
              >
                <h2 className="text-[20px] sm:text-[24px] font-semibold mb-6">
                  All Shifts
                </h2>

                <div className="space-y-4">
                  {shiftList.length === 0 && (
                    <p className="text-gray-600 dark:text-gray-500">
                      No shifts created yet
                    </p>
                  )}

                  {shiftList.map((shift) => {
                    const formattedDate = new Date(
                      `${shift.shift_date}T00:00:00`,
                    ).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    });

                    return (
                      <div
                        key={shift.id}
                        className="rounded-[20px] border border-black/10 dark:border-white/10 bg-white dark:bg-[#0c1118] p-5 sm:p-6"
                      >
                        <div className="space-y-5">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-black/10 dark:border-white/10 pb-4">
                            <div>
                              <h3 className="text-black dark:text-white text-[20px] font-semibold">
                                {formattedDate}
                              </h3>
                              <p className="text-gray-600 dark:text-gray-500 text-sm mt-1">
                                Scheduled Care Shift
                              </p>
                            </div>
                            <div className="text-left sm:text-right space-y-1">
                              <p className="text-sky-300 font-medium">
                                <span className="text-gray-600 dark:text-gray-400">
                                  Staff:
                                </span>{" "}
                                {shift.staff_name}
                              </p>
                              <p className="text-emerald-300 text-sm">
                                <span className="text-gray-600 dark:text-gray-400">
                                  Patient:
                                </span>{" "}
                                {shift.patient_name}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="rounded-[14px] border border-blue-200 dark:border-[#1e3a52] bg-blue-50 dark:bg-[#0d1722] px-4 py-3">
                              <p className="text-[#79bbff] text-[12px] uppercase mb-1">
                                Shift Time
                              </p>
                              <p className="text-black dark:text-white font-semibold">
                                {shift.start_time} - {shift.end_time}
                              </p>
                            </div>
                            <div className="rounded-[14px] border border-yellow-200 dark:border-[#3b3520] bg-yellow-50 dark:bg-[#1a160d] px-4 py-3">
                              <p className="text-[#ffd15c] text-[12px] uppercase mb-1">
                                Status
                              </p>
                              <p className="text-black dark:text-white font-semibold capitalize">
                                {(shift.status || "unknown").replaceAll(
                                  "_",
                                  " ",
                                )}
                              </p>
                            </div>
                            <div className="rounded-[14px] border border-green-200 dark:border-[#1f3f2f] bg-green-50 dark:bg-[#101a14] px-4 py-3">
                              <p className="text-[#9eff5b] text-[12px] uppercase mb-1">
                                Handover
                              </p>
                              <p
                                className={`font-semibold ${
                                  shift.handover_completed
                                    ? "text-emerald-300"
                                    : "text-yellow-300"
                                }`}
                              >
                                {shift.handover_completed
                                  ? "Submitted"
                                  : "Pending"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="space-y-8">
              {/* SUMMARY */}
              <div
                id="summary-section"
                className="rounded-[20px] sm:rounded-[24px] border border-black/10 dark:border-white/10 bg-white dark:bg-[#070c14] p-4 sm:p-6"
              >
                <h2 className="text-[20px] font-semibold mb-6">
                  Today's Summary
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="rounded-[16px] border border-black/10 dark:border-white/10 bg-gray-100 dark:bg-[#11161d]/80 p-5 text-center">
                    <Users className="mx-auto mb-4 text-sky-300" />

                    <p className="text-gray-600 dark:text-gray-500 text-[13px] text-[12px] mb-1.5">
                      Staff
                    </p>

                    <h3 className="text-[30px] font-semibold leading-none">
                      {staffList.length}
                    </h3>
                  </div>

                  <div className="rounded-[16px] border border-black/10 dark:border-white/10 bg-gray-100 dark:bg-[#11161d]/80 p-5 text-center">
                    <ClipboardList className="mx-auto mb-4 text-emerald-300" />

                    <p className="text-gray-600 dark:text-gray-500 text-[13px] text-[12px] mb-1.5">
                      Check-ins
                    </p>

                    <h3 className="text-[30px] font-semibold leading-none">
                      {checkinCount}
                    </h3>
                  </div>

                  <div className="rounded-[16px] border border-black/10 dark:border-white/10 bg-gray-100 dark:bg-[#11161d]/80 p-5 text-center">
                    <Clock3 className="mx-auto mb-4 text-yellow-400" />

                    <p className="text-gray-600 dark:text-gray-500 text-[13px] text-[12px] mb-1.5">
                      Active Shifts
                    </p>

                    <h3 className="text-[30px] font-semibold leading-none">
                      {activeShifts.length}
                    </h3>
                  </div>

                  <div className="rounded-[16px] border border-black/10 dark:border-white/10 bg-gray-100 dark:bg-[#11161d]/80 p-5 text-center">
                    <ShieldCheck className="mx-auto mb-4 text-red-400" />

                    <p className="text-gray-600 dark:text-gray-500 text-[13px] text-[12px] mb-1.5">
                      Completed Shifts
                    </p>

                    <h3 className="text-[30px] font-semibold leading-none">
                      {completedShifts.length}
                    </h3>
                  </div>
                </div>
              </div>

              {/* QUICK ACTIONS */}
              <div className="rounded-[20px] sm:rounded-[24px] border border-black/10 dark:border-white/10 bg-white dark:bg-[#070c14] p-4 sm:p-6">
                <h2 className="text-[20px] font-semibold mb-6">
                  Quick Actions
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={scrollToCreateAccount}
                    className="h-[100px] rounded-[16px] border border-black/10 dark:border-white/10 bg-gray-100 dark:bg-[#11161d]/80 flex flex-col items-center justify-center gap-3 hover:border-sky-400/30 transition-all duration-300"
                  >
                    <UserPlus className="text-sky-300" />
                    Add Staff
                  </button>

                  <button
                    onClick={scrollToShifts}
                    className="h-[100px] rounded-[16px] border border-black/10 dark:border-white/10 bg-gray-100 dark:bg-[#11161d]/80 flex flex-col items-center justify-center gap-3 hover:border-emerald-300/30 transition-all duration-300"
                  >
                    <ClipboardList className="text-emerald-300" />
                    View Shifts
                  </button>

                  {/* Notifications button removed as per instructions */}

                  <button
                    onClick={scrollToCreateShift}
                    className="h-[100px] rounded-[16px] border border-black/10 dark:border-white/10 bg-gray-100 dark:bg-[#11161d]/80 flex flex-col items-center justify-center gap-3 hover:border-red-400/30 transition-all duration-300"
                  >
                    <FileText className="text-red-400" />
                    Reports
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
