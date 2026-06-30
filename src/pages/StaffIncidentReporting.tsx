import React, { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import Sidebar from "../components/StaffSidebar";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";

import { supabase } from "../lib/supabase";

// Incident categories and subcategories
const incidentCategories: { [key: string]: string[] } = {
  "Clinical & Health Incidents": [
    "Medication error",
    "Fall",
    "Seizure",
    "Self-harm",
    "Injury/accident",
    "Deterioration in health",
    "Pressure ulcer",
    "Other clinical",
  ],
  "Safeguarding Incidents": [
    "Allegation of abuse",
    "Neglect",
    "Financial abuse",
    "Absconding/missing",
    "Peer-on-peer abuse",
    "Other safeguarding",
  ],
  "Behavioural & Emotional Incidents": [
    "Aggression/violence",
    "Verbal abuse",
    "Emotional distress",
    "Property damage",
    "Sexualised behaviour",
    "Bullying",
    "Other behavioural",
  ],
  "Environmental & Property Incidents": [
    "Fire alarm triggered",
    "Property damage",
    "Unsafe environment",
    "Equipment failure",
    "Theft/loss",
    "Other environmental",
  ],
  "Care Delivery Incidents": [
    "Missed care",
    "Incorrect care",
    "Documentation error",
    "Late care",
    "Other care delivery",
  ],
  "Staff Related Incidents": [
    "Staff injury",
    "Staff conduct",
    "Staff absence",
    "Staff conflict",
    "Other staff",
  ],
  "Infection Prevention & Control": [
    "Infection outbreak",
    "Infection exposure",
    "PPE breach",
    "Other infection control",
  ],
  "Complaints & Feedback": [
    "Complaint received",
    "Compliment received",
    "Suggestion",
    "Other feedback",
  ],
  "Near Miss Incidents": [
    "Near miss clinical",
    "Near miss environmental",
    "Near miss safeguarding",
    "Other near miss",
  ],
  "General / Other": ["Other"],
};

const actionsList = [
  "Client reassured",
  "Supervisor informed",
  "Family informed",
  "GP contacted",
  "999 called",
  "First aid provided",
  "Monitoring increased",
  "Incident escalated",
  "No further action required",
];

const outcomeList = [
  "Resolved",
  "Ongoing concern",
  "Hospital transfer",
  "Follow up required",
  "Monitoring required",
  "Awaiting further review",
];

const StaffIncidentReporting: React.FC = () => {
  // State fields
  const [clientName, setClientName] = useState("");
  const [staffName, setStaffName] = useState("");
  const [location, setLocation] = useState("");
  const [shiftType, setShiftType] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [incidentDescription, setIncidentDescription] = useState("");
  const [actionDetails, setActionDetails] = useState("");
  const [outcomeDetails, setOutcomeDetails] = useState("");
  const [witnesses, setWitnesses] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<FileList | null>(null);
  const [escalationDetails, setEscalationDetails] = useState("");
  const [declaration, setDeclaration] = useState(false);
  const [actionsTaken, setActionsTaken] = useState<string[]>([]);
  const [outcome, setOutcome] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [organisationId, setOrganisationId] = useState<string | null>(null);
  const [name, setName] = useState("Staff");
  const [role, setRole] = useState("Staff");
  const [incidentDate, setIncidentDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [incidentTime, setIncidentTime] = useState(
    new Date().toTimeString().slice(0, 5),
  );
  useEffect(() => {
    const loadOrganisationIdAndResident = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) return;

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("full_name, organization_id, role")
        .eq("id", session.user.id)
        .maybeSingle();

      if (error) {
        console.error("Failed to load profile:", error);
        return;
      }

      if (profile?.organization_id) {
        setOrganisationId(profile.organization_id);
      }
      if (profile?.role) {
        setRole(profile.role);
      }

      const fullName = profile?.full_name?.trim();

      if (fullName) {
        setName(fullName);
        setStaffName(fullName);
      } else {
        setName(session.user.email ?? "Staff");
      }

      // Load currently assigned resident from active shift
      const { data: shift } = await supabase
        .from("shifts")
        .select("patient_name")
        .eq("staff_id", session.user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (shift?.patient_name) {
        setClientName(shift.patient_name);
      }

      console.log("Loaded profile:", profile);
    };

    loadOrganisationIdAndResident();
  }, []);

  // Date and time
  const now = new Date();
  const dateString = now.toLocaleDateString();
  const timeString = now.toLocaleTimeString();

  // Handle category change
  const handleCategoryChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setCategory(e.target.value);
    setSubcategory(""); // Reset subcategory
  };
  const navigate = useNavigate();
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };
  // This Handles actions checkbox
  const handleActionChange = (action: string) => {
    setActionsTaken((prev) =>
      prev.includes(action)
        ? prev.filter((a) => a !== action)
        : [...prev, action],
    );
  };

  // Handle file upload
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUploadedFiles(e.target.files);
  };

  // Handle submit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    let uploadedFileUrls: string[] = [];

    if (uploadedFiles && uploadedFiles.length > 0) {
      for (const file of Array.from(uploadedFiles)) {
        const safeFileName = file.name
          .replace(/[^a-zA-Z0-9._-]/g, "_")
          .replace(/_+/g, "_");
        const filePath = `incidents/${Date.now()}-${safeFileName}`;

        const { error: uploadError } = await supabase.storage
          .from("incident-photos")
          .upload(filePath, file);

        if (uploadError) {
          console.error("File upload failed:", uploadError);
          alert("File upload failed.");
          setIsSubmitting(false);
          return;
        }

        const { data } = supabase.storage
          .from("incident-photos")
          .getPublicUrl(filePath);

        uploadedFileUrls.push(data.publicUrl);
      }
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      alert("You must be logged in to submit an incident.");
      setIsSubmitting(false);
      return;
    }

    const payload = {
      resident_name: clientName,
      staff_name: staffName,
      reported_by: session.user.id,
      organization_id: organisationId,
      location,
      shift_type: shiftType,
      incident_date: incidentDate,
      incident_time: incidentTime,
      category,
      subcategory,
      incident_description: incidentDescription,
      actions_taken: actionsTaken,
      action_details: actionDetails,
      outcome,
      outcome_details: outcomeDetails,
      witnesses,
      uploaded_files: uploadedFileUrls,
      escalation_details: escalationDetails,
      declaration,
    };
    console.log(payload);

    const { error } = await supabase.from("incidents").insert([payload]);

    if (error) {
      console.error("Failed to save incident:", error);
      alert("Failed to submit incident.");
      setIsSubmitting(false);
    } else {
      alert("Incident submitted successfully.");
      setIncidentDate(new Date().toISOString().split("T")[0]);
      setIncidentTime(new Date().toTimeString().slice(0, 5));
      // Keep the assigned resident after submission
      setStaffName(name);
      setLocation("");
      setShiftType("");
      setCategory("");
      setSubcategory("");
      setIncidentDescription("");
      setActionDetails("");
      setOutcomeDetails("");
      setWitnesses("");
      setUploadedFiles(null);
      setEscalationDetails("");
      setDeclaration(false);
      setActionsTaken([]);
      setOutcome("");

      setIsSubmitting(false);
    }
  };

  // Cancel handler
  const handleCancel = () => {
    // Optionally, implement navigation or form clear
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-black/60">
      <Sidebar onLogout={handleLogout} />
      <div className="lg:ml-[245px] min-h-screen">
        <Navbar name={name} role={role} />
        <form
          onSubmit={handleSubmit}
          className="px-4 sm:px-6 lg:px-8 pt-14 pb-6"
        >
          <div className="max-w-5xl mx-auto">
            <div className="mb-8">
              <h1 className="mt-7 text-[32px] font-bold tracking-tight text-gray-900 dark:text-white">
                Incident Reporting
              </h1>
              <p className="mt-2 text-gray-600 dark:text-slate-400">
                Record, manage and escalate resident incidents.
              </p>
            </div>
            {/* 1. Basic Incident Details */}
            <section className="bg-white dark:bg-[#060b12]/95 border border-black/10 dark:border-white/[0.06] rounded-[24px] p-7 mb-6 shadow-sm backdrop-blur-sm">
              <h2 className="mb-5 text-xl font-semibold text-sky-400">
                Basic Incident Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">
                    Resident Name
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-black/10 dark:border-white/[0.06] bg-white dark:bg-[#0b1018] text-gray-900 dark:text-white px-4 py-3"
                    value={clientName}
                    readOnly
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">
                    Staff Name
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-black/10 dark:border-white/[0.06] bg-white dark:bg-[#0b1018] text-gray-900 dark:text-white px-4 py-3"
                    value={staffName}
                    readOnly
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">
                    Location
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-black/10 dark:border-white/[0.06] bg-white dark:bg-[#0b1018] text-gray-900 dark:text-white px-4 py-3"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">
                    Shift Type
                  </label>
                  <select
                    className="w-full rounded-xl border border-black/10 dark:border-white/[0.06] bg-white dark:bg-[#0b1018] text-gray-900 dark:text-white px-4 py-3"
                    value={shiftType}
                    onChange={(e) => setShiftType(e.target.value)}
                    required
                  >
                    <option value="">Select shift</option>
                    <option>Day</option>
                    <option>Night</option>
                    <option>Evening</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">
                    Incident Date
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-black/10 dark:border-white/[0.06] bg-white dark:bg-[#0b1018] text-gray-900 dark:text-white px-4 py-3"
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                    required
                    onClick={(e) => {
                      (e.currentTarget as HTMLInputElement).showPicker?.();
                    }}
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">
                    Incident Time
                  </label>
                  <input
                    type="time"
                    className="w-full rounded-xl border border-black/10 dark:border-white/[0.06] bg-white dark:bg-[#0b1018] text-gray-900 dark:text-white px-4 py-3"
                    value={incidentTime}
                    onChange={(e) => setIncidentTime(e.target.value)}
                    required
                    step={60}
                    onClick={(e) => {
                      (e.currentTarget as HTMLInputElement).showPicker?.();
                    }}
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">
                    Date
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-black/10 dark:border-white/[0.06] bg-white dark:bg-[#0b1018] text-gray-900 dark:text-white px-4 py-3 bg-slate-100"
                    value={dateString}
                    readOnly
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">
                    Time
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-black/10 dark:border-white/[0.06] bg-white dark:bg-[#0b1018] text-gray-900 dark:text-white px-4 py-3 bg-slate-100"
                    value={timeString}
                    readOnly
                  />
                </div>
              </div>
            </section>

            {/* 2. Incident Type */}
            <section className="bg-white dark:bg-[#060b12]/95 border border-black/10 dark:border-white/[0.06] rounded-[24px] p-7 mb-6 shadow-sm backdrop-blur-sm">
              <h2 className="mb-5 text-xl font-semibold text-sky-400">
                Incident Type
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">
                    Category
                  </label>
                  <select
                    className="w-full rounded-xl border border-black/10 dark:border-white/[0.06] bg-white dark:bg-[#0b1018] text-gray-900 dark:text-white px-4 py-3"
                    value={category}
                    onChange={handleCategoryChange}
                    required
                  >
                    <option value="">Select category</option>
                    {Object.keys(incidentCategories).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-1 text-slate-700 dark:text-slate-300">
                    Subcategory
                  </label>
                  <select
                    className="w-full rounded-xl border border-black/10 dark:border-white/[0.06] bg-white dark:bg-[#0b1018] text-gray-900 dark:text-white px-4 py-3"
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                    required
                    disabled={!category}
                  >
                    <option value="">Select subcategory</option>
                    {category &&
                      incidentCategories[category].map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </section>

            {/* 3. What Happened? */}
            <section className="bg-white dark:bg-[#060b12]/95 border border-black/10 dark:border-white/[0.06] rounded-[24px] p-7 mb-6 shadow-sm backdrop-blur-sm">
              <h2 className="mb-5 text-xl font-semibold text-sky-400">
                What Happened?
              </h2>
              <textarea
                className="w-full rounded-xl border border-black/10 dark:border-white/[0.06] bg-white dark:bg-[#0b1018] text-gray-900 dark:text-white px-4 py-3 min-h-[120px]"
                value={incidentDescription}
                onChange={(e) => setIncidentDescription(e.target.value)}
                placeholder="Describe the incident in detail..."
                required
              />
            </section>

            {/* 4. Immediate Actions Taken */}
            <section className="bg-white dark:bg-[#060b12]/95 border border-black/10 dark:border-white/[0.06] rounded-[24px] p-7 mb-6 shadow-sm backdrop-blur-sm">
              <h2 className="mb-5 text-xl font-semibold text-sky-400">
                Immediate Actions Taken
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
                {actionsList.map((action) => (
                  <label
                    key={action}
                    className="flex items-center rounded-xl border border-black/10 dark:border-white/[0.06] px-3 py-3"
                  >
                    <input
                      type="checkbox"
                      className="accent-sky-600 mr-2"
                      checked={actionsTaken.includes(action)}
                      onChange={() => handleActionChange(action)}
                    />
                    <span>{action}</span>
                  </label>
                ))}
              </div>
              <textarea
                className="w-full rounded-xl border border-black/10 dark:border-white/[0.06] bg-white dark:bg-[#0b1018] text-gray-900 dark:text-white px-4 py-3 min-h-[80px]"
                value={actionDetails}
                onChange={(e) => setActionDetails(e.target.value)}
                placeholder="Provide further details about actions taken..."
              />
            </section>

            {/* 5. Outcome of Incident */}
            <section className="bg-white dark:bg-[#060b12]/95 border border-black/10 dark:border-white/[0.06] rounded-[24px] p-7 mb-6 shadow-sm backdrop-blur-sm">
              <h2 className="mb-5 text-xl font-semibold text-sky-400">
                Outcome of Incident
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
                {outcomeList.map((opt) => (
                  <label
                    key={opt}
                    className="flex items-center rounded-xl border border-black/10 dark:border-white/[0.06] px-3 py-3"
                  >
                    <input
                      type="radio"
                      name="outcome"
                      className="accent-sky-600 mr-2"
                      checked={outcome === opt}
                      onChange={() => setOutcome(opt)}
                      required
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
              <textarea
                className="w-full rounded-xl border border-black/10 dark:border-white/[0.06] bg-white dark:bg-[#0b1018] text-gray-900 dark:text-white px-4 py-3 min-h-[80px]"
                value={outcomeDetails}
                onChange={(e) => setOutcomeDetails(e.target.value)}
                placeholder="Provide further details about the outcome..."
              />
            </section>

            {/* 6. Witnesses */}
            <section className="bg-white dark:bg-[#060b12]/95 border border-black/10 dark:border-white/[0.06] rounded-[24px] p-7 mb-6 shadow-sm backdrop-blur-sm">
              <h2 className="mb-5 text-xl font-semibold text-sky-400">
                Witnesses
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Include staff, residents, visitors or professionals who
                witnessed the incident.
              </p>
              <input
                type="text"
                className="w-full rounded-xl border border-black/10 dark:border-white/[0.06] bg-white dark:bg-[#0b1018] text-gray-900 dark:text-white px-4 py-3"
                value={witnesses}
                onChange={(e) => setWitnesses(e.target.value)}
                placeholder="List names of any witnesses (comma separated)"
              />
            </section>

            {/* 7. Photo/File Upload */}
            <section className="bg-white dark:bg-[#060b12]/95 border border-black/10 dark:border-white/[0.06] rounded-[24px] p-7 mb-6 shadow-sm backdrop-blur-sm">
              <h2 className="mb-5 text-xl font-semibold text-sky-400">
                Photo/File Upload
              </h2>
              <input
                type="file"
                className="block"
                multiple
                onChange={handleFileChange}
              />
              {uploadedFiles && uploadedFiles.length > 0 && (
                <ul className="mt-2 text-sm text-slate-700">
                  {Array.from(uploadedFiles).map((file, idx) => (
                    <li key={idx}>{file.name}</li>
                  ))}
                </ul>
              )}
            </section>

            {/* 8. Escalation & Communication */}
            <section className="bg-white dark:bg-[#060b12]/95 border border-black/10 dark:border-white/[0.06] rounded-[24px] p-7 mb-6 shadow-sm backdrop-blur-sm">
              <h2 className="mb-5 text-xl font-semibold text-sky-400">
                Escalation & Communication
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Record who was informed, when they were informed and any actions
                requested.
              </p>
              <textarea
                className="w-full rounded-xl border border-black/10 dark:border-white/[0.06] bg-white dark:bg-[#0b1018] text-gray-900 dark:text-white px-4 py-3 min-h-[80px]"
                value={escalationDetails}
                onChange={(e) => setEscalationDetails(e.target.value)}
                placeholder="Describe any escalation, communication or notifications made..."
              />
            </section>

            {/* 9. Staff Declaration */}
            <section className="bg-white dark:bg-[#060b12]/95 border border-black/10 dark:border-white/[0.06] rounded-[24px] p-7 mb-32 shadow-sm backdrop-blur-sm">
              <label className="flex items-center rounded-xl border border-black/10 dark:border-white/[0.06] px-3 py-3">
                <input
                  type="checkbox"
                  className="accent-sky-600 mr-2"
                  checked={declaration}
                  onChange={(e) => setDeclaration(e.target.checked)}
                  required
                />
                <span className="text-slate-500">
                  I declare that the information provided is accurate and
                  complete to the best of my knowledge.
                </span>
              </label>
            </section>

            {/* Sticky Footer */}
            <div className="sticky bottom-0 mt-8 bg-white dark:bg-[#060b12]/95 border border-black/10 dark:border-white/[0.06] rounded-[24px] p-5 backdrop-blur-sm">
              <div className="max-w-3xl w-full flex flex-col sm:flex-row gap-3 justify-between mx-auto">
                <button
                  type="button"
                  className="h-[48px] px-6 rounded-[14px] border border-black/10 dark:border-white/[0.06] text-gray-900 dark:text-white hover:border-sky-400/40 transition-colors"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-[48px] px-8 rounded-[14px] bg-gradient-to-r from-sky-500 to-emerald-500 text-white font-semibold shadow-lg shadow-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Submitting..." : "Submit Incident Report"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StaffIncidentReporting;
