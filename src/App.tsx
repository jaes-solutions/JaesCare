import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import AdminDashboard from "./pages/AdminDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import PatientDashboard from "./pages/PatientDashboard";
import HourlyCheck from "./pages/HourlyCheck";
import AdminPatients from "./pages/AdminPatients";
import AdminStaff from "./pages/AdminStaff";
import StaffClient from "./pages/StaffClient";
import IncidentReporting from "./pages/IncidentReporting";
import AdminIncidents from "./pages/AdminIncidents";
import StaffIncident from "./pages/StaffIncident";
import StaffIncidentReporting from "./pages/StaffIncidentReporting";
function App() {
  const [darkMode, setDarkMode] = useState(
    window.matchMedia("(prefers-color-scheme: dark)").matches,
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      setDarkMode(e.matches);
    };

    media.addEventListener("change", handleChange);

    return () => media.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white transition-colors duration-300">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/adminDashboard"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff-dashboard"
            element={
              <ProtectedRoute requiredRole="staff">
                <StaffDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hourly-check"
            element={
              <ProtectedRoute requiredRole="staff">
                <HourlyCheck />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient-dashboard"
            element={
              <ProtectedRoute requiredRole="patient">
                <PatientDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/adminPatients"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminPatients />
              </ProtectedRoute>
            }
          />
          <Route
            path="/adminStaff"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminStaff />
              </ProtectedRoute>
            }
          />
          <Route path="/staff-client" element={<StaffClient />} />
          <Route
            path="/adminIncidents"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminIncidents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff-incident"
            element={
              <ProtectedRoute requiredRole="staff">
                <StaffIncident />
              </ProtectedRoute>
            }
          />
          <Route
            path="/incidentReporting"
            element={
              <ProtectedRoute requiredRole="admin">
                <IncidentReporting />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staffIncidentReporting"
            element={<StaffIncidentReporting />}
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
