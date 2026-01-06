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

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const [farmsData, cattleData] = await Promise.all([
          apiFetch(`/farms/worker/${user.id}`).catch(() => []),
          user.id ? apiFetch(`/cattle/farm/${user.farmId || ''}`).catch(() => []) : Promise.resolve([])
        ]);
        if (!mounted) return;
        setAssignedFarms(Array.isArray(farmsData) ? farmsData : []);
        setCattle(Array.isArray(cattleData) ? cattleData : []);
      } catch (err) {
        if (!mounted) return;
        setAssignedFarms([]);
        setCattle([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (user.id) loadData();
    return () => { mounted = false; };
  }, [user.id]);

  const activeFarm = assignedFarms.length > 0 ? assignedFarms[0] : null;
  const farmId = activeFarm?.id;

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
        className="bg-card border border-border rounded-xl p-5 shadow-card"
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
            {cattle.slice(0, 5).map((c) => {
              const hasEntry = todayEntries.some(e => e.cattleTagId === c.tagId);
              return (
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
                  {hasEntry ? (
                    <Badge className="bg-success/10 text-success border-success/30">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Done
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      <Clock className="w-3 h-3 mr-1" />
                      Pending
                    </Badge>
                  )}
                </div>
              );
            })}
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
