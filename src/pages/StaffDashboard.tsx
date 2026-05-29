import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Sidebar from "../components/StaffSidebar";
import Navbar from "../components/Navbar";

export default function StaffDashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [staffName, setStaffName] = useState("");
  const [staffRole, setStaffRole] = useState("");
  const [shifts, setShifts] = useState<any[]>([]);
  const [todayChecks, setTodayChecks] = useState<any[]>([]);
  const [nextCheckin, setNextCheckin] = useState<any>(null);
  const [nextCountdown, setNextCountdown] = useState("--");
  const [nextProgress, setNextProgress] = useState(0);
  const [notifiedCheckin, setNotifiedCheckin] = useState<string | null>(null);

  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [selectedCheckin, setSelectedCheckin] = useState<any>(null);

  const [wellbeing, setWellbeing] = useState<string[]>([]);
  const [wellbeingNotes, setWellbeingNotes] = useState("");

  const [mood, setMood] = useState<string[]>([]);
  const [moodNotes, setMoodNotes] = useState("");

  const [hydration, setHydration] = useState<string[]>([]);
  const [hydrationNotes, setHydrationNotes] = useState("");

  const [safety, setSafety] = useState<string[]>([]);
  const [safetyNotes, setSafetyNotes] = useState("");

  const [engagement, setEngagement] = useState<string[]>([]);
  const [engagementNotes, setEngagementNotes] = useState("");

  // UK/UTC helpers
  const UK_OFFSET_HOURS = 1;

  const ukToUTC = (date: string, time: string) => {
    const [year, month, day] = date.split("-").map(Number);
    const [hour, minute] = time.split(":").map(Number);

    return new Date(
      Date.UTC(year, month - 1, day, hour - UK_OFFSET_HOURS, minute, 0),
    );
  };

  const utcToUKTime = (timestamp: string) => {
    const utcDate = new Date(
      timestamp.endsWith("Z") ? timestamp : timestamp + "Z",
    );

    return new Date(
      utcDate.getTime() + UK_OFFSET_HOURS * 60 * 60 * 1000,
    ).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "UTC",
    });
  };

  useEffect(() => {
    checkStaffAccess();
  }, []);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const next = todayChecks.find(
        (check) => check.action === "Locked" || check.action === "Start",
      );

      if (!next) {
        setNextCheckin(null);
        setNextCountdown("No upcoming check-ins");
        setNextProgress(0);
        return;
      }

      setNextCheckin(next);

      const openTime = ukToUTC(next.shiftDate, next.checkTime);

      const diff = openTime.getTime() - new Date().getTime();

      const oneHour = 60 * 60 * 1000;

      const progress = Math.min(
        100,
        Math.max(0, ((oneHour - diff) / oneHour) * 100),
      );

      setNextProgress(progress);

      if (diff <= 0) {
        setNextCountdown("Available now");
        setNextProgress(100);

        const notificationId = `${next.shiftId}-${next.time}`;

        if (notifiedCheckin !== notificationId) {
          setNotifiedCheckin(notificationId);

          if (
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            new Notification("Check-in is now open", {
              body: `Your ${next.time} check-in is ready to complete.`,
            });
          }
        }

        return;
      }

      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      setNextCountdown(`${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(timer);
  }, [todayChecks, notifiedCheckin]);

  const checkStaffAccess = async () => {
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
        .select("full_name, role")
        .eq("id", session.user.id)
        .single();

      if (error || !profile || profile.role !== "staff") {
        navigate("/login");
        return;
      }

      setStaffName(profile.full_name || "Staff");
      setStaffRole(profile.role || "staff");

      console.log("Logged in user ID:", session.user.id);

      const { data: shiftData, error: shiftError } = await supabase
        .from("shifts")
        .select("*")
        .eq("staff_id", session.user.id)
        .order("shift_date", { ascending: true });

      console.log("Fetched shifts:", shiftData);
      console.log("Shift fetch error:", shiftError);

      if (!shiftError && shiftData) {
        setShifts(shiftData);
      }

      if (!shiftError && shiftData) {
        const now = new Date();

        const currentDate = new Intl.DateTimeFormat("en-CA", {
          timeZone: "Europe/London",
        }).format(new Date());

        const todayShifts = shiftData.filter(
          (shift) => shift.shift_date === currentDate,
        );

        let generatedChecks: any[] = [];

        // Replace forEach with for-await-of to allow await inside loop
        for (const shift of todayShifts) {
          const [startHour, startMinute] = shift.start_time
            .split(":")
            .map(Number);

          const [endHour, endMinute] = shift.end_time.split(":").map(Number);

          let currentCheckTime = new Date(
            Date.UTC(
              Number(shift.shift_date.split("-")[0]),
              Number(shift.shift_date.split("-")[1]) - 1,
              Number(shift.shift_date.split("-")[2]),
              startHour,
              startMinute,
            ),
          );

          const shiftEndTime = new Date(
            Date.UTC(
              Number(shift.shift_date.split("-")[0]),
              Number(shift.shift_date.split("-")[1]) - 1,
              Number(shift.shift_date.split("-")[2]),
              endHour,
              endMinute,
            ),
          );

          while (currentCheckTime < shiftEndTime) {
            const formattedHour = currentCheckTime.toISOString().slice(11, 16);

            const checkTime = ukToUTC(shift.shift_date, formattedHour);

            let status = "Upcoming";
            let color = "blue";
            let action = "Locked";
            let note = "Waiting for check-in window";

            const diffMinutes = (now.getTime() - checkTime.getTime()) / 60000;

            // FIRST: check if check-in already exists in Supabase
            const existingCheck = await supabase
              .from("checkins")
              .select("*")
              .eq("shift_id", shift.id)
              .eq("scheduled_time", checkTime.toISOString())
              .order("submitted_at", { ascending: false })
              .limit(1)
              .maybeSingle();

            // IF CHECKIN EXISTS → DATABASE BECOMES SOURCE OF TRUTH
            if (existingCheck.data) {
              const submittedTime = new Date(
                existingCheck.data.submitted_at.endsWith("Z")
                  ? existingCheck.data.submitted_at
                  : existingCheck.data.submitted_at + "Z",
              );

              const submittedDiffMinutes =
                (submittedTime.getTime() - checkTime.getTime()) / 60000;

              const submittedDisplayTime = utcToUKTime(
                existingCheck.data.submitted_at,
              );

              action = submittedDisplayTime;
              note = `Submitted at ${submittedDisplayTime} UK time`;

              if (submittedDiffMinutes <= 30) {
                status = "Completed on time";
                color = "green";
              } else if (submittedDiffMinutes <= 45) {
                status = "Late entry";
                color = "yellow";
              } else {
                status = "Missed entry";
                color = "red";
              }
            }

            // ONLY GENERATE BUTTONS IF CHECKIN DOES NOT EXIST
            else {
              // ACTIVE CHECK-IN WINDOW
              if (diffMinutes >= 0 && diffMinutes <= 30) {
                status = "On time window";
                color = "green";
                action = "Start";
                note = "Complete within 30 minutes";
              }

              // LATE WINDOW
              else if (diffMinutes > 30 && diffMinutes <= 45) {
                status = "Late window";
                color = "yellow";
                action = "Start";
                note = "Check-in will be marked late";
              }

              // MISSED
              else if (diffMinutes > 45) {
                status = "Missed entry";
                color = "red";
                action = "Missed";
                note = "Check-in window expired";
              }
            }

            generatedChecks.push({
              time: formattedHour,
              status,
              action,
              color,
              note,
              submittedAt: existingCheck.data?.submitted_at || null,
              shiftId: shift.id,
              checkTime: formattedHour,
              shiftDate: shift.shift_date,
            });
            currentCheckTime.setHours(currentCheckTime.getHours() + 1);
          }
        }

        generatedChecks.sort((a, b) => a.time.localeCompare(b.time));

        setTodayChecks(generatedChecks);
      }
    } catch (err) {
      console.error(err);
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const toggleValue = (value: string, list: string[], setter: any) => {
    if (list.includes(value)) {
      setter(list.filter((v) => v !== value));
    } else {
      setter([...list, value]);
    }
  };

  const submitCheckin = async () => {
    if (!selectedCheckin) return;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) return;

      const submittedAt = new Date();

      const scheduledTime = ukToUTC(
        selectedCheckin.shiftDate,
        selectedCheckin.time,
      );

      const submittedDiffMinutes =
        (submittedAt.getTime() - scheduledTime.getTime()) / 60000;

      let checkinStatus = "completed_on_time";

      if (submittedDiffMinutes > 30 && submittedDiffMinutes <= 45) {
        checkinStatus = "late";
      }

      if (submittedDiffMinutes > 45) {
        checkinStatus = "missed";
      }

      const shift = shifts.find((s) => s.id === selectedCheckin.shiftId);

      if (!shift) {
        console.error("Shift not found");
        return;
      }

      const { error: checkinInsertError } = await supabase
        .from("checkins")
        .insert({
          shift_id: selectedCheckin.shiftId,
          patient_id: shift.patient_id,
          patient_name: shift.patient_name,
          staff_id: session.user.id,
          staff_name: staffName,
          scheduled_time: scheduledTime.toISOString(),
          submitted_at: submittedAt.toISOString(),
          status: checkinStatus,

          wellbeing,
          wellbeing_notes: wellbeingNotes,

          mood,
          mood_notes: moodNotes,

          hydration,
          hydration_notes: hydrationNotes,

          safety,
          safety_notes: safetyNotes,

          engagement,
          engagement_notes: engagementNotes,
        });

      if (checkinInsertError) {
        console.error("Check-in insert error:", checkinInsertError);
        return;
      }

      console.log("Check-in saved successfully");

      await checkStaffAccess();

      setTodayChecks((prev: any[]) =>
        prev.map((check) => {
          if (
            check.shiftId === selectedCheckin.shiftId &&
            check.time === selectedCheckin.time
          ) {
            const submittedDisplayTime = utcToUKTime(submittedAt.toISOString());

            let updatedStatus = "Completed on time";
            let updatedColor = "green";

            if (submittedDiffMinutes > 30 && submittedDiffMinutes <= 45) {
              updatedStatus = "Late entry";
              updatedColor = "yellow";
            }

            if (submittedDiffMinutes > 45) {
              updatedStatus = "Missed entry";
              updatedColor = "red";
            }

            return {
              ...check,
              status: updatedStatus,
              color: updatedColor,
              action: submittedDisplayTime,
              note: `Submitted at ${submittedDisplayTime} UK time`,
              submittedAt: submittedAt.toISOString(),
            };
          }

          return check;
        }),
      );

      setShowCheckinModal(false);
      setSelectedCheckin(null);

      setWellbeing([]);
      setWellbeingNotes("");
      setMood([]);
      setMoodNotes("");
      setHydration([]);
      setHydrationNotes("");
      setSafety([]);
      setSafetyNotes("");
      setEngagement([]);
      setEngagementNotes("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#03060b] text-white flex relative isolate">
      <Sidebar onLogout={handleLogout} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.12),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(134,239,172,0.10),transparent_30%)]" />

      <div className="flex-1 lg:ml-[245px] w-full min-w-0 min-h-screen bg-[#03060b] pt-[78px] overflow-x-hidden relative z-0">
        <Navbar name={staffName} role={staffRole} />

        {/* MAIN */}
        <main className="relative z-10 w-full max-w-7xl mx-auto p-3 sm:p-5 lg:p-7 overflow-hidden">
          {/* TOP OVERVIEW */}
          <div className="rounded-[24px] border border-white/[0.06] bg-[#060b12]/95 backdrop-blur-2xl overflow-hidden mb-5">
            <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.06]">
              <div className="flex items-center gap-5 p-4 sm:p-6">
                <div className="w-[90px] h-[90px] rounded-full bg-[#0f2234] border border-[#1f3b56] flex items-center justify-center text-[42px] text-[#76bfff]">
                  ○
                </div>

                <div>
                  <p className="text-[#56a8ff] text-[14px] font-medium mb-1">
                    My Client
                  </p>

                  <h2 className="text-[24px] font-semibold text-white leading-tight mb-2">
                    {shifts[0]?.patient_name || "No Patient Assigned"}
                  </h2>

                  <p className="text-[#9ca8b5] text-[13px]">
                    {shifts[0]?.patient_role || "Care Patient"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-5 p-4 sm:p-6">
                <div className="w-[90px] h-[90px] rounded-full bg-[#162414] border border-[#2d4927] flex items-center justify-center text-[38px] text-[#9eff5b]">
                  ⌘
                </div>

                <div>
                  <p className="text-white text-[14px] mb-1">Care Plan</p>

                  <h2 className="text-[#8eff4d] text-[24px] font-semibold mb-2">
                    Active
                  </h2>

                  <p className="text-[#9ca8b5] text-[13px]">
                    Started: 20 May 2026
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-5 p-4 sm:p-6">
                <div className="w-[90px] h-[90px] rounded-full bg-[#102235] border border-[#22415d] flex items-center justify-center text-[36px] text-[#5fb5ff]">
                  ◔
                </div>

                <div>
                  <p className="text-white text-[14px] mb-1">Current Shift</p>

                  <h2 className="text-white text-[24px] font-semibold mb-2">
                    {(() => {
                      const ukNow = new Date(
                        new Date().toLocaleString("en-US", {
                          timeZone: "Europe/London",
                        }),
                      );

                      const currentUkDate = new Intl.DateTimeFormat("en-CA", {
                        timeZone: "Europe/London",
                      }).format(new Date());

                      const currentUkTime = ukNow.toTimeString().slice(0, 5);

                      const activeShift = shifts.find((shift) => {
                        const shiftStart = shift.start_time.slice(0, 5);
                        const shiftEnd = shift.end_time.slice(0, 5);

                        return (
                          shift.shift_date === currentUkDate &&
                          currentUkTime >= shiftStart &&
                          currentUkTime <= shiftEnd
                        );
                      });

                      return activeShift?.start_time || "No Active Shift";
                    })()}
                  </h2>

                  <p className="text-[#9ca8b5] text-[13px]">
                    {(() => {
                      const ukNow = new Date(
                        new Date().toLocaleString("en-US", {
                          timeZone: "Europe/London",
                        }),
                      );

                      const currentUkDate = new Intl.DateTimeFormat("en-CA", {
                        timeZone: "Europe/London",
                      }).format(new Date());

                      const currentUkTime = ukNow.toTimeString().slice(0, 5);

                      const activeShift = shifts.find((shift) => {
                        const shiftStart = shift.start_time.slice(0, 5);
                        const shiftEnd = shift.end_time.slice(0, 5);

                        return (
                          shift.shift_date === currentUkDate &&
                          currentUkTime >= shiftStart &&
                          currentUkTime <= shiftEnd
                        );
                      });

                      return activeShift
                        ? `Started at ${activeShift.start_time}`
                        : "No shift currently active";
                    })()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* SHIFT CALENDAR */}
          <div className="rounded-[24px] border border-white/[0.06] bg-[#060b12]/95 backdrop-blur-2xl p-6 mb-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-[22px] font-semibold text-white mb-1">
                  My Shift Calendar
                </h2>

                <p className="text-[#94a3b8] text-[14px]">
                  All shifts allocated by admin
                </p>
              </div>

              <div className="w-[54px] h-[54px] rounded-[16px] border border-[#1f3b56] bg-[#0c1825] flex items-center justify-center text-[#79bbff] text-[24px]">
                📅
              </div>
            </div>

            {shifts.length === 0 ? (
              <div className="h-[120px] rounded-[18px] border border-dashed border-white/[0.08] bg-[#0b1018] flex items-center justify-center text-[#7f8b99] text-[15px]">
                No shifts assigned yet.
              </div>
            ) : (
              <div className="space-y-3">
                {shifts.map((shift) => (
                  <div
                    key={shift.id}
                    className="rounded-[18px] border border-white/[0.06] bg-[#0b1018] p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
                  >
                    <div>
                      <p className="text-[#7cbcff] text-[13px] mb-2 font-medium uppercase tracking-[1px]">
                        Shift Date
                      </p>

                      <h3 className="text-white text-[20px] font-semibold mb-2">
                        {shift.shift_date}
                      </h3>

                      <p className="text-[#9ca8b5] text-[14px]">
                        Patient: {shift.patient_name}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto">
                      <div className="min-w-[140px] rounded-[16px] border border-[#1e3a52] bg-[#0d1722] px-4 py-3">
                        <p className="text-[#79bbff] text-[12px] mb-1 uppercase">
                          Start Time
                        </p>

                        <h4 className="text-white text-[18px] font-semibold">
                          {shift.start_time}
                        </h4>
                      </div>

                      <div className="min-w-[140px] rounded-[16px] border border-[#1f3f2f] bg-[#101a14] px-4 py-3">
                        <p className="text-[#9eff5b] text-[12px] mb-1 uppercase">
                          End Time
                        </p>

                        <h4 className="text-white text-[18px] font-semibold">
                          {shift.end_time}
                        </h4>
                      </div>

                      <div className="min-w-[140px] rounded-[16px] border border-[#3b3520] bg-[#1a160d] px-4 py-3">
                        <p className="text-[#ffd15c] text-[12px] mb-1 uppercase">
                          Status
                        </p>

                        <h4 className="text-white text-[18px] font-semibold capitalize">
                          {(() => {
                            const ukNow = new Date(
                              new Date().toLocaleString("en-US", {
                                timeZone: "Europe/London",
                              }),
                            );

                            const currentUkDate = new Intl.DateTimeFormat(
                              "en-CA",
                              {
                                timeZone: "Europe/London",
                              },
                            ).format(new Date());

                            const currentUkTime = ukNow
                              .toTimeString()
                              .slice(0, 5);

                            const shiftStart = shift.start_time.slice(0, 5);
                            const shiftEnd = shift.end_time.slice(0, 5);

                            if (currentUkDate < shift.shift_date) {
                              return "Upcoming";
                            }

                            if (currentUkDate > shift.shift_date) {
                              return "Done";
                            }

                            if (currentUkTime < shiftStart) {
                              return "Upcoming";
                            }

                            if (
                              currentUkTime >= shiftStart &&
                              currentUkTime <= shiftEnd
                            ) {
                              return "Active";
                            }

                            return "Done";
                          })()}
                        </h4>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.9fr] gap-5">
            <div className="rounded-[24px] border border-white/[0.06] bg-[#060b12]/95 backdrop-blur-2xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <div className="flex items-center gap-3">
                  <h2 className="text-[18px] font-semibold text-white">
                    Today's Hourly Check-ins
                  </h2>

                  <div className="w-6 h-6 rounded-full border border-[#29425d] text-[#80bfff] text-[12px] flex items-center justify-center">
                    i
                  </div>
                </div>

                <button
                  onClick={() => navigate("/hourly-check")}
                  className="h-[44px] px-5 rounded-[14px] border border-[#1d3d5d] bg-[#0b1622] text-[#5db5ff] text-[14px] font-medium hover:bg-[#122233] transition-all duration-300"
                >
                  View all check-ins →
                </button>
              </div>

              <div className="space-y-2">
                {todayChecks.map((item, index) => (
                  <div
                    key={index}
                    className="min-h-[66px] py-3 border-b border-white/[0.05] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 sm:gap-5 w-full sm:w-auto">
                      <p className="text-white text-[15px] w-[70px]">
                        {item.time}
                      </p>

                      <div
                        className={`w-4 h-4 rounded-full ${
                          item.color === "green"
                            ? "bg-[#8eff4d]"
                            : item.color === "yellow"
                              ? "bg-[#ffc83d]"
                              : item.color === "red"
                                ? "bg-[#ff5757]"
                                : "border border-[#7aa6cf]"
                        }`}
                      />

                      <div>
                        <p
                          className={`text-[15px] ${
                            item.color === "green"
                              ? "text-[#8eff4d]"
                              : item.color === "yellow"
                                ? "text-[#ffc83d]"
                                : item.color === "red"
                                  ? "text-[#ff5757]"
                                  : "text-[#a9c7e6]"
                          }`}
                        >
                          {item.status}
                        </p>
                        <p className="text-[11px] text-[#6f7f91] mt-1">
                          {item.note}
                        </p>
                      </div>
                    </div>

                    <div>
                      {item.action === "Start" ? (
                        <button
                          onClick={() => {
                            setSelectedCheckin(item);
                            setShowCheckinModal(true);
                          }}
                          className="w-[92px] h-[38px] rounded-[12px] bg-[#0e1d2b] border border-[#1f3347] text-[#7ec1ff] text-[14px] font-medium hover:bg-[#13273a] transition-all duration-300"
                        >
                          Start
                        </button>
                      ) : item.action === "Locked" ? (
                        <button className="w-[92px] h-[38px] rounded-[12px] bg-[#0a1016] border border-[#1b2733] text-[#5d7186] text-[14px] font-medium cursor-not-allowed">
                          Locked
                        </button>
                      ) : item.action === "Missed" ? (
                        <button className="w-[92px] h-[38px] rounded-[12px] bg-[#2a1111] border border-[#5c2020] text-[#ff6b6b] text-[14px] font-medium cursor-not-allowed">
                          Missed
                        </button>
                      ) : (
                        <p className="text-[15px] text-[#d5dde7]">
                          {item.action}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-[24px] border border-white/[0.06] bg-[#060b12]/95 backdrop-blur-2xl p-5">
                <h2 className="text-[18px] font-semibold text-white mb-5">
                  Next Check-in
                </h2>

                <div className="flex items-center gap-5 mb-5">
                  <div className="w-[90px] h-[90px] rounded-full bg-[#1d3115] flex items-center justify-center text-[#98ff55] text-[36px]">
                    ◔
                  </div>
                  <div>
                    <h2 className="text-[42px] font-semibold text-white leading-none mb-2">
                      {nextCheckin?.time || "--:--"}
                    </h2>
                    <p className="text-[#b5c0cb] text-[14px]">
                      {nextCheckin
                        ? `Available from ${nextCheckin.time}`
                        : "No upcoming check-ins"}
                    </p>
                  </div>
                </div>

                <div className="w-full h-[8px] rounded-full bg-[#2a3440] overflow-hidden mb-4">
                  <div
                    className="h-full bg-gradient-to-r from-[#8eff4d] to-[#b8ff76] transition-all duration-1000"
                    style={{ width: `${nextProgress}%` }}
                  />
                </div>

                <p className="text-[#cfd8e1] text-[15px]">
                  Check-in window opens in
                  <span className="text-[#9eff5b]"> {nextCountdown}</span>
                </p>
              </div>

              <div className="rounded-[24px] border border-white/[0.06] bg-[#060b12]/95 backdrop-blur-2xl p-5">
                <h2 className="text-[18px] font-semibold text-white mb-5">
                  Today's Summary
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    ["On Time", "3", "#8eff4d"],
                    ["Late", "1", "#ffc83d"],
                    ["Missed", "1", "#ff5757"],
                    ["Total", "5", "#5db5ff"],
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="rounded-[18px] border border-white/[0.06] bg-[#0b1018] h-[140px] flex flex-col items-center justify-center"
                    >
                      <p
                        className="text-[14px] mb-3"
                        style={{ color: item[2] }}
                      >
                        {item[0]}
                      </p>

                      <h2 className="text-[42px] font-semibold text-white leading-none">
                        {item[1]}
                      </h2>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* CHECKIN MODAL */}
      {showCheckinModal && (
        <div
          className="fixed inset-0 z-[2147483647] bg-black/90 backdrop-blur-md overflow-y-auto"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        >
          <div className="min-h-screen w-full flex items-start justify-center px-4 py-10">
            <div className="relative z-[2147483647] w-full max-w-5xl rounded-[20px] sm:rounded-[30px] border border-white/[0.06] bg-[#060b12] p-4 sm:p-6 shadow-2xl h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-[28px] font-semibold text-white mb-2">
                    Hourly Care Check-in
                  </h2>

                  <p className="text-[#8da1b5] text-[14px]">
                    Complete the care documentation for this visit.
                  </p>
                </div>

                <button
                  onClick={() => setShowCheckinModal(false)}
                  className="w-[46px] h-[46px] rounded-full border border-[#1f3347] bg-[#0c1825] text-white text-[22px]"
                >
                  ×
                </button>
              </div>

              <div className="rounded-[22px] border border-[#1b2c3d] bg-[#0d1722] p-5 mb-6 flex items-center justify-between">
                <div>
                  <p className="text-[#79bbff] text-[13px] mb-1 uppercase">
                    Check-in Time
                  </p>

                  <h2 className="text-[32px] font-semibold text-white">
                    {selectedCheckin?.time}
                  </h2>
                </div>

                <div className="w-[72px] h-[72px] rounded-full bg-[#102235] border border-[#22415d] flex items-center justify-center text-[#5fb5ff] text-[30px]">
                  ◔
                </div>
              </div>
              <div className="rounded-[22px] border border-white/[0.05] bg-[#0b1018] p-5 mb-6">
                <h3 className="text-[20px] font-semibold text-white mb-5">
                  Wellbeing & Presentation
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                  {[
                    "Calm and settled",
                    "Alert and responsive",
                    "Comfortable",
                    "Sleeping/resting appropriately",
                    "Appears anxious",
                    "Appears distressed/agitated",
                    "No concerns observed",
                  ].map((item) => (
                    <label
                      key={item}
                      className="flex items-center gap-3 rounded-[14px] border border-[#1b2b3d] bg-[#101926] px-4 py-3 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={wellbeing.includes(item)}
                        onChange={() =>
                          toggleValue(item, wellbeing, setWellbeing)
                        }
                      />

                      <span className="text-white text-[14px]">{item}</span>
                    </label>
                  ))}
                </div>

                <textarea
                  value={wellbeingNotes}
                  onChange={(e) => setWellbeingNotes(e.target.value)}
                  placeholder="Detailed wellbeing notes..."
                  className="w-full h-[120px] rounded-[18px] border border-[#1d3248] bg-[#0d1722] p-4 text-white outline-none"
                />
              </div>

              <div className="rounded-[22px] border border-white/[0.05] bg-[#0b1018] p-5 mb-6">
                <h3 className="text-[20px] font-semibold text-white mb-5">
                  Mood & Emotional Wellbeing
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                  {[
                    "Happy/content",
                    "Calm",
                    "Quiet/withdrawn",
                    "Low mood observed",
                    "Engaging positively",
                    "Appears anxious/worried",
                  ].map((item) => (
                    <label
                      key={item}
                      className="flex items-center gap-3 rounded-[14px] border border-[#1b2b3d] bg-[#101926] px-4 py-3 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={mood.includes(item)}
                        onChange={() => toggleValue(item, mood, setMood)}
                      />

                      <span className="text-white text-[14px]">{item}</span>
                    </label>
                  ))}
                </div>

                <textarea
                  value={moodNotes}
                  onChange={(e) => setMoodNotes(e.target.value)}
                  placeholder="Detailed mood notes..."
                  className="w-full h-[120px] rounded-[18px] border border-[#1d3248] bg-[#0d1722] p-4 text-white outline-none"
                />
              </div>

              <div className="rounded-[22px] border border-white/[0.05] bg-[#0b1018] p-5 mb-6">
                <h3 className="text-[20px] font-semibold text-white mb-5">
                  Hydration & Nutrition
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                  {[
                    "0 glasses",
                    "1 glass",
                    "2 glasses",
                    "3+ glasses",
                    "Refused fluids",
                    "Encouraged fluids",
                    "Meal eaten",
                    "Snack taken",
                    "Refused food",
                  ].map((item) => (
                    <label
                      key={item}
                      className="flex items-center gap-3 rounded-[14px] border border-[#1b2b3d] bg-[#101926] px-4 py-3 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={hydration.includes(item)}
                        onChange={() =>
                          toggleValue(item, hydration, setHydration)
                        }
                      />

                      <span className="text-white text-[14px]">{item}</span>
                    </label>
                  ))}
                </div>

                <textarea
                  value={hydrationNotes}
                  onChange={(e) => setHydrationNotes(e.target.value)}
                  placeholder="Hydration notes..."
                  className="w-full h-[120px] rounded-[18px] border border-[#1d3248] bg-[#0d1722] p-4 text-white outline-none"
                />
              </div>

              <div className="rounded-[22px] border border-white/[0.05] bg-[#0b1018] p-5 mb-6">
                <h3 className="text-[20px] font-semibold text-white mb-5">
                  Safety & Environment
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                  {[
                    "Environment appears safe",
                    "No immediate hazards observed",
                    "Door/windows secure",
                    "Heating appropriate",
                    "Minor concern observed",
                    "Escalation required",
                  ].map((item) => (
                    <label
                      key={item}
                      className="flex items-center gap-3 rounded-[14px] border border-[#1b2b3d] bg-[#101926] px-4 py-3 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={safety.includes(item)}
                        onChange={() => toggleValue(item, safety, setSafety)}
                      />

                      <span className="text-white text-[14px]">{item}</span>
                    </label>
                  ))}
                </div>

                <textarea
                  value={safetyNotes}
                  onChange={(e) => setSafetyNotes(e.target.value)}
                  placeholder="Safety notes..."
                  className="w-full h-[120px] rounded-[18px] border border-[#1d3248] bg-[#0d1722] p-4 text-white outline-none"
                />
              </div>

              <div className="rounded-[22px] border border-white/[0.05] bg-[#0b1018] p-5 mb-6">
                <h3 className="text-[20px] font-semibold text-white mb-5">
                  Social Engagement & Activity
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                  {[
                    "Conversation provided",
                    "Watching TV",
                    "Listening to music",
                    "Reading/activity",
                    "Outdoor walk",
                    "Family interaction",
                    "Resting quietly",
                    "Declined engagement",
                  ].map((item) => (
                    <label
                      key={item}
                      className="flex items-center gap-3 rounded-[14px] border border-[#1b2b3d] bg-[#101926] px-4 py-3 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={engagement.includes(item)}
                        onChange={() =>
                          toggleValue(item, engagement, setEngagement)
                        }
                      />

                      <span className="text-white text-[14px]">{item}</span>
                    </label>
                  ))}
                </div>

                <textarea
                  value={engagementNotes}
                  onChange={(e) => setEngagementNotes(e.target.value)}
                  placeholder="Engagement notes..."
                  className="w-full h-[120px] rounded-[18px] border border-[#1d3248] bg-[#0d1722] p-4 text-white outline-none"
                />
              </div>
              <div className="h-[40px]" />
              <div className="flex flex-col sm:flex-row justify-end gap-4 sticky bottom-0 left-0 right-0 bg-[#060b12] pt-4 pb-2 border-t border-white/[0.06] mt-6">
                <button
                  onClick={() => setShowCheckinModal(false)}
                  className="h-[54px] px-7 rounded-[16px] border border-[#1d3248] bg-[#0d1722] text-white font-medium"
                >
                  Cancel
                </button>

                <button
                  onClick={submitCheckin}
                  className="h-[54px] px-7 rounded-[16px] bg-gradient-to-r from-[#57a8ff] to-[#87ff9f] text-black font-semibold"
                >
                  Submit Check-in
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
