import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef, useLayoutEffect } from "react";
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
  const [daysRange, setDaysRange] = useState(7);
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useLayoutEffect(() => {
    function measure() {
      const w = containerRef.current ? containerRef.current.clientWidth : 0;
      setContainerWidth(w || 0);
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

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

  // Fetch milk history for selected daysRange
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
    if (farmId) loadHistory(farmId, daysRange);
    return () => { mounted = false; };
  }, [activeFarm?.id, daysRange]);

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
            <button
              onClick={() => setDaysRange(7)}
              className={`px-3 py-1 rounded border text-sm ${daysRange === 7 ? 'bg-white text-gray-800' : 'text-gray-600 bg-white'}`}
            >
              7 Days
            </button>
            <button
              onClick={() => setDaysRange(30)}
              className={`px-3 py-1 rounded border text-sm ${daysRange === 30 ? 'bg-white text-gray-800' : 'text-gray-600 bg-white'}`}
            >
              30 Days
            </button>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="h-40 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">
            No chart data
          </div>
        ) : (
          <div ref={containerRef} className="rounded-lg p-3 overflow-x-auto" style={{ background: '#fff', minHeight: 340 }}>
            {(() => {
              const n = chartData.length;
              const is30 = daysRange > 7;
              // choose visual sizes that look good on dashboard
              const viewH = 280; // px height of svg (2x)
              const pointSpacing = is30 ? 47.2 : 200; // px per point (increased spacing)
              // make view width at least twice the card width so x-axis is 2x the visible area
              const desiredFromPoints = Math.max(560, n * pointSpacing);
              const doubleContainer = containerWidth ? Math.max(containerWidth * 2, 560) : 560;
              const viewW = Math.max(desiredFromPoints, doubleContainer);
              const padTop = 18;
              const padBottom = 40;
              const padLeft = 24;
              const padRight = 24;
              const plotH = viewH - padTop - padBottom;
              const max = maxTotal || 1;

              const pts = chartData.map((d, i) => {
                const x = padLeft + (i * (viewW - padLeft - padRight)) / Math.max(1, n - 1);
                const val = d.total || 0;
                const y = padTop + (1 - val / max) * plotH;
                return { x, y, val, label: d.date };
              });

              const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
              const areaPath = `${pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ')} L ${pts[pts.length - 1].x.toFixed(2)} ${padTop + plotH} L ${pts[0].x.toFixed(2)} ${padTop + plotH} Z`;

              return (
                <div style={{ width: `${viewW}px` }}>
                  <svg viewBox={`0 0 ${viewW} ${viewH}`} preserveAspectRatio="xMinYMid meet" style={{ width: `${viewW}px`, height: `${viewH}px` }}>
                    {/* grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
                      const y = padTop + t * plotH;
                      return <line key={i} x1={padLeft} x2={viewW - padRight} y1={y} y2={y} stroke="#e6f0ea" strokeWidth="0.8" />;
                    })}

                    {/* area */}
                    <path d={areaPath} fill="#e6f9ec" stroke="none" />

                    {/* line */}
                    <path d={linePath} fill="none" stroke="#2ea53a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                    {/* points and labels */}
                    {pts.map((p, i) => (
                      <g key={i}>
                        <circle cx={p.x} cy={p.y} r={is30 ? 2.6 : 3.4} fill="#fff" stroke="#2ea53a" strokeWidth={is30 ? 1.1 : 1.4} />
                        <circle cx={p.x} cy={p.y} r={is30 ? 1.4 : 2} fill="#2ea53a" />
                        {/* show value only for 7-day or for last point when 30-day */}
                        {((!is30) || i === pts.length - 1) && p.val !== 0 && (
                          <text x={p.x} y={p.y - 12} fontSize="14" textAnchor="middle" fill="#2f6b35">{Number(p.val).toFixed(1)}</text>
                        )}
                        {/* x-axis label */}
                        <text x={p.x} y={viewH - 10} fontSize="13" textAnchor="middle" fill="#6f9b73">{(() => { try { return new Date(p.label).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); } catch (e) { return p.label; } })()}</text>
                      </g>
                    ))}
                  </svg>
                </div>
              );
            })()}
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
