import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import StorefrontIcon from "@mui/icons-material/Storefront";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import { apiFetch } from "../../api/client";
import { orderApi } from "../../api/orderApi";
import { StatCard } from "./StatCard";
import { QuickActions } from "./QuickActions";
import {
  DailyProductionChart,
  FarmComparisonChart,
} from "./ProductionChart";
import { Milk, Beef, Users, Warehouse, Store, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import { Badge } from "../ui/badge";

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
  const [recentOrders, setRecentOrders] = useState([]);
  const [todayEntries, setTodayEntries] = useState([]);
  const [isToggling, setIsToggling] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  /* ===========================
     LOAD TODAY BREAKDOWN
     =========================== */
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
    return () => (mounted = false);
  }, [activeFarm?.id]);

  /* ===========================
     LOAD MILK HISTORY (7 / 30)
     =========================== */
  useEffect(() => {
    let mounted = true;

    async function loadHistory(farmId, days) {
      try {
        const data = await apiFetch(
          `/milk/history?farmId=${farmId}&days=${days}`
        );
        if (!mounted) return;
        setMilkHistory(Array.isArray(data) ? data : []);
      } catch {
        if (!mounted) return;
        setMilkHistory([]);
      }
    }

    if (activeFarm?.id) loadHistory(activeFarm.id, daysRange);
    return () => (mounted = false);
  }, [activeFarm?.id, daysRange]);

  /* ===========================
     LOAD FARMS
     =========================== */
  useEffect(() => {
    let mounted = true;

    async function loadFarms() {
      try {
        const data = await apiFetch("/farms/me");
        if (!mounted) return;
        setFarms(Array.isArray(data) ? data : []);
      } catch {
        if (!mounted) return;
        setFarms([]);
      }
    }

    loadFarms();
    return () => (mounted = false);
  }, []);

  /* ===========================
     LOAD RECENT ORDERS (OWNER VIEW)
     =========================== */
  useEffect(() => {
    let mounted = true;

    async function loadRecentOrders(farmId) {
      try {
        const data = await orderApi.getFarmOrders(farmId, 0, 5);
        if (!mounted) return;
        setRecentOrders(Array.isArray(data) ? data : []);
      } catch {
        if (!mounted) return;
        setRecentOrders([]);
      }
    }

    if (activeFarm?.id) {
      loadRecentOrders(activeFarm.id);
    }

    return () => {
      mounted = false;
    };
  }, [activeFarm?.id]);

  /* ===========================
     LOAD TODAY ENTRIES (OWNER VIEW)
     =========================== */
  useEffect(() => {
    let mounted = true;

    async function loadTodayEntries(farmId) {
      try {
        const data = await apiFetch(`/milk/today/entries?farmId=${farmId}`);
        if (!mounted) return;
        setTodayEntries(Array.isArray(data) ? data : []);
      } catch {
        if (!mounted) return;
        setTodayEntries([]);
      }
    }

    if (activeFarm?.id) {
      loadTodayEntries(activeFarm.id);
    }

    return () => {
      mounted = false;
    };
  }, [activeFarm?.id]);

  const handleToggleSelling = async (farm) => {
    if (isToggling) return;
    try {
      setIsToggling(true);
      const currentStatus = farm.isSelling === true || farm.selling === true;
      const newStatus = !currentStatus;

      await apiFetch(`/farms/${farm.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isSelling: newStatus }),
      });
      // Update local state and localStorage
      const updatedFarm = { ...farm, isSelling: newStatus, selling: newStatus };
      localStorage.setItem("activeFarm", JSON.stringify(updatedFarm));
      window.location.reload(); // Simplest way to sync across components
    } catch (err) {
      alert(err.message || "Failed to update selling status");
    } finally {
      setIsToggling(false);
    }
  };

  // Robust check for selling status
  const currentIsSelling = activeFarm?.isSelling === true || activeFarm?.selling === true;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold">
            Good morning, {user?.name?.split(" ")[0] || "User"}!
          </h1>
          <p className="text-muted-foreground mt-1">
            {activeFarm
              ? `Here's what's happening at ${activeFarm.name} today`
              : "Here's what's happening across your farms today"}
          </p>
          {activeFarm && (
            <div className="flex items-center gap-2 mt-2">
              <Badge
                variant="outline"
                className={cn(
                  "font-medium",
                  currentIsSelling
                    ? "border-primary text-primary bg-primary/5"
                    : "border-muted-foreground/30 text-muted-foreground bg-muted/5"
                )}
              >
                {currentIsSelling ? "Selling ON" : "Selling OFF"}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                disabled={isToggling}
                className="h-7 text-[10px] gap-1.5 min-w-[100px]"
                onClick={() => handleToggleSelling(activeFarm)}
              >
                {isToggling ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : currentIsSelling ? (
                  <ShoppingBagIcon sx={{ fontSize: 14 }} />
                ) : (
                  <StorefrontIcon sx={{ fontSize: 14 }} />
                )}
                {isToggling ? "Updating..." : currentIsSelling ? "Stop Selling" : "Start Selling"}
              </Button>
            </div>
          )}
        </div>

        {!activeFarm && (
          <Button onClick={() => navigate("/farms")}>
            <Warehouse className="w-4 h-4 mr-2" />
            Select Farm
          </Button>
        )}
      </motion.div>

      {activeFarm && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Morning Milk"
              value={morningMilk != null ? `${morningMilk.toFixed(1)}L` : "—"}
              icon={Milk}
              variant="success"
            />

            <StatCard
              title="Evening Milk"
              value={eveningMilk != null ? `${eveningMilk.toFixed(1)}L` : "—"}
              icon={Milk}
              variant="success"
            />

            <StatCard
              title="Active Cattle"
              value={activeCattleCount ?? "—"}
              subtitle={herdCount != null ? `Total: ${herdCount}` : ""}
              icon={Beef}
              onClick={() => navigate(`/cattle/${activeFarm.id}`)}
            />

            <StatCard
              title="Workers"
              value={workerCount ?? "—"}
              icon={Users}
              variant="warning"
              onClick={() => navigate(`/workers/${activeFarm.id}`)}
            />
          </div>

          {/* Charts + Controls */}
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {/* 7 / 30 Days Toggle */}
              <div className="flex items-center gap-2">
                {[7, 30].map((d) => (
                  <Button
                    key={d}
                    size="sm"
                    variant={daysRange === d ? "default" : "outline"}
                    className={cn(
                      daysRange === d && "pointer-events-none"
                    )}
                    onClick={() => setDaysRange(d)}
                  >
                    {d} Days
                  </Button>
                ))}
              </div>

              <DailyProductionChart data={milkHistory} />

              {farms.length > 1 && (
                <FarmComparisonChart farmsData={farms} />
              )}
            </div>

            <div className="space-y-6">
              <QuickActions />

              {/* Recent Orders */}
              <div className="bg-card border border-border rounded-xl p-4 shadow-card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-foreground text-sm">
                    Recent Orders
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    Last {recentOrders.length} orders
                  </span>
                </div>

                {recentOrders.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No orders for this farm yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {recentOrders.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between text-xs border border-border/60 rounded-md px-2 py-1.5"
                      >
                        <div>
                          <p className="font-medium text-foreground">
                            {order.quantity.toFixed(1)}L • {order.session}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {order.orderDate}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-medium",
                            order.status === "COMPLETED" &&
                            "bg-emerald-50 text-emerald-700 border border-emerald-200",
                            order.status === "PENDING" &&
                            "bg-amber-50 text-amber-700 border border-amber-200",
                            order.status === "CANCELLED" &&
                            "bg-destructive/10 text-destructive border border-destructive/30"
                          )}
                        >
                          {order.status.toLowerCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Today's Entries (Showing Worker) */}
              <div className="bg-card border border-border rounded-xl p-4 shadow-card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-foreground text-sm">
                    Today's Milk Entries
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {todayEntries.length} entries
                  </span>
                </div>

                {todayEntries.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No milk entries for today yet.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {todayEntries.map((entry, idx) => (
                      <div
                        key={`${entry.cattleTagId}-${entry.session}-${idx}`}
                        className="flex items-center justify-between text-xs border border-border/60 rounded-md px-2 py-1.5"
                      >
                        <div>
                          <p className="font-medium text-foreground">
                            {entry.cattleTagId} • {entry.session}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {entry.milkLiters}L • Milked by: <span className="font-medium text-primary">{entry.workerName || "Unknown Worker"}</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
