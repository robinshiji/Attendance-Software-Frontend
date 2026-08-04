import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRole?: 'admin' | 'teacher';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRole }) => {
  const token = localStorage.getItem('access_token');
  const role = localStorage.getItem('user_role');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && role !== allowedRole) {
    // If not allowed, redirect to role's home dashboard
    return <Navigate to={role === 'admin' ? '/admin' : '/teacher'} replace />;
  }

  return children;
};

export default ProtectedRoute;
