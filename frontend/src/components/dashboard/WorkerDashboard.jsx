import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { CheckCircle, Clock, Milk, Beef, Plus } from "lucide-react";
import { apiFetch } from "../../api/client";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";

export function WorkerDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [assignedFarms, setAssignedFarms] = useState([]);
  const [cattle, setCattle] = useState([]);
  const [todayEntries, setTodayEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEntries, setShowEntries] = useState(false);

  // Resolve active farm from localStorage (if set) or fall back to first assigned farm
  const [activeFarmId, setActiveFarmId] = useState(() => {
    try {
      const raw = localStorage.getItem("activeFarm");
      return raw ? JSON.parse(raw).id : null;
    } catch {
      return null;
    }
  });

  const activeFarm =
    assignedFarms.find((f) => f.id === activeFarmId) ||
    (assignedFarms.length > 0 ? assignedFarms[0] : null);
  const farmId = activeFarm?.id;

  const refreshTodayEntries = async () => {
    if (farmId) {
      try {
        const entriesData = await apiFetch(`/milk/today/entries?farmId=${farmId}`).catch(() => []);
        setTodayEntries(Array.isArray(entriesData) ? entriesData : []);
      } catch (err) {
        setTodayEntries([]);
      }
    }
  };

  // Load farms assigned to this worker
  useEffect(() => {
    let mounted = true;
    async function loadFarms() {
      try {
        const farmsData = await apiFetch(`/farms/worker/${user.id}`).catch(() => []);
        if (!mounted) return;
        setAssignedFarms(Array.isArray(farmsData) ? farmsData : []);
      } catch (err) {
        if (!mounted) return;
        setAssignedFarms([]);
      }
    }
    if (user.id) loadFarms();
    return () => {
      mounted = false;
    };
  }, [user.id]);

  // Persist active farm to localStorage when it changes
  useEffect(() => {
    if (activeFarm) {
      localStorage.setItem("activeFarm", JSON.stringify(activeFarm));
      if (activeFarmId !== activeFarm.id) {
        setActiveFarmId(activeFarm.id);
      }
    }
  }, [activeFarm, activeFarmId]);

  // Load cattle + today's entries for current farm
  useEffect(() => {
    let mounted = true;
    async function loadFarmData() {
      if (!farmId) {
        setCattle([]);
        setTodayEntries([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [cattleData, entriesData] = await Promise.all([
          apiFetch(`/cattle/farm/${farmId}`).catch(() => []),
          apiFetch(`/milk/today/entries?farmId=${farmId}`).catch(() => [])
        ]);
        if (!mounted) return;
        setCattle(Array.isArray(cattleData) ? cattleData : []);
        setTodayEntries(Array.isArray(entriesData) ? entriesData : []);
      } catch (err) {
        if (!mounted) return;
        setCattle([]);
        setTodayEntries([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadFarmData();
    return () => {
      mounted = false;
    };
  }, [farmId]);

  // Refresh today's entries when window regains focus
  useEffect(() => {
    const handleFocus = () => {
      refreshTodayEntries();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [farmId]);

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
            Hello, {user?.name?.split(' ')[0] || "Worker"}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Ready to record today's milk collection?
          </p>
        </div>
        {farmId && (
          <Button onClick={() => navigate(`/milk/add/${farmId}`)} className="gap-2">
            <Plus className="w-5 h-5" />
            Add Milk Entry
          </Button>
        )}
      </motion.div>

      {/* Entry Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={cn(
          "bg-card border border-border rounded-xl p-5 shadow-card",
          todayEntries.length > 0 ? "cursor-pointer" : "cursor-default"
        )}
        onClick={() => {
          if (todayEntries.length > 0) setShowEntries((prev) => !prev);
        }}
      >
        <h3 className="font-semibold text-foreground mb-4">Today's Entry Status</h3>
        <div className="flex items-center gap-4">
          <div className={cn(
            "p-3 rounded-xl",
            todayEntries.length > 0 ? "bg-success/10" : "bg-warning/10"
          )}>
            {todayEntries.length > 0 ? (
              <CheckCircle className="w-6 h-6 text-success" />
            ) : (
              <Clock className="w-6 h-6 text-warning" />
            )}
          </div>
          <div>
            <p className="font-medium text-foreground">
              {todayEntries.length > 0
                ? `${todayEntries.length} entries recorded`
                : 'No entries yet today'}
            </p>
            <p className="text-sm text-muted-foreground">
              {todayEntries.length > 0
                ? `Keep up the good work!`
                : 'Start recording milk collection'}
            </p>
          </div>
        </div>
      </motion.div>

      {showEntries && todayEntries.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-5 shadow-card"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Today's Entries</h3>
            <Button variant="outline" size="sm" onClick={() => setShowEntries(false)}>
              Close
            </Button>
          </div>
          <div className="space-y-2">
            {todayEntries.map((entry, idx) => (
              <div key={`${entry.cattleTagId}-${entry.session}-${idx}`} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">{entry.cattleTagId || "—"}</span>
                  {entry.cattleName && <span className="text-xs text-muted-foreground">{entry.cattleName}</span>}
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Badge variant="outline">{entry.session}</Badge>
                  <span>{entry.milkLiters} L</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Assigned Farms */}
      {assignedFarms.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="font-semibold text-foreground mb-4">Assigned Farms</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {assignedFarms.map((farm, index) => (
              <motion.div
                key={farm.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + index * 0.05 }}
                className="bg-card border border-border rounded-xl p-5 shadow-card"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-foreground">{farm.name || "—"}</h4>
                    <p className="text-sm text-muted-foreground">{farm.address || farm.location || "—"}</p>
                  </div>
                  <Badge variant="outline" className="bg-success/10 border-success/30 text-success">
                    Active
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Beef className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{farm.cattleCount || farm.herdCount || "—"} cattle</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Milk className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{farm.todayMilk != null ? `${farm.todayMilk}L` : "—"} today</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Cattle List */}
      {cattle.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-xl p-5 shadow-card"
        >
          <h3 className="font-semibold text-foreground mb-4">Cattle for Milking</h3>
          <div className="divide-y divide-border">
            {cattle
              .map((c) => {
                // Check which sessions are completed for this cattle
                const hasMorning = todayEntries.some(
                  e => e.cattleTagId === c.tagId && e.session === "MORNING"
                );
                const hasEvening = todayEntries.some(
                  e => e.cattleTagId === c.tagId && e.session === "EVENING"
                );

                return {
                  cattle: c,
                  hasMorning,
                  hasEvening,
                  hasPendingSession: !hasMorning || !hasEvening
                };
              })
              // Filter out cattle with both sessions complete
              .filter(item => item.hasPendingSession)
              .slice(0, 10)
              .map(({ cattle: c, hasMorning, hasEvening }) => (
                <div key={c.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      c.status === "ACTIVE" ? "bg-success" :
                        c.status === "SICK" ? "bg-destructive" : "bg-muted"
                    )} />
                    <div>
                      <p className="font-medium text-foreground">
                        {c.tagId || "—"}
                        {c.name && <span className="text-muted-foreground ml-1">({c.name})</span>}
                      </p>
                      <p className="text-sm text-muted-foreground">{c.breed || "—"} • Avg {c.avgMilkPerDay != null ? `${c.avgMilkPerDay}L` : "—"}/day</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!hasMorning && (
                      <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
                        <Clock className="w-3 h-3 mr-1" />
                        Morning
                      </Badge>
                    )}
                    {!hasEvening && (
                      <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">
                        <Clock className="w-3 h-3 mr-1" />
                        Evening
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </motion.div>
      )}

      {assignedFarms.length === 0 && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-card border border-border rounded-xl p-12 text-center shadow-card"
        >
          <p className="text-muted-foreground">No farms assigned yet.</p>
        </motion.div>
      )}
    </div>
  );
}
