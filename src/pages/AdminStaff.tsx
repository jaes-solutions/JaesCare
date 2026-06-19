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

  useEffect(() => {
    loadStaff();
  }, []);

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

  return (
    <div className="min-h-screen bg-white dark:bg-[#0b0f14]">
      <AdminSidebar
        onLogout={() => {
          localStorage.clear();
          window.location.href = "/";
        }}
      />

      <div className="lg:ml-[280px] min-h-screen">
        <Navbar name={adminName} role="admin" />

        <div className="pt-24 px-6 pb-6 max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-black dark:text-white">
            Staff Management
          </h1>

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
              <div className="rounded-2xl border border-black/10 dark:border-white/10 overflow-hidden bg-white dark:bg-[#11161d]">
                <div className="p-4 border-b border-black/10 dark:border-white/10 font-semibold">
                  Staff Members ({staff.length})
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

              <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#11161d] p-6 overflow-x-hidden">
                {selectedStaff ? (
                  <div className="space-y-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-bold text-black dark:text-white">
                          {selectedStaff.full_name}
                        </h2>
                        <p className="text-gray-500 mt-1">
                          {selectedStaff.role}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditing(!editing)}
                          className="px-4 py-2 rounded-lg bg-sky-500 text-white"
                        >
                          {editing ? "Cancel" : "Edit"}
                        </button>

                        {editing && (
                          <button
                            onClick={saveStaff}
                            className="px-4 py-2 rounded-lg bg-emerald-500 text-white"
                          >
                            Save
                          </button>
                        )}
                      </div>
                    </div>

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
                    </div>
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
