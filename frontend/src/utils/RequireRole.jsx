import React from "react";
import { Navigate } from "react-router-dom";

export default function RequireRole({ role, children }) {
  const storedRole = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  if (!token) return <Navigate to="/login" replace />;

  if (storedRole !== role) return <Navigate to="/" replace />;

  return children;
}
