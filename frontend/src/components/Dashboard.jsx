import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  // ✅ Read active farm safely
  const activeFarm = JSON.parse(localStorage.getItem("activeFarm"));

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("activeFarm");
    navigate("/login", { replace: true });
  };

  const handleManageHerd = () => {
    // ✅ If no farm selected, force user to farms page
    if (!activeFarm) {
      navigate("/farms");
      return;
    }

    // ✅ Correct navigation with farmId
    navigate(`/cattle/${activeFarm.id}`);
  };

  return (
    <div className="min-h-screen bg-[#f7faf7] px-6 py-4">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gray-200"></div>
          <div>
            <p className="text-xs text-gray-500">Welcome back</p>
            <p className="font-semibold text-gray-800">DAIRYDASH</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 bg-green-300 hover:bg-green-500 hover:text-gray-800 transition px-3 py-1 rounded"
        >
          Logout
        </button>
      </div>

      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Good Morning,
        </h1>
        <p className="text-sm text-gray-500">
          Here&apos;s what&apos;s happening on the farm today.
        </p>

        {activeFarm && (
          <p className="text-xs text-gray-500 mt-1">
            Active farm:{" "}
            <span className="font-semibold">{activeFarm.name}</span>
          </p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <button
          onClick={() => navigate("/farms")}
          className="bg-white rounded-xl p-4 shadow-sm text-left hover:shadow-md transition"
        >
          <p className="text-xs text-gray-500 mb-1">Farms</p>
          <p className="font-semibold text-gray-800">
            Manage Farms
          </p>
          <p className="text-xs text-gray-400 mt-1">
            View and manage your farms.
          </p>
        </button>

        <button
          onClick={handleManageHerd}
          className="bg-white rounded-xl p-4 shadow-sm text-left hover:shadow-md transition"
        >
          <p className="text-xs text-gray-500 mb-1">Cattle</p>
          <p className="font-semibold text-gray-800">
            Manage Herd
          </p>
          <p className="text-xs text-gray-400 mt-1">
            View and add cattle for the active farm.
          </p>
        </button>
      </div>

      {/* Stats Cards (PLACEHOLDERS KEPT) */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <StatCard title="TOTAL HERD" unit="Head" />
        <StatCard title="TODAY'S MILK" unit="L" />
        <StatCard title="PREDICTED" unit="L" />
        <StatCard title="SOLD REVENUE" unit="$" />
      </div>

      {/* Production Trends (PLACEHOLDER KEPT) */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-gray-800">
            Production Trends
          </h2>
          <div className="flex gap-2 text-sm">
            <button className="px-3 py-1 rounded border text-gray-600">
              7 Days
            </button>
            <button className="px-3 py-1 rounded border text-gray-600">
              30 Days
            </button>
          </div>
        </div>

        <div className="h-40 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">
          Chart Data From Backend
        </div>
      </div>

      {/* Alerts (PLACEHOLDER KEPT) */}
      <div className="mb-20">
        <h2 className="font-semibold text-gray-800 mb-3">
          Production Alerts
        </h2>
        <div className="bg-white rounded-lg p-4 text-gray-400 text-sm shadow-sm">
          Alerts will appear here
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, unit }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <p className="text-xs text-gray-500 mb-2">{title}</p>
      <div className="h-6 bg-gray-100 rounded w-20 mb-1"></div>
      <p className="text-xs text-gray-400">{unit}</p>
    </div>
  );
}
