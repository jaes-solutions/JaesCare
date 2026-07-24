import { useEffect, useState } from "react";
import {
  ClipboardList,
  PlusCircle,
  Trash2,
  RotateCcw,
  Clock3,
  History,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Sidebar from "../components/AdminSidebar";
import Navbar from "../components/Navbar";
import { getShiftWallClockRange, getUKWallClockDate } from "../lib/time";

export default function AdminShifts() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState("");
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  const [shiftList, setShiftList] = useState<any[]>([]);
  const [archivedShiftList, setArchivedShiftList] = useState<any[]>([]);

  // Track which shift ids currently have an in-flight delete/restore request,
  // so we can disable their buttons and avoid double-clicks.
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const getShiftStatus = (shift: any, now = getUKWallClockDate()) => {
    const { start, end } = getShiftWallClockRange(shift);

    if (now >= end) return "completed";
    if (now >= start) return "active";
    return "upcoming";
  };

  const formatDateRange = (startDate: string, endDate?: string | null) => {
    const formatDate = (date: string, includeYear: boolean) => {
      const [year, month, day] = date.split("-").map(Number);

      return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "long",
        ...(includeYear && { year: "numeric" }),
        timeZone: "UTC",
      }).format(new Date(Date.UTC(year, month - 1, day)));
    };

    if (endDate && endDate !== startDate) {
      return `${formatDate(startDate, false)} - ${formatDate(endDate, true)}`;
    }

    return formatDate(startDate, true);
  };

  const formatArchivedAt = (timestamp?: string | null) => {
    if (!timestamp) return "";

    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(timestamp));
  };

  const checkAdminAccess = async () => {
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

      setAdminName(profile.full_name || "Admin");
      setOrganizationId(profile.organization_id || null);

      await Promise.all([
        loadShifts(profile.organization_id),
        loadArchivedShifts(profile.organization_id),
      ]);
    } catch (err) {
      console.error(err);
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const loadShifts = async (orgId: string) => {
    const { data: shifts, error: shiftsError } = await supabase
      .from("shifts")
      .select(
        `
        *,
        patient:profiles!shifts_patient_id_fkey(full_name),
        staff:profiles!shifts_staff_id_fkey(full_name)
      `,
      )
      .eq("organization_id", orgId)
      .order("shift_date", { ascending: false })
      .order("start_time", { ascending: false });

    if (shiftsError) {
      console.error(shiftsError);
      return;
    }

    const ukNow = getUKWallClockDate();
    const updatedShifts = await Promise.all(
      (shifts || []).map(async (shift) => {
        const calculatedStatus = getShiftStatus(shift, ukNow);

        if (shift.status !== calculatedStatus) {
          await supabase
            .from("shifts")
            .update({ status: calculatedStatus })
            .eq("id", shift.id)
            .eq("organization_id", orgId);

          return { ...shift, status: calculatedStatus };
        }

        return shift;
      }),
    );

    setShiftList(updatedShifts);
  };

  const loadArchivedShifts = async (orgId: string) => {
    const { data: archived, error: archivedError } = await supabase
      .from("archived_shifts")
      .select(
        `
        *,
        patient:profiles!shifts_patient_id_fkey(full_name),
        staff:profiles!shifts_staff_id_fkey(full_name)
      `,
      )
      .eq("organization_id", orgId)
      .order("archived_at", { ascending: false });

    if (archivedError) {
      console.error(archivedError);
      return;
    }

    setArchivedShiftList(archived || []);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const goToCreateShift = () => {
    // Sends the admin to the dashboard's Create Shift section.
    navigate("/adminDashboard#create-shift-section");
  };

  const setPending = (id: string, isPending: boolean) => {
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (isPending) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  // Archive-then-delete: the shift is only removed from `shifts` once it has
  // been safely written to `archived_shifts`. If the archive insert fails,
  // nothing is deleted.
  const handleDeleteShift = async (shift: any) => {
    if (!organizationId) return;
    if (getShiftStatus(shift) === "completed") {
      alert("Completed shifts cannot be deleted.");
      return;
    }

    const confirmed = window.confirm(
      `Delete the shift for ${shift.staff_name} with ${shift.patient_name}? It will be moved to Recently Deleted and can be restored later.`,
    );
    if (!confirmed) return;

    setPending(shift.id, true);

    try {
      const { id, ...shiftData } = shift;

      const { error: archiveError } = await supabase
        .from("archived_shifts")
        .insert({
          id,
          ...shiftData,
          original_shift_id: id,
          organization_id: organizationId,
          archived_at: new Date().toISOString(),
        });

      if (archiveError) {
        console.error(archiveError);
        alert("Failed to archive shift. Shift was not deleted.");
        return;
      }

      const { error: deleteError } = await supabase
        .from("shifts")
        .delete()
        .eq("id", id)
        .eq("organization_id", organizationId);

      if (deleteError) {
        console.error(deleteError);
        alert(
          "Shift was archived but could not be removed from the active list. Please refresh and try again.",
        );
        return;
      }

      setShiftList((prev) => prev.filter((s) => s.id !== id));
      await loadArchivedShifts(organizationId);
    } catch (err) {
      console.error(err);
      alert("Something went wrong while deleting the shift.");
    } finally {
      setPending(shift.id, false);
    }
  };

  // Restore-then-delete-from-archive: the archived row is only removed once
  // the shift has been safely written back to `shifts`.
  const handleRestoreShift = async (archivedShift: any) => {
    if (!organizationId) return;

    setPending(archivedShift.id, true);

    try {
      const { id, original_shift_id, archived_at, ...shiftData } =
        archivedShift;

      const { error: restoreError } = await supabase.from("shifts").insert({
        ...shiftData,
        organization_id: organizationId,
      });

      if (restoreError) {
        console.error(restoreError);
        alert("Failed to restore shift.");
        return;
      }

      const { error: removeArchiveError } = await supabase
        .from("archived_shifts")
        .delete()
        .eq("id", id)
        .eq("organization_id", organizationId);

      if (removeArchiveError) {
        console.error(removeArchiveError);
        alert(
          "Shift was restored but the archived copy could not be cleaned up. Please refresh.",
        );
      }

      setArchivedShiftList((prev) => prev.filter((s) => s.id !== id));
      await loadShifts(organizationId);
    } catch (err) {
      console.error(err);
      alert("Something went wrong while restoring the shift.");
    } finally {
      setPending(archivedShift.id, false);
    }
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

                <div className="text-center">
                  <h2 className="text-xl font-semibold text-black dark:text-white mb-2">
                    Preparing Data ..
                  </h2>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* HEADER */}
              <div className="rounded-[20px] sm:rounded-[24px] border border-black/10 dark:border-white/10 bg-white dark:bg-[#070c14] p-4 sm:p-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-[22px] sm:text-[26px] font-semibold mb-1.5">
                    Shifts
                  </h2>
                  <p className="text-gray-600 dark:text-gray-500 text-[13px]">
                    View, create, and manage all scheduled shifts.
                  </p>
                </div>

                <button
                  onClick={goToCreateShift}
                  className="h-[46px] px-5 rounded-[16px] bg-gradient-to-r from-sky-400 to-emerald-300 text-black font-semibold flex items-center justify-center gap-2 shrink-0"
                >
                  <PlusCircle size={18} />
                  Create Shift
                </button>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[1.6fr,1fr] gap-6">
                {/* ALL SHIFTS */}
                <div className="rounded-[20px] sm:rounded-[24px] border border-black/10 dark:border-white/10 bg-white dark:bg-[#070c14] p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <ClipboardList className="text-sky-300" size={22} />
                    <h2 className="text-[20px] sm:text-[24px] font-semibold">
                      All Shifts
                    </h2>
                  </div>

                  <div className="space-y-4">
                    {shiftList.length === 0 && (
                      <p className="text-gray-600 dark:text-gray-500">
                        No shifts created yet
                      </p>
                    )}

                    {shiftList.map((shift) => {
                      const formattedDate = formatDateRange(
                        shift.shift_date,
                        shift.end_date,
                      );
                      const isPending = pendingIds.has(shift.id);

                      return (
                        <div
                          key={shift.id}
                          className="rounded-[20px] border border-black/10 dark:border-white/10 bg-white dark:bg-[#0c1118] p-5 sm:p-6"
                        >
                          <div className="space-y-5">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-black/10 dark:border-white/10 pb-4">
                              <div>
                                <h3 className="text-black dark:text-white text-[20px] font-semibold">
                                  {formattedDate}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-500 text-sm mt-1">
                                  Scheduled Care Shift
                                </p>
                              </div>
                              <div className="text-left sm:text-right space-y-1">
                                <p className="text-sky-300 font-medium">
                                  <span className="text-gray-600 dark:text-gray-400">
                                    Staff:
                                  </span>{" "}
                                  {shift.staff?.full_name || shift.staff_name}
                                </p>
                                <p className="text-emerald-300 text-sm">
                                  <span className="text-gray-600 dark:text-gray-400">
                                    Resident:
                                  </span>{" "}
                                  {shift.patient?.full_name ||
                                    shift.patient_name}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="rounded-[14px] border border-blue-200 dark:border-[#1e3a52] bg-blue-50 dark:bg-[#0d1722] px-4 py-3">
                                <p className="text-[#79bbff] text-[12px] uppercase mb-1">
                                  Shift Time
                                </p>
                                <p className="text-black dark:text-white font-semibold">
                                  {shift.start_time} - {shift.end_time}
                                </p>
                              </div>
                              <div className="rounded-[14px] border border-yellow-200 dark:border-[#3b3520] bg-yellow-50 dark:bg-[#1a160d] px-4 py-3">
                                <p className="text-[#ffd15c] text-[12px] uppercase mb-1">
                                  Status
                                </p>
                                <p className="text-black dark:text-white font-semibold capitalize">
                                  {getShiftStatus(shift)}
                                </p>
                              </div>
                              <div className="rounded-[14px] border border-green-200 dark:border-[#1f3f2f] bg-green-50 dark:bg-[#101a14] px-4 py-3">
                                <p className="text-[#9eff5b] text-[12px] uppercase mb-1">
                                  Handover
                                </p>
                                <p
                                  className={`font-semibold ${
                                    shift.handover_completed
                                      ? "text-emerald-300"
                                      : "text-yellow-300"
                                  }`}
                                >
                                  {shift.handover_completed
                                    ? "Submitted"
                                    : "Pending"}
                                </p>
                              </div>
                            </div>

                            <div className="flex justify-end">
                              <button
                                onClick={() => handleDeleteShift(shift)}
                                disabled={
                                  isPending ||
                                  getShiftStatus(shift) === "completed"
                                }
                                className="h-[42px] px-4 rounded-[14px] border border-red-400/30 text-red-400 bg-red-400/10 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-400/20 transition-colors disabled:bg-gray-300/20 disabled:text-gray-400 disabled:border-gray-500/20"
                              >
                                <Trash2 size={16} />
                                {isPending
                                  ? "Deleting..."
                                  : getShiftStatus(shift) === "completed"
                                    ? "Cannot Delete"
                                    : "Delete Shift"}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* RECENTLY DELETED */}
                <div className="rounded-[20px] sm:rounded-[24px] border border-black/10 dark:border-white/10 bg-white dark:bg-[#070c14] p-4 sm:p-6 h-fit">
                  <div className="flex items-center gap-3 mb-6">
                    <History className="text-red-400" size={22} />
                    <h2 className="text-[20px] font-semibold">
                      Recently Deleted
                    </h2>
                  </div>

                  <div className="space-y-4">
                    {archivedShiftList.length === 0 && (
                      <p className="text-gray-600 dark:text-gray-500">
                        No deleted shifts
                      </p>
                    )}

                    {archivedShiftList.map((shift) => {
                      const formattedDate = formatDateRange(
                        shift.shift_date,
                        shift.end_date,
                      );
                      const isPending = pendingIds.has(shift.id);

                      return (
                        <div
                          key={shift.id}
                          className="rounded-[16px] border border-black/10 dark:border-white/10 bg-gray-100 dark:bg-[#11161d]/80 p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-black dark:text-white font-semibold">
                                {formattedDate}
                              </h3>
                              <p className="text-gray-600 dark:text-gray-500 text-sm mt-1">
                                {shift.staff?.full_name || shift.staff_name}{" "}
                                &middot;{" "}
                                {shift.patient?.full_name || shift.patient_name}
                              </p>
                              <p className="text-gray-500 dark:text-gray-600 text-xs mt-2 flex items-center gap-1">
                                <Clock3 size={12} />
                                {shift.start_time} - {shift.end_time}
                              </p>
                              {shift.archived_at && (
                                <p className="text-gray-500 dark:text-gray-600 text-xs mt-1">
                                  Deleted {formatArchivedAt(shift.archived_at)}
                                </p>
                              )}
                            </div>

                            <button
                              onClick={() => handleRestoreShift(shift)}
                              disabled={isPending}
                              className="h-[38px] px-3 rounded-[12px] border border-emerald-300/30 text-emerald-300 bg-emerald-300/10 flex items-center gap-1.5 text-sm shrink-0 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-300/20 transition-colors"
                            >
                              <RotateCcw size={14} />
                              {isPending ? "Restoring..." : "Restore"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
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
