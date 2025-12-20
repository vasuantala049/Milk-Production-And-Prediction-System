export default function Dashboard({ onGoToFarms, onGoToCattle, selectedFarm }) {
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
        <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
      </div>

      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Good Morning,
        </h1>
        <p className="text-sm text-gray-500">
          Here&apos;s what&apos;s happening on the farm today.
        </p>
        {selectedFarm && (
          <p className="text-xs text-gray-500 mt-1">
            Active farm: <span className="font-semibold">{selectedFarm.name}</span>
          </p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <button
          onClick={onGoToFarms}
          className="bg-white rounded-xl p-4 shadow-sm text-left hover:shadow-md transition"
        >
          <p className="text-xs text-gray-500 mb-1">Farms</p>
          <p className="font-semibold text-gray-800">Manage Farms</p>
          <p className="text-xs text-gray-400 mt-1">
            View and add farms you own.
          </p>
        </button>
        <button
          onClick={onGoToCattle}
          className="bg-white rounded-xl p-4 shadow-sm text-left hover:shadow-md transition"
        >
          <p className="text-xs text-gray-500 mb-1">Cattle</p>
          <p className="font-semibold text-gray-800">Manage Herd</p>
          <p className="text-xs text-gray-400 mt-1">
            View and add cattle for the active farm.
          </p>
        </button>
      </div>

      {/* Stats Cards (placeholders for now) */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <StatCard title="TOTAL HERD" unit="Head" />
        <StatCard title="TODAY'S MILK" unit="L" />
        <StatCard title="PREDICTED" unit="L" />
        <StatCard title="SOLD REVENUE" unit="$" />
      </div>

      {/* Production Trends */}
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

      {/* Alerts */}
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
