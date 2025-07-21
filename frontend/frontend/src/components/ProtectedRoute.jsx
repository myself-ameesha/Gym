import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { refreshAccessToken } from '../features/auth/authApi';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { isAuthenticated, user, accessToken, refreshToken } = useSelector(state => state.auth);

  // Attempt to refresh token if we have a refresh token but no access token
  useEffect(() => {
    if (!isAuthenticated && refreshToken && !accessToken) {
      dispatch(refreshAccessToken());
    }
  }, [isAuthenticated, refreshToken, accessToken, dispatch]);

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/Login" state={{ from: location }} replace />;
  }

  // If authenticated but no user, something is wrong - redirect to login
  if (!user) {
    return <Navigate to="/Login" replace />;
  }

  // Handle required password reset for trainers first
  if (user.user_type === 'trainer' && user.requires_password_reset && location.pathname !== "/Reset-Password") {
    return <Navigate to="/Reset-Password" replace />;
  }

  // If a specific role is required, check user role
  if (requiredRole && user.user_type !== requiredRole) {
    // Redirect to appropriate home page based on role
    if (user.user_type === 'admin') {
      return <Navigate to="/Admin/AdminHome" replace />;
    } else if (user.user_type === 'trainer') {
      return <Navigate to="/Trainer/TrainerHome" replace />;
    } else {
      // Default for members
      return <Navigate to="/" replace />;
    }
  }

  // If all checks pass, render the children
  return children;
};

export default ProtectedRoute;