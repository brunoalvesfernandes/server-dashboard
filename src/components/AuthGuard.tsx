import { Navigate } from "react-router-dom";
import { ReactNode } from "react";

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const isAuthenticated = localStorage.getItem("hytale-auth") === "true";

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export function useAuth() {
  const isAuthenticated = localStorage.getItem("hytale-auth") === "true";
  const user = localStorage.getItem("hytale-user") || "";

  const logout = () => {
    localStorage.removeItem("hytale-auth");
    localStorage.removeItem("hytale-user");
    window.location.href = "/login";
  };

  return { isAuthenticated, user, logout };
}
