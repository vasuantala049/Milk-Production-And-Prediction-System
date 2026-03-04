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
  const [allOrders, setAllOrders] = useState([]);
  const [farmSubscriptions, setFarmSubscriptions] = useState([]);
  const [orderTab, setOrderTab] = useState("pending"); // "pending" | "all"
  const [subTab, setSubTab] = useState(false);
  const [todayEntries, setTodayEntries] = useState([]);
  const [isToggling, setIsToggling] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  const [pricesDialogOpen, setPricesDialogOpen] = useState(false);
  const [cowPrice, setCowPrice] = useState("");
  const [buffaloPrice, setBuffaloPrice] = useState("");
  const [priceSubmitting, setPriceSubmitting] = useState(false);
  const [shedStatusList, setShedStatusList] = useState([]);

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
     LOAD ALL ORDERS + SUBSCRIPTIONS (OWNER VIEW)
     =========================== */
  useEffect(() => {
    let mounted = true;

    async function loadAll(farmId) {
      try {
        const [orders, subs] = await Promise.all([
          orderApi.getFarmOrders(farmId),
          apiFetch(`/subscriptions/farm/${farmId}`),
        ]);
        if (!mounted) return;
        setAllOrders(Array.isArray(orders) ? orders : []);
        setRecentOrders((Array.isArray(orders) ? orders : []).slice(0, 5));
        setFarmSubscriptions(Array.isArray(subs) ? subs : []);
      } catch {
        if (!mounted) return;
        setAllOrders([]);
        setRecentOrders([]);
        setFarmSubscriptions([]);
      }
    }

    if (activeFarm?.id) loadAll(activeFarm.id);
    return () => { mounted = false; };
  }, [activeFarm?.id]);

  const handleOrderAction = async (orderId, action) => {
    setActionLoading((prev) => ({ ...prev, [orderId]: action }));
    try {
      if (action === "approve") await orderApi.approveOrder(orderId);
      else await orderApi.rejectOrder(orderId);
      // Refresh orders
      const orders = await orderApi.getFarmOrders(activeFarm.id);
      setAllOrders(Array.isArray(orders) ? orders : []);
      setRecentOrders((Array.isArray(orders) ? orders : []).slice(0, 5));
    } catch (err) {
      alert(err.message || `Failed to ${action} order`);
    } finally {
      setActionLoading((prev) => { const n = { ...prev }; delete n[orderId]; return n; });
    }
  };

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

  useEffect(() => {
    if (activeFarm) {
      setCowPrice(activeFarm.cowPrice || "");
      setBuffaloPrice(activeFarm.buffaloPrice || "");
    }
  }, [activeFarm]);

  useEffect(() => {
    let mounted = true;
    async function loadShedStatus(farmId) {
      try {
        const data = await apiFetch(`/farms/${farmId}/sheds-status`);
        if (!mounted) return;
        setShedStatusList(Array.isArray(data) ? data : []);
      } catch {
        if (!mounted) return;
        setShedStatusList([]);
      }
    }
    if (activeFarm?.id) loadShedStatus(activeFarm.id);
    return () => (mounted = false);
  }, [activeFarm?.id]);

  const handleSavePrices = async () => {
    if (!activeFarm) return;
    setPriceSubmitting(true);
    try {
      await apiFetch(`/farms/${activeFarm.id}`, {
        method: "PATCH",
        body: JSON.stringify({ cowPrice: parseFloat(cowPrice), buffaloPrice: parseFloat(buffaloPrice) })
      });
      const updatedFarm = { ...activeFarm, cowPrice: parseFloat(cowPrice), buffaloPrice: parseFloat(buffaloPrice) };
      localStorage.setItem("activeFarm", JSON.stringify(updatedFarm));
      window.location.reload();
    } catch (err) {
      alert("Failed to update prices");
    } finally {
      setPriceSubmitting(false);
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
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[10px] gap-1.5"
                onClick={() => setPricesDialogOpen(true)}
              >
                Set Prices
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

              {/* Shed Status View */}
              <div className="bg-card border border-border rounded-xl p-4 shadow-card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-foreground text-sm">
                    Sheds Status
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {shedStatusList.length} Sheds
                  </span>
                </div>
                {shedStatusList.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No shed data available.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {shedStatusList.map((shed, idx) => (
                      <div key={idx} className="border border-border/60 rounded-md p-3">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium text-sm text-primary">{shed.shedName}</h4>
                          <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full">{shed.workerInCharge}</span>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Total: <span className="text-foreground">{shed.totalCattle}</span></span>
                          <span>Milked: <span className="text-emerald-500 font-medium">{shed.milkedCattle}</span></span>
                          <span>Remaining: <span className="text-amber-500 font-medium">{shed.remainingCattle}</span></span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <QuickActions />

              {/* Orders Management */}
              <div className="bg-card border border-border rounded-xl p-4 shadow-card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-foreground text-sm">Orders</h3>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setOrderTab("pending")}
                      className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium transition-colors",
                        orderTab === "pending" ? "bg-amber-500 text-white border-amber-500" : "border-border text-muted-foreground hover:bg-muted")}
                    >
                      Pending ({allOrders.filter(o => o.status === "PENDING").length})
                    </button>
                    <button
                      onClick={() => setOrderTab("all")}
                      className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium transition-colors",
                        orderTab === "all" ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:bg-muted")}
                    >
                      All ({allOrders.length})
                    </button>
                  </div>
                </div>

                {(() => {
                  const displayed = orderTab === "pending"
                    ? allOrders.filter(o => o.status === "PENDING")
                    : allOrders;
                  return displayed.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      {orderTab === "pending" ? "No pending orders 🎉" : "No orders yet."}
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {displayed.map((order) => (
                        <div key={order.id} className="border border-border/60 rounded-md px-3 py-2 text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-foreground">
                              {order.buyerName || `Buyer #${order.buyerId}`}
                            </span>
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-medium",
                              order.status === "CONFIRMED" && "bg-emerald-50 text-emerald-700 border border-emerald-200",
                              order.status === "PENDING" && "bg-amber-50 text-amber-700 border border-amber-200",
                              order.status === "CANCELLED" && "bg-red-50 text-red-700 border border-red-200",
                              order.status === "COMPLETED" && "bg-blue-50 text-blue-700 border border-blue-200",
                            )}>
                              {order.status}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-muted-foreground">
                            <span>{order.quantity?.toFixed(1)}L</span>
                            <span>{order.animalType === "COW" ? "🐮 Cow" : order.animalType === "BUFFALO" ? "🐃 Buffalo" : "🐄 Any"}</span>
                            <span>{order.session}</span>
                            {order.totalPrice != null && (
                              <span className="text-emerald-600 font-semibold">₹{order.totalPrice.toFixed(2)}</span>
                            )}
                            <span>{order.orderDate}</span>
                          </div>
                          {order.status === "PENDING" && (
                            <div className="flex gap-2 pt-1">
                              <button
                                disabled={!!actionLoading[order.id]}
                                onClick={() => handleOrderAction(order.id, "approve")}
                                className="flex-1 text-[11px] py-1 rounded bg-emerald-500 hover:bg-emerald-600 text-white font-medium disabled:opacity-50 transition-colors"
                              >
                                {actionLoading[order.id] === "approve" ? "..." : "✓ Accept"}
                              </button>
                              <button
                                disabled={!!actionLoading[order.id]}
                                onClick={() => handleOrderAction(order.id, "reject")}
                                className="flex-1 text-[11px] py-1 rounded bg-red-500 hover:bg-red-600 text-white font-medium disabled:opacity-50 transition-colors"
                              >
                                {actionLoading[order.id] === "reject" ? "..." : "✗ Decline"}
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Subscriptions Panel */}
              <div className="bg-card border border-border rounded-xl p-4 shadow-card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-foreground text-sm">Subscriptions</h3>
                  <span className="text-xs text-muted-foreground">{farmSubscriptions.length} total</span>
                </div>
                {farmSubscriptions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No subscriptions yet.</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {farmSubscriptions.map((sub) => (
                      <div key={sub.id} className="border border-border/60 rounded-md px-3 py-2 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground">{sub.buyerName || `Buyer #${sub.buyerId}`}</span>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-medium",
                            sub.status === "ACTIVE" && "bg-emerald-50 text-emerald-700 border border-emerald-200",
                            sub.status === "PAUSED" && "bg-amber-50 text-amber-700 border border-amber-200",
                            sub.status === "CANCELLED" && "bg-red-50 text-red-700 border border-red-200",
                            sub.status === "COMPLETED" && "bg-blue-50 text-blue-700 border border-blue-200",
                          )}>
                            {sub.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-muted-foreground">
                          <span>{sub.quantity?.toFixed(1)}L/day</span>
                          <span>{sub.animalType === "COW" ? "🐮 Cow" : sub.animalType === "BUFFALO" ? "🐃 Buffalo" : "🐄 Any"}</span>
                          <span>{sub.session}</span>
                          <span>From {sub.startDate}</span>
                        </div>
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

      {/* Price Dialog */}
      {pricesDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-xl p-6 max-w-sm w-full shadow-lg border border-border">
            <h2 className="text-lg font-bold mb-4">Set Milk Prices</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Cow Milk Price (per Liter)</label>
                <input
                  type="number"
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={cowPrice}
                  onChange={(e) => setCowPrice(e.target.value)}
                  placeholder="e.g. 50"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Buffalo Milk Price (per Liter)</label>
                <input
                  type="number"
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={buffaloPrice}
                  onChange={(e) => setBuffaloPrice(e.target.value)}
                  placeholder="e.g. 60"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setPricesDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSavePrices} disabled={priceSubmitting}>
                {priceSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
