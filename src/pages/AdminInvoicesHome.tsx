import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import AdminSidebar from "../components/AdminSidebar";
import Navbar from "../components/Navbar";

// ---------------------------------------------------------------------------
// Types — kept in sync with AdminInvoices.tsx
// ---------------------------------------------------------------------------

type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";

type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
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

const STATUS_BAR_COLOR: Record<InvoiceStatus, string> = {
  draft: "bg-gray-400",
  sent: "bg-sky-400",
  paid: "bg-emerald-400",
  overdue: "bg-rose-400",
  cancelled: "bg-gray-300",
};

function money(value: number) {
  return `£${(value || 0).toFixed(2)}`;
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

function isOverdue(invoice: Invoice) {
  if (invoice.status === "paid" || invoice.status === "cancelled") return false;
  if (!invoice.due_date) return false;
  return new Date(invoice.due_date) < new Date(new Date().toDateString());
}

// ---------------------------------------------------------------------------
// Shared small UI bits
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  sublabel,
  accent = "sky",
}: {
  label: string;
  value: string;
  sublabel?: string;
  accent?: "sky" | "emerald" | "rose" | "gray";
}) {
  const accentClass = {
    sky: "text-sky-500",
    emerald: "text-emerald-500",
    rose: "text-rose-500",
    gray: "text-gray-400",
  }[accent];

  return (
    <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#070c14] px-6 py-5 shadow-sm">
      <p
        className={`text-xs uppercase tracking-wide font-semibold mb-2 ${accentClass}`}
      >
        {label}
      </p>
      <p className="text-2xl font-bold text-black dark:text-white">{value}</p>
      {sublabel && <p className="text-sm text-gray-500 mt-1">{sublabel}</p>}
    </div>
  );
}

function QuickAction({
  to,
  title,
  description,
  icon,
}: {
  to: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className="group flex items-start gap-4 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#070c14] px-5 py-4 hover:border-sky-400/50 hover:shadow-sm transition"
    >
      <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0 group-hover:bg-sky-500 group-hover:text-white transition">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-black dark:text-white">{title}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminInvoicesHome() {
  const [adminName, setAdminName] = useState("Admin");
  const [organizationId, setOrganizationId] = useState("");
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [companyName, setCompanyName] = useState("");

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

    const [{ data: invoiceRows }, { data: settingsRow }] = await Promise.all([
      supabase
        .from("invoices")
        .select("*")
        .eq("organization_id", profile.organization_id)
        .order("created_at", { ascending: false }),
      supabase
        .from("invoice_settings")
        .select("company_name")
        .eq("organization_id", profile.organization_id)
        .maybeSingle(),
    ]);

    setInvoices(invoiceRows || []);
    setCompanyName(settingsRow?.company_name || "");
    setLoading(false);
  };

  // Normalise overdue status on the fly (sent invoices past due_date read as overdue)
  const effectiveInvoices = useMemo(
    () =>
      invoices.map((inv) =>
        isOverdue(inv) ? { ...inv, status: "overdue" as InvoiceStatus } : inv,
      ),
    [invoices],
  );

  const stats = useMemo(() => {
    const totalInvoiced = effectiveInvoices.reduce(
      (sum, inv) => sum + calcInvoiceTotals(inv).total,
      0,
    );
    const outstanding = effectiveInvoices
      .filter((inv) => inv.status === "sent" || inv.status === "overdue")
      .reduce((sum, inv) => sum + calcInvoiceTotals(inv).total, 0);
    const paid = effectiveInvoices
      .filter((inv) => inv.status === "paid")
      .reduce((sum, inv) => sum + calcInvoiceTotals(inv).total, 0);
    const overdueCount = effectiveInvoices.filter(
      (inv) => inv.status === "overdue",
    ).length;
    const draftCount = effectiveInvoices.filter(
      (inv) => inv.status === "draft",
    ).length;

    return { totalInvoiced, outstanding, paid, overdueCount, draftCount };
  }, [effectiveInvoices]);

  // Status breakdown, for the simple horizontal bar chart
  const statusBreakdown = useMemo(() => {
    const counts: Record<InvoiceStatus, number> = {
      draft: 0,
      sent: 0,
      paid: 0,
      overdue: 0,
      cancelled: 0,
    };
    effectiveInvoices.forEach((inv) => {
      counts[inv.status] = (counts[inv.status] || 0) + 1;
    });
    const max = Math.max(1, ...Object.values(counts));
    return { counts, max };
  }, [effectiveInvoices]);

  // Last 6 months invoiced totals, for the mini bar chart
  const monthlyTotals = useMemo(() => {
    const months: { key: string; label: string; total: number }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: d.toLocaleString("en-GB", { month: "short" }),
        total: 0,
      });
    }

    effectiveInvoices.forEach((inv) => {
      const dateStr = inv.issue_date || inv.created_at;
      if (!dateStr) return;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const bucket = months.find((m) => m.key === key);
      if (bucket) bucket.total += calcInvoiceTotals(inv).total;
    });

    const max = Math.max(1, ...months.map((m) => m.total));
    return { months, max };
  }, [effectiveInvoices]);

  const recentInvoices = effectiveInvoices.slice(0, 5);

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
                {companyName
                  ? `Overview for ${companyName}.`
                  : "An overview of your billing."}
              </p>
            </div>

            <div className="flex gap-3">
              <Link
                to="/admin/invoices/manage"
                className="px-5 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition text-sky-600 dark:text-sky-300 font-medium"
              >
                View All Invoices
              </Link>
              <Link
                to="/admin/invoices/manage?new=1"
                className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 transition text-white font-medium"
              >
                + New Invoice
              </Link>
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
              {/* Top stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard
                  label="Total Invoiced"
                  value={money(stats.totalInvoiced)}
                  sublabel={`${invoices.length} invoice(s)`}
                  accent="sky"
                />
                <StatCard
                  label="Outstanding"
                  value={money(stats.outstanding)}
                  sublabel={`${stats.overdueCount} overdue`}
                  accent="rose"
                />
                <StatCard
                  label="Paid"
                  value={money(stats.paid)}
                  sublabel="All time"
                  accent="emerald"
                />
                <StatCard
                  label="Drafts"
                  value={String(stats.draftCount)}
                  sublabel="Not yet sent"
                  accent="gray"
                />
              </div>

              {/* Charts row */}
              <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6">
                {/* Monthly invoiced bar chart */}
                <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#070c14] p-6">
                  <h3 className="font-semibold text-black dark:text-white mb-1">
                    Invoiced by Month
                  </h3>
                  <p className="text-sm text-gray-500 mb-6">Last 6 months</p>

                  <div className="flex items-end justify-between gap-3 h-40">
                    {monthlyTotals.months.map((m) => (
                      <div
                        key={m.key}
                        className="flex-1 flex flex-col items-center gap-2"
                      >
                        <div className="w-full flex-1 flex items-end">
                          <div
                            className="w-full rounded-t-lg bg-gradient-to-t from-sky-500 to-emerald-400 transition-all"
                            style={{
                              height: `${Math.max(4, (m.total / monthlyTotals.max) * 100)}%`,
                            }}
                            title={money(m.total)}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{m.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status breakdown */}
                <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#070c14] p-6">
                  <h3 className="font-semibold text-black dark:text-white mb-1">
                    Status Breakdown
                  </h3>
                  <p className="text-sm text-gray-500 mb-6">All invoices</p>

                  <div className="space-y-4">
                    {(Object.keys(STATUS_LABEL) as InvoiceStatus[]).map(
                      (status) => (
                        <div key={status}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600 dark:text-gray-300">
                              {STATUS_LABEL[status]}
                            </span>
                            <span className="text-gray-500">
                              {statusBreakdown.counts[status]}
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${STATUS_BAR_COLOR[status]}`}
                              style={{
                                width: `${(statusBreakdown.counts[status] / statusBreakdown.max) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>

              {/* Quick actions */}
              <div>
                <h3 className="font-semibold text-black dark:text-white mb-3">
                  Quick Actions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <QuickAction
                    to="/admin/invoices/manage?new=1"
                    title="Create Invoice"
                    description="Start a new invoice for a client"
                    icon={
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    }
                  />
                  <QuickAction
                    to="/admin/invoices/manage?customise=1"
                    title="Customise Branding"
                    description="Update logo, address and bank details"
                    icon={
                      <svg
                        className="w-5 h-5"
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
                    }
                  />
                  <QuickAction
                    to="/admin/invoices/manage?status=overdue"
                    title="Chase Overdue"
                    description={`${stats.overdueCount} invoice(s) need following up`}
                    icon={
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    }
                  />
                </div>
              </div>

              {/* Recent invoices */}
              <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#070c14] overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-black/10 dark:border-white/10">
                  <h3 className="font-semibold text-black dark:text-white">
                    Recent Invoices
                  </h3>
                  <Link
                    to="/admin/invoices/manage"
                    className="text-sm text-sky-500 hover:underline font-medium"
                  >
                    View all
                  </Link>
                </div>

                {recentInvoices.map((invoice) => {
                  const { total } = calcInvoiceTotals(invoice);
                  return (
                    <div
                      key={invoice.id}
                      className="flex flex-col md:flex-row md:items-center justify-between gap-2 px-5 py-4 border-b border-black/5 dark:border-white/5 last:border-b-0"
                    >
                      <div>
                        <p className="font-semibold text-black dark:text-white">
                          {invoice.invoice_number}
                        </p>
                        <p className="text-sm text-gray-500">
                          {invoice.client_name || "—"} · Due{" "}
                          {invoice.due_date || "—"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 self-end md:self-auto">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[invoice.status]}`}
                        >
                          {STATUS_LABEL[invoice.status]}
                        </span>
                        <span className="font-semibold text-black dark:text-white">
                          {money(total)}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {recentInvoices.length === 0 && (
                  <div className="p-10 text-center text-gray-500 dark:text-gray-400">
                    No invoices yet. Create your first one to see it here.
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
