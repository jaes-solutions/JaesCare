import { useEffect, useState } from "react";
import {
  Bell,
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

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("staff");
  const [staffList, setStaffList] = useState<any[]>([]);
  const [patientList, setPatientList] = useState<any[]>([]);
  const [shiftList, setShiftList] = useState<any[]>([]);

  const [selectedStaff, setSelectedStaff] = useState("");
  const [selectedPatient, setSelectedPatient] = useState("");
  const [shiftDate, setShiftDate] = useState("");
  const [shiftStart, setShiftStart] = useState("");
  const [shiftEnd, setShiftEnd] = useState("");

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
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, role")
        .order("full_name", { ascending: true });

      if (profilesError) {
        console.error(profilesError);
        return;
      }

      console.log("PROFILES FROM SUPABASE:", profiles);

      const staffProfiles = (profiles || []).filter(
        (item) => item.role?.trim().toLowerCase() === "staff",
      );

      const patientProfiles = (profiles || []).filter(
        (item) => item.role?.trim().toLowerCase() === "patient",
      );

      console.log("STAFF LIST:", staffProfiles);
      console.log("PATIENT LIST:", patientProfiles);

      setStaffList(staffProfiles);
      setPatientList(patientProfiles);

      const { data: shifts, error: shiftsError } = await supabase
        .from("shifts")
        .select("*")
        .order("shift_date", { ascending: false })
        .order("start_time", { ascending: false });

      if (shiftsError) {
        console.error(shiftsError);
      } else {
        setShiftList(shifts || []);
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

  const createShift = async () => {
    try {
      const staff = staffList.find((s) => s.id === selectedStaff);
      const patient = patientList.find((p) => p.id === selectedPatient);

      if (!staff || !patient || !shiftDate || !shiftStart || !shiftEnd) {
        alert("Please fill all shift details");
        return;
      }

      const { error } = await supabase.from("shifts").insert({
        patient_id: patient.id,
        patient_name: patient.full_name,
        staff_id: staff.id,
        staff_name: staff.full_name,
        shift_date: shiftDate,
        start_time: shiftStart,
        end_time: shiftEnd,
        status: "active",
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
      const session = await supabase.auth.getSession();
      console.log("SESSION:", session);

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
          body: JSON.stringify({
            full_name: newName,
            email: newEmail,
            password: newPassword,
            role: newRole,
          }),
        },
      );

      const data = await response.json();

      console.log("CREATE USER RESPONSE:", data);

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
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        Loading admin dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#03060b] text-white flex overflow-x-hidden">
      <Sidebar onLogout={handleLogout} />
      {/* MAIN CONTENT */}
      <div className="flex-1 w-full min-w-0 overflow-y-auto overflow-x-hidden lg:ml-[245px] min-h-screen bg-[#03060b] pt-[78px]">
        <Navbar name={adminName} />
        {/* CONTENT */}
        <main className="w-full p-3 sm:p-5 lg:p-7 overflow-hidden">
          {/* HERO */}
          <div className="rounded-[20px] sm:rounded-[24px] border border-white/10 bg-[#070c14] p-4 sm:p-6 mb-6">
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

                  <p className="text-gray-500 text-[13px] mt-2">
                    All systems operational
                  </p>
                </div>
              </div>

              <div className="lg:border-l lg:border-white/10 lg:px-8">
                <div className="w-20 h-20 rounded-full bg-emerald-300/10 border border-emerald-300/20 flex items-center justify-center mb-4">
                  <Users size={34} className="text-emerald-300" />
                </div>

                <p className="text-gray-500 text-[13px] mb-1.5">
                  Total Active Staff
                </p>

                <h2 className="text-[30px] font-semibold leading-none text-emerald-300">
                  24
                </h2>
              </div>

              <div className="lg:border-l lg:border-white/10 lg:px-8">
                <div className="w-20 h-20 rounded-full bg-sky-400/10 border border-sky-400/20 flex items-center justify-center mb-4">
                  <Clock3 size={34} className="text-sky-300" />
                </div>

                <p className="text-gray-500 text-[13px] mb-1.5">
                  Active Check-ins
                </p>

                <h2 className="text-[30px] font-semibold leading-none">87</h2>
              </div>
            </div>
          </div>

          {/* GRID */}
          <div className="grid grid-cols-1 xl:grid-cols-[1.5fr,0.9fr] gap-6">
            {/* LEFT */}
            <div className="space-y-8">
              {/* CREATE USER */}
              <div className="rounded-[20px] sm:rounded-[24px] border border-white/10 bg-[#070c14] p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-[20px] sm:text-[24px] font-semibold mb-1.5">
                      Create Account
                    </h2>

                    <p className="text-gray-500 text-[13px]">
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
                    className="w-full h-[50px] rounded-[16px] border border-white/10 bg-[#11161d]/90 px-4 text-white outline-none"
                  />

                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Email Address"
                    className="w-full h-[50px] rounded-[16px] border border-white/10 bg-[#11161d]/90 px-4 text-white outline-none"
                  />

                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Temporary Password"
                    className="w-full h-[50px] rounded-[16px] border border-white/10 bg-[#11161d]/90 px-4 text-white outline-none"
                  />

                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full h-[50px] rounded-[16px] border border-white/10 bg-[#11161d]/90 px-4 text-white outline-none"
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

              <div className="rounded-[20px] sm:rounded-[24px] border border-white/10 bg-[#070c14] p-4 sm:p-6">
                <h2 className="text-[20px] sm:text-[24px] font-semibold mb-6">
                  Create Shift
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select
                    value={selectedStaff}
                    onChange={(e) => setSelectedStaff(e.target.value)}
                    className="h-[50px] rounded-[16px] border border-white/10 bg-[#11161d] px-4"
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
                    className="h-[50px] rounded-[16px] border border-white/10 bg-[#11161d] px-4"
                  >
                    <option value="">Select Patient</option>
                    {patientList.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.full_name}
                      </option>
                    ))}
                  </select>

                  <input
                    type="date"
                    value={shiftDate}
                    onChange={(e) => setShiftDate(e.target.value)}
                    className="h-[50px] rounded-[16px] border border-white/10 bg-[#11161d] px-4"
                  />

                  <input
                    type="time"
                    value={shiftStart}
                    onChange={(e) => setShiftStart(e.target.value)}
                    className="h-[50px] rounded-[16px] border border-white/10 bg-[#11161d] px-4"
                  />

                  <input
                    type="time"
                    value={shiftEnd}
                    onChange={(e) => setShiftEnd(e.target.value)}
                    className="h-[50px] rounded-[16px] border border-white/10 bg-[#11161d] px-4"
                  />
                </div>

                <button
                  onClick={createShift}
                  className="mt-6 w-full sm:w-auto h-[50px] px-8 rounded-[16px] bg-gradient-to-r from-sky-400 to-emerald-300 text-black font-semibold"
                >
                  Create Shift
                </button>
              </div>

              {/* SHIFTS LIST */}
              <div className="rounded-[20px] sm:rounded-[24px] border border-white/10 bg-[#070c14] p-4 sm:p-6">
                <h2 className="text-[20px] sm:text-[24px] font-semibold mb-6">
                  All Shifts
                </h2>

                <div className="space-y-4">
                  {shiftList.length === 0 && (
                    <p className="text-gray-500">No shifts created yet</p>
                  )}

                  {shiftList.map((shift) => (
                    <div
                      key={shift.id}
                      className="rounded-[16px] border border-white/10 bg-[#11161d]/80 p-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                        <div>
                          <p className="text-sky-300 font-semibold">
                            Staff: {shift.staff_name}
                          </p>

                          <p className="text-emerald-300 text-sm mt-1">
                            Patient: {shift.patient_name}
                          </p>
                        </div>

                        <div className="text-left sm:text-right">
                          <p>{shift.shift_date}</p>

                          <p className="text-gray-400 text-sm">
                            {shift.start_time} - {shift.end_time}
                          </p>

                          <p
                            className={`text-sm mt-2 font-semibold ${
                              shift.status === "completed"
                                ? "text-emerald-300"
                                : "text-sky-300"
                            }`}
                          >
                            {shift.status === "completed"
                              ? "Completed"
                              : "Active"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="space-y-8">
              {/* SUMMARY */}
              <div className="rounded-[20px] sm:rounded-[24px] border border-white/10 bg-[#070c14] p-4 sm:p-6">
                <h2 className="text-[20px] font-semibold mb-6">
                  Today's Summary
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="rounded-[16px] border border-white/10 bg-[#11161d]/80 p-5 text-center">
                    <Users className="mx-auto mb-4 text-sky-300" />

                    <p className="text-gray-500 text-[13px] text-[12px] mb-1.5">
                      Staff Online
                    </p>

                    <h3 className="text-[30px] font-semibold leading-none">
                      18
                    </h3>
                  </div>

                  <div className="rounded-[16px] border border-white/10 bg-[#11161d]/80 p-5 text-center">
                    <ClipboardList className="mx-auto mb-4 text-emerald-300" />

                    <p className="text-gray-500 text-[13px] text-[12px] mb-1.5">
                      Check-ins
                    </p>

                    <h3 className="text-[30px] font-semibold leading-none">
                      87
                    </h3>
                  </div>

                  <div className="rounded-[16px] border border-white/10 bg-[#11161d]/80 p-5 text-center">
                    <Bell className="mx-auto mb-4 text-yellow-400" />

                    <p className="text-gray-500 text-[13px] text-[12px] mb-1.5">
                      Alerts
                    </p>

                    <h3 className="text-[30px] font-semibold leading-none">
                      2
                    </h3>
                  </div>

                  <div className="rounded-[16px] border border-white/10 bg-[#11161d]/80 p-5 text-center">
                    <ShieldCheck className="mx-auto mb-4 text-red-400" />

                    <p className="text-gray-500 text-[13px] text-[12px] mb-1.5">
                      Compliance
                    </p>

                    <h3 className="text-[30px] font-semibold leading-none">
                      98%
                    </h3>
                  </div>
                </div>
              </div>

              {/* QUICK ACTIONS */}
              <div className="rounded-[20px] sm:rounded-[24px] border border-white/10 bg-[#070c14] p-4 sm:p-6">
                <h2 className="text-[20px] font-semibold mb-6">
                  Quick Actions
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button className="h-[100px] rounded-[16px] border border-white/10 bg-[#11161d]/80 flex flex-col items-center justify-center gap-3 hover:border-sky-400/30 transition-all duration-300">
                    <UserPlus className="text-sky-300" />
                    Add Staff
                  </button>

                  <button className="h-[100px] rounded-[16px] border border-white/10 bg-[#11161d]/80 flex flex-col items-center justify-center gap-3 hover:border-emerald-300/30 transition-all duration-300">
                    <ClipboardList className="text-emerald-300" />
                    View Patients
                  </button>

                  <button className="h-[100px] rounded-[16px] border border-white/10 bg-[#11161d]/80 flex flex-col items-center justify-center gap-3 hover:border-yellow-400/30 transition-all duration-300">
                    <Bell className="text-yellow-400" />
                    Notifications
                  </button>

                  <button className="h-[100px] rounded-[16px] border border-white/10 bg-[#11161d]/80 flex flex-col items-center justify-center gap-3 hover:border-red-400/30 transition-all duration-300">
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
