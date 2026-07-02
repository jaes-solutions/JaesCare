import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  Bell,
  Eye,
  Lock,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  User,
} from "lucide-react";
import StaffSidebar from "../components/StaffSidebar";
import Navbar from "../components/Navbar";
import { supabase } from "../lib/supabase";

type StaffProfileForm = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  gender: string;
};

type StaffPreferences = {
  emailNotifications: boolean;
  shiftReminders: boolean;
  checkinAlerts: boolean;
  incidentAlerts: boolean;
  compactView: boolean;
  highContrast: boolean;
};

const profileInitial: StaffProfileForm = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  gender: "",
};

const preferenceInitial: StaffPreferences = {
  emailNotifications: true,
  shiftReminders: true,
  checkinAlerts: true,
  incidentAlerts: true,
  compactView: false,
  highContrast: false,
};

const inputClass =
  "w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0b1018] px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-sky-400";

const labelClass = "mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300";

export default function StaffSettings() {
  const [staffName, setStaffName] = useState("Staff");
  const [staffRole, setStaffRole] = useState("staff");
  const [profile, setProfile] = useState<StaffProfileForm>(profileInitial);
  const [preferences, setPreferences] =
    useState<StaffPreferences>(preferenceInitial);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const preferencesKey = profile.email
    ? `staff-settings:${profile.email}`
    : "staff-settings";

  const updateProfile = (key: keyof StaffProfileForm, value: string) => {
    setProfile((current) => ({ ...current, [key]: value }));
  };

  const updatePreference = (key: keyof StaffPreferences, value: boolean) => {
    const next = { ...preferences, [key]: value };
    setPreferences(next);
    localStorage.setItem(preferencesKey, JSON.stringify(next));
  };

  const loadSettings = async () => {
    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      window.location.href = "/login";
      return;
    }

    const { data: loadedProfile, error } = await supabase
      .from("profiles")
      .select(
        "full_name, role, phone, address, emergency_contact_name, emergency_contact_phone, gender",
      )
      .eq("id", session.user.id)
      .maybeSingle();

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    const nextProfile = {
      fullName: loadedProfile?.full_name || "",
      email: session.user.email || "",
      phone: loadedProfile?.phone || "",
      address: loadedProfile?.address || "",
      emergencyContactName: loadedProfile?.emergency_contact_name || "",
      emergencyContactPhone: loadedProfile?.emergency_contact_phone || "",
      gender: loadedProfile?.gender || "",
    };

    setStaffName(nextProfile.fullName || "Staff");
    setStaffRole(loadedProfile?.role || "staff");
    setProfile(nextProfile);

    const savedPreferences = localStorage.getItem(
      nextProfile.email ? `staff-settings:${nextProfile.email}` : "staff-settings",
    );

    if (savedPreferences) {
      setPreferences({ ...preferenceInitial, ...JSON.parse(savedPreferences) });
    }

    setLoading(false);
  };

  const saveProfile = async () => {
    setSavingProfile(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      window.location.href = "/login";
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.fullName,
        phone: profile.phone,
        address: profile.address,
        emergency_contact_name: profile.emergencyContactName,
        emergency_contact_phone: profile.emergencyContactPhone,
        gender: profile.gender,
      })
      .eq("id", session.user.id);

    setSavingProfile(false);

    if (error) {
      console.error(error);
      alert("Profile settings could not be saved.");
      return;
    }

    setStaffName(profile.fullName || "Staff");
    alert("Profile settings saved successfully.");
  };

  const updatePassword = async () => {
    if (newPassword.length < 8) {
      alert("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    setSavingPassword(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setSavingPassword(false);

    if (error) {
      console.error(error);
      alert("Password could not be updated.");
      return;
    }

    setNewPassword("");
    setConfirmPassword("");
    alert("Password updated successfully.");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#03060b] text-slate-900 dark:text-white">
      <StaffSidebar onLogout={handleLogout} />

      <div className="lg:ml-[245px] min-h-screen">
        <Navbar name={staffName} role={staffRole} />

        <main className="pt-24 px-4 sm:px-6 lg:px-8 pb-8 max-w-6xl mx-auto">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Manage your profile, alerts, accessibility and account security.
              </p>
            </div>
            <button
              onClick={saveProfile}
              disabled={savingProfile || loading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sky-500 px-5 text-sm font-semibold text-white transition hover:bg-sky-600 disabled:opacity-60"
            >
              <Save size={18} />
              {savingProfile ? "Saving..." : "Save Profile"}
            </button>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#070c14] p-8 text-sm text-slate-600 dark:text-slate-300">
              Loading settings...
            </div>
          ) : (
            <div className="space-y-6">
              <section className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#070c14] p-6">
                <div className="mb-5 flex items-center gap-3">
                  <User className="text-sky-400" size={22} />
                  <h2 className="text-xl font-semibold">Profile Details</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Full Name">
                    <input
                      className={inputClass}
                      value={profile.fullName}
                      onChange={(e) => updateProfile("fullName", e.target.value)}
                    />
                  </Field>
                  <Field label="Email" icon={<Mail size={16} />}>
                    <input
                      className={`${inputClass} opacity-75`}
                      value={profile.email}
                      disabled
                    />
                  </Field>
                  <Field label="Phone" icon={<Phone size={16} />}>
                    <input
                      className={inputClass}
                      value={profile.phone}
                      onChange={(e) => updateProfile("phone", e.target.value)}
                    />
                  </Field>
                  <Field label="Gender">
                    <select
                      className={inputClass}
                      value={profile.gender}
                      onChange={(e) => updateProfile("gender", e.target.value)}
                    >
                      <option value="">Prefer not to say</option>
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Non-binary">Non-binary</option>
                      <option value="Other">Other</option>
                    </select>
                  </Field>
                  <div className="md:col-span-2">
                    <Field label="Address" icon={<MapPin size={16} />}>
                      <textarea
                        className={`${inputClass} min-h-[96px] resize-y`}
                        value={profile.address}
                        onChange={(e) => updateProfile("address", e.target.value)}
                      />
                    </Field>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#070c14] p-6">
                <div className="mb-5 flex items-center gap-3">
                  <ShieldCheck className="text-emerald-400" size={22} />
                  <h2 className="text-xl font-semibold">Emergency Contact</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Emergency Contact Name">
                    <input
                      className={inputClass}
                      value={profile.emergencyContactName}
                      onChange={(e) =>
                        updateProfile("emergencyContactName", e.target.value)
                      }
                    />
                  </Field>
                  <Field label="Emergency Contact Phone" icon={<Phone size={16} />}>
                    <input
                      className={inputClass}
                      value={profile.emergencyContactPhone}
                      onChange={(e) =>
                        updateProfile("emergencyContactPhone", e.target.value)
                      }
                    />
                  </Field>
                </div>
              </section>

              <section className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#070c14] p-6">
                <div className="mb-5 flex items-center gap-3">
                  <Bell className="text-yellow-400" size={22} />
                  <h2 className="text-xl font-semibold">Notifications</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Toggle
                    title="Email Notifications"
                    description="Receive important account and care updates by email."
                    checked={preferences.emailNotifications}
                    onChange={(value) =>
                      updatePreference("emailNotifications", value)
                    }
                  />
                  <Toggle
                    title="Shift Reminders"
                    description="Keep reminders enabled for upcoming assigned shifts."
                    checked={preferences.shiftReminders}
                    onChange={(value) => updatePreference("shiftReminders", value)}
                  />
                  <Toggle
                    title="Check-in Alerts"
                    description="Show alerts for due and overdue care check-ins."
                    checked={preferences.checkinAlerts}
                    onChange={(value) => updatePreference("checkinAlerts", value)}
                  />
                  <Toggle
                    title="Incident Alerts"
                    description="Keep incident-related dashboard prompts visible."
                    checked={preferences.incidentAlerts}
                    onChange={(value) => updatePreference("incidentAlerts", value)}
                  />
                </div>
              </section>

              <section className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#070c14] p-6">
                <div className="mb-5 flex items-center gap-3">
                  <Eye className="text-purple-400" size={22} />
                  <h2 className="text-xl font-semibold">Display Preferences</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Toggle
                    title="Compact View"
                    description="Use tighter spacing in supported staff screens."
                    checked={preferences.compactView}
                    onChange={(value) => updatePreference("compactView", value)}
                  />
                  <Toggle
                    title="High Contrast"
                    description="Prefer stronger contrast for text and controls."
                    checked={preferences.highContrast}
                    onChange={(value) => updatePreference("highContrast", value)}
                  />
                </div>
              </section>

              <section className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#070c14] p-6">
                <div className="mb-5 flex items-center gap-3">
                  <Lock className="text-red-400" size={22} />
                  <h2 className="text-xl font-semibold">Password</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-5 md:items-end">
                  <Field label="New Password">
                    <input
                      type="password"
                      className={inputClass}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </Field>
                  <Field label="Confirm Password">
                    <input
                      type="password"
                      className={inputClass}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </Field>
                  <button
                    onClick={updatePassword}
                    disabled={savingPassword}
                    className="h-11 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                  >
                    {savingPassword ? "Updating..." : "Update"}
                  </button>
                </div>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className={`${labelClass} flex items-center gap-2`}>
        {icon}
        {label}
      </span>
      {children}
    </label>
  );
}

function Toggle({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-black/10 dark:border-white/10 bg-slate-50 dark:bg-[#0b1018] p-4">
      <span>
        <span className="block text-sm font-semibold text-slate-900 dark:text-white">
          {title}
        </span>
        <span className="mt-1 block text-sm text-slate-600 dark:text-slate-400">
          {description}
        </span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-5 w-5 accent-sky-500"
      />
    </label>
  );
}
