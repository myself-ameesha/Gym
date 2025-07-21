import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

import MainLayout from "./components/MainLayout";
import AuthLayout from "./components/AuthLayout";
import Layout from "./components/Layout";
import AdminLayout from "./components/Admin/AdminLayout";
import TrainerLayout from "./components/Trainer/TrainerLayout";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./components/Auth/Home";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import BMICalculator from "./components/Auth/BMICalculator";
import AdminHome from "./components/Admin/AdminHome";
import TrainerHome from "./components/Trainer/TrainerHome";
import TrainerFirstLogin from "./components/Trainer/TrainerFirstLogin";
import TrainerList from "./components/Admin/TrainerList";
import CreateTrainer from "./components/Admin/CreateTrainer";
import AdminMembers from "./components/Admin/AdminMembers";
import MembershipPlanList from "./components/Admin/MembershipPlanList";
import CreateMembershipPlan from "./components/Admin/CreateMembershipPlan";
import MembershipPlans from "./components/Auth/MembershipPlan";
import MemberDashboard from "./components/Auth/MemberDashboard";
import TrainerDashboard from "./components/Trainer/TrainerDashboard";
import OTPVerification from "./components/Auth/OTPVerification";
import TrainerAssignmentModal from "./components/Admin/TrainerAssignmentModal";
import TrainerMembers from "./components/Trainer/TrainerMembers";
import ForgotPassword from "./components/Auth/ForgotPassword";
import Payment from "./components/Auth/Payment";
import DietPlanManagement from "./components/Trainer/DietPlanManagement";
import WorkoutManagement from "./components/Trainer/WorkoutManagement";
import MemberWorkoutView from "./components/Auth/MemberWorkoutView";
import PaidMembersList from "./components/Admin/PaidMembersList";
import TrainerEditProfile from "./components/Trainer/TrainerEditProfile";
import ChatInterface from "./components/Auth/ChatInterface";
import Notifications from "./components/Auth/Notifications";
import NotificationList from "./components/Auth/NotificationList";
import MemberTrainerRatingForm from "./components/Auth/MemberTrainerRatingForm";
import TrainerRatingsView from "./components/Trainer/TrainerRatingsView";
import RevenuePage from "./components/Admin/RevenuePage";
import SalesReportPage from "./components/Admin/SalesReportPage";
import EditProfile from "./components/Auth/EditProfile";
import AdminMarkTrainerAttendance from "./components/Admin/AdminMarkTrainerAttendance";
import TrainerAttendance from "./components/Trainer/TrainerAttendance";




const RedirectBasedOnAuth = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only redirect if authenticated and at Login or Register pages or the root path
    const isAuthPage = location.pathname === "/Login" || location.pathname === "/Register";
    const isRootPath = location.pathname === "/";
    
    if (isAuthenticated && user && (isAuthPage || (isRootPath && user.user_type !== "member"))) {
      // Use location.state to get the 'from' path if available (for redirects after login)
      const from = location.state?.from?.pathname;
      
      // If redirect path exists and it's appropriate for the user's role, use it
      if (from) {
        const canAccessFromPath = 
          (user.user_type === "admin" && from.startsWith("/Admin")) ||
          (user.user_type === "trainer" && from.startsWith("/Trainer")) ||
          (user.user_type === "member");
          
        if (canAccessFromPath) {
          navigate(from, { replace: true });
          return;
        }
      }
      
      // Otherwise, redirect to the appropriate home page
      if (user.user_type === "admin") {
        navigate("/Admin/AdminHome", { replace: true });
      } else if (user.user_type === "trainer") {
        if (user.requires_password_reset) {
          navigate("/Reset-Password", { replace: true });
        } else {
          navigate("/Trainer/TrainerHome", { replace: true });
        }
      } else if (user.user_type === "member" && isAuthPage) {
        // Only redirect members from auth pages, not from the homepage
        navigate("/", { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate, location.pathname, location.state]);

  return null;
};

const App = () => {
  return (
    <Router>
      <RedirectBasedOnAuth />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<MainLayout><Home /></MainLayout>} />
        <Route path="/Login" element={<AuthLayout><Login /></AuthLayout>} />
        <Route path="/forgot-password" element={<AuthLayout><ForgotPassword /></AuthLayout>} />
        <Route path="/Register" element={<AuthLayout><Register /></AuthLayout>} />
        <Route path="/payment" element={<AuthLayout><Payment /></AuthLayout>} />
        <Route path="/verify-email" element={<AuthLayout><OTPVerification /></AuthLayout>} />
        <Route path="/about" element={<MainLayout><div>About Page</div></MainLayout>} />
        <Route path="/services" element={<MainLayout><div>Services Page</div></MainLayout>} />
        <Route path="/our-team" element={<MainLayout><div>Our Team Page</div></MainLayout>} />
        <Route path="/BMICalculator" element={<Layout><BMICalculator /></Layout>} />
        <Route path="/MembershipPlans" element={<MainLayout><MembershipPlans /></MainLayout>} />
        <Route path="/MemberDashboard" element={<Layout><MemberDashboard /></Layout>} />
        <Route path="/MemberWorkoutView" element={<Layout><MemberWorkoutView /></Layout>} />
      
        <Route path="/chat" element={<Layout><ChatInterface /></Layout>} />
        <Route path="/Notifications" element={<Layout><Notifications /></Layout>} />
        <Route path="/Notification" element={<Layout><NotificationList /></Layout>} />
        <Route path="/Rating" element={<Layout><MemberTrainerRatingForm /></Layout>} />
        <Route path="/edit-profile" element={<Layout><EditProfile /></Layout>} />
       
        
        {/* Admin routes */}
        <Route 
          path="/Admin/AdminHome" 
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout><AdminHome /></AdminLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/Admin/TrainerList" 
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout><TrainerList /></AdminLayout>
            </ProtectedRoute>
          } 
        />

         <Route 
          path="/Admin/AdminMembers" 
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout><AdminMembers /></AdminLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/Admin/CreateTrainer" 
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout><CreateTrainer /></AdminLayout>
            </ProtectedRoute>
          } 
        />
      
      <Route 
          path="/Admin/MembershipPlanList" 
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout><MembershipPlanList /></AdminLayout>
            </ProtectedRoute>
          } 
        />
      
      <Route 
          path="/Admin/CreateMembershipPlan" 
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout><CreateMembershipPlan /></AdminLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/Admin/TrainerAssignmentModal" 
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout><TrainerAssignmentModal /></AdminLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/Admin/PaidMembersList" 
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout><PaidMembersList /></AdminLayout>
            </ProtectedRoute>
          } 
        />
      
          <Route 
          path="/Admin/RevenuePage" 
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout><RevenuePage /></AdminLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/Admin/SalesReportPage" 
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout><SalesReportPage /></AdminLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/Admin/AdminMarkTrainerAttendance" 
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminLayout><AdminMarkTrainerAttendance /></AdminLayout>
            </ProtectedRoute>
          } 
        />
  
        
        {/* Trainer routes */}
        <Route 
          path="/Trainer/TrainerHome" 
          element={
            <ProtectedRoute requiredRole="trainer">
              <TrainerLayout><TrainerHome /></TrainerLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/Reset-Password" 
          element={
            <ProtectedRoute requiredRole="trainer">
              <TrainerFirstLogin />
            </ProtectedRoute>
          } 
        />

          <Route 
          path="/Trainer/TrainerDashboard" 
          element={
            <ProtectedRoute requiredRole="trainer">
              <TrainerLayout><TrainerDashboard /></TrainerLayout>
            </ProtectedRoute>
          } 
        />

          <Route 
          path="/Trainer/TrainerMembers" 
          element={
            <ProtectedRoute requiredRole="trainer">
              <TrainerLayout><TrainerMembers /></TrainerLayout>
            </ProtectedRoute>
          } 
        />

          <Route 
          path="/Trainer/DietPlanManagement" 
          element={
            <ProtectedRoute requiredRole="trainer">
              <TrainerLayout><DietPlanManagement /></TrainerLayout>
            </ProtectedRoute>
          } 
        />


        <Route 
          path="/Trainer/WorkoutManagement" 
          element={
            <ProtectedRoute requiredRole="trainer">
              <TrainerLayout><WorkoutManagement /></TrainerLayout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/Trainer/TrainerEditProfile" 
          element={
            <ProtectedRoute requiredRole="trainer">
              <TrainerLayout><TrainerEditProfile /></TrainerLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/Trainer/ChatInterface" 
          element={
            <ProtectedRoute requiredRole="trainer">
              <TrainerLayout><ChatInterface /></TrainerLayout>
            </ProtectedRoute>
          } 
        />

          <Route 
          path="/Trainer/Notifications" 
          element={
            <ProtectedRoute requiredRole="trainer">
              <TrainerLayout><Notifications /></TrainerLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/Trainer/TrainerRatingsView" 
          element={
            <ProtectedRoute requiredRole="trainer">
              <TrainerLayout><TrainerRatingsView /></TrainerLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/Trainer/TrainerAttendance" 
          element={
            <ProtectedRoute requiredRole="trainer">
              <TrainerLayout><TrainerAttendance /></TrainerLayout>
            </ProtectedRoute>
          } 
        />



         
        {/* Catch-all route for 404 */}
        <Route path="*" element={<MainLayout><div>Page Not Found</div></MainLayout>} />
      </Routes>
    </Router>
  );
};

export default App;
