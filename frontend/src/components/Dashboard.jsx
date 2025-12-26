import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";

export default function Dashboard() {
  const navigate = useNavigate();

  // ✅ Read active farm once (stable reference) and fetch breakdown by farmId
  const [activeFarm] = useState(() => {
    try {
      const raw = localStorage.getItem("activeFarm");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [morningMilk, setMorningMilk] = useState(null);
  const [eveningMilk, setEveningMilk] = useState(null);
  const [herdCount, setHerdCount] = useState(null);
  const [workerCount, setWorkerCount] = useState(null);
  const [activeCattleCount, setActiveCattleCount] = useState(null);
  const [milkHistory, setMilkHistory] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function loadBreakdown(farmId) {
      try {
        const [dto, herd, workers, activeCount] = await Promise.all([
          apiFetch(`/milk/today/breakdown?farmId=${farmId}`),
          apiFetch(`/farms/${farmId}/herd-count`),
          apiFetch(`/farms/${farmId}/worker-count`),
          apiFetch(`/farms/${farmId}/active-cattle-count`),
        ]);
        if (!mounted) return;
        setMorningMilk(dto?.morning ?? 0);
        setEveningMilk(dto?.evening ?? 0);
        setHerdCount(herd ?? 0);
        setWorkerCount(workers ?? 0);
        setActiveCattleCount(activeCount ?? 0);
      } catch (err) {
        if (!mounted) return;
        setMorningMilk(0);
        setEveningMilk(0);
        setHerdCount(0);
        setWorkerCount(0);
        setActiveCattleCount(0);
      }
    }

    const farmId = activeFarm?.id;
    if (farmId) loadBreakdown(farmId);
    return () => { mounted = false; };
  }, [activeFarm?.id]);

  // Fetch last 7 days milk history for chart
  useEffect(() => {
    let mounted = true;
    async function loadHistory(farmId, days = 7) {
      try {
        const data = await apiFetch(`/milk/history?farmId=${farmId}&days=${days}`);
        if (!mounted) return;
        // expect array of { date, total }
        setMilkHistory(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!mounted) return;
        setMilkHistory([]);
      }
    }

    const farmId = activeFarm?.id;
    if (farmId) loadHistory(farmId, 7);
    return () => { mounted = false; };
  }, [activeFarm?.id]);

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

  // prepare chart data
  const chartData = milkHistory || [];
  const maxTotal = chartData.length ? Math.max(...chartData.map(d => d.total || 0)) : 0;
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

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.location.href = '/profile'}
            className="text-sm text-gray-700 bg-white px-3 py-1 rounded border"
          >
            Profile
          </button>

          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 bg-green-300 hover:bg-green-500 hover:text-gray-800 transition px-3 py-1 rounded"
          >
            Logout
          </button>
        </div>
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
          <div className="flex items-center gap-3">
            <p className="font-semibold text-gray-800">Manage Herd</p>
            <div className="ml-auto text-sm text-gray-500">
              Total: <span className="font-semibold text-gray-800">{herdCount == null ? "—" : Number(herdCount).toFixed(0)}</span>
            </div>
          </div>
            <div className="mt-1 text-sm text-gray-500">
              Active: <span className="font-semibold text-gray-800">{activeCattleCount == null ? "—" : Number(activeCattleCount).toFixed(0)}</span>
            </div>
          <p className="text-xs text-gray-400 mt-1">
            View and add cattle for the active farm.
          </p>
        </button>
      </div>

      {/* Stats Cards (PLACEHOLDERS KEPT) */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <StatCard title="TODAY'S MILK (MORNING)" unit="L" value={morningMilk} />
        <StatCard title="TODAY'S MILK (EVENING)" unit="L" value={eveningMilk} />
        <StatCard
          title="WORKERS"
          unit="Workers"
          value={workerCount}
          onClick={() => activeFarm && navigate(`/workers/${activeFarm.id}`)}
        />
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

        {chartData.length === 0 ? (
          <div className="h-40 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">
            No chart data
          </div>
        ) : (
          <div className="h-40 rounded-lg p-2 flex items-end gap-3">
            {chartData.map((pt, idx) => {
              const val = pt.total || 0;
              const heightPct = maxTotal ? Math.round((val / maxTotal) * 100) : 0;
              const label = (() => {
                try {
                  return new Date(pt.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                } catch (e) { return pt.date; }
              })();
              return (
                <div key={idx} className="flex-1 flex flex-col items-center">
                  <div className="text-xs text-gray-600 mb-1">{Number(val).toFixed(1)}</div>
                  <div className="w-full h-28 bg-gray-100 rounded-t-md flex items-end">
                    <div style={{ height: `${heightPct}%` }} className="w-full bg-green-400 rounded-b-md transition-all" />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{label}</div>
                </div>
              );
            })}
          </div>
        )}
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

function StatCard({ title, unit, value, onClick }) {
  return (
    <div
      className={`bg-white rounded-xl p-4 shadow-sm ${onClick ? 'cursor-pointer hover:shadow-md' : ''}`}
      onClick={onClick}
    >
      <p className="text-xs text-gray-500 mb-2">{title}</p>
      <div className="mb-1">
        {value === null || value === undefined ? (
          <div className="h-6 bg-gray-100 rounded w-20"></div>
        ) : (
          <p className="font-semibold text-lg text-gray-800">{unit === "Head" ? Number(value).toFixed(0) : Number(value).toFixed(1)}</p>
        )}
      </div>
      <p className="text-xs text-gray-400">{unit}</p>
    </div>
  );
}
