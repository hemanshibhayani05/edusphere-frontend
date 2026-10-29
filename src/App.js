import React from "react";
import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Chatbot from "./components/Chatbot";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Courses from "./pages/Courses";
import CourseDetails from "./pages/CourseDetails";
import About from "./pages/About";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

import StudentDashboard from "./pages/student/StudentDashboard";
import MyCourses from "./pages/student/MyCourses";
import Profile from "./pages/student/Profile";
import Certificates from "./pages/student/Certificates";
import LearnCourse from "./pages/student/LearnCourse";
import StudentPayments from "./pages/student/StudentPayments";

import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageUsers from "./pages/admin/ManageUsers";
import ManageStudents from "./pages/admin/ManageStudents";
import ManageCourses from "./pages/admin/ManageCourses";
import ManageInstructors from "./pages/admin/Manageinstructors";
import AdminReports from "./pages/admin/Adminreports";
import AdminPayments from "./pages/admin/Adminpayments";
import AddCourse from "./pages/admin/AddCourse";
import EditCourse from "./pages/admin/EditCourse";
import Enrollment from "./pages/Enrollment";
import AdminLogin from "./pages/AdminLogin";
import Settings from "./pages/student/Settings";

import InstructorDashboard from "./pages/instructor/InstructorDashboard";
import InstructorCourses from "./pages/instructor/InstructorCourses";
import InstructorStudents from "./pages/instructor/InstructorStudents";
import InstructorPayments from "./pages/instructor/InstructorPayments";

function App() {
  return (
    <div className="app">
      <Navbar />

      <main className="main-content">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:id" element={<CourseDetails />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/enroll/:id" element={<Enrollment />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/settings" element={<Settings />} />

          {/* Student Routes */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute role="student">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/courses"
            element={
              <ProtectedRoute role="student">
                <MyCourses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute role="admin">
                <AdminReports />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/payments"
            element={
              <ProtectedRoute role="admin">
                <AdminPayments />
              </ProtectedRoute>
            }
          />
          {/* <Route
            path="/student/profile"
            element={
              <ProtectedRoute role="student">
                <Profile />
              </ProtectedRoute>
            }
          /> */}

          <Route
            path="/student/certificates"
            element={
              <ProtectedRoute role="student">
                <Certificates />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/payments"
            element={
              <ProtectedRoute role="student">
                <StudentPayments />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/learn/:id"
            element={
              <ProtectedRoute role="student">
                <LearnCourse />
              </ProtectedRoute>
            }
          />

          {/* Instructor Routes */}
          <Route
            path="/instructor/dashboard"
            element={
              <ProtectedRoute role="instructor">
                <InstructorDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/instructor/courses"
            element={
              <ProtectedRoute role="instructor">
                <InstructorCourses />
              </ProtectedRoute>
            }
          />

          <Route
            path="/instructor/students"
            element={
              <ProtectedRoute role="instructor">
                <InstructorStudents />
              </ProtectedRoute>
            }
          />

          <Route
            path="/instructor/payments"
            element={
              <ProtectedRoute role="instructor">
                <InstructorPayments />
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
            path="/admin/users"
            element={
              <ProtectedRoute role="admin">
                <ManageUsers />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/students"
            element={
              <ProtectedRoute role="admin">
                <ManageStudents />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/courses"
            element={
              <ProtectedRoute role="admin">
                <ManageCourses />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/instructors"
            element={
              <ProtectedRoute role="admin">
                <ManageInstructors />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/courses/add"
            element={
              <ProtectedRoute role="admin">
                <AddCourse />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/courses/edit/:id"
            element={
              <ProtectedRoute role="admin">
                <EditCourse />
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Footer />
      <Chatbot />
    </div>
  );
}

export default App;