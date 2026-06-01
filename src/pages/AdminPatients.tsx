

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function AdminPatients() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "patient")
      .order("full_name");

    if (!error && data) {
      setPatients(data);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#050a11] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-semibold mb-2">Patients</h1>
        <p className="text-gray-400 mb-6">
          View and manage all patient records.
        </p>

        <div className="rounded-[24px] border border-white/10 bg-[#0b1018] p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">All Patients</h2>
            <div className="text-sky-300 font-medium">
              {patients.length} Patients
            </div>
          </div>

          {loading ? (
            <p className="text-gray-400">Loading patients...</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {patients.map((patient) => (
                <div
                  key={patient.id}
                  className="rounded-[18px] border border-white/10 bg-[#11161d] p-5"
                >
                  <h3 className="text-lg font-semibold text-white mb-4">
                    {patient.full_name || "Unnamed Patient"}
                  </h3>

                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-400">Email:</span> {patient.email || "-"}</p>
                    <p><span className="text-gray-400">Phone:</span> {patient.phone || "-"}</p>
                    <p><span className="text-gray-400">Role:</span> {patient.role}</p>
                  </div>

                  <button
                    className="mt-5 h-[44px] px-4 rounded-[12px] bg-sky-400 text-black font-medium"
                  >
                    Patient Information
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}