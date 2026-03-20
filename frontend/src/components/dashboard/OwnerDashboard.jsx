import { useEffect, useMemo, useState } from "react";
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
} from "./ProductionChart";
import { Milk, Beef, Users, Warehouse, Store, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import { sortOrdersByDateAndPending, sortSubscriptionsByDateAndPending } from "../../lib/requestSort";
import { Badge } from "../ui/badge";
import { SubscribersRequestsSection } from "./SubscribersRequestsSection";
import { useLazyList } from "../../hooks/useLazyList";
import { useTranslation } from 'react-i18next';
import { InlineMessage } from "../ui/InlineMessage";

// Main dashboard for farm owners
export function OwnerDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const TYPE_COLORS = {
    COW: "#2f9e44",
    BUFFALO: "#1c7ed6",
    SHEEP: "#f08c00",
    GOAT: "#ae3ec9",
    UNKNOWN: "#6b7280",
  };

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
  const [milkTypeHistory, setMilkTypeHistory] = useState([]);
  const [farms, setFarms] = useState([]);
  const [daysRange, setDaysRange] = useState(7);
  const [historyView, setHistoryView] = useState("TOTAL");
  const [historyMode, setHistoryMode] = useState("SEPARATED");
  const [recentOrders, setRecentOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [farmSubscriptions, setFarmSubscriptions] = useState([]);
  const [orderTab, setOrderTab] = useState("pending"); // "pending" | "all"
  const [subTab, setSubTab] = useState(false);
  const [todayEntries, setTodayEntries] = useState([]);
  const [farmCattle, setFarmCattle] = useState([]);
  const [isToggling, setIsToggling] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  const [pricesDialogOpen, setPricesDialogOpen] = useState(false);
  const [cowPrice, setCowPrice] = useState("");
  const [buffaloPrice, setBuffaloPrice] = useState("");
  const [sheepPrice, setSheepPrice] = useState("");
  const [goatPrice, setGoatPrice] = useState("");
  const [priceSubmitting, setPriceSubmitting] = useState(false);
  const [shedStatusList, setShedStatusList] = useState([]);
  const [message, setMessage] = useState({ type: "", text: "" });

  const filteredDashboardOrders = useMemo(
    () => orderTab === "pending" ? allOrders.filter((order) => order.status === "PENDING") : allOrders,
    [allOrders, orderTab]
  );

  const {
    visibleItems: visibleDashboardOrders,
    hasMore: hasMoreDashboardOrders,
    loadMore: loadMoreDashboardOrders,
  } = useLazyList(filteredDashboardOrders, 6, 6);

  const {
    visibleItems: visibleFarmSubscriptions,
    hasMore: hasMoreFarmSubscriptions,
    loadMore: loadMoreFarmSubscriptions,
  } = useLazyList(farmSubscriptions, 6, 6);

  const {
    visibleItems: visibleTodayEntries,
    hasMore: hasMoreTodayEntries,
    loadMore: loadMoreTodayEntries,
  } = useLazyList(todayEntries, 8, 8);

  const {
    visibleItems: visibleShedStatuses,
    hasMore: hasMoreShedStatuses,
    loadMore: loadMoreShedStatuses,
  } = useLazyList(shedStatusList, 6, 6);

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
          `/milk/history/by-type?farmId=${farmId}&days=${days}`
        );
        if (!mounted) return;
        setMilkTypeHistory(Array.isArray(data) ? data : []);
      } catch {
        if (!mounted) return;
        setMilkTypeHistory([]);
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
        const sortedOrders = sortOrdersByDateAndPending(orders);
        const sortedSubscriptions = sortSubscriptionsByDateAndPending(subs);
        setAllOrders(sortedOrders);
        setRecentOrders(sortedOrders.slice(0, 5));
        setFarmSubscriptions(sortedSubscriptions);
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
      const sortedOrders = sortOrdersByDateAndPending(orders);
      setAllOrders(sortedOrders);
      setRecentOrders(sortedOrders.slice(0, 5));
    } catch (err) {
      setMessage({ type: "error", text: err.message || `Failed to ${action} order` });
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

  /* ===========================
     LOAD FARM CATTLE (OWNER VIEW)
     =========================== */
  useEffect(() => {
    let mounted = true;

    async function loadFarmCattle(farmId) {
      try {
        const data = await apiFetch(`/cattle/farm/${farmId}`);
        if (!mounted) return;
        setFarmCattle(Array.isArray(data) ? data : []);
      } catch {
        if (!mounted) return;
        setFarmCattle([]);
      }
    }

    if (activeFarm?.id) {
      loadFarmCattle(activeFarm.id);
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
      setMessage({ type: "error", text: err.message || "Failed to update selling status" });
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
        body: JSON.stringify({
          cowPrice: parseFloat(cowPrice),
          buffaloPrice: parseFloat(buffaloPrice),
          sheepPrice: parseFloat(sheepPrice),
          goatPrice: parseFloat(goatPrice)
        })
      });
      const updatedFarm = {
        ...activeFarm,
        cowPrice: parseFloat(cowPrice),
        buffaloPrice: parseFloat(buffaloPrice),
        sheepPrice: parseFloat(sheepPrice),
        goatPrice: parseFloat(goatPrice)
      };
      localStorage.setItem("activeFarm", JSON.stringify(updatedFarm));
      window.location.reload();
    } catch (err) {
      setMessage({ type: "error", text: "Failed to update prices" });
    } finally {
      setPriceSubmitting(false);
    }
  };

  // Robust check for selling status
  const currentIsSelling = activeFarm?.isSelling === true || activeFarm?.selling === true;

  const normalizeAnimalType = (value) => {
    if (!value) return "UNKNOWN";
    return String(value).trim().toUpperCase();
  };

  const formatAnimalTypeLabel = (value) => {
    const normalized = normalizeAnimalType(value);
    return t(`cattle.${normalized.toLowerCase()}`, normalized.charAt(0) + normalized.slice(1).toLowerCase());
  };

  const formatTimeSlot = (slot) => {
    if (!slot) return null;
    const [h, m] = String(slot).split(':');
    const hour = Number(h);
    const minute = Number(m);
    if (Number.isNaN(hour) || Number.isNaN(minute)) return String(slot);
    const d = new Date();
    d.setHours(hour, minute, 0, 0);
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  const formatSession = (session) => {
    if (!session) return '--';
    if (session === "MORNING") return t('common.morning', { defaultValue: 'Morning' });
    if (session === "EVENING") return t('common.evening', { defaultValue: 'Evening' });
    return String(session);
  };

  const formatOrderSlot = (order) => {
    const formattedSlot = formatTimeSlot(order?.timeSlot);
    if (formattedSlot) return formattedSlot;
    return formatSession(order?.session);
  };

  const cattleTypeSummaries = Array.from(
    farmCattle.reduce((map, cattle) => {
      const normalizedType = normalizeAnimalType(cattle?.type);
      const existing = map.get(normalizedType) || {
        type: normalizedType,
        count: 0,
        morning: 0,
        evening: 0,
      };

      existing.count += 1;
      map.set(normalizedType, existing);
      return map;
    }, new Map()).values()
  ).map((summary) => {
    const morning = todayEntries
      .filter((entry) => normalizeAnimalType(entry?.animalType) === summary.type && entry?.session === "MORNING")
      .reduce((total, entry) => total + (Number(entry?.milkLiters) || 0), 0);

    const evening = todayEntries
      .filter((entry) => normalizeAnimalType(entry?.animalType) === summary.type && entry?.session === "EVENING")
      .reduce((total, entry) => total + (Number(entry?.milkLiters) || 0), 0);

    return {
      ...summary,
      morning,
      evening,
    };
  });

  const ownedTypeKeys = Array.from(
    new Set(farmCattle.map((cattle) => normalizeAnimalType(cattle?.type)))
  ).sort();

  const chartData = Array.from({ length: daysRange }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (daysRange - 1 - index));

    const isoDate = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
    const row = {
      rawDate: isoDate,
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    };

    ownedTypeKeys.forEach((type) => {
      row[type] = 0;
    });

    milkTypeHistory.forEach((entry) => {
      if (entry?.date !== isoDate) return;
      const type = normalizeAnimalType(entry?.animalType);
      if (!ownedTypeKeys.includes(type)) return;

      const selectedValue = historyView === "MORNING"
        ? Number(entry?.morning) || 0
        : historyView === "EVENING"
          ? Number(entry?.evening) || 0
          : Number(entry?.total) || 0;

      row[type] = selectedValue;
    });

    return row;
  });

  const chartSeries = ownedTypeKeys.map((type) => ({
    key: type,
    label: formatAnimalTypeLabel(type),
    color: TYPE_COLORS[type] || TYPE_COLORS.UNKNOWN,
  }));

  const combinedChartData = chartData.map((row) => ({
    ...row,
    COMBINED: ownedTypeKeys.reduce((sum, type) => sum + (Number(row[type]) || 0), 0),
  }));

  const displayedChartData = historyMode === "COMBINED" ? combinedChartData : chartData;
  const displayedChartSeries = historyMode === "COMBINED"
    ? [{ key: "COMBINED", label: t('dashboard.combinedMilkLine'), color: "#2f9e44" }]
    : chartSeries;

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
            {t('dashboard.goodMorning', { name: user?.name?.split(" ")[0] || t('common.user') })}
          </h1>
          <p className="text-muted-foreground mt-1">
            {activeFarm
              ? t('dashboard.happeningAtFarm', { farm: activeFarm.name })
              : t('dashboard.happeningAcrossFarms')}
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
                {currentIsSelling ? t('dashboard.sellingOn') : t('dashboard.sellingOff')}
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
                {isToggling ? t('dashboard.updating') : currentIsSelling ? t('dashboard.stopSelling') : t('dashboard.startSelling')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[10px] gap-1.5"
                onClick={() => {
                  setCowPrice(activeFarm?.cowPrice || "");
                  setBuffaloPrice(activeFarm?.buffaloPrice || "");
                  setSheepPrice(activeFarm?.sheepPrice || "");
                  setGoatPrice(activeFarm?.goatPrice || "");
                  setPricesDialogOpen(true);
                }}
              >
                {t('dashboard.setPrices')}
              </Button>
            </div>
          )}
        </div>

        {!activeFarm && (
          <Button onClick={() => navigate("/farms")}>
            <Warehouse className="w-4 h-4 mr-2" />
            {t('dashboard.selectFarm')}
          </Button>
        )}
      </motion.div>

      <InlineMessage
        type={message.type}
        message={message.text}
        onClose={() => setMessage({ type: "", text: "" })}
      />

      {activeFarm && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="dashboard.morningMilk"
              value={morningMilk != null ? `${morningMilk.toFixed(1)}L` : "—"}
              icon={Milk}
              variant="success"
            />

            <StatCard
              title="dashboard.eveningMilk"
              value={eveningMilk != null ? `${eveningMilk.toFixed(1)}L` : "—"}
              icon={Milk}
              variant="success"
            />

            <StatCard
              title="dashboard.activeCattle"
              value={activeCattleCount ?? "—"}
              subtitle={herdCount != null ? t('dashboard.totalCattle', { count: herdCount }) : ""}
              icon={Beef}
              onClick={() => navigate(`/cattle/${activeFarm.id}`)}
            />

            <StatCard
              title="dashboard.workers"
              value={workerCount ?? "—"}
              icon={Users}
              variant="warning"
              onClick={() => navigate(`/workers/${activeFarm.id}`)}
            />
          </div>

          <div className="bg-card border border-border rounded-xl p-4 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground text-sm">
                {t('dashboard.cattleTypeMilkSummary')}
              </h3>
              <span className="text-xs text-muted-foreground">
                {t('dashboard.cattleTypesCount', { count: cattleTypeSummaries.length })}
              </span>
            </div>

            {cattleTypeSummaries.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                {t('dashboard.noCattleTypes')}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {cattleTypeSummaries.map((summary) => (
                  <div key={summary.type} className="rounded-xl border border-border/60 bg-muted/20 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-foreground">
                          {formatAnimalTypeLabel(summary.type)}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {t('dashboard.cattleTypeCount', { count: summary.count })}
                        </p>
                      </div>
                      <div className="rounded-full bg-primary/10 p-2 text-primary">
                        <Milk className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                        <p className="text-[11px] font-medium text-emerald-700">
                          {t('dashboard.morningMilk')}
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                          {summary.morning.toFixed(1)}L
                        </p>
                      </div>
                      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                        <p className="text-[11px] font-medium text-amber-700">
                          {t('dashboard.eveningMilk')}
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                          {summary.evening.toFixed(1)}L
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Milk Prices */}
          {activeFarm && (activeFarm.cowPrice || activeFarm.buffaloPrice || activeFarm.sheepPrice || activeFarm.goatPrice) && (
            <div className="bg-card border border-border rounded-xl p-4 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground text-sm">{t('dashboard.milkPrices')}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[10px] gap-1"
                  onClick={() => {
                    setCowPrice(activeFarm?.cowPrice || "");
                    setBuffaloPrice(activeFarm?.buffaloPrice || "");
                    setSheepPrice(activeFarm?.sheepPrice || "");
                    setGoatPrice(activeFarm?.goatPrice || "");
                    setPricesDialogOpen(true);
                  }}
                >
                  {t('dashboard.setPrices')}
                </Button>
              </div>
              <div className="flex flex-wrap gap-3">
                {activeFarm.cowPrice > 0 && (
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2">
                    <span className="text-xs text-muted-foreground">{formatAnimalTypeLabel('COW')}</span>
                    <span className="font-semibold text-foreground text-sm">₹{activeFarm.cowPrice}/L</span>
                  </div>
                )}
                {activeFarm.buffaloPrice > 0 && (
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2">
                    <span className="text-xs text-muted-foreground">{formatAnimalTypeLabel('BUFFALO')}</span>
                    <span className="font-semibold text-foreground text-sm">₹{activeFarm.buffaloPrice}/L</span>
                  </div>
                )}
                {activeFarm.sheepPrice > 0 && (
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2">
                    <span className="text-xs text-muted-foreground">{formatAnimalTypeLabel('SHEEP')}</span>
                    <span className="font-semibold text-foreground text-sm">₹{activeFarm.sheepPrice}/L</span>
                  </div>
                )}
                {activeFarm.goatPrice > 0 && (
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2">
                    <span className="text-xs text-muted-foreground">{formatAnimalTypeLabel('GOAT')}</span>
                    <span className="font-semibold text-foreground text-sm">₹{activeFarm.goatPrice}/L</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Charts + Controls */}
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {/* 7 / 30 Days Toggle */}
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-2">
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
                      {t('dashboard.days', { count: d })}
                    </Button>
                  ))}

                  {[
                    { value: "SEPARATED", label: t('dashboard.separated') },
                    { value: "COMBINED", label: t('dashboard.combined') },
                  ].map((option) => (
                    <Button
                      key={option.value}
                      size="sm"
                      variant={historyMode === option.value ? "default" : "outline"}
                      className={cn(historyMode === option.value && "pointer-events-none")}
                      onClick={() => setHistoryMode(option.value)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>

                <div className="flex items-center gap-2 self-start lg:self-auto">
                  {[
                    { value: "TOTAL", label: t('dashboard.total') },
                    { value: "MORNING", label: t('dashboard.morning') },
                    { value: "EVENING", label: t('dashboard.evening') },
                  ].map((option) => (
                    <Button
                      key={option.value}
                      size="sm"
                      variant={historyView === option.value ? "default" : "outline"}
                      className={cn(historyView === option.value && "pointer-events-none")}
                      onClick={() => setHistoryView(option.value)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <DailyProductionChart data={displayedChartData} series={displayedChartSeries} />

              {/* Shed Status View */}
              <div className="bg-card border border-border rounded-xl p-4 shadow-card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-foreground text-sm">
                    {t('dashboard.shedsStatus')}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {t('dashboard.shedsCount', { count: shedStatusList.length })}
                  </span>
                </div>
                {shedStatusList.length === 0 ? (
                  <p className="text-xs text-muted-foreground">{t('dashboard.noShedData')}</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {visibleShedStatuses.map((shed, idx) => (
                      <div key={idx} className="border border-border/60 rounded-md p-3">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium text-sm text-primary">{shed.shedName}</h4>
                          <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full">{shed.workerInCharge}</span>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{t('dashboard.total')}: <span className="text-foreground">{shed.totalCattle}</span></span>
                          <span>{t('dashboard.milked')}: <span className="text-emerald-500 font-medium">{shed.milkedCattle}</span></span>
                          <span>{t('dashboard.remaining')}: <span className="text-amber-500 font-medium">{shed.remainingCattle}</span></span>
                        </div>
                      </div>
                    ))}
                    {hasMoreShedStatuses && (
                      <div className="md:col-span-2 flex justify-center pt-2">
                        <Button variant="outline" size="sm" onClick={loadMoreShedStatuses}>{t('common.loadMore')}</Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <QuickActions />

              {/* Orders Management */}
              <div className="bg-card border border-border rounded-xl p-4 shadow-card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-foreground text-sm">{t('dashboard.orders')}</h3>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setOrderTab("pending")}
                      className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium transition-colors",
                        orderTab === "pending" ? "bg-amber-500 text-white border-amber-500" : "border-border text-muted-foreground hover:bg-muted")}
                    >
                      {t('dashboard.pending')} ({allOrders.filter(o => o.status === "PENDING").length})
                    </button>
                    <button
                      onClick={() => setOrderTab("all")}
                      className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium transition-colors",
                        orderTab === "all" ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:bg-muted")}
                    >
                      {t('dashboard.all')} ({allOrders.length})
                    </button>
                  </div>
                </div>

                {(() => {
                  return filteredDashboardOrders.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      {orderTab === "pending" ? t('dashboard.noPendingOrders') : t('dashboard.noOrdersYet')}
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {visibleDashboardOrders.map((order) => (
                        <div key={order.id} className="border border-border/60 rounded-md px-3 py-2 text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-foreground">
                              #{order.displayCode || String(order.id).padStart(6, '0')}
                            </span>
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-medium",
                              order.status === "CONFIRMED" && "bg-emerald-50 text-emerald-700 border border-emerald-200",
                              order.status === "PENDING" && "bg-amber-50 text-amber-700 border border-amber-200",
                              order.status === "CANCELLED" && "bg-red-50 text-red-700 border border-red-200",
                              order.status === "TIMEOUT_REJECTED" && "bg-red-50 text-red-700 border border-red-200",
                              order.status === "COMPLETED" && "bg-blue-50 text-blue-700 border border-blue-200",
                            )}>
                              {t(`orders.${order.status.toLowerCase()}`)}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-muted-foreground">
                            <span>{order.quantity?.toFixed(1)}L</span>
                            <span>{order.animalType === "COW" ? "🐮 Cow" : order.animalType === "BUFFALO" ? "🐃 Buffalo" : order.animalType === "SHEEP" ? "🐑 Sheep" : order.animalType === "GOAT" ? "🐐 Goat" : "🐄 Any"}</span>
                            <span>{formatOrderSlot(order)}</span>
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
                      {hasMoreDashboardOrders && (
                        <div className="flex justify-center pt-2">
                          <Button variant="outline" size="sm" onClick={loadMoreDashboardOrders}>{t('common.loadMore')}</Button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Subscriptions Panel */}
              <div className="bg-card border border-border rounded-xl p-4 shadow-card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-foreground text-sm">{t('dashboard.subscriptionsLabel')}</h3>
                  <span className="text-xs text-muted-foreground">{t('dashboard.totalSubs', { count: farmSubscriptions.length })}</span>
                </div>
                {farmSubscriptions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">{t('dashboard.noSubscriptionsYet')}</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {visibleFarmSubscriptions.map((sub) => (
                      <div key={sub.id} className="border border-border/60 rounded-md px-3 py-2 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground">#{sub.displayCode || String(sub.id).padStart(6, '0')}</span>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-medium",
                            sub.status === "ACTIVE" && "bg-emerald-50 text-emerald-700 border border-emerald-200",
                            sub.status === "PAUSED" && "bg-amber-50 text-amber-700 border border-amber-200",
                            sub.status === "CANCELLED" && "bg-red-50 text-red-700 border border-red-200",
                            sub.status === "TIMEOUT_REJECTED" && "bg-red-50 text-red-700 border border-red-200",
                            sub.status === "COMPLETED" && "bg-blue-50 text-blue-700 border border-blue-200",
                          )}>
                            {sub.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-muted-foreground">
                          <span>{sub.quantity?.toFixed(1)}L/day</span>
                          <span>{sub.animalType === "COW" ? "🐮 Cow" : sub.animalType === "BUFFALO" ? "🐃 Buffalo" : sub.animalType === "SHEEP" ? "🐑 Sheep" : sub.animalType === "GOAT" ? "🐐 Goat" : "🐄 Any"}</span>
                          <span>{sub.session}</span>
                          <span>From {sub.startDate}</span>
                        </div>
                      </div>
                    ))}
                    {hasMoreFarmSubscriptions && (
                      <div className="flex justify-center pt-2">
                        <Button variant="outline" size="sm" onClick={loadMoreFarmSubscriptions}>{t('common.loadMore')}</Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Today's Entries (Showing Worker) */}
              <div className="bg-card border border-border rounded-xl p-4 shadow-card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-foreground text-sm">
                    {t('dashboard.todaysMilkEntries')}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {t('dashboard.entriesCount', { count: todayEntries.length })}
                  </span>
                </div>

                {todayEntries.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {t('dashboard.noMilkEntriesToday')}
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {visibleTodayEntries.map((entry, idx) => (
                      <div
                        key={`${entry.cattleTagId}-${entry.session}-${idx}`}
                        className="flex items-center justify-between text-xs border border-border/60 rounded-md px-2 py-1.5"
                      >
                        <div>
                          <p className="font-medium text-foreground">
                            {entry.cattleTagId} • {entry.session}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {entry.milkLiters}L • {t('dashboard.milkedBy')} <span className="font-medium text-primary">{entry.workerName || t('dashboard.unknownWorker')}</span>
                          </p>
                        </div>
                      </div>
                    ))}
                    {hasMoreTodayEntries && (
                      <div className="flex justify-center pt-2">
                        <Button variant="outline" size="sm" onClick={loadMoreTodayEntries}>{t('common.loadMore')}</Button>
                      </div>
                    )}
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
            <h2 className="text-lg font-bold mb-4">{t('dashboard.setMilkPrices')}</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">{t('dashboard.cowMilkPrice')}</label>
                <input
                  type="number"
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={cowPrice}
                  onChange={(e) => setCowPrice(e.target.value)}
                  placeholder="e.g. 50"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">{t('dashboard.buffaloMilkPrice')}</label>
                <input
                  type="number"
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={buffaloPrice}
                  onChange={(e) => setBuffaloPrice(e.target.value)}
                  placeholder="e.g. 60"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">{t('dashboard.sheepMilkPrice')}</label>
                <input
                  type="number"
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={sheepPrice}
                  onChange={(e) => setSheepPrice(e.target.value)}
                  placeholder="e.g. 80"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">{t('dashboard.goatMilkPrice')}</label>
                <input
                  type="number"
                  className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={goatPrice}
                  onChange={(e) => setGoatPrice(e.target.value)}
                  placeholder="e.g. 85"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setPricesDialogOpen(false)}>{t('common.cancel')}</Button>
              <Button onClick={handleSavePrices} disabled={priceSubmitting}>
                {priceSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.save')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
