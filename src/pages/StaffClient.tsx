import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import StaffSidebar from "../components/StaffSidebar";
import Navbar from "../components/Navbar";

export default function StaffClient() {
  const [patient, setPatient] = useState<any>(null);
  const [patientDetails, setPatientDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [staffName, setStaffName] = useState("");
  const [staffRole, setStaffRole] = useState("");
  const [latestHandover, setLatestHandover] = useState<any>(null);

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
        .select("*")
        .eq("patient_id", shift.patient_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setLatestHandover(handover);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white dark:bg-[#050a11] transition-colors duration-300">
        <StaffSidebar onLogout={handleLogout} />

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
    <div className="min-h-screen bg-white dark:bg-[#050a11] text-black dark:text-white transition-colors duration-300">
      <Navbar name={staffName} role={staffRole} />

      <StaffSidebar onLogout={handleLogout} />

      <div className="pt-32 pl-[290px] pr-6 pb-6">
        <div className="w-full space-y-6">
          <div className="rounded-3xl bg-white dark:bg-[#060b12]/95 border border-black/10 dark:border-white/10 p-8 shadow-2xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-sky-300 text-sm uppercase tracking-wider">
                  Resident
                </p>
                <h1 className="text-4xl font-bold mt-2">
                  {patient?.name || "No Resident Assigned"}
                </h1>
              </div>

              <div className="px-5 py-4 rounded-2xl bg-sky-500/10 border border-sky-500/20">
                <p className="text-sky-300 text-sm">Assigned Resident</p>
                <p className="font-semibold mt-1">
                  {patient?.name || "No Resident Assigned"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white dark:bg-[#060b12]/95 border border-black/10 dark:border-white/10 p-8 shadow-xl">
            {!patientDetails ? (
              <div className="text-center py-12">
                <h2 className="text-2xl font-semibold mb-2">
                  No Resident Assigned
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  You do not have a resident assigned for today's shift.
                </p>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-semibold mb-6">Resident Details</h2>

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

          {patientDetails && (
            <div className="rounded-3xl bg-white dark:bg-[#060b12]/95 border border-black/10 dark:border-white/10 p-8 shadow-xl">
              <h2 className="text-xl font-semibold mb-6">Latest Handover</h2>

              {!latestHandover ? (
                <p className="text-gray-600 dark:text-gray-400">
                  No previous handover available for this resident.
                </p>
              ) : (
                <div className="space-y-4">
                  <Info
                    label="Completed"
                    value={formatDate(latestHandover.created_at)}
                  />

                  <Info
                    label="Completed By"
                    value={latestHandover.staff_name}
                  />

                  <TextCard
                    title="Wellbeing Summary"
                    value={latestHandover.wellbeing_summary}
                  />

                  <TextCard
                    title="Care Summary"
                    value={latestHandover.care_summary}
                  />

                  <TextCard
                    title="Concerns / Incidents"
                    value={latestHandover.concerns_incidents}
                  />

                  <TextCard
                    title="Escalations"
                    value={latestHandover.escalations}
                  />

                  <TextCard
                    title="Family Communication"
                    value={latestHandover.family_communication}
                  />

                  <TextCard
                    title="Baseline Changes"
                    value={latestHandover.baseline_changes}
                  />

                  <TextCard
                    title="Recommendations"
                    value={latestHandover.recommendations}
                  />

                  <TextCard
                    title="Detailed Notes"
                    value={latestHandover.detailed_notes}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-xl bg-gray-50 dark:bg-[#0b1018] border border-black/10 dark:border-white/10 p-4">
      <p className="text-xs text-gray-600 dark:text-gray-400">{label}</p>
      <p className="mt-1">{value || "-"}</p>
    </div>
  );
}

function TextCard({ title, value }: { title: string; value: any }) {
  return (
    <div className="rounded-xl bg-gray-50 dark:bg-[#0b1018] border border-black/10 dark:border-white/10 p-4">
      <p className="text-sky-300 mb-2">{title}</p>
      <p>{value || "-"}</p>
    </div>
  );
}
