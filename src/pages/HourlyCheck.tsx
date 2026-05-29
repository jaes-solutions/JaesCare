import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import { Clock3, CheckCircle2, AlertTriangle, XCircle, X } from "lucide-react";
import StaffSidebar from "../components/StaffSidebar";

const allHistory = [
  {
    date: "26 May 2026",
    checks: 8,
    completed: 7,
    missed: 1,
  },
  {
    date: "25 May 2026",
    checks: 8,
    completed: 8,
    missed: 0,
  },
  {
    date: "24 May 2026",
    checks: 8,
    completed: 6,
    missed: 2,
  },
  {
    date: "23 May 2026",
    checks: 8,
    completed: 8,
    missed: 0,
  },
];

export default function HourlyCheck() {
  const navigate = useNavigate();
  const [staffName, setStaffName] = useState("");
  const [staffRole, setStaffRole] = useState("");
  const [setCurrentShift] = useState<any | null>(null);
  const [todayChecks, setTodayChecks] = useState<any[]>([]);

  const [selectedCheckin, setSelectedCheckin] = useState<any | null>(null);
  const [showCheckinModal, setShowCheckinModal] = useState(false);

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

  useEffect(() => {
    checkStaffAccess();
  }, []);

  async function checkStaffAccess() {
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

      if (error || !profile) {
        navigate("/login");
        return;
      }

      setStaffName(profile.full_name || "Staff");
      setStaffRole(profile.role || "staff");
      const { data: shiftsData } = await supabase
        .from("shifts")
        .select("*")
        .eq("staff_id", session.user.id)
        .order("shift_date", { ascending: false })
        .order("start_time", { ascending: false });

      if (shiftsData && shiftsData.length > 0) {
        setCurrentShift(shiftsData[0]);

        const shiftIds = shiftsData.map((shift) => shift.id);

        let { data: checkinsData } = await supabase
          .from("checkins")
          .select("*")
          .in("shift_id", shiftIds)
          .order("scheduled_time", { ascending: false });

        if (!checkinsData || checkinsData.length === 0) {
          const shiftData = shiftsData[0];

          const start = new Date(
            `${shiftData.shift_date}T${shiftData.start_time}`,
          );

          const end = new Date(`${shiftData.shift_date}T${shiftData.end_time}`);

          const generatedCheckins = [];

          const current = new Date(start);

          while (current <= end) {
            generatedCheckins.push({
              shift_id: shiftData.id,

              patient_id: shiftData.patient_id,
              patient_name: shiftData.patient_name,

              staff_id: shiftData.staff_id,
              staff_name: shiftData.staff_name,

              scheduled_time: `${shiftData.shift_date}T${String(
                current.getHours(),
              ).padStart(2, "0")}:${String(current.getMinutes()).padStart(
                2,
                "0",
              )}:00`,

              status: "upcoming",
            });

            current.setHours(current.getHours() + 1);
          }

          const { data: insertedCheckins } = await supabase
            .from("checkins")
            .insert(generatedCheckins)
            .select();

          if (insertedCheckins) {
            checkinsData = insertedCheckins;
          }
        }
        if (checkinsData) {
          const formattedChecks = checkinsData.map((check) => {
            const scheduled = new Date(check.scheduled_time);

            const ukNow = new Date(
              new Date().toLocaleString("en-US", {
                timeZone: "Europe/London",
              }),
            );

            let status = "Upcoming";
            let color = "blue";
            let note = "Waiting for check-in";
            let completedAt = "--:--";

            const currentDiffMinutes =
              (ukNow.getTime() - scheduled.getTime()) / 60000;

            if (check.submitted_at) {
              const submitted = new Date(check.submitted_at);

              const submittedDiffMinutes =
                (submitted.getTime() - scheduled.getTime()) / 60000;

              completedAt = submitted.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              });

              if (submittedDiffMinutes <= 30) {
                status = "Completed on time";
                color = "green";
                note = "Check-in submitted within 30 minute window";
              } else if (submittedDiffMinutes <= 60) {
                status = "Late entry";
                color = "yellow";
                note = "Check-in submitted after 30 minutes";
              } else {
                status = "Missed entry";
                color = "red";
                note = "Check-in submitted too late";
              }
            } else {
              if (currentDiffMinutes >= 60) {
                status = "Missed entry";
                color = "red";
                completedAt = "Missed";
                note = "No check-in submitted within 1 hour";
              } else if (currentDiffMinutes >= 0) {
                status = "Upcoming";
                color = "blue";
                completedAt = "";
                note = "Check-in available now";
              } else {
                status = "Upcoming";
                color = "blue";
                completedAt = "";
                note = "Waiting for scheduled check-in time";
              }
            }

            return {
              ...check,
              id: check.id,
              shift_id: check.shift_id,
              patient_name: check.patient_name,
              staff_name: check.staff_name,
              scheduled_time: check.scheduled_time,
              date: scheduled.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                timeZone: "Europe/London",
              }),
              time: scheduled.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              }),
              status,
              note,
              completedAt,
              color,
            };
          });

          setTodayChecks(formattedChecks);
        }
      }
    } catch (err) {
      console.error(err);
      navigate("/login");
    }
  }
  function toggleValue(
    value: string,
    current: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
  ) {
    if (current.includes(value)) {
      setter(current.filter((item) => item !== value));
    } else {
      setter([...current, value]);
    }
  }

  async function submitCheckin() {
    if (!selectedCheckin) {
      alert("No check-in selected");
      return;
    }

    try {
      const submittedAt = new Date(
        new Date().toLocaleString("en-US", {
          timeZone: "Europe/London",
        }),
      );

      const scheduledTime = new Date(selectedCheckin.scheduled_time);

      const submittedDiffMinutes =
        (submittedAt.getTime() - scheduledTime.getTime()) / 60000;

      let checkinStatus = "completed_on_time";

      if (submittedDiffMinutes > 30 && submittedDiffMinutes <= 60) {
        checkinStatus = "late";
      }

      if (submittedDiffMinutes > 60) {
        checkinStatus = "missed";
      }

      const { data, error } = await supabase
        .from("checkins")
        .update({
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

          submitted_at: submittedAt.toISOString(),
          status: checkinStatus,
        })
        .eq("id", selectedCheckin.id)
        .select();

      console.log("CHECKIN SAVE DATA", data);
      console.log("CHECKIN SAVE ERROR", error);

      if (error) {
        alert(error.message);
        return;
      }

      alert("Check-in saved successfully");

      setShowCheckinModal(false);
      setSelectedCheckin(null);

      await checkStaffAccess();
    } catch (err) {
      console.error(err);
      alert("Failed to save check-in");
    }
  }
  return (
    <div className="min-h-screen bg-[#03060b] text-white flex overflow-hidden">
      <StaffSidebar onLogout={() => {}} />

      <div className="flex-1 overflow-y-auto lg:ml-[245px] min-h-screen bg-[#03060b] pt-[78px]">
        <Navbar name={staffName} role={staffRole} />

        <main className="max-w-7xl mx-auto p-5 lg:p-7">
          {/* HEADER */}
          <div className="mb-6">
            <p className="text-[#56a8ff] text-[13px] font-medium mb-2 tracking-[0.18em] uppercase">
              Hourly Monitoring
            </p>

            <h1 className="text-[34px] font-semibold leading-tight mb-3">
              Hourly Check-ins
            </h1>

            <p className="text-[#98a6b5] text-[14px] max-w-3xl leading-7">
              View all your assigned check-ins, completed entries, missed
              entries, and shift documentation history.
            </p>
          </div>

          <div className="grid xl:grid-cols-[1.15fr_0.85fr] gap-6">
            {/* TODAY */}
            <div className="rounded-[24px] border border-white/[0.06] bg-[#060b12]/95 backdrop-blur-2xl p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-[#5db5ff] text-[13px] mb-1">All Records</p>

                  <h2 className="text-[22px] font-semibold text-white">
                    All My Check-ins
                  </h2>
                </div>

                <div className="w-[44px] h-[44px] rounded-[14px] border border-[#1d3248] bg-[#0c1622] flex items-center justify-center text-[#78beff]">
                  <Clock3 size={18} />
                </div>
              </div>

              <div className="space-y-3">
                {todayChecks.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-[18px] border border-white/[0.05] bg-[#0b1018] p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-[52px] h-[52px] rounded-[16px] bg-[#101926] border border-[#1f3347] flex items-center justify-center text-[#78beff] text-[14px] font-medium">
                        {item.time}
                      </div>

                      <div>
                        <p className="text-white text-[14px] font-medium mb-1">
                          {item.patient_name || "Assigned Patient"}
                        </p>

                        <p className="text-[#7f92a6] text-[12px] mb-1">
                          {item.date}
                        </p>

                        <div className="flex items-center gap-2 mb-1">
                          {item.color === "green" && (
                            <CheckCircle2
                              size={16}
                              className="text-[#8eff4d]"
                            />
                          )}

                          {item.color === "yellow" && (
                            <AlertTriangle
                              size={16}
                              className="text-[#ffc83d]"
                            />
                          )}

                          {item.color === "red" && (
                            <XCircle size={16} className="text-[#ff6464]" />
                          )}

                          {item.color === "blue" && (
                            <Clock3 size={16} className="text-[#78beff]" />
                          )}

                          <p
                            className={`text-[15px] font-medium ${
                              item.color === "green"
                                ? "text-[#8eff4d]"
                                : item.color === "yellow"
                                  ? "text-[#ffc83d]"
                                  : item.color === "blue"
                                    ? "text-[#78beff]"
                                    : "text-[#ff6464]"
                            }`}
                          >
                            {item.status}
                          </p>
                        </div>

                        <p className="text-[#9dadbb] text-[13px]">
                          {item.note}
                        </p>
                      </div>
                    </div>

                    <div className="text-right min-w-[110px] flex justify-end">
                      {item.status === "Upcoming" &&
                      item.note === "Check-in available now" ? (
                        <button
                          onClick={() => {
                            setSelectedCheckin(item);
                            setShowCheckinModal(true);
                          }}
                          className="h-[44px] px-6 rounded-[14px] border border-[#1d3248] bg-[#102030] text-[#79c0ff] text-[14px] font-semibold"
                        >
                          Start
                        </button>
                      ) : item.status === "Missed entry" ? (
                        <button className="h-[44px] px-6 rounded-[14px] border border-[#5b2020] bg-[#2a1111] text-[#ff7a7a] text-[14px] font-semibold cursor-not-allowed">
                          Missed
                        </button>
                      ) : (
                        <p className="text-white text-[15px] font-medium">
                          {item.completedAt}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* HISTORY */}
            <div className="rounded-[24px] border border-white/[0.06] bg-[#060b12]/95 backdrop-blur-2xl p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-[#5db5ff] text-[13px] mb-1">
                    Previous Records
                  </p>

                  <h2 className="text-[22px] font-semibold text-white">
                    All Days History
                  </h2>
                </div>
              </div>

              <div className="space-y-3">
                {allHistory.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-[18px] border border-white/[0.05] bg-[#0b1018] p-4"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-[16px] font-medium text-white mb-1">
                          {item.date}
                        </h3>

                        <p className="text-[#8b98a6] text-[13px]">
                          Total scheduled check-ins: {item.checks}
                        </p>
                      </div>

                      <button className="h-[38px] px-4 rounded-[12px] border border-[#1d3248] bg-[#0d1723] text-[#79c0ff] text-[13px] font-medium hover:bg-[#122131] transition-all duration-300">
                        View Details
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-[14px] bg-[#0e1a10] border border-[#1f3d24] p-3">
                        <p className="text-[#8eff4d] text-[12px] mb-1">
                          Completed
                        </p>

                        <h2 className="text-[24px] font-semibold text-white">
                          {item.completed}
                        </h2>
                      </div>

                      <div className="rounded-[14px] bg-[#1b1111] border border-[#3b1f1f] p-3">
                        <p className="text-[#ff7272] text-[12px] mb-1">
                          Missed
                        </p>

                        <h2 className="text-[24px] font-semibold text-white">
                          {item.missed}
                        </h2>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
      {showCheckinModal && (
        <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-5xl rounded-[28px] border border-white/[0.08] bg-[#071019] p-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-[#66b7ff] text-[13px] uppercase tracking-[0.18em] mb-2">
                  Hourly Care Documentation
                </p>

                <h2 className="text-[30px] font-semibold text-white">
                  Complete Check-in
                </h2>
              </div>

              <button
                onClick={() => setShowCheckinModal(false)}
                className="w-[48px] h-[48px] rounded-[16px] border border-[#1d3248] bg-[#0d1722] flex items-center justify-center text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="rounded-[22px] border border-white/[0.05] bg-[#0b1018] p-5 mb-6">
              <h3 className="text-[20px] font-semibold text-white mb-5">
                Wellbeing & Presentation
              </h3>

              <div className="grid md:grid-cols-2 gap-3 mb-5">
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

              <div className="grid md:grid-cols-2 gap-3 mb-5">
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

              <div className="grid md:grid-cols-2 gap-3 mb-5">
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

              <div className="grid md:grid-cols-2 gap-3 mb-5">
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

              <div className="grid md:grid-cols-2 gap-3 mb-5">
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

            <div className="flex justify-end gap-4">
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
      )}
    </div>
  );
}
