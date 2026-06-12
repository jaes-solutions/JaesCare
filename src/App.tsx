import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import PatientDashboard from "./pages/PatientDashboard";
import HourlyCheck from "./pages/HourlyCheck";
import AdminPatients from "./pages/AdminPatients";
import StaffClient from "./pages/StaffClient";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/admin-dashboard"
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
        <Route path="/staff-client" element={<StaffClient />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
