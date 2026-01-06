import { DashboardLayout } from "./layout/DashboardLayout";
import { OwnerDashboard } from "./dashboard/OwnerDashboard";
import { WorkerDashboard } from "./dashboard/WorkerDashboard";
import { CustomerDashboard } from "./dashboard/CustomerDashboard";

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = user.role || user.userRole || "FARM_OWNER";

  const renderDashboard = () => {
    // Map backend roles to dashboard components
    if (userRole === "FARM_OWNER" || userRole === "OWNER" || userRole === "owner") {
      return <OwnerDashboard />;
    }
    if (userRole === "WORKER" || userRole === "worker") {
      return <WorkerDashboard />;
    }
    if (userRole === "CUSTOMER" || userRole === "BUYER" || userRole === "customer" || userRole === "buyer") {
      return <CustomerDashboard />;
    }
    // Default to owner dashboard
    return <OwnerDashboard />;
  };

  return (
    <DashboardLayout>
      {renderDashboard()}
    </DashboardLayout>
  );
}
