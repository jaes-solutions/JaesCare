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
  const currentUkDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/London",
  }).format(new Date());

  const currentUkTime = new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "Europe/London",
    }),
  )
    .toTimeString()
    .slice(0, 5);

  const activeShiftPatient = shifts.find((shift) => {
    const shiftStart = shift.start_time.slice(0, 5);
    const shiftEnd = shift.end_time.slice(0, 5);

    return (
      shift.shift_date === currentUkDate &&
      currentUkTime >= shiftStart &&
      currentUkTime <= shiftEnd
    );
  });

  const nextShiftPatient = shifts.find((shift) => {
    if (shift.shift_date > currentUkDate) return true;

    return (
      shift.shift_date === currentUkDate &&
      shift.start_time.slice(0, 5) > currentUkTime
    );
  });

  const assignedPatient = activeShiftPatient || nextShiftPatient || shifts[0];
  const onTimeCount = todayChecks.filter(
    (c) => c.status === "Completed on time",
  ).length;

  const lateCount = todayChecks.filter((c) => c.status === "Late entry").length;

  const missedCount = todayChecks.filter(
    (c) => c.status === "Missed entry",
  ).length;

  const totalCount = todayChecks.length;
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

  const [mobility, setMobility] = useState<string[]>([]);
  const [mobilityNotes, setMobilityNotes] = useState("");

  const [medication, setMedication] = useState<string[]>([]);
  const [medicationNotes, setMedicationNotes] = useState("");

  const [privacyReview, setPrivacyReview] = useState<string[]>([]);
  const [privacyReviewNotes, setPrivacyReviewNotes] = useState("");

  const [personalSupport, setPersonalSupport] = useState<string[]>([]);
  const [personalSupportNotes, setPersonalSupportNotes] = useState("");

  const [safeguarding, setSafeguarding] = useState<string[]>([]);
  const [safeguardingNotes, setSafeguardingNotes] = useState("");
  const [showAllShifts, setShowAllShifts] = useState(false);
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState<any>(null);

  const [wellbeingSummary, setWellbeingSummary] = useState("");
  const [careSummary, setCareSummary] = useState("");
  const [concernsIncidents, setConcernsIncidents] = useState("");
  const [escalations, setEscalations] = useState("");
  const [familyCommunication, setFamilyCommunication] = useState("");
  const [baselineChanges, setBaselineChanges] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [detailedNotes, setDetailedNotes] = useState("");

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

        if (activeShift) {
          setNextCheckin({
            time: activeShift.end_time.slice(0, 5),
            isHandover: true,
          });

          const handoverTime = ukToUTC(
            activeShift.shift_date,
            activeShift.end_time.slice(0, 5),
          );

          const diff = handoverTime.getTime() - new Date().getTime();

          if (diff <= 0) {
            setNextCountdown("Handover Required");
            setNextProgress(100);
          } else {
            const hours = Math.floor(diff / 3600000);
            const minutes = Math.floor((diff % 3600000) / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);

            setNextCountdown(`${hours}h ${minutes}m ${seconds}s`);

            const oneHour = 60 * 60 * 1000;
            setNextProgress(
              Math.min(100, Math.max(0, ((oneHour - diff) / oneHour) * 100)),
            );
          }

          return;
        }

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
  }, [todayChecks, notifiedCheckin, shifts]);

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

      if (error || !profile || profile.role?.trim().toLowerCase() !== "staff") {
        navigate("/login");
        return;
      }

      setStaffName(profile.full_name || "Staff");
      setStaffRole(profile.role || "staff");

      const { data: shiftData, error: shiftError } = await supabase
        .from("shifts")
        .select("*")
        .eq("staff_id", session.user.id)
        .order("shift_date", { ascending: true });

      if (shiftData) {
        const ukNow = new Date(
          new Date().toLocaleString("en-US", {
            timeZone: "Europe/London",
          }),
        );

        const currentDate = new Intl.DateTimeFormat("en-CA", {
          timeZone: "Europe/London",
        }).format(new Date());

        const currentTime = ukNow.toTimeString().slice(0, 5);

        for (const shift of shiftData) {
          const shiftFinished =
            shift.shift_date < currentDate ||
            (shift.shift_date === currentDate &&
              currentTime > shift.end_time.slice(0, 5));

          if (shiftFinished && shift.status !== "done") {
            await supabase
              .from("shifts")
              .update({ status: "done" })
              .eq("id", shift.id)
              .eq("staff_id", session.user.id);

            shift.status = "done";
          }
        }
      }

      if (!shiftError && shiftData) {
        const sortedShifts = [...shiftData].sort((a, b) => {
          const aDateTime = `${a.shift_date} ${a.start_time}`;
          const bDateTime = `${b.shift_date} ${b.start_time}`;
          return bDateTime.localeCompare(aDateTime);
        });

        setShifts(sortedShifts);
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
              .select("id,status,submitted_at")
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

                // Calculate 4-hourly missed status
                const hoursFromShiftStart = Math.round(
                  (checkTime.getTime() -
                    ukToUTC(
                      shift.shift_date,
                      shift.start_time.slice(0, 5),
                    ).getTime()) /
                    (1000 * 60 * 60),
                );

                const isFourHourlyMissed =
                  hoursFromShiftStart > 0 && hoursFromShiftStart % 4 === 0;

                const { error: missedError } = await supabase
                  .from("checkins")
                  .upsert(
                    {
                      shift_id: shift.id,
                      patient_id: shift.patient_id,
                      patient_name: shift.patient_name,
                      staff_id: shift.staff_id,
                      staff_name: shift.staff_name,
                      scheduled_time: checkTime.toISOString(),
                      submitted_at: new Date().toISOString(),
                      status: "missed",
                      wellbeing: [],
                      wellbeing_notes: "",
                      mood: [],
                      mood_notes: "",
                      hydration: [],
                      hydration_notes: "",
                      safety: [],
                      safety_notes: "",
                      engagement: [],
                      engagement_notes: "",
                      ...(isFourHourlyMissed && {
                        mobility: [],
                        mobility_notes: "",
                        medication: [],
                        medication_notes: "",
                        privacy: [],
                        privacy_notes: "",
                        support: [],
                        support_notes: "",
                        safeguarding: [],
                        safeguarding_notes: "",
                      }),
                    },
                    {
                      onConflict: "shift_id,scheduled_time",
                    },
                  );

                if (missedError) {
                  console.error("Failed to save missed check-in:", missedError);
                }
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
              isFourHourly:
                generatedChecks.length > 0 &&
                (generatedChecks.length + 1) % 4 === 0,
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

    const missingStandardSection =
      wellbeing.length === 0 ||
      mood.length === 0 ||
      hydration.length === 0 ||
      safety.length === 0 ||
      engagement.length === 0;

    if (missingStandardSection) {
      alert(
        "All sections must have at least one checkbox selected. Notes are optional.",
      );
      return;
    }

    if (selectedCheckin?.isFourHourly) {
      const missingFourHourlySection =
        mobility.length === 0 ||
        medication.length === 0 ||
        privacyReview.length === 0 ||
        personalSupport.length === 0 ||
        safeguarding.length === 0;

      if (missingFourHourlySection) {
        alert(
          "All 4-hourly review sections must have at least one checkbox selected. Notes are optional.",
        );
        return;
      }
    }

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

          mobility,
          mobility_notes: mobilityNotes,

          medication,
          medication_notes: medicationNotes,

          privacy: privacyReview,
          privacy_notes: privacyReviewNotes,

          support: personalSupport,
          support_notes: personalSupportNotes,

          safeguarding,
          safeguarding_notes: safeguardingNotes,
        });

      if (checkinInsertError) {
        console.error("Check-in insert error:", checkinInsertError);
        return;
      }

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
      setMobility([]);
      setMobilityNotes("");

      setMedication([]);
      setMedicationNotes("");

      setPrivacyReview([]);
      setPrivacyReviewNotes("");

      setPersonalSupport([]);
      setPersonalSupportNotes("");

      setSafeguarding([]);
      setSafeguardingNotes("");
    } catch (err) {
      console.error(err);
    }
  };

  const submitHandover = async () => {
    if (!selectedShift) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) return;

    const { error } = await supabase.from("handovers").insert({
      shift_id: selectedShift.id,
      wellbeing_summary: wellbeingSummary,
      care_summary: careSummary,
      concerns_incidents: concernsIncidents,
      escalations,
      family_communication: familyCommunication,
      baseline_changes: baselineChanges,
      recommendations,
      detailed_notes: detailedNotes,
      submitted_by: session.user.id,
    });

    if (error) {
      console.error("Failed to save handover", error);
      alert("Failed to save handover");
      return;
    }

    await supabase
      .from("shifts")
      .update({ handover_completed: true })
      .eq("id", selectedShift.id)
      .eq("staff_id", session.user.id);

    setShowHandoverModal(false);
    setSelectedShift(null);

    setWellbeingSummary("");
    setCareSummary("");
    setConcernsIncidents("");
    setEscalations("");
    setFamilyCommunication("");
    setBaselineChanges("");
    setRecommendations("");
    setDetailedNotes("");

    await checkStaffAccess();
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
                    {assignedPatient?.patient_name || "No Patient Assigned"}
                  </h2>

                  <p className="text-[#9ca8b5] text-[13px]">
                    {assignedPatient?.patient_role || "Care Patient"}
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
                  Current/latest shift shown. Expand to view all shifts.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowAllShifts(!showAllShifts)}
                  className="h-[42px] px-4 rounded-[12px] border border-[#1f3b56] bg-[#0c1825] text-[#79bbff] text-[13px] font-medium"
                >
                  {showAllShifts ? "Hide Shifts" : "View All Shifts"}
                </button>

                <div className="w-[54px] h-[54px] rounded-[16px] border border-[#1f3b56] bg-[#0c1825] flex items-center justify-center text-[#79bbff] text-[24px]">
                  📅
                </div>
              </div>
            </div>

            {shifts.length === 0 ? (
              <div className="h-[120px] rounded-[18px] border border-dashed border-white/[0.08] bg-[#0b1018] flex items-center justify-center text-[#7f8b99] text-[15px]">
                No shifts assigned yet.
              </div>
            ) : (
              <div className="space-y-3">
                {(showAllShifts ? shifts : shifts.slice(0, 1)).map((shift) => (
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

                            if (
                              shift.status === "done" &&
                              !shift.handover_completed
                            ) {
                              return "Handover Required";
                            }

                            if (
                              shift.status === "done" &&
                              shift.handover_completed
                            ) {
                              return "Completed";
                            }
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
                    <div className="flex gap-2">
                      {shift.status === "done" && !shift.handover_completed && (
                        <button
                          onClick={() => {
                            setSelectedShift(shift);
                            setShowHandoverModal(true);
                          }}
                          className="h-[42px] px-4 rounded-[12px] bg-[#ffd15c] text-black font-medium"
                        >
                          Start Handover
                        </button>
                      )}
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
                      {nextCheckin?.isHandover
                        ? "Handover"
                        : nextCheckin?.time || "--:--"}
                    </h2>
                    <p className="text-[#b5c0cb] text-[14px]">
                      {nextCheckin
                        ? nextCheckin.isHandover
                          ? `Handover begins at ${nextCheckin.time}`
                          : `Available from ${nextCheckin.time}`
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
                    ["On Time", String(onTimeCount), "#8eff4d"],
                    ["Late", String(lateCount), "#ffc83d"],
                    ["Missed", String(missedCount), "#ff5757"],
                    ["Total", String(totalCount), "#5db5ff"],
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

      {/* HANDOVER MODAL */}
      {showHandoverModal && (
        <div className="fixed inset-0 z-[2147483647] bg-black/90 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-[#060b12] rounded-[24px] p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-white text-[28px] font-semibold mb-6">
              End of Shift Handover
            </h2>

            {[
              [
                "Overall presentation and wellbeing summary",
                wellbeingSummary,
                setWellbeingSummary,
              ],
              ["Summary of care/support provided", careSummary, setCareSummary],
              [
                "Any concerns or incidents",
                concernsIncidents,
                setConcernsIncidents,
              ],
              ["Escalations made", escalations, setEscalations],
              [
                "Family communication",
                familyCommunication,
                setFamilyCommunication,
              ],
              [
                "Changes from normal baseline",
                baselineChanges,
                setBaselineChanges,
              ],
              [
                "Recommendations for next staff member",
                recommendations,
                setRecommendations,
              ],
              ["Detailed handover notes", detailedNotes, setDetailedNotes],
            ].map(([label, value, setter]: any) => (
              <div key={label} className="mb-4">
                <label className="block text-white mb-2">{label}</label>
                <textarea
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  className="w-full h-[100px] rounded-[12px] bg-[#0d1722] border border-[#1d3248] p-3 text-white"
                />
              </div>
            ))}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowHandoverModal(false)}
                className="px-5 h-[48px] border border-[#1d3248] rounded-[12px] text-white"
              >
                Cancel
              </button>
              <button
                onClick={submitHandover}
                className="px-5 h-[48px] rounded-[12px] bg-[#ffd15c] text-black font-semibold"
              >
                Submit Handover
              </button>
            </div>
          </div>
        </div>
      )}

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
                    "Appears tired/fatigued",
                    "Sleeping/resting appropriately",
                    "Appears anxious",
                    "Appears distressed/agitated",
                    "Appears confused/disorientated",
                    "Appears physically unwell",
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

              {selectedCheckin?.isFourHourly && (
                <div className="rounded-[22px] border border-[#3b3520] bg-[#16120b] p-5 mb-6">
                  <h3 className="text-[20px] font-semibold text-white mb-3">
                    4-Hourly Review Required
                  </h3>
                  <p className="text-[#ffd15c] text-[14px]">
                    Complete Mobility, Medication, Privacy, Personal Support and
                    Safeguarding reviews for this check-in.
                  </p>
                </div>
              )}

              {selectedCheckin?.isFourHourly && (
                <>
                  {/* Mobility & Functional Ability Review */}
                  <div className="rounded-[22px] border border-white/[0.05] bg-[#0b1018] p-5 mb-6">
                    <h3 className="text-[20px] font-semibold text-white mb-5">
                      Mobility & Functional Ability Review
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                      {[
                        "Independent mobility maintained",
                        "Walking with support",
                        "Walking aid used",
                        "Wheelchair used",
                        "Reduced mobility observed",
                        "Unsteady mobility observed",
                        "Increased falls risk observed",
                        "Fatigue affecting mobility",
                        "Client remained seated/bed resting",
                      ].map((item) => (
                        <label
                          key={item}
                          className="flex items-center gap-3 rounded-[14px] border border-[#1b2b3d] bg-[#101926] px-4 py-3 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={mobility.includes(item)}
                            onChange={() =>
                              toggleValue(item, mobility, setMobility)
                            }
                          />
                          <span className="text-white text-[14px]">{item}</span>
                        </label>
                      ))}
                    </div>
                    <textarea
                      value={mobilityNotes}
                      onChange={(e) => setMobilityNotes(e.target.value)}
                      placeholder="Mobility notes..."
                      className="w-full h-[120px] rounded-[18px] border border-[#1d3248] bg-[#0d1722] p-4 text-white outline-none"
                    />
                  </div>
                  {/* Medication Prompts & Health Observations */}
                  <div className="rounded-[22px] border border-white/[0.05] bg-[#0b1018] p-5 mb-6">
                    <h3 className="text-[20px] font-semibold text-white mb-5">
                      Medication Prompts & Health Observations
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                      {[
                        "Medication prompted",
                        "Medication taken independently",
                        "Medication refused",
                        "Medication not due",
                        "Health concern escalated",
                        "No concerns observed",
                        "Pain/discomfort observed",
                        "Shortness of breath observed",
                        "Appears lethargic",
                        "Change in condition observed",
                      ].map((item) => (
                        <label
                          key={item}
                          className="flex items-center gap-3 rounded-[14px] border border-[#1b2b3d] bg-[#101926] px-4 py-3 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={medication.includes(item)}
                            onChange={() =>
                              toggleValue(item, medication, setMedication)
                            }
                          />
                          <span className="text-white text-[14px]">{item}</span>
                        </label>
                      ))}
                    </div>
                    <textarea
                      value={medicationNotes}
                      onChange={(e) => setMedicationNotes(e.target.value)}
                      placeholder="Medication/health notes..."
                      className="w-full h-[120px] rounded-[18px] border border-[#1d3248] bg-[#0d1722] p-4 text-white outline-none"
                    />
                  </div>
                  {/* Privacy, Respect & Independence Review */}
                  <div className="rounded-[22px] border border-white/[0.05] bg-[#0b1018] p-5 mb-6">
                    <h3 className="text-[20px] font-semibold text-white mb-5">
                      Privacy, Respect & Independence Review
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                      {[
                        "Client spoken to respectfully",
                        "Client addressed by preferred name",
                        "Privacy respected",
                        "Consent obtained before prompts/support",
                        "Client involved in decisions",
                        "Client choices respected",
                        "Client encouraged to maintain independence",
                        "Client not rushed during interaction",
                        "Cultural/religious preferences respected",
                      ].map((item) => (
                        <label
                          key={item}
                          className="flex items-center gap-3 rounded-[14px] border border-[#1b2b3d] bg-[#101926] px-4 py-3 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={privacyReview.includes(item)}
                            onChange={() =>
                              toggleValue(item, privacyReview, setPrivacyReview)
                            }
                          />
                          <span className="text-white text-[14px]">{item}</span>
                        </label>
                      ))}
                    </div>
                    <textarea
                      value={privacyReviewNotes}
                      onChange={(e) => setPrivacyReviewNotes(e.target.value)}
                      placeholder="Privacy/respect notes..."
                      className="w-full h-[120px] rounded-[18px] border border-[#1d3248] bg-[#0d1722] p-4 text-white outline-none"
                    />
                  </div>
                  {/* Personal Support & Comfort Review */}
                  <div className="rounded-[22px] border border-white/[0.05] bg-[#0b1018] p-5 mb-6">
                    <h3 className="text-[20px] font-semibold text-white mb-5">
                      Personal Support & Comfort Review
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                      {[
                        "Prompted toileting",
                        "Prompted washing/freshening up",
                        "Prompted oral care",
                        "Prompted clothing change",
                        "Client appeared clean and comfortable",
                        "Client declined prompts",
                        "No support required",
                      ].map((item) => (
                        <label
                          key={item}
                          className="flex items-center gap-3 rounded-[14px] border border-[#1b2b3d] bg-[#101926] px-4 py-3 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={personalSupport.includes(item)}
                            onChange={() =>
                              toggleValue(
                                item,
                                personalSupport,
                                setPersonalSupport,
                              )
                            }
                          />
                          <span className="text-white text-[14px]">{item}</span>
                        </label>
                      ))}
                    </div>
                    <textarea
                      value={personalSupportNotes}
                      onChange={(e) => setPersonalSupportNotes(e.target.value)}
                      placeholder="Personal support notes..."
                      className="w-full h-[120px] rounded-[18px] border border-[#1d3248] bg-[#0d1722] p-4 text-white outline-none"
                    />
                  </div>
                  {/* Safeguarding Review */}
                  <div className="rounded-[22px] border border-white/[0.05] bg-[#0b1018] p-5 mb-6">
                    <h3 className="text-[20px] font-semibold text-white mb-5">
                      Safeguarding Review
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                      {[
                        "No safeguarding concerns observed",
                        "Environmental concern identified",
                        "Financial vulnerability concern observed",
                        "Possible neglect concern observed",
                        "Concern escalated appropriately",
                        "Family/supervisor informed",
                      ].map((item) => (
                        <label
                          key={item}
                          className="flex items-center gap-3 rounded-[14px] border border-[#1b2b3d] bg-[#101926] px-4 py-3 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={safeguarding.includes(item)}
                            onChange={() =>
                              toggleValue(item, safeguarding, setSafeguarding)
                            }
                          />
                          <span className="text-white text-[14px]">{item}</span>
                        </label>
                      ))}
                    </div>
                    <textarea
                      value={safeguardingNotes}
                      onChange={(e) => setSafeguardingNotes(e.target.value)}
                      placeholder="Safeguarding notes..."
                      className="w-full h-[120px] rounded-[18px] border border-[#1d3248] bg-[#0d1722] p-4 text-white outline-none"
                    />
                  </div>
                </>
              )}
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
