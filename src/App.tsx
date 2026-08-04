import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminStudents from './pages/admin/AdminStudents';
import AdminTeachers from './pages/admin/AdminTeachers';
import AdminAcademicYears from './pages/admin/AdminAcademicYears';
import AdminReports from './pages/admin/AdminReports';
import AdminClassrooms from './pages/admin/AdminClassrooms'

// Teacher Pages
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherStudents from './pages/teacher/TeacherStudents';
import TeacherAttendance from './pages/teacher/TeacherAttendance';
import TeacherHistory from './pages/teacher/TeacherHistory';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Auth Route */}
        <Route path="/login" element={<Login />} />

        {/* Admin Protected Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/classrooms"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminClassrooms />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/students"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminStudents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/teachers"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminTeachers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/academic-years"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminAcademicYears />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminReports />
            </ProtectedRoute>
          }
        />

        {/* Teacher Protected Routes */}
        <Route
          path="/teacher"
          element={
            <ProtectedRoute allowedRole="teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/mark"
          element={
            <ProtectedRoute allowedRole="teacher">
              <TeacherAttendance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/students"
          element={
            <ProtectedRoute allowedRole="teacher">
              <TeacherStudents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/history"
          element={
            <ProtectedRoute allowedRole="teacher">
              <TeacherHistory />
            </ProtectedRoute>
          }
        />

        {/* Fallback Catch-all Route */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
