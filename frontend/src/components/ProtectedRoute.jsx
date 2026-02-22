import { Navigate, Outlet } from "react-router-dom";
import { DashboardLayout } from "./layout/DashboardLayout";

export default function ProtectedRoute() {
  const isAuthenticated = !!localStorage.getItem("token");

  return isAuthenticated ? (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  ) : (
    <Navigate to="/login" replace />
  );
}
