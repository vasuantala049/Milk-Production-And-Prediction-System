import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { apiFetch } from "../../api/client";
import { StatCard } from "./StatCard";
import { QuickActions } from "./QuickActions";
import { DailyProductionChart, FarmComparisonChart } from "./ProductionChart";
import { Milk, Beef, Users, Warehouse } from "lucide-react";
import { Button } from "../ui/button";

export function OwnerDashboard() {
  const navigate = useNavigate();
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
  const [milkHistory, setMilkHistory] = useState([]);
  const [farms, setFarms] = useState([]);
  const [daysRange, setDaysRange] = useState(7);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

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
        setMorningMilk(dto?.morning ?? null);
        setEveningMilk(dto?.evening ?? null);
        setHerdCount(herd ?? null);
        setWorkerCount(workers ?? null);
        setActiveCattleCount(activeCount ?? null);
      } catch {
        if (!mounted) return;
        setMorningMilk(null);
        setEveningMilk(null);
        setHerdCount(null);
        setWorkerCount(null);
        setActiveCattleCount(null);
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

  useEffect(() => {
    let mounted = true;
    async function loadFarms() {
      try {
        const data = await apiFetch(`/farms/me`);
        if (!mounted) return;
        setFarms(Array.isArray(data) ? data : []);
      } catch {
        if (!mounted) return;
        setFarms([]);
      }
    }
    loadFarms();
    return () => { mounted = false; };
  }, []);

  const totalMilk = (morningMilk ?? 0) + (eveningMilk ?? 0);
  const totalCattle = farms.reduce((sum, f) => sum + (f.cattleCount || 0), 0);
  const totalAvailable = farms.reduce((sum, f) => sum + (f.availableMilk || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
            Good morning, {user?.name?.split(' ')[0] || "User"}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            {activeFarm ? `Here's what's happening at ${activeFarm.name} today` : "Here's what's happening across your farms today"}
          </p>
        </div>
        {!activeFarm && (
          <Button onClick={() => navigate("/farms")}>
            <Warehouse className="w-4 h-4 mr-2" />
            Select Farm
          </Button>
        )}
      </motion.div>

      {activeFarm ? (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Morning Milk"
              value={morningMilk != null ? `${morningMilk.toFixed(1)}L` : "—"}
              icon={Milk}
              variant="success"
              delay={0}
            />
            <StatCard
              title="Evening Milk"
              value={eveningMilk != null ? `${eveningMilk.toFixed(1)}L` : "—"}
              icon={Milk}
              variant="success"
              delay={0.05}
            />
            <StatCard
              title="Active Cattle"
              value={activeCattleCount != null ? activeCattleCount : "—"}
              subtitle={herdCount != null ? `Total: ${herdCount}` : ""}
              icon={Beef}
              delay={0.1}
            />
            <StatCard
              title="Workers"
              value={workerCount != null ? workerCount : "—"}
              icon={Users}
              variant="warning"
              delay={0.15}
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Charts */}
            <div className="lg:col-span-2 space-y-6">
              <DailyProductionChart data={milkHistory} />
              {farms.length > 1 && <FarmComparisonChart farmsData={farms} />}
            </div>

            {/* Right Column - Actions */}
            <div className="space-y-6">
              <QuickActions />
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Stats Grid - All Farms */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Farms"
              value={farms.length}
              subtitle="Active farms"
              icon={Warehouse}
              variant="primary"
              delay={0}
            />
            <StatCard
              title="Today's Milk"
              value={totalMilk > 0 ? `${totalMilk.toFixed(1)}L` : "—"}
              icon={Milk}
              variant="success"
              delay={0.05}
            />
            <StatCard
              title="Active Cattle"
              value={totalCattle > 0 ? totalCattle : "—"}
              subtitle="Across all farms"
              icon={Beef}
              delay={0.1}
            />
            <StatCard
              title="Available Milk"
              value={totalAvailable > 0 ? `${totalAvailable.toFixed(1)}L` : "—"}
              icon={Milk}
              variant="warning"
              delay={0.15}
            />
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            {farms.length > 0 && <FarmComparisonChart farmsData={farms} />}
          </div>

          {/* Empty State */}
          {farms.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-xl p-12 text-center shadow-card"
            >
              <Warehouse className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No Farms Yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first farm to start tracking milk production.
              </p>
              <Button onClick={() => navigate("/farms/add")}>
                <Warehouse className="w-4 h-4 mr-2" />
                Create Farm
              </Button>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
