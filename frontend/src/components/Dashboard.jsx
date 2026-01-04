import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef, useLayoutEffect } from "react";
import { apiFetch } from "../api/client";
import { Button, Avatar } from "@mui/material";

export default function Dashboard() {
  const navigate = useNavigate();

  // ===== STATE (UNCHANGED) =====
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
    const measure = () =>
      setContainerWidth(containerRef.current?.clientWidth || 0);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadBreakdown(farmId) {
      try {
        const [dto, herd, workers, activeCount] = await Promise.all([
          apiFetch(`/milk/today/breakdown?farmId=${farmId}`),
          apiFetch(`/farms/${farmId}/herd-count`),
          apiFetch(`/farms/${farmId}/worker-count`),
          apiFetch(`/farms/${farmId}/active-cattle-count`)
        ]);
        if (!mounted) return;
        setMorningMilk(dto?.morning ?? 0);
        setEveningMilk(dto?.evening ?? 0);
        setHerdCount(herd ?? 0);
        setWorkerCount(workers ?? 0);
        setActiveCattleCount(activeCount ?? 0);
      } catch {
        if (!mounted) return;
        setMorningMilk(0);
        setEveningMilk(0);
        setHerdCount(0);
        setWorkerCount(0);
        setActiveCattleCount(0);
      }
    }

    if (activeFarm?.id) loadBreakdown(activeFarm.id);
    return () => { mounted = false; };
  }, [activeFarm?.id]);

  useEffect(() => {
    let mounted = true;
    async function loadHistory(farmId, days) {
      try {
        const data = await apiFetch(`/milk/history?farmId=${farmId}&days=${days}`);
        if (!mounted) return;
        setMilkHistory(Array.isArray(data) ? data : []);
      } catch {
        if (!mounted) return;
        setMilkHistory([]);
      }
    }
    if (activeFarm?.id) loadHistory(activeFarm.id, daysRange);
    return () => { mounted = false; };
  }, [activeFarm?.id, daysRange]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  const handleManageHerd = () => {
    if (!activeFarm) navigate("/farms");
    else navigate(`/cattle/${activeFarm.id}`);
  };

  const chartData = milkHistory || [];
  const maxTotal = chartData.length
    ? Math.max(...chartData.map(d => d.total || 0))
    : 0;

  return (
    <div className="min-h-screen bg-gray-200/60">
      {/* HEADER */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-300">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-1 rounded-full" style={{ background: 'linear-gradient(90deg, rgba(79,70,229,0.12), rgba(34,211,238,0.08))' }}>
                <Avatar sx={{ bgcolor: "#eef2ff", color: "#4f46e5" }}>DF</Avatar>
              </div>
              <div>
                <p className="text-xs text-gray-500">Dashboard</p>
                <h3 className="font-semibold text-gray-900">Active Farm: {activeFarm?.name || "None"}</h3>
              </div>
            </div>

            <div className="flex gap-2">
              <Button size="small" variant="outlined" onClick={() => navigate("/profile")}>Profile</Button>
              <Button size="small" variant="contained" onClick={handleLogout} className="btn-primary">Logout</Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        {/* ACTIONS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ActionCard title="Manage Farms" subtitle="View and manage your farms" onClick={() => navigate("/farms")} />
          <ActionCard title="Manage Herd" subtitle={`Active cattle: ${activeCattleCount ?? "—"}`} onClick={handleManageHerd} />
        </section>

        {/* STATS */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Morning Milk" value={morningMilk} unit="L" />
          <StatCard label="Evening Milk" value={eveningMilk} unit="L" />
          <StatCard label="Workers" value={workerCount} unit="Workers" />
        </section>

        {/* GRAPH */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-gray-900">Production Trends</h2>
            <div className="flex gap-2">
              {[7, 30].map(d => (
                <button
                  key={d}
                  onClick={() => setDaysRange(d)}
                  className={`px-3 py-1 rounded border text-sm transition
                    ${daysRange === d
                      ? "bg-gray-800 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-100"}
                  `}
                >
                  {d} Days
                </button>
              ))}
            </div>
          </div>

          {chartData.length === 0 ? (
            <div className="h-40 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
              No chart data
            </div>
          ) : (
            <div
              ref={containerRef}
              className="overflow-x-auto rounded-lg bg-gray-50 p-4"
              style={{ minHeight: 340 }}
            >
              {(() => {
                const n = chartData.length;
                const viewH = 280;
                const pointSpacing = daysRange > 7 ? 47 : 200;
                const viewW = Math.max(containerWidth * 2, n * pointSpacing, 560);
                const padTop = 18;
                const padBottom = 40;
                const padLeft = 24;
                const plotH = viewH - padTop - padBottom;
                const max = maxTotal || 1;

                const pts = chartData.map((d, i) => {
                  const x = padLeft + (i * (viewW - padLeft * 2)) / Math.max(1, n - 1);
                  const y = padTop + (1 - (d.total || 0) / max) * plotH;
                  return { x, y, val: d.total, label: d.date };
                });

                const linePath = pts
                  .map((p, i) => `${i ? "L" : "M"} ${p.x} ${p.y}`)
                  .join(" ");

                const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${padTop + plotH} L ${pts[0].x} ${padTop + plotH} Z`;

                return (
                  <svg width={viewW} height={viewH}>
                    <path d={areaPath} fill="#e5f5ea" />
                    <path
                      d={linePath}
                      fill="none"
                      stroke="#2f6b35"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    {pts.map((p, i) => (
                      <g key={i}>
                        <circle cx={p.x} cy={p.y} r="3" fill="#2f6b35" />
                        {p.val !== 0 && (
                          <text
                            x={p.x}
                            y={p.y - 10}
                            textAnchor="middle"
                            fontSize="12"
                            fill="#2f6b35"
                          >
                            {Number(p.val).toFixed(1)}
                          </text>
                        )}
                      </g>
                    ))}
                  </svg>
                );
              })()}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

/* ===== UI COMPONENTS ===== */

function ActionCard({ title, subtitle, onClick }) {
  return (
    <div onClick={onClick} className="bg-white rounded-2xl p-5 cursor-pointer card-hover accent-gradient soft-border">
      <p className="font-semibold text-gray-900">{title}</p>
      <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
    </div>
  );
}

function StatCard({ label, value, unit }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm card-hover">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-2xl font-semibold text-gray-900">{value == null ? "—" : Number(value).toFixed(1)}</p>
      <p className="text-xs text-gray-400">{unit}</p>
    </div>
  );
}
