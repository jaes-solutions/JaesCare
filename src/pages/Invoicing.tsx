import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import AdminSidebar from "../components/AdminSidebar";
import Navbar from "../components/Navbar";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";

type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
};

type InvoiceSettings = {
  id?: string;
  organization_id?: string;
  // NOTE: the "invoice-branding" bucket is PRIVATE, so this no longer holds
  // a public URL. It holds the storage object PATH (e.g. "logos/169...-logo.png").
  // A signed URL is generated on demand wherever the logo needs to be shown.
  logo_url: string | null;
  company_name: string;
  address_line1: string;
  address_line2: string;
  city: string;
  postcode: string;
  country: string;
  email: string;
  phone: string;
  tax_number: string;
  bank_name: string;
  bank_account_name: string;
  bank_sort_code: string;
  bank_account_number: string;
  invoice_prefix: string;
  default_tax_rate: number;
  footer_note: string;
  accent_color: string;
};

type Invoice = {
  id: string;
  organization_id: string;
  invoice_number: string;
  client_name: string;
  client_address: string;
  client_email: string;
  issue_date: string;
  due_date: string;
  status: InvoiceStatus;
  items: InvoiceItem[];
  tax_rate: number;
  discount: number;
  notes: string;
  created_at?: string;
};

const DEFAULT_SETTINGS: InvoiceSettings = {
  logo_url: null,
  company_name: "Your Company Ltd",
  address_line1: "1 Business Street",
  address_line2: "",
  city: "London",
  postcode: "EC1A 1AA",
  country: "United Kingdom",
  email: "accounts@yourcompany.com",
  phone: "+44 20 0000 0000",
  tax_number: "",
  bank_name: "",
  bank_account_name: "",
  bank_sort_code: "",
  bank_account_number: "",
  invoice_prefix: "INV",
  default_tax_rate: 0,
  footer_note: "Thank you for your business.",
  accent_color: "#0ea5e9", // sky-500, matches the rest of the admin app
};

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  overdue: "Overdue",
  cancelled: "Cancelled",
};

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  draft: "bg-gray-500/10 text-gray-500",
  sent: "bg-sky-500/10 text-sky-500",
  paid: "bg-emerald-500/10 text-emerald-500",
  overdue: "bg-rose-500/10 text-rose-500",
  cancelled: "bg-gray-500/10 text-gray-400 line-through",
};

function newItemRow(): InvoiceItem {
  return {
    id: crypto.randomUUID(),
    description: "",
    quantity: 1,
    unit_price: 0,
  };
}

function money(value: number) {
  return `£${(value || 0).toFixed(2)}`;
}

function slugify(value: string) {
  return (value || "record")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function calcInvoiceTotals(
  invoice: Pick<Invoice, "items" | "tax_rate" | "discount">,
) {
  const subtotal = (invoice.items || []).reduce(
    (sum, item) =>
      sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0),
    0,
  );
  const discountAmount = subtotal * ((invoice.discount || 0) / 100);
  const taxable = subtotal - discountAmount;
  const taxAmount = taxable * ((invoice.tax_rate || 0) / 100);
  const total = taxable + taxAmount;
  return { subtotal, discountAmount, taxAmount, total };
}

// ---------------------------------------------------------------------------
// Private bucket helper
// ---------------------------------------------------------------------------

// "invoice-branding" is a PRIVATE bucket, so we can't use getPublicUrl().
// Instead we store the object's storage path and mint a short-lived signed
// URL every time we actually need to render or download the logo.
// Note: the caller (current authenticated user) still needs a storage RLS
// policy granting SELECT on this bucket's objects, or this will error out.
async function getSignedLogoUrl(
  path: string | null | undefined,
  expiresIn = 60 * 60, // 1 hour
): Promise<string | null> {
  if (!path) return null;

  const { data, error } = await supabase.storage
    .from("invoice-branding")
    .createSignedUrl(path, expiresIn);

  if (error) {
    console.error(error);
    return null;
  }

  return data.signedUrl;
}

// ---------------------------------------------------------------------------
// PDF export
// ---------------------------------------------------------------------------

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  if (clean.length !== 6 || isNaN(bigint)) return [14, 165, 233];
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

async function loadImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function downloadInvoicePdf(invoice: Invoice, settings: InvoiceSettings) {
  const doc = new jsPDF();
  const accent = hexToRgb(settings.accent_color || "#0ea5e9");
  const { subtotal, discountAmount, taxAmount, total } =
    calcInvoiceTotals(invoice);

  // Header band
  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.rect(0, 0, 210, 32, "F");

  let logoDrawn = false;
  if (settings.logo_url) {
    // settings.logo_url is a private storage PATH — sign it first, then fetch.
    const signedUrl = await getSignedLogoUrl(settings.logo_url);
    const dataUrl = signedUrl ? await loadImageAsDataUrl(signedUrl) : null;
    if (dataUrl) {
      try {
        doc.addImage(dataUrl, "PNG", 14, 7, 18, 18, undefined, "FAST");
        logoDrawn = true;
      } catch {
        logoDrawn = false;
      }
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text(settings.company_name || "Company", logoDrawn ? 36 : 14, 15);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const addressLine = [
    settings.address_line1,
    settings.address_line2,
    settings.city,
    settings.postcode,
    settings.country,
  ]
    .filter(Boolean)
    .join(", ");
  doc.text(addressLine, logoDrawn ? 36 : 14, 22, { maxWidth: 130 });

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", 196, 15, { align: "right" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(invoice.invoice_number || "—", 196, 22, { align: "right" });

  doc.setTextColor(20, 20, 20);

  // Bill to / dates
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text("BILL TO", 14, 42);
  doc.text("ISSUE DATE", 140, 42);
  doc.text("DUE DATE", 175, 42);

  doc.setTextColor(20, 20, 20);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(invoice.client_name || "—", 14, 48);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(invoice.client_address || "—", 14, 53, { maxWidth: 110 });
  if (invoice.client_email) doc.text(invoice.client_email, 14, 58);

  doc.text(invoice.issue_date || "—", 140, 48);
  doc.text(invoice.due_date || "—", 175, 48);

  // Line items
  autoTable(doc, {
    startY: 66,
    head: [["Description", "Qty", "Unit Price", "Amount"]],
    body: (invoice.items || []).map((item) => [
      item.description || "—",
      String(item.quantity ?? 0),
      money(Number(item.unit_price) || 0),
      money((Number(item.quantity) || 0) * (Number(item.unit_price) || 0)),
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: accent },
    columnStyles: {
      1: { halign: "right", cellWidth: 20 },
      2: { halign: "right", cellWidth: 30 },
      3: { halign: "right", cellWidth: 30 },
    },
  });

  const afterTableY = (doc as any).lastAutoTable.finalY + 8;

  const totalsX = 140;
  let y = afterTableY;
  doc.setFontSize(9);
  doc.setTextColor(90, 90, 90);
  doc.text("Subtotal", totalsX, y);
  doc.setTextColor(20, 20, 20);
  doc.text(money(subtotal), 196, y, { align: "right" });

  if (invoice.discount) {
    y += 6;
    doc.setTextColor(90, 90, 90);
    doc.text(`Discount (${invoice.discount}%)`, totalsX, y);
    doc.setTextColor(20, 20, 20);
    doc.text(`-${money(discountAmount)}`, 196, y, { align: "right" });
  }

  if (invoice.tax_rate) {
    y += 6;
    doc.setTextColor(90, 90, 90);
    doc.text(`Tax (${invoice.tax_rate}%)`, totalsX, y);
    doc.setTextColor(20, 20, 20);
    doc.text(money(taxAmount), 196, y, { align: "right" });
  }

  y += 4;
  doc.setDrawColor(accent[0], accent[1], accent[2]);
  doc.line(totalsX, y, 196, y);
  y += 7;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(accent[0], accent[1], accent[2]);
  doc.text("Total Due", totalsX, y);
  doc.text(money(total), 196, y, { align: "right" });

  if (invoice.notes) {
    y += 14;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 20, 20);
    doc.text("Notes", 14, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(90, 90, 90);
    doc.text(invoice.notes, 14, y + 5, { maxWidth: 182 });
  }

  // Footer: bank details + note
  const pageHeight = doc.internal.pageSize.height;
  doc.setDrawColor(230, 230, 230);
  doc.line(14, pageHeight - 32, 196, pageHeight - 32);

  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  const bankParts = [
    settings.bank_name && `Bank: ${settings.bank_name}`,
    settings.bank_account_name && `Account name: ${settings.bank_account_name}`,
    settings.bank_sort_code && `Sort code: ${settings.bank_sort_code}`,
    settings.bank_account_number &&
      `Account no: ${settings.bank_account_number}`,
  ].filter(Boolean);
  if (bankParts.length) {
    doc.text(bankParts.join("   ·   "), 14, pageHeight - 25, { maxWidth: 182 });
  }
  if (settings.tax_number) {
    doc.text(`Tax / VAT number: ${settings.tax_number}`, 14, pageHeight - 20);
  }
  const contactParts = [settings.email, settings.phone]
    .filter(Boolean)
    .join("   ·   ");
  if (contactParts) doc.text(contactParts, 14, pageHeight - 15);
  if (settings.footer_note) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text(settings.footer_note, 14, pageHeight - 9);
  }

  doc.save(`${slugify(invoice.invoice_number || "invoice")}.pdf`);
}

// ---------------------------------------------------------------------------
// Small shared UI bits (kept visually consistent with the rest of the admin)
// ---------------------------------------------------------------------------

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs uppercase tracking-wide text-gray-500">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "rounded-xl border border-black/10 dark:border-white/[0.1] bg-white dark:bg-[#060b12]/95 px-4 py-3 text-black dark:text-white outline-none focus:ring-2 focus:ring-sky-500 w-full";

function SummaryStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#070c14] px-5 py-4">
      <p className="text-xs uppercase tracking-wide text-sky-500 font-semibold mb-1">
        {label}
      </p>
      <p className="text-xl font-bold text-black dark:text-white">{value}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Customise Invoice modal — edits the "constant" branding/company details
// ---------------------------------------------------------------------------

function CustomiseInvoiceModal({
  settings,
  onClose,
  onSave,
  saving,
}: {
  settings: InvoiceSettings;
  onClose: () => void;
  onSave: (settings: InvoiceSettings) => void;
  saving: boolean;
}) {
  const [draft, setDraft] = useState<InvoiceSettings>(settings);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  // draft.logo_url holds a private storage PATH, not a renderable URL.
  // We resolve it to a short-lived signed URL just for the <img> preview below.
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);

  const set = (patch: Partial<InvoiceSettings>) =>
    setDraft((prev) => ({ ...prev, ...patch }));

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const signedUrl = await getSignedLogoUrl(draft.logo_url);
      if (!cancelled) setLogoPreviewUrl(signedUrl);
    })();

    return () => {
      cancelled = true;
    };
  }, [draft.logo_url]);

  const handleLogoFile = async (file: File | null) => {
    if (!file) return;
    setUploadingLogo(true);

    const path = `logos/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("invoice-branding")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      console.error(uploadError);
      alert("Failed to upload logo");
      setUploadingLogo(false);
      return;
    }

    // Bucket is private — there is no public URL to fetch. Persist the path
    // instead; it gets resolved to a signed URL wherever it's displayed/used.
    set({ logo_url: path });
    setUploadingLogo(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
      <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#070c14] border border-black/10 dark:border-white/10 shadow-xl">
        <div className="sticky top-0 bg-white dark:bg-[#070c14] border-b border-black/10 dark:border-white/10 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-black dark:text-white">
            Customise Invoice
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl border border-black/10 dark:border-white/10 flex items-center justify-center overflow-hidden bg-black/5 dark:bg-white/5 shrink-0">
              {logoPreviewUrl ? (
                <img
                  src={logoPreviewUrl}
                  alt="Logo"
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-xs text-gray-400">No logo</span>
              )}
            </div>
            <div className="flex-1">
              <Field label="Company Logo">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleLogoFile(e.target.files?.[0] || null)}
                  className={`${inputClass} file:mr-3 file:rounded-lg file:border-0 file:bg-sky-500 file:text-white file:px-3 file:py-1.5`}
                />
              </Field>
              {uploadingLogo && (
                <p className="text-xs text-sky-500 mt-1">Uploading…</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Company Name">
              <input
                className={inputClass}
                value={draft.company_name}
                onChange={(e) => set({ company_name: e.target.value })}
              />
            </Field>
            <Field label="Accent Colour">
              <input
                type="color"
                className={`${inputClass} h-[46px] p-1`}
                value={draft.accent_color}
                onChange={(e) => set({ accent_color: e.target.value })}
              />
            </Field>

            <Field label="Address Line 1">
              <input
                className={inputClass}
                value={draft.address_line1}
                onChange={(e) => set({ address_line1: e.target.value })}
              />
            </Field>
            <Field label="Address Line 2">
              <input
                className={inputClass}
                value={draft.address_line2}
                onChange={(e) => set({ address_line2: e.target.value })}
              />
            </Field>

            <Field label="City">
              <input
                className={inputClass}
                value={draft.city}
                onChange={(e) => set({ city: e.target.value })}
              />
            </Field>
            <Field label="Postcode">
              <input
                className={inputClass}
                value={draft.postcode}
                onChange={(e) => set({ postcode: e.target.value })}
              />
            </Field>

            <Field label="Country">
              <input
                className={inputClass}
                value={draft.country}
                onChange={(e) => set({ country: e.target.value })}
              />
            </Field>
            <Field label="Tax / VAT Number">
              <input
                className={inputClass}
                value={draft.tax_number}
                onChange={(e) => set({ tax_number: e.target.value })}
              />
            </Field>

            <Field label="Email">
              <input
                className={inputClass}
                value={draft.email}
                onChange={(e) => set({ email: e.target.value })}
              />
            </Field>
            <Field label="Phone">
              <input
                className={inputClass}
                value={draft.phone}
                onChange={(e) => set({ phone: e.target.value })}
              />
            </Field>

            <Field label="Invoice Number Prefix">
              <input
                className={inputClass}
                value={draft.invoice_prefix}
                onChange={(e) => set({ invoice_prefix: e.target.value })}
              />
            </Field>
            <Field label="Default Tax Rate (%)">
              <input
                type="number"
                className={inputClass}
                value={draft.default_tax_rate}
                onChange={(e) =>
                  set({ default_tax_rate: Number(e.target.value) })
                }
              />
            </Field>
          </div>

          <div className="border-t border-black/10 dark:border-white/10 pt-4">
            <h3 className="font-semibold text-black dark:text-white mb-3">
              Bank Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Bank Name">
                <input
                  className={inputClass}
                  value={draft.bank_name}
                  onChange={(e) => set({ bank_name: e.target.value })}
                />
              </Field>
              <Field label="Account Name">
                <input
                  className={inputClass}
                  value={draft.bank_account_name}
                  onChange={(e) => set({ bank_account_name: e.target.value })}
                />
              </Field>
              <Field label="Sort Code">
                <input
                  className={inputClass}
                  value={draft.bank_sort_code}
                  onChange={(e) => set({ bank_sort_code: e.target.value })}
                />
              </Field>
              <Field label="Account Number">
                <input
                  className={inputClass}
                  value={draft.bank_account_number}
                  onChange={(e) => set({ bank_account_number: e.target.value })}
                />
              </Field>
            </div>
          </div>

          <Field label="Footer Note (shown on every invoice)">
            <textarea
              className={`${inputClass} min-h-[70px]`}
              value={draft.footer_note}
              onChange={(e) => set({ footer_note: e.target.value })}
            />
          </Field>
        </div>

        <div className="sticky bottom-0 bg-white dark:bg-[#070c14] border-t border-black/10 dark:border-white/10 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition text-black dark:text-white font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(draft)}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 transition text-white font-medium"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Invoice editor (create / edit one invoice)
// ---------------------------------------------------------------------------

function InvoiceEditor({
  invoice,
  settings,
  onClose,
  onSave,
  saving,
}: {
  invoice: Invoice;
  settings: InvoiceSettings;
  onClose: () => void;
  onSave: (invoice: Invoice) => void;
  saving: boolean;
}) {
  const [draft, setDraft] = useState<Invoice>(invoice);

  const set = (patch: Partial<Invoice>) =>
    setDraft((prev) => ({ ...prev, ...patch }));

  const updateItem = (id: string, patch: Partial<InvoiceItem>) => {
    setDraft((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    }));
  };

  const removeItem = (id: string) => {
    setDraft((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));
  };

  const { subtotal, discountAmount, taxAmount, total } =
    calcInvoiceTotals(draft);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
      <div className="w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#070c14] border border-black/10 dark:border-white/10 shadow-xl">
        <div className="sticky top-0 bg-white dark:bg-[#070c14] border-b border-black/10 dark:border-white/10 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-black dark:text-white">
            {invoice.invoice_number
              ? `Edit ${invoice.invoice_number}`
              : "New Invoice"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Invoice Number">
              <input
                className={inputClass}
                value={draft.invoice_number}
                onChange={(e) => set({ invoice_number: e.target.value })}
              />
            </Field>
            <Field label="Status">
              <select
                className={inputClass}
                value={draft.status}
                onChange={(e) =>
                  set({ status: e.target.value as InvoiceStatus })
                }
              >
                {Object.entries(STATUS_LABEL).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Client Name">
              <input
                className={inputClass}
                value={draft.client_name}
                onChange={(e) => set({ client_name: e.target.value })}
              />
            </Field>
            <Field label="Client Email">
              <input
                className={inputClass}
                value={draft.client_email}
                onChange={(e) => set({ client_email: e.target.value })}
              />
            </Field>

            <Field label="Client Address">
              <input
                className={inputClass}
                value={draft.client_address}
                onChange={(e) => set({ client_address: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Issue Date">
                <input
                  type="date"
                  className={inputClass}
                  value={draft.issue_date}
                  onChange={(e) => set({ issue_date: e.target.value })}
                  onClick={(e) => e.currentTarget.showPicker?.()}
                />
              </Field>
              <Field label="Due Date">
                <input
                  type="date"
                  className={inputClass}
                  value={draft.due_date}
                  onChange={(e) => set({ due_date: e.target.value })}
                  onClick={(e) => e.currentTarget.showPicker?.()}
                />
              </Field>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-black dark:text-white">
                Line Items
              </h3>
              <button
                type="button"
                onClick={() => set({ items: [...draft.items, newItemRow()] })}
                className="px-3 py-1.5 rounded-lg bg-sky-500/10 text-sky-500 text-sm font-medium hover:bg-sky-500/20 transition"
              >
                + Add Item
              </button>
            </div>

            <div className="space-y-2">
              {draft.items.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-2 items-center"
                >
                  <input
                    className={`${inputClass} col-span-6`}
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) =>
                      updateItem(item.id, { description: e.target.value })
                    }
                  />
                  <input
                    type="number"
                    className={`${inputClass} col-span-2`}
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(item.id, { quantity: Number(e.target.value) })
                    }
                  />
                  <input
                    type="number"
                    className={`${inputClass} col-span-2`}
                    placeholder="Unit Price"
                    value={item.unit_price}
                    onChange={(e) =>
                      updateItem(item.id, {
                        unit_price: Number(e.target.value),
                      })
                    }
                  />
                  <span className="col-span-1 text-sm text-gray-500 text-right pr-1">
                    {money(
                      (Number(item.quantity) || 0) *
                        (Number(item.unit_price) || 0),
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="col-span-1 text-rose-500 hover:text-rose-600 transition text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {draft.items.length === 0 && (
                <p className="text-sm text-gray-500">
                  No line items yet — add one above.
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Discount (%)">
              <input
                type="number"
                className={inputClass}
                value={draft.discount}
                onChange={(e) => set({ discount: Number(e.target.value) })}
              />
            </Field>
            <Field label="Tax Rate (%)">
              <input
                type="number"
                className={inputClass}
                value={draft.tax_rate}
                onChange={(e) => set({ tax_rate: Number(e.target.value) })}
              />
            </Field>
          </div>

          <Field label="Notes">
            <textarea
              className={`${inputClass} min-h-[70px]`}
              value={draft.notes}
              onChange={(e) => set({ notes: e.target.value })}
            />
          </Field>

          <div className="rounded-2xl border border-black/10 dark:border-white/10 p-4 space-y-1 max-w-xs ml-auto text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>{money(subtotal)}</span>
            </div>
            {draft.discount > 0 && (
              <div className="flex justify-between text-gray-500">
                <span>Discount ({draft.discount}%)</span>
                <span>-{money(discountAmount)}</span>
              </div>
            )}
            {draft.tax_rate > 0 && (
              <div className="flex justify-between text-gray-500">
                <span>Tax ({draft.tax_rate}%)</span>
                <span>{money(taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-black dark:text-white pt-1 border-t border-black/10 dark:border-white/10">
              <span>Total</span>
              <span>{money(total)}</span>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white dark:bg-[#070c14] border-t border-black/10 dark:border-white/10 px-6 py-4 flex justify-between gap-3">
          <button
            onClick={() => downloadInvoicePdf(draft, settings)}
            className="px-5 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition text-sky-600 dark:text-sky-300 font-medium"
          >
            Preview PDF
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition text-black dark:text-white font-medium"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(draft)}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 transition text-white font-medium"
            >
              {saving ? "Saving..." : "Save Invoice"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function AdminInvoices() {
  const [adminName, setAdminName] = useState("Admin");
  const [organizationId, setOrganizationId] = useState("");
  const [loading, setLoading] = useState(true);

  const [settings, setSettings] = useState<InvoiceSettings>(DEFAULT_SETTINGS);
  const [showCustomise, setShowCustomise] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [savingInvoice, setSavingInvoice] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | InvoiceStatus>(
    "all",
  );

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id, full_name")
      .eq("id", user.id)
      .single();

    if (profile?.full_name) setAdminName(profile.full_name);

    if (!profile?.organization_id) {
      setLoading(false);
      return;
    }

    setOrganizationId(profile.organization_id);
    await Promise.all([
      loadSettings(profile.organization_id),
      loadInvoices(profile.organization_id),
    ]);

    setLoading(false);
  };

  const loadSettings = async (orgId: string) => {
    const { data, error } = await supabase
      .from("invoice_settings")
      .select("*")
      .eq("organization_id", orgId)
      .maybeSingle();

    if (error) {
      console.error(error);
      return;
    }

    if (data) {
      setSettings({ ...DEFAULT_SETTINGS, ...data });
    }
  };

  const loadInvoices = async (orgId: string) => {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setInvoices(data || []);
  };

  const saveSettings = async (draft: InvoiceSettings) => {
    if (!organizationId) return;
    setSavingSettings(true);

    const payload = { ...draft, organization_id: organizationId };

    const { error } = await supabase
      .from("invoice_settings")
      .upsert(payload, { onConflict: "organization_id" });

    if (error) {
      console.error(error);
      alert("Failed to save invoice settings");
      setSavingSettings(false);
      return;
    }

    setSettings(draft);
    setSavingSettings(false);
    setShowCustomise(false);
  };

  const nextInvoiceNumber = () => {
    const count = invoices.length + 1;
    return `${settings.invoice_prefix || "INV"}-${String(count).padStart(4, "0")}`;
  };

  const openNewInvoice = () => {
    const today = new Date().toISOString().slice(0, 10);
    setEditingInvoice({
      id: crypto.randomUUID(),
      organization_id: organizationId,
      invoice_number: nextInvoiceNumber(),
      client_name: "",
      client_address: "",
      client_email: "",
      issue_date: today,
      due_date: today,
      status: "draft",
      items: [newItemRow()],
      tax_rate: settings.default_tax_rate || 0,
      discount: 0,
      notes: "",
    });
  };

  const saveInvoice = async (invoice: Invoice) => {
    if (!organizationId) return;
    setSavingInvoice(true);

    const isNew = !invoices.some((inv) => inv.id === invoice.id);

    const payload = { ...invoice, organization_id: organizationId };

    const { error } = isNew
      ? await supabase.from("invoices").insert(payload)
      : await supabase.from("invoices").update(payload).eq("id", invoice.id);

    if (error) {
      console.error(error);
      alert("Failed to save invoice");
      setSavingInvoice(false);
      return;
    }

    await loadInvoices(organizationId);
    setSavingInvoice(false);
    setEditingInvoice(null);
  };

  const deleteInvoice = async (invoice: Invoice) => {
    if (
      !confirm(
        `Delete invoice ${invoice.invoice_number}? This cannot be undone.`,
      )
    )
      return;

    const { error } = await supabase
      .from("invoices")
      .delete()
      .eq("id", invoice.id);
    if (error) {
      console.error(error);
      alert("Failed to delete invoice");
      return;
    }

    await loadInvoices(organizationId);
  };

  const filteredInvoices = useMemo(() => {
    const q = search.toLowerCase();
    return invoices.filter((invoice) => {
      const matchesSearch =
        (invoice.invoice_number || "").toLowerCase().includes(q) ||
        (invoice.client_name || "").toLowerCase().includes(q) ||
        (invoice.client_email || "").toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" || invoice.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, search, statusFilter]);

  const totals = useMemo(() => {
    const outstanding = invoices
      .filter((inv) => inv.status === "sent" || inv.status === "overdue")
      .reduce((sum, inv) => sum + calcInvoiceTotals(inv).total, 0);
    const paid = invoices
      .filter((inv) => inv.status === "paid")
      .reduce((sum, inv) => sum + calcInvoiceTotals(inv).total, 0);
    return { outstanding, paid };
  }, [invoices]);

  return (
    <div className="min-h-screen bg-white dark:bg-[#03060b]">
      <AdminSidebar
        onLogout={() => {
          localStorage.clear();
          window.location.href = "/";
        }}
      />

      <div className="lg:ml-[280px] min-h-screen">
        <Navbar name={adminName} role="admin" />

        <div className="pt-24 px-6 pb-6 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-black dark:text-white mb-1">
                Invoicing
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-base">
                Create, brand and export invoices for your organisation.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCustomise(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition text-sky-600 dark:text-sky-300 font-medium"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 4h2m-1 0v2m0 12v2m8-9h-2M6 12H4m14.36-6.36l-1.42 1.42M7.06 16.94l-1.42 1.42m0-12.72l1.42 1.42m9.88 9.88l1.42 1.42M12 8a4 4 0 100 8 4 4 0 000-8z"
                  />
                </svg>
                Customise Invoice
              </button>
              <button
                onClick={openNewInvoice}
                className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 transition text-white font-medium"
              >
                + New Invoice
              </button>
            </div>
          </div>

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
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <SummaryStat label="Total Invoices" value={invoices.length} />
                <SummaryStat
                  label="Outstanding"
                  value={money(totals.outstanding)}
                />
                <SummaryStat label="Paid" value={money(totals.paid)} />
              </div>

              <div className="flex flex-col md:flex-row gap-3">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search invoices..."
                  className={`${inputClass} flex-1`}
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className={inputClass}
                >
                  <option value="all">All Statuses</option>
                  {Object.entries(STATUS_LABEL).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#070c14] overflow-hidden">
                <div className="hidden md:grid grid-cols-[1fr_1fr_100px_100px_120px_140px] gap-4 px-5 py-3 border-b border-black/10 dark:border-white/10 text-xs uppercase tracking-wide text-gray-500 font-semibold">
                  <span>Invoice</span>
                  <span>Client</span>
                  <span>Issued</span>
                  <span>Due</span>
                  <span>Status</span>
                  <span className="text-right">Amount / Actions</span>
                </div>

                {filteredInvoices.map((invoice) => {
                  const { total } = calcInvoiceTotals(invoice);
                  return (
                    <div
                      key={invoice.id}
                      className="grid grid-cols-1 md:grid-cols-[1fr_1fr_100px_100px_120px_140px] gap-2 md:gap-4 px-5 py-4 border-b border-black/5 dark:border-white/5 items-center hover:bg-black/5 dark:hover:bg-white/5 transition"
                    >
                      <span className="font-semibold text-black dark:text-white">
                        {invoice.invoice_number}
                      </span>
                      <span className="text-gray-600 dark:text-gray-300">
                        {invoice.client_name || "—"}
                      </span>
                      <span className="text-sm text-gray-500">
                        {invoice.issue_date || "—"}
                      </span>
                      <span className="text-sm text-gray-500">
                        {invoice.due_date || "—"}
                      </span>
                      <span>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[invoice.status]}`}
                        >
                          {STATUS_LABEL[invoice.status]}
                        </span>
                      </span>
                      <div className="flex items-center justify-end gap-3">
                        <span className="font-semibold text-black dark:text-white">
                          {money(total)}
                        </span>
                        <button
                          onClick={() => downloadInvoicePdf(invoice, settings)}
                          title="Download PDF"
                          className="text-sky-500 hover:text-sky-600 transition"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => setEditingInvoice(invoice)}
                          title="Edit"
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => deleteInvoice(invoice)}
                          title="Delete"
                          className="text-rose-400 hover:text-rose-500 transition"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}

                {filteredInvoices.length === 0 && (
                  <div className="p-10 text-center text-gray-500 dark:text-gray-400">
                    No invoices found. Click "+ New Invoice" to create one.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showCustomise && (
        <CustomiseInvoiceModal
          settings={settings}
          onClose={() => setShowCustomise(false)}
          onSave={saveSettings}
          saving={savingSettings}
        />
      )}

      {editingInvoice && (
        <InvoiceEditor
          invoice={editingInvoice}
          settings={settings}
          onClose={() => setEditingInvoice(null)}
          onSave={saveInvoice}
          saving={savingInvoice}
        />
      )}
    </div>
  );
}
