import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import StaffSidebar from "../components/StaffSidebar";
import Navbar from "../components/Navbar";

export default function StaffClient() {
  const [patient, setPatient] = useState<any>(null);
  const [patientDetails, setPatientDetails] = useState<any>(null);
  const [latestHandover, setLatestHandover] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [staffName, setStaffName] = useState("");
  const [staffRole, setStaffRole] = useState("");

  useEffect(() => {
    loadPatient();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const formatDate = (date?: string) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const calculateAge = (dob?: string) => {
    if (!dob) return "-";

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

  const loadPatient = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", session.user.id)
        .single();

      setStaffName(profile?.full_name || "Staff");
      setStaffRole(profile?.role || "staff");

      const today = new Date().toISOString().split("T")[0];

      const { data: shift, error: shiftError } = await supabase
        .from("shifts")
        .select("*")
        .eq("staff_id", session.user.id)
        .eq("shift_date", today)
        .eq("status", "active")
        .order("start_time")
        .limit(1)
        .maybeSingle();

      console.log("Today's shift:", shift);
      console.log("Shift error:", shiftError);

      if (!shift) {
        setPatient(null);
        setPatientDetails(null);
        setLatestHandover(null);
        setLoading(false);
        return;
      }

      setPatient({
        id: shift.patient_id,
        name: shift.patient_name,
      });

      const { data: details } = await supabase
        .from("patient_details")
        .select("*")
        .eq("profile_id", shift.patient_id)
        .single();

      setPatientDetails(details);

      const { data: handover } = await supabase
        .from("handovers")
        .select(
          `
          *,
          shifts!handovers_shift_id_fkey (
            staff_name,
            shift_date,
            start_time,
            end_time
          )
        `,
        )
        .eq("shifts.patient_id", shift.patient_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      setLatestHandover(handover);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050a11] text-white">
        <Navbar name={staffName} role={staffRole} />
        <StaffSidebar onLogout={handleLogout} />
        <div className="pt-32 pl-[290px] pr-6 pb-6">Loading...</div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-[#050a11] text-white">
      <Navbar name={staffName} role={staffRole} />

      <StaffSidebar onLogout={handleLogout} />

      <div className="pt-32 pl-[290px] pr-6 pb-6">
        <div className="w-full space-y-6">
          <div className="rounded-3xl bg-[#11161d] border border-white/10 p-8 shadow-2xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-sky-300 text-sm uppercase tracking-wider">
                  My Client
                </p>
                <h1 className="text-4xl font-bold mt-2">
                  {patient?.name || "No Patient Assigned"}
                </h1>
              </div>

              <div className="px-5 py-4 rounded-2xl bg-sky-500/10 border border-sky-500/20">
                <p className="text-sky-300 text-sm">Assigned Patient</p>
                <p className="font-semibold mt-1">
                  {patient?.name || "No Patient Assigned"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-[#11161d] border border-white/10 p-8 shadow-xl">
            {!patientDetails ? (
              <div className="text-center py-12">
                <h2 className="text-2xl font-semibold mb-2">
                  No Patient Assigned
                </h2>
                <p className="text-gray-400">
                  You do not have a patient assigned for today's shift.
                </p>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-semibold mb-6">Patient Details</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  <Info label="First Name" value={patientDetails?.first_name} />

                  <Info label="Last Name" value={patientDetails?.last_name} />

                  <Info
                    label="Date of Birth"
                    value={`${formatDate(
                      patientDetails?.date_of_birth,
                    )} (${calculateAge(patientDetails?.date_of_birth)} years)`}
                  />

                  <Info label="Gender" value={patientDetails?.gender} />

                  <Info label="Email" value={patientDetails?.email} />

                  <Info label="Phone" value={patientDetails?.phone} />

                  <Info label="Address" value={patientDetails?.address} />

                  <Info label="NHS Number" value={patientDetails?.nhs_number} />

                  <Info label="Ethnicity" value={patientDetails?.ethnicity} />

                  <Info label="Religion" value={patientDetails?.religion} />

                  <Info
                    label="IDDSI Level"
                    value={patientDetails?.iddsi_level}
                  />

                  <Info label="GP Name" value={patientDetails?.gp_name} />

                  <Info label="GP Phone" value={patientDetails?.gp_phone} />

                  <Info
                    label="Emergency Contact"
                    value={patientDetails?.emergency_contact_name}
                  />

                  <Info
                    label="Emergency Phone"
                    value={patientDetails?.emergency_contact_phone}
                  />
                </div>

                <div className="mt-6 space-y-4">
                  <TextCard
                    title="Medical Conditions"
                    value={patientDetails?.medical_conditions}
                  />

                  <TextCard
                    title="Allergies"
                    value={patientDetails?.allergies}
                  />

                  <TextCard
                    title="Abilities"
                    value={patientDetails?.abilities}
                  />

                  <TextCard
                    title="Communication Needs"
                    value={patientDetails?.communication_needs}
                  />

                  <TextCard
                    title="Mobility Status"
                    value={patientDetails?.mobility_status}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-xl bg-[#0b1018] border border-white/10 p-4">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-1">{value || "-"}</p>
    </div>
  );
}

function TextCard({ title, value }: { title: string; value: any }) {
  return (
    <div className="rounded-xl bg-[#0b1018] border border-white/10 p-4">
      <p className="text-sky-300 mb-2">{title}</p>
      <p>{value || "-"}</p>
    </div>
  );
}
