import React from 'react';
import { Navigate } from 'react-router-dom';

interface RouteProps {
  children: React.ReactNode;
}

export const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload.exp) return false;
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

export const ProtectedRoute: React.FC<RouteProps> = ({ children }) => {
  const token = localStorage.getItem('access_token');

  if (!token || isTokenExpired(token)) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_id');
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
};

export const PublicRoute: React.FC<RouteProps> = ({ children }) => {
  const token = localStorage.getItem('access_token');

  if (token && !isTokenExpired(token)) {
    return <Navigate to="/chat" replace />;
  } else if (token && isTokenExpired(token)) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_id');
  }

  return <>{children}</>;
};
