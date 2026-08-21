import { useEffect, useState } from "react";
import { AlertCircle, Calendar, CheckCircle2, ExternalLink, FileText, Loader2, Mail, MapPin, Moon, Phone, Save, Settings2, Sun, Upload, User, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import StaffSidebar from "../components/StaffSidebar";
import Navbar from "../components/Navbar";
import { useTheme } from "../context/ThemeContext";
import { supabase } from "../lib/supabase";

type ProfileForm = { full_name: string; email: string; phone: string; address: string; date_of_birth: string; gender: string; emergency_contact_name: string; emergency_contact_phone: string };
type StaffDocument = { id: string; name: string | null; file_name: string | null; file_path: string | null; created_at: string };
const emptyForm: ProfileForm = { full_name: "", email: "", phone: "", address: "", date_of_birth: "", gender: "", emergency_contact_name: "", emergency_contact_phone: "" };
const inputClass = "w-full h-[46px] px-4 rounded-[14px] border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-[#0c1118] text-black dark:text-white outline-none focus:border-sky-300 transition-colors placeholder:text-gray-400 disabled:opacity-60";
const labelClass = "text-gray-600 dark:text-gray-400 text-[12px] uppercase font-medium mb-1.5 flex items-center gap-1.5";

export default function StaffSettings() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [staffName, setStaffName] = useState("Staff");
  const [staffRole, setStaffRole] = useState("staff");
  const [profileId, setProfileId] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [initialForm, setInitialForm] = useState(emptyForm);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [documents, setDocuments] = useState<StaffDocument[]>([]);
  const [documentName, setDocumentName] = useState("");
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { void loadSettings(); }, []);

  async function loadDocuments(staffId: string, orgId: string) {
    const { data, error } = await supabase.from("staff_documents").select("id, name, file_name, file_path, created_at").eq("staff_id", staffId).eq("organization_id", orgId).order("created_at", { ascending: false });
    if (error) console.error(error);
    else setDocuments((data || []) as StaffDocument[]);
  }

  async function loadSettings() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { navigate("/login"); return; }
      const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
      if (error || !profile || profile.role !== "staff") { navigate("/login"); return; }
      const loaded: ProfileForm = {
        full_name: profile.full_name || "", email: profile.email || session.user.email || "", phone: profile.phone || "", address: profile.address || "",
        date_of_birth: profile.date_of_birth || "", gender: profile.gender || "", emergency_contact_name: profile.emergency_contact_name || "", emergency_contact_phone: profile.emergency_contact_phone || "",
      };
      setProfileId(profile.id); setOrganizationId(profile.organization_id || null); setStaffName(profile.full_name || "Staff"); setStaffRole(profile.role); setForm(loaded); setInitialForm(loaded);
      if (profile.organization_id) await loadDocuments(profile.id, profile.organization_id);
    } catch (error) { console.error(error); navigate("/login"); }
    finally { setLoading(false); }
  }

  const handleChange = (field: keyof ProfileForm, value: string) => { setForm((current) => ({ ...current, [field]: value })); setSaveStatus("idle"); };
  const hasChanges = JSON.stringify(form) !== JSON.stringify(initialForm);

  async function handleSave() {
    if (!profileId) return;
    setSaving(true); setSaveStatus("idle"); setErrorMessage("");
    const { error } = await supabase.from("profiles").update({ full_name: form.full_name || null, phone: form.phone || null, address: form.address || null, date_of_birth: form.date_of_birth || null, gender: form.gender || null, emergency_contact_name: form.emergency_contact_name || null, emergency_contact_phone: form.emergency_contact_phone || null }).eq("id", profileId);
    setSaving(false);
    if (error) { console.error(error); setSaveStatus("error"); setErrorMessage("Failed to save changes. Please try again."); return; }
    setInitialForm(form); setStaffName(form.full_name || "Staff"); setSaveStatus("success"); window.setTimeout(() => setSaveStatus("idle"), 3000);
  }

  async function uploadDocument() {
    if (!profileId || !organizationId) { alert("Your organisation details are missing. Please contact an administrator."); return; }
    if (!documentName.trim() || !documentFile) { alert("Please provide a document name and choose a file."); return; }
    setUploading(true);
    const safeName = documentFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `${organizationId}/${profileId}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from("staff-documents").upload(filePath, documentFile);
    if (uploadError) { console.error(uploadError); alert("Failed to upload the file."); setUploading(false); return; }
    const { error } = await supabase.from("staff_documents").insert({ staff_id: profileId, organization_id: organizationId, name: documentName.trim(), file_path: filePath, file_url: null, file_name: documentFile.name });
    if (error) { console.error(error); await supabase.storage.from("staff-documents").remove([filePath]); alert("Failed to save the document record."); setUploading(false); return; }
    setDocumentName(""); setDocumentFile(null); setFileInputKey((key) => key + 1); await loadDocuments(profileId, organizationId); setUploading(false);
  }

  async function openDocument(filePath: string) {
    const { data, error } = await supabase.storage.from("staff-documents").createSignedUrl(filePath, 600);
    if (error || !data?.signedUrl) { console.error(error); alert("Unable to open this document."); return; }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  const logout = async () => { await supabase.auth.signOut(); navigate("/login"); };

  return <div className="min-h-screen bg-white dark:bg-[#03060b] text-black dark:text-white flex overflow-x-hidden transition-colors duration-300">
    <StaffSidebar onLogout={logout} />
    <div className="flex-1 w-full min-w-0 overflow-y-auto overflow-x-hidden lg:ml-[245px] min-h-screen bg-gray-50 dark:bg-[#03060b] pt-[78px]">
      <Navbar name={staffName} role={staffRole} />
      <main className="w-full p-3 sm:p-5 lg:p-7 overflow-hidden">
        {loading ? <div className="flex min-h-[calc(100vh-78px)] flex-col items-center justify-center gap-5"><Loader2 className="h-16 w-16 animate-spin text-sky-400" /><h2 className="text-xl font-semibold">Loading Settings ..</h2></div> : <>
          <header className="rounded-[20px] sm:rounded-[24px] border border-black/10 dark:border-white/10 bg-white dark:bg-[#070c14] p-4 sm:p-6 mb-6 flex items-center gap-3">
            <Settings2 className="text-sky-300" size={26} /><div><h1 className="text-[22px] sm:text-[26px] font-semibold mb-1">Settings</h1><p className="text-gray-600 dark:text-gray-500 text-[13px]">Manage your appearance, profile details and documents.</p></div>
          </header>
          <div className="grid grid-cols-1 xl:grid-cols-[1fr,1.6fr] gap-6 items-start">
            <div className="space-y-6">
              <Card><div className="flex items-center gap-3 mb-6">{theme === "dark" ? <Moon className="text-sky-300" size={22} /> : <Sun className="text-amber-400" size={22} />}<h2 className="text-[20px] font-semibold">Appearance</h2></div>
                <div className="rounded-[16px] border border-black/10 dark:border-white/10 bg-gray-100 dark:bg-[#0c1118] p-4 flex items-center justify-between gap-4"><div><p className="font-semibold">{theme === "dark" ? "Dark Mode" : "Light Mode"}</p><p className="text-gray-600 dark:text-gray-500 text-sm mt-1">Switch between light and dark themes.</p></div><button role="switch" aria-checked={theme === "dark"} onClick={toggleTheme} className={`relative w-[56px] h-[30px] rounded-full shrink-0 ${theme === "dark" ? "bg-gradient-to-r from-sky-400 to-emerald-300" : "bg-gray-300"}`}><span className={`absolute top-[3px] left-[3px] w-[24px] h-[24px] rounded-full bg-white shadow-md flex items-center justify-center transition-transform ${theme === "dark" ? "translate-x-[26px]" : ""}`}>{theme === "dark" ? <Moon size={13} className="text-sky-500" /> : <Sun size={13} className="text-amber-500" />}</span></button></div>
              </Card>
              <Card><div className="flex items-center gap-3 mb-5"><FileText className="text-sky-300" size={22} /><div><h2 className="text-[20px] font-semibold">My Documents</h2><p className="text-xs text-gray-500 mt-1">Add a clear name before uploading.</p></div></div>
                <div className="space-y-3"><input value={documentName} onChange={(e) => setDocumentName(e.target.value)} placeholder="Document name (e.g. Passport)" className={inputClass} /><input key={fileInputKey} type="file" onChange={(e) => setDocumentFile(e.target.files?.[0] || null)} className={`${inputClass} file:mr-3 file:rounded-lg file:border-0 file:bg-sky-500 file:px-3 file:py-1.5 file:text-white`} /><button onClick={uploadDocument} disabled={uploading} className="w-full h-[46px] rounded-[14px] bg-sky-500 hover:bg-sky-600 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50">{uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}{uploading ? "Uploading..." : "Upload Document"}</button></div>
                <div className="mt-5 space-y-3">{documents.map((doc) => <div key={doc.id} className="rounded-[14px] border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-[#0c1118] p-3 flex items-center justify-between gap-3"><div className="min-w-0"><p className="font-medium truncate">{doc.name || "Untitled document"}</p><p className="text-xs text-gray-500 mt-1 truncate">{doc.file_name || new Date(doc.created_at).toLocaleDateString("en-GB")}</p></div>{doc.file_path && <button onClick={() => void openDocument(doc.file_path!)} className="shrink-0 text-sky-500" aria-label={`Open ${doc.name || "document"}`}><ExternalLink size={18} /></button>}</div>)}{documents.length === 0 && <div className="rounded-[14px] border border-dashed border-black/10 dark:border-white/10 p-5 text-center text-sm text-gray-500">No documents uploaded yet.</div>}</div>
              </Card>
            </div>
            <Card><div className="flex items-center gap-3 mb-6"><User className="text-emerald-300" size={22} /><h2 className="text-[20px] font-semibold">Profile Details</h2></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><Field label="Full Name" icon={<User size={14} />} value={form.full_name} onChange={(v) => handleChange("full_name", v)} placeholder="Jane Doe" /><Field label="Email" icon={<Mail size={14} />} value={form.email} disabled onChange={() => {}} /><Field label="Phone" icon={<Phone size={14} />} value={form.phone} onChange={(v) => handleChange("phone", v)} placeholder="+44 7000 000000" /><Field label="Date of Birth" icon={<Calendar size={14} />} type="date" value={form.date_of_birth} onChange={(v) => handleChange("date_of_birth", v)} /><div className="sm:col-span-2"><Field label="Address" icon={<MapPin size={14} />} value={form.address} onChange={(v) => handleChange("address", v)} placeholder="123 Example Street, London" /></div><div><label className={labelClass}>Gender</label><select value={form.gender} onChange={(e) => handleChange("gender", e.target.value)} className={inputClass}><option value="">Prefer not to say</option><option value="female">Female</option><option value="male">Male</option><option value="non_binary">Non-binary</option><option value="other">Other</option></select></div><Field label="Emergency Contact Name" icon={<Users size={14} />} value={form.emergency_contact_name} onChange={(v) => handleChange("emergency_contact_name", v)} /><Field label="Emergency Contact Phone" icon={<Phone size={14} />} value={form.emergency_contact_phone} onChange={(v) => handleChange("emergency_contact_phone", v)} /></div>
              {saveStatus === "success" && <p className="mt-5 flex items-center gap-2 text-emerald-500 text-sm"><CheckCircle2 size={16} />Profile updated successfully.</p>}{saveStatus === "error" && <p className="mt-5 flex items-center gap-2 text-red-500 text-sm"><AlertCircle size={16} />{errorMessage}</p>}
              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 pt-5 border-t border-black/10 dark:border-white/10">{hasChanges && <button onClick={() => { setForm(initialForm); setSaveStatus("idle"); }} className="h-[46px] px-5 rounded-[14px] border border-black/10 dark:border-white/10 font-medium">Discard Changes</button>}<button onClick={handleSave} disabled={saving || !hasChanges} className="h-[46px] px-6 rounded-[14px] bg-gradient-to-r from-sky-400 to-emerald-300 text-black font-semibold flex items-center justify-center gap-2 disabled:opacity-50">{saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}{saving ? "Saving..." : "Save Changes"}</button></div>
            </Card>
          </div>
        </>}
      </main>
    </div>
  </div>;
}

function Card({ children }: { children: React.ReactNode }) { return <section className="rounded-[20px] sm:rounded-[24px] border border-black/10 dark:border-white/10 bg-white dark:bg-[#070c14] p-4 sm:p-6">{children}</section>; }
function Field({ label, icon, value, onChange, placeholder, type = "text", disabled = false }: { label: string; icon?: React.ReactNode; value: string; onChange: (value: string) => void; placeholder?: string; type?: string; disabled?: boolean }) { return <div><label className={labelClass}>{icon}{label}</label><input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} className={inputClass} /></div>; }
