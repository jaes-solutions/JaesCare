import { useEffect, useState } from "react";
import {
  Settings2,
  Sun,
  Moon,
  User,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Phone,
  MapPin,
  Calendar,
  Users,
  Mail,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Sidebar from "../components/AdminSidebar";
import Navbar from "../components/Navbar";

import { useTheme } from "../context/ThemeContext";

type ProfileForm = {
  full_name: string;
  email: string;
  phone: string;
  address: string;
  date_of_birth: string;
  gender: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
};

const emptyForm: ProfileForm = {
  full_name: "",
  email: "",
  phone: "",
  address: "",
  date_of_birth: "",
  gender: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
};

export default function AdminSettings() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [profileId, setProfileId] = useState<string | null>(null);

  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [initialForm, setInitialForm] = useState<ProfileForm>(emptyForm);

  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
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

      setProfileId(profile.id);
      setAdminName(profile.full_name || "Admin");

      const loadedForm: ProfileForm = {
        full_name: profile.full_name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        address: profile.address || "",
        date_of_birth: profile.date_of_birth || "",
        gender: profile.gender || "",
        emergency_contact_name: profile.emergency_contact_name || "",
        emergency_contact_phone: profile.emergency_contact_phone || "",
      };

      setForm(loadedForm);
      setInitialForm(loadedForm);
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

  const handleChange = (field: keyof ProfileForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (saveStatus !== "idle") setSaveStatus("idle");
  };

  const hasChanges = JSON.stringify(form) !== JSON.stringify(initialForm);

  const handleSave = async () => {
    if (!profileId) return;

    setSaving(true);
    setSaveStatus("idle");
    setErrorMessage("");

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: form.full_name || null,
          email: form.email || null,
          phone: form.phone || null,
          address: form.address || null,
          date_of_birth: form.date_of_birth || null,
          gender: form.gender || null,
          emergency_contact_name: form.emergency_contact_name || null,
          emergency_contact_phone: form.emergency_contact_phone || null,
        })
        .eq("id", profileId);

      if (error) {
        console.error(error);
        setSaveStatus("error");
        setErrorMessage("Failed to save changes. Please try again.");
        return;
      }

      setInitialForm(form);
      setAdminName(form.full_name || "Admin");
      setSaveStatus("success");

      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (err) {
      console.error(err);
      setSaveStatus("error");
      setErrorMessage("Something went wrong while saving.");
    } finally {
      setSaving(false);
    }
  };
``
  const handleDiscard = () => {
    setForm(initialForm);
    setSaveStatus("idle");
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#03060b] text-black dark:text-white flex overflow-x-hidden transition-colors duration-300">
      <Sidebar onLogout={handleLogout} />

      <div className="flex-1 w-full min-w-0 overflow-y-auto overflow-x-hidden lg:ml-[245px] min-h-screen bg-gray-50 dark:bg-[#03060b] pt-[78px]">
        <Navbar name={adminName} />

        <main className="w-full p-3 sm:p-5 lg:p-7 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center min-h-[calc(100vh-78px)]">
              <div className="flex flex-col items-center gap-6">
                <div className="relative w-24 h-24">
                  <div className="absolute inset-0 rounded-full border-4 border-sky-200 dark:border-sky-900" />
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-sky-400 border-r-emerald-300 animate-spin" />
                  <div className="absolute inset-3 rounded-full border-4 border-transparent border-b-sky-300 border-l-emerald-400 animate-spin [animation-direction:reverse] [animation-duration:1.5s]" />
                </div>
                <h2 className="text-xl font-semibold text-black dark:text-white">
                  Loading Settings ..
                </h2>
              </div>
            </div>
          ) : (
            <>
              {/* HEADER */}
              <div className="rounded-[20px] sm:rounded-[24px] border border-black/10 dark:border-white/10 bg-white dark:bg-[#070c14] p-4 sm:p-6 mb-6 flex items-center gap-3">
                <Settings2 className="text-sky-300" size={26} />
                <div>
                  <h2 className="text-[22px] sm:text-[26px] font-semibold mb-1">
                    Settings
                  </h2>
                  <p className="text-gray-600 dark:text-gray-500 text-[13px]">
                    Manage your appearance preferences and profile details.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[1fr,1.6fr] gap-6">
                {/* APPEARANCE */}
                <div className="rounded-[20px] sm:rounded-[24px] border border-black/10 dark:border-white/10 bg-white dark:bg-[#070c14] p-4 sm:p-6 h-fit">
                  <div className="flex items-center gap-3 mb-6">
                    {theme === "dark" ? (
                      <Moon className="text-sky-300" size={22} />
                    ) : (
                      <Sun className="text-amber-400" size={22} />
                    )}
                    <h2 className="text-[20px] font-semibold">Appearance</h2>
                  </div>

                  <div className="rounded-[16px] border border-black/10 dark:border-white/10 bg-gray-100 dark:bg-[#0c1118] p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-black dark:text-white">
                        {theme === "dark" ? "Dark Mode" : "Light Mode"}
                      </p>
                      <p className="text-gray-600 dark:text-gray-500 text-sm mt-1">
                        Switch between light and dark themes.
                      </p>
                    </div>

                    <button
                      role="switch"
                      aria-checked={theme === "dark"}
                      onClick={toggleTheme}
                      className={`relative w-[56px] h-[30px] rounded-full transition-colors duration-300 shrink-0 ${
                        theme === "dark"
                          ? "bg-gradient-to-r from-sky-400 to-emerald-300"
                          : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`absolute top-[3px] left-[3px] w-[24px] h-[24px] rounded-full bg-white shadow-md flex items-center justify-center transition-transform duration-300 ${
                          theme === "dark" ? "translate-x-[26px]" : ""
                        }`}
                      >
                        {theme === "dark" ? (
                          <Moon size={13} className="text-sky-500" />
                        ) : (
                          <Sun size={13} className="text-amber-500" />
                        )}
                      </span>
                    </button>
                  </div>
                </div>

                {/* PROFILE */}
                <div className="rounded-[20px] sm:rounded-[24px] border border-black/10 dark:border-white/10 bg-white dark:bg-[#070c14] p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <User className="text-emerald-300" size={22} />
                    <h2 className="text-[20px] font-semibold">
                      Profile Details
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field
                      label="Full Name"
                      icon={<User size={14} />}
                      value={form.full_name}
                      onChange={(v) => handleChange("full_name", v)}
                      placeholder="Jane Doe"
                    />
                    <Field
                      label="Email"
                      icon={<Mail size={14} />}
                      type="email"
                      value={form.email}
                      onChange={(v) => handleChange("email", v)}
                      placeholder="jane@example.com"
                    />
                    <Field
                      label="Phone"
                      icon={<Phone size={14} />}
                      value={form.phone}
                      onChange={(v) => handleChange("phone", v)}
                      placeholder="+44 7000 000000"
                    />
                    <Field
                      label="Date of Birth"
                      icon={<Calendar size={14} />}
                      type="date"
                      value={form.date_of_birth}
                      onChange={(v) => handleChange("date_of_birth", v)}
                    />
                    <div className="sm:col-span-2">
                      <Field
                        label="Address"
                        icon={<MapPin size={14} />}
                        value={form.address}
                        onChange={(v) => handleChange("address", v)}
                        placeholder="123 Example Street, London"
                      />
                    </div>

                    <div>
                      <label className="text-gray-600 dark:text-gray-400 text-[12px] uppercase font-medium mb-1.5 flex items-center gap-1.5">
                        Gender
                      </label>
                      <select
                        value={form.gender}
                        onChange={(e) => handleChange("gender", e.target.value)}
                        className="w-full h-[46px] px-4 rounded-[14px] border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-[#0c1118] text-black dark:text-white outline-none focus:border-sky-300 dark:focus:border-sky-400 transition-colors"
                      >
                        <option value="">Prefer not to say</option>
                        <option value="female">Female</option>
                        <option value="male">Male</option>
                        <option value="non_binary">Non-binary</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <Field
                      label="Emergency Contact Name"
                      icon={<Users size={14} />}
                      value={form.emergency_contact_name}
                      onChange={(v) =>
                        handleChange("emergency_contact_name", v)
                      }
                      placeholder="John Doe"
                    />
                    <Field
                      label="Emergency Contact Phone"
                      icon={<Phone size={14} />}
                      value={form.emergency_contact_phone}
                      onChange={(v) =>
                        handleChange("emergency_contact_phone", v)
                      }
                      placeholder="+44 7000 000000"
                    />
                  </div>

                  {saveStatus === "success" && (
                    <div className="mt-5 flex items-center gap-2 text-emerald-400 text-sm">
                      <CheckCircle2 size={16} />
                      Profile updated successfully.
                    </div>
                  )}

                  {saveStatus === "error" && (
                    <div className="mt-5 flex items-center gap-2 text-red-400 text-sm">
                      <AlertCircle size={16} />
                      {errorMessage}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 pt-5 border-t border-black/10 dark:border-white/10">
                    {hasChanges && (
                      <button
                        onClick={handleDiscard}
                        disabled={saving}
                        className="h-[46px] px-5 rounded-[14px] border border-black/10 dark:border-white/10 text-black dark:text-white font-medium disabled:opacity-50"
                      >
                        Discard Changes
                      </button>
                    )}

                    <button
                      onClick={handleSave}
                      disabled={saving || !hasChanges}
                      className="h-[46px] px-6 rounded-[14px] bg-gradient-to-r from-sky-400 to-emerald-300 text-black font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save size={16} />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

// ── Reusable text/date input field ──────────────────────────────────────
function Field({
  label,
  icon,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  icon?: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="text-gray-600 dark:text-gray-400 text-[12px] uppercase font-medium mb-1.5 flex items-center gap-1.5">
        {icon}
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-[46px] px-4 rounded-[14px] border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-[#0c1118] text-black dark:text-white outline-none focus:border-sky-300 dark:focus:border-sky-400 transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-600"
      />
    </div>
  );
}
