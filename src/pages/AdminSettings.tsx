import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  CreditCard,
  ImageUp,
  Mail,
  MapPin,
  Phone,
  Save,
  Settings,
  UploadCloud,
} from "lucide-react";
import AdminSidebar from "../components/AdminSidebar";
import Navbar from "../components/Navbar";
import { supabase } from "../lib/supabase";

type AdminSettingsForm = {
  organizationName: string;
  contactEmail: string;
  contactPhone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postcode: string;
  country: string;
  timezone: string;
  currency: string;
  invoicePrefix: string;
  invoicePaymentTerms: string;
  vatNumber: string;
  companyRegistrationNumber: string;
  bankName: string;
  bankAccountName: string;
  bankSortCode: string;
  bankAccountNumber: string;
  invoiceFooter: string;
  invoiceLogoUrl: string;
};

const initialForm: AdminSettingsForm = {
  organizationName: "",
  contactEmail: "",
  contactPhone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  postcode: "",
  country: "United Kingdom",
  timezone: "Europe/London",
  currency: "GBP",
  invoicePrefix: "INV",
  invoicePaymentTerms: "Payment due within 14 days",
  vatNumber: "",
  companyRegistrationNumber: "",
  bankName: "",
  bankAccountName: "",
  bankSortCode: "",
  bankAccountNumber: "",
  invoiceFooter: "Thank you for choosing JAES Care.",
  invoiceLogoUrl: "",
};

const inputClass =
  "w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0b1018] px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-sky-400";

const labelClass = "mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300";

export default function AdminSettings() {
  const [adminName, setAdminName] = useState("Admin");
  const [organizationId, setOrganizationId] = useState("");
  const [form, setForm] = useState<AdminSettingsForm>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const logoName = useMemo(() => {
    if (!form.invoiceLogoUrl) return "No logo uploaded";

    return form.invoiceLogoUrl.split("/").pop()?.split("?")[0] || "Uploaded logo";
  }, [form.invoiceLogoUrl]);

  useEffect(() => {
    loadSettings();
  }, []);

  const updateField = (key: keyof AdminSettingsForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
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

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, organization_id")
      .eq("id", session.user.id)
      .maybeSingle();

    if (profileError || !profile?.organization_id) {
      console.error(profileError);
      setLoading(false);
      return;
    }

    setAdminName(profile.full_name || "Admin");
    setOrganizationId(profile.organization_id);

    const { data: organization, error: organizationError } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", profile.organization_id)
      .maybeSingle();

    if (organizationError) {
      console.error(organizationError);
      setLoading(false);
      return;
    }

    setForm({
      organizationName: organization?.name || organization?.organization_name || "",
      contactEmail: organization?.contact_email || "",
      contactPhone: organization?.contact_phone || "",
      addressLine1: organization?.address_line_1 || "",
      addressLine2: organization?.address_line_2 || "",
      city: organization?.city || "",
      postcode: organization?.postcode || "",
      country: organization?.country || "United Kingdom",
      timezone: organization?.timezone || "Europe/London",
      currency: organization?.currency || "GBP",
      invoicePrefix: organization?.invoice_prefix || "INV",
      invoicePaymentTerms:
        organization?.invoice_payment_terms || "Payment due within 14 days",
      vatNumber: organization?.vat_number || "",
      companyRegistrationNumber:
        organization?.company_registration_number || "",
      bankName: organization?.bank_name || "",
      bankAccountName: organization?.bank_account_name || "",
      bankSortCode: organization?.bank_sort_code || "",
      bankAccountNumber: organization?.bank_account_number || "",
      invoiceFooter:
        organization?.invoice_footer || "Thank you for choosing JAES Care.",
      invoiceLogoUrl: organization?.invoice_logo_url || "",
    });

    setLoading(false);
  };

  const uploadLogo = async (file?: File) => {
    if (!file || !organizationId) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file.");
      return;
    }

    setUploadingLogo(true);

    const extension = file.name.split(".").pop() || "png";
    const filePath = `${organizationId}/invoice-logo-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("organization-assets")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error(uploadError);
      alert(
        "Logo upload failed. Please make sure the organization-assets storage bucket exists.",
      );
      setUploadingLogo(false);
      return;
    }

    const { data } = supabase.storage
      .from("organization-assets")
      .getPublicUrl(filePath);

    updateField("invoiceLogoUrl", data.publicUrl);
    setUploadingLogo(false);
  };

  const saveSettings = async () => {
    if (!organizationId) return;

    setSaving(true);

    const { error } = await supabase
      .from("organizations")
      .update({
        name: form.organizationName,
        contact_email: form.contactEmail,
        contact_phone: form.contactPhone,
        address_line_1: form.addressLine1,
        address_line_2: form.addressLine2,
        city: form.city,
        postcode: form.postcode,
        country: form.country,
        timezone: form.timezone,
        currency: form.currency,
        invoice_prefix: form.invoicePrefix,
        invoice_payment_terms: form.invoicePaymentTerms,
        vat_number: form.vatNumber,
        company_registration_number: form.companyRegistrationNumber,
        bank_name: form.bankName,
        bank_account_name: form.bankAccountName,
        bank_sort_code: form.bankSortCode,
        bank_account_number: form.bankAccountNumber,
        invoice_footer: form.invoiceFooter,
        invoice_logo_url: form.invoiceLogoUrl,
      })
      .eq("id", organizationId);

    setSaving(false);

    if (error) {
      console.error(error);
      alert(
        "Settings could not be saved. Please check the organizations table has the settings columns.",
      );
      return;
    }

    alert("Settings saved successfully.");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#03060b] text-slate-900 dark:text-white">
      <AdminSidebar onLogout={handleLogout} />

      <div className="lg:ml-[245px] min-h-screen">
        <Navbar name={adminName} role="Admin" />

        <main className="pt-24 px-4 sm:px-6 lg:px-8 pb-8 max-w-7xl mx-auto">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Manage organisation details, invoice branding and payment settings.
              </p>
            </div>
            <button
              onClick={saveSettings}
              disabled={saving || loading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-sky-500 px-5 text-sm font-semibold text-white transition hover:bg-sky-600 disabled:opacity-60"
            >
              <Save size={18} />
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#070c14] p-8 text-sm text-slate-600 dark:text-slate-300">
              Loading settings...
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
              <div className="space-y-6">
                <section className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#070c14] p-6">
                  <div className="mb-5 flex items-center gap-3">
                    <Building2 className="text-sky-400" size={22} />
                    <h2 className="text-xl font-semibold">Organisation Details</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Field label="Organisation Name">
                      <input
                        className={inputClass}
                        value={form.organizationName}
                        onChange={(e) =>
                          updateField("organizationName", e.target.value)
                        }
                      />
                    </Field>
                    <Field label="Contact Email" icon={<Mail size={16} />}>
                      <input
                        type="email"
                        className={inputClass}
                        value={form.contactEmail}
                        onChange={(e) => updateField("contactEmail", e.target.value)}
                      />
                    </Field>
                    <Field label="Contact Phone" icon={<Phone size={16} />}>
                      <input
                        className={inputClass}
                        value={form.contactPhone}
                        onChange={(e) => updateField("contactPhone", e.target.value)}
                      />
                    </Field>
                    <Field label="Timezone">
                      <select
                        className={inputClass}
                        value={form.timezone}
                        onChange={(e) => updateField("timezone", e.target.value)}
                      >
                        <option value="Europe/London">Europe/London</option>
                      </select>
                    </Field>
                    <Field label="Address Line 1" icon={<MapPin size={16} />}>
                      <input
                        className={inputClass}
                        value={form.addressLine1}
                        onChange={(e) => updateField("addressLine1", e.target.value)}
                      />
                    </Field>
                    <Field label="Address Line 2">
                      <input
                        className={inputClass}
                        value={form.addressLine2}
                        onChange={(e) => updateField("addressLine2", e.target.value)}
                      />
                    </Field>
                    <Field label="City">
                      <input
                        className={inputClass}
                        value={form.city}
                        onChange={(e) => updateField("city", e.target.value)}
                      />
                    </Field>
                    <Field label="Postcode">
                      <input
                        className={inputClass}
                        value={form.postcode}
                        onChange={(e) => updateField("postcode", e.target.value)}
                      />
                    </Field>
                    <Field label="Country">
                      <input
                        className={inputClass}
                        value={form.country}
                        onChange={(e) => updateField("country", e.target.value)}
                      />
                    </Field>
                  </div>
                </section>

                <section className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#070c14] p-6">
                  <div className="mb-5 flex items-center gap-3">
                    <CreditCard className="text-emerald-400" size={22} />
                    <h2 className="text-xl font-semibold">Invoice Settings</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Field label="Invoice Prefix">
                      <input
                        className={inputClass}
                        value={form.invoicePrefix}
                        onChange={(e) => updateField("invoicePrefix", e.target.value)}
                      />
                    </Field>
                    <Field label="Currency">
                      <select
                        className={inputClass}
                        value={form.currency}
                        onChange={(e) => updateField("currency", e.target.value)}
                      >
                        <option value="GBP">GBP</option>
                        <option value="EUR">EUR</option>
                        <option value="USD">USD</option>
                      </select>
                    </Field>
                    <Field label="VAT Number">
                      <input
                        className={inputClass}
                        value={form.vatNumber}
                        onChange={(e) => updateField("vatNumber", e.target.value)}
                      />
                    </Field>
                    <Field label="Company Registration Number">
                      <input
                        className={inputClass}
                        value={form.companyRegistrationNumber}
                        onChange={(e) =>
                          updateField("companyRegistrationNumber", e.target.value)
                        }
                      />
                    </Field>
                    <Field label="Payment Terms">
                      <input
                        className={inputClass}
                        value={form.invoicePaymentTerms}
                        onChange={(e) =>
                          updateField("invoicePaymentTerms", e.target.value)
                        }
                      />
                    </Field>
                    <Field label="Bank Name">
                      <input
                        className={inputClass}
                        value={form.bankName}
                        onChange={(e) => updateField("bankName", e.target.value)}
                      />
                    </Field>
                    <Field label="Account Name">
                      <input
                        className={inputClass}
                        value={form.bankAccountName}
                        onChange={(e) =>
                          updateField("bankAccountName", e.target.value)
                        }
                      />
                    </Field>
                    <Field label="Sort Code">
                      <input
                        className={inputClass}
                        value={form.bankSortCode}
                        onChange={(e) => updateField("bankSortCode", e.target.value)}
                      />
                    </Field>
                    <Field label="Account Number">
                      <input
                        className={inputClass}
                        value={form.bankAccountNumber}
                        onChange={(e) =>
                          updateField("bankAccountNumber", e.target.value)
                        }
                      />
                    </Field>
                    <div className="md:col-span-2">
                      <Field label="Invoice Footer">
                        <textarea
                          className={`${inputClass} min-h-[110px] resize-y`}
                          value={form.invoiceFooter}
                          onChange={(e) =>
                            updateField("invoiceFooter", e.target.value)
                          }
                        />
                      </Field>
                    </div>
                  </div>
                </section>
              </div>

              <aside className="space-y-6">
                <section className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#070c14] p-6">
                  <div className="mb-5 flex items-center gap-3">
                    <ImageUp className="text-yellow-400" size={22} />
                    <h2 className="text-xl font-semibold">Invoice Logo</h2>
                  </div>

                  <div className="mb-4 flex aspect-[3/2] items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-[#0b1018] p-4">
                    {form.invoiceLogoUrl ? (
                      <img
                        src={form.invoiceLogoUrl}
                        alt="Client invoice logo"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <UploadCloud className="text-slate-400" size={42} />
                    )}
                  </div>

                  <p className="mb-4 truncate text-sm text-slate-600 dark:text-slate-400">
                    {logoName}
                  </p>

                  <label className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
                    <UploadCloud size={18} />
                    {uploadingLogo ? "Uploading..." : "Upload Logo"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingLogo}
                      onChange={(e) => uploadLogo(e.target.files?.[0])}
                    />
                  </label>
                </section>

                <section className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#070c14] p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <Settings className="text-sky-400" size={22} />
                    <h2 className="text-xl font-semibold">Essentials</h2>
                  </div>
                  <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                    <p>Logo appears on generated invoices.</p>
                    <p>Invoice defaults are used for payment and organisation details.</p>
                    <p>Timezone remains locked to UK time for shifts and care records.</p>
                  </div>
                </section>
              </aside>
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
  icon?: React.ReactNode;
  children: React.ReactNode;
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
