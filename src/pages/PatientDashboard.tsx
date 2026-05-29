import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function PatientDashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [patientName, setPatientName] = useState("");

  useEffect(() => {
    checkPatientAccess();
  }, []);

  const checkPatientAccess = async () => {
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
        .select("full_name, role")
        .eq("id", session.user.id)
        .single();

      if (error || !profile || profile.role !== "patient") {
        navigate("/login");
        return;
      }

      setPatientName(profile.full_name || "Patient");
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

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.12),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(134,239,172,0.10),transparent_30%)]" />

      <header className="relative z-10 border-b border-white/10 backdrop-blur-xl bg-[#0b0f14]/90">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div>
            <p className="text-sky-300 text-sm tracking-[0.2em] uppercase mb-1">
              JAES Care
            </p>

            <h1 className="text-2xl font-bold">Patient Dashboard</h1>
          </div>

          <button
            onClick={handleLogout}
            className="px-5 py-2 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-10">
        <div className="rounded-[32px] border border-white/10 bg-[#0b0f14]/90 backdrop-blur-2xl p-8 shadow-2xl shadow-black/40 mb-8 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-56 h-56 bg-sky-400/10 blur-3xl rounded-full" />

          <div className="relative z-10">
            <div className="inline-flex items-center px-4 py-2 rounded-full border border-sky-400/20 bg-sky-400/10 text-sky-300 text-xs tracking-[0.2em] uppercase mb-5">
              Secure Patient Access
            </div>

            <h2 className="text-4xl font-bold mb-4">Welcome, {patientName}</h2>

            <p className="text-gray-400 text-lg leading-8 max-w-3xl">
              View your care updates, support information, scheduled check-ins
              and healthcare records securely from your patient dashboard.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="rounded-[28px] border border-white/10 bg-[#11161d]/90 p-6 backdrop-blur-xl">
            <p className="text-gray-500 text-sm mb-3">Assigned Caregiver</p>

            <h3 className="text-3xl font-bold text-sky-300">Available</h3>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[#11161d]/90 p-6 backdrop-blur-xl">
            <p className="text-gray-500 text-sm mb-3">Today's Check-Ins</p>

            <h3 className="text-3xl font-bold text-emerald-300">8 Completed</h3>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[#11161d]/90 p-6 backdrop-blur-xl">
            <p className="text-gray-500 text-sm mb-3">Care Status</p>

            <h3 className="text-3xl font-bold text-white">Stable</h3>
          </div>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-[#0b0f14]/90 backdrop-blur-2xl p-8 shadow-2xl shadow-black/40">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div>
              <p className="text-sky-300 text-sm tracking-[0.2em] uppercase mb-3">
                Care Overview
              </p>

              <h2 className="text-3xl font-bold mb-3">Daily Care Monitoring</h2>

              <p className="text-gray-400 leading-7 max-w-2xl">
                Track your scheduled care visits, medication support, healthcare
                updates and realtime wellbeing monitoring.
              </p>
            </div>

            <button className="h-14 px-8 rounded-2xl bg-gradient-to-r from-sky-400 to-emerald-300 text-black font-semibold shadow-lg shadow-sky-500/10 hover:opacity-95 transition-all duration-300">
              View Care Plan
            </button>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
            <div className="rounded-2xl border border-white/10 bg-[#11161d]/80 p-5">
              <p className="text-gray-500 text-sm mb-2">Next Visit</p>

              <h3 className="text-lg font-semibold">2:00 PM</h3>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#11161d]/80 p-5">
              <p className="text-gray-500 text-sm mb-2">Assigned Staff</p>

              <h3 className="text-lg font-semibold">Sarah Johnson</h3>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#11161d]/80 p-5">
              <p className="text-gray-500 text-sm mb-2">Medication Status</p>

              <h3 className="text-lg font-semibold text-emerald-300">
                Updated
              </h3>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#11161d]/80 p-5">
              <p className="text-gray-500 text-sm mb-2">Alerts</p>

              <h3 className="text-lg font-semibold text-sky-300">No Issues</h3>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
