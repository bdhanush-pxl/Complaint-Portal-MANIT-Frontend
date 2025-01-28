import React from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Layout from "./Layout/Layout";
import Home from "./pages/students/Home";
import Login from "./pages/Login";
import Profile from "./pages/students/Profile";
import Complaint from "./pages/students/Complaint";
import AdminDashboard from "./pages/admins/AdminDashboard.tsx";
import AdminManageComplaints from "./pages/admins/AdminManageComplaints";
import ComplaintListWithErrorBoundary from './pages/students/ComplaintListWithErrorBoundary';
import ComplaintListAdmin from './pages/admins/ComplaintListAdmin.tsx'
import Feedback from "./pages/students/Feedback.tsx";
import MedicalComplaintList from "./pages/admins/medicalAdmin/MedicalComplaintList.tsx";
import Utils from "./pages/admins/Util.tsx";
import { useAuth } from "./context/AuthContext";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';  
import './customToast.css'; 
import SearchPage from "./pages/students/Search.tsx";
import Contacts from "./pages/students/Contacts.tsx";

const App = () => {
  const location = useLocation();
  useEffect(() => {
    console.log("The pathname : ", location.pathname);
    if (location.pathname === "/admin/dashboard" || "/admin/complaints") {
      localStorage.removeItem("complaintFilters");
      localStorage.removeItem("lastSeenId");
      localStorage.removeItem("complaints");
    }
  }, [location]);
  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick={true}
        pauseOnHover={false}
        draggable={true}
        className="custom-toast" // Added for responsive styling
      />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<AuthenticatedRoute />} />

          {/* Student Routes */}
          <Route
            path="/student/home"
            element={
              <ProtectedRoute role="student">
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/profile"
            element={
              <ProtectedRoute role="student">
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/complaint"
            element={
              <ProtectedRoute role="student">
                <Complaint />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/home/:category"
            element={
              <ProtectedRoute role="student">
                <ComplaintListWithErrorBoundary />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/feedback"
            element={
              <ProtectedRoute role="student">
                <Feedback />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/search"
            element={
              <ProtectedRoute role="student">
                <SearchPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/contacts"
            element={
              <ProtectedRoute role="student">
                <Contacts/>
              </ProtectedRoute>
            }
          />


          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/complaints"
            element={
              <ProtectedRoute role="admin">
                <AdminManageComplaints />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/complaints/:category"
            element={
              <ProtectedRoute role="admin">
                <ComplaintListAdmin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/utils"
            element={
              <ProtectedRoute role="admin">
                <Utils />
              </ProtectedRoute>
            }
          />

          {/* Medical Admin Routes */}
          <Route
            path="/medical-admin/dashboard"
            element={
              <ProtectedRoute role="medical_admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/medical-admin/complaints"
            element={
              <ProtectedRoute role="medical_admin">
                <MedicalComplaintList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/medical-admin/complaints/:category"
            element={
              <ProtectedRoute role="medical_admin">
                <MedicalComplaintList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/medical-admin/utils"
            element={
              <ProtectedRoute role="medical_admin">
                <Utils />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="/*" element={<CatchAllRoutes />} />
      </Routes>
    </>
  );
};

const AuthenticatedRoute = () => {
  const { auth } = useAuth();
  return !auth ? <Login /> : <RedirectBasedOnRole />;
};

const CatchAllRoutes = () => {
  return <RedirectBasedOnRole />;
};

const RedirectBasedOnRole = () => {
  const { auth, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (!auth) {
        navigate('/', { replace: true });
      } else if (auth?.role === "student") {
        navigate('/student/home', { replace: true });
      } else if (auth?.role === "admin") {
        navigate('/admin/complaints', { replace: true });
      } else if (auth?.role === "medical_admin") {
        navigate('/medical-admin/complaints/medical', { replace: true });
      }
    }
  }, [auth, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center text-3xl bg-transparent font-bold text-gray-700">
        <div>Loading...</div>
      </div>
    );
  }
};

const ProtectedRoute = ({ role, children }) => {
  const { auth, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && (!auth || auth?.role !== role)) {
      navigate('/', { replace: true });
    }
  }, [auth, role, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Return null while redirecting or if unauthorized
  if (!auth || auth?.role !== role) {
    return null;
  }

  return children;
};

export default App;