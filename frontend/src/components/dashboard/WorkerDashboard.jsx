import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { CheckCircle, Clock, Milk, Beef, Plus, RefreshCw, ChevronsUpDown } from "lucide-react";
import { apiFetch } from "../../api/client";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";
import { useLazyList } from "../../hooks/useLazyList";
import { Card, CardContent } from "../ui/card"; // Assuming these are from shadcn/ui
import { Grid, Box, Typography } from "@mui/material"; // Assuming MUI components

export function WorkerDashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [farms, setFarms] = useState([]);
  const [myProfileOptions, setMyProfileOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [cattle, setCattle] = useState([]);
  const [todayEntries, setTodayEntries] = useState([]);
  const [farmTodayEntries, setFarmTodayEntries] = useState([]);
  const [showEntries, setShowEntries] = useState(false);
  const [showFarmSelection, setShowFarmSelection] = useState(false);
  const [invitations, setInvitations] = useState([]);
  const [invitationMsg, setInvitationMsg] = useState({ type: '', text: '' });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Resolve active farm from localStorage (if set) or fall back to first assigned farm
  const [activeFarmId, setActiveFarmId] = useState(() => {
    try {
      const raw = localStorage.getItem("activeFarm");
      return raw ? JSON.parse(raw).id : null;
    } catch {
      return null;
    }
  });

  const activeFarm = farms.find((f) => f.id === activeFarmId) || null;
  const farmId = activeFarm?.id;

  const {
    visibleItems: visibleFarms,
    hasMore: hasMoreFarms,
    loadMore: loadMoreFarms,
  } = useLazyList(farms, 6, 6);

  const {
    visibleItems: visibleInvitations,
    hasMore: hasMoreInvitations,
    loadMore: loadMoreInvitations,
  } = useLazyList(invitations, 5, 5);

  const {
    visibleItems: visibleTodayEntries,
    hasMore: hasMoreTodayEntries,
    loadMore: loadMoreTodayEntries,
  } = useLazyList(todayEntries, 8, 8);

  const fetchInvitations = async () => {
    try {
      const data = await apiFetch('/users/me/invitations');
      setInvitations(Array.isArray(data) ? data : []);
    } catch {
      setInvitations([]);
    }
  };

  const respondToInvitation = async (invitationId, accept) => {
    try {
      await apiFetch(`/users/me/invitations/${invitationId}/respond?accept=${accept}`, { method: 'POST' });
      setInvitationMsg({ type: 'success', text: accept ? t('workers.invitationAccepted') : t('workers.invitationDeclined') });
      fetchInvitations();
      if (accept) {
        // Reload farms to show the newly accepted farm
        const farmsData = await apiFetch('/farms/me');
        setFarms(farmsData || []);
      }
      setTimeout(() => setInvitationMsg({ type: '', text: '' }), 3000);
    } catch (err) {
      setInvitationMsg({ type: 'error', text: err?.message || t('workers.assignError') });
    }
  };

  const refreshTodayEntries = async () => {
    if (farmId) {
      try {
        const timestamp = Date.now();
        const [entriesData, allEntriesData] = await Promise.all([
          apiFetch(`/milk/today/entries?farmId=${farmId}&t=${timestamp}`).catch(() => []),
          apiFetch(`/milk/today/entries?farmId=${farmId}&includeAllEntries=true&t=${timestamp}`).catch(() => [])
        ]);
        setTodayEntries(Array.isArray(entriesData) ? entriesData : []);
        setFarmTodayEntries(Array.isArray(allEntriesData) ? allEntriesData : []);
      } catch (err) {
        setTodayEntries([]);
        setFarmTodayEntries([]);
      }
    }
  };

  // Load invitations on mount
  useEffect(() => {
    fetchInvitations();
  }, []);

  // Load farms assigned to this worker
  useEffect(() => {
    async function fetchDashboard() {
      try {
        const currentUser = JSON.parse(localStorage.getItem("user"));
        if (!currentUser || currentUser.role !== "WORKER") {
          throw new Error("Unauthorized access");
        }
        setUser(currentUser);

        // Fetch user's assigned farms
        const farmsData = await apiFetch(`/farms/me`);
        setFarms(farmsData || []);

        // Pre-fetch the worker's profile per farm so we know their specific sheds
        // because /farms/me only gives generic Farm details, not worker assignments
        const profiles = await Promise.all((farmsData || []).map(async farm => {
          try {
            // Get all workers for the farm, filter down to the current worker
            const farmWorkers = await apiFetch(`/farms/${farm.id}/workers`);
            const myProfile = farmWorkers.find(w => w.id == currentUser.id); // Loose equal for string/number comparison
            return { farmId: farm.id, profile: myProfile };
          } catch (e) {
            return { farmId: farm.id, profile: null };
          }
        }));
        setMyProfileOptions(profiles);
      } catch (err) {
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, [user?.id]);

  // Persist active farm to localStorage and handle initial selection screen
  useEffect(() => {
    if (loading) return; // Wait until farms are loaded

    if (activeFarm) {
      localStorage.setItem("activeFarm", JSON.stringify(activeFarm));
    } else if (farms.length > 0) {
      // If no valid active farm, show the selection screen
      setShowFarmSelection(true);
    }
  }, [activeFarm, loading, farms.length]);

  // Load cattle + today's entries for current farm
  useEffect(() => {
    let mounted = true;
    async function loadFarmData() {
      if (!farmId) {
        setCattle([]);
        setTodayEntries([]);
        setFarmTodayEntries([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [cattleData, entriesData, allEntriesData] = await Promise.all([
          apiFetch(`/cattle/farm/${farmId}`).catch(() => []),
          apiFetch(`/milk/today/entries?farmId=${farmId}`).catch(() => []),
          apiFetch(`/milk/today/entries?farmId=${farmId}&includeAllEntries=true`).catch(() => [])
        ]);
        if (!mounted) return;
        setCattle(Array.isArray(cattleData) ? cattleData : []);
        setTodayEntries(Array.isArray(entriesData) ? entriesData : []);
        setFarmTodayEntries(Array.isArray(allEntriesData) ? allEntriesData : []);
      } catch (err) {
        if (!mounted) return;
        setCattle([]);
        setTodayEntries([]);
        setFarmTodayEntries([]);
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

  // Auto-refresh entries every 2 seconds to sync across multiple workers in same shed
  useEffect(() => {
    if (!farmId) return;
    // Refresh immediately when farm changes
    refreshTodayEntries();
  }, [farmId]);

  if (showFarmSelection || !activeFarm) {
    return (
      <>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
            {t('workerDashboard.selectFarm')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('workerDashboard.pickFarmDescription')}
          </p>
        </motion.div>

        <Grid container spacing={3}>
          {visibleFarms.map((farm) => {
            const farmProfileEntry = myProfileOptions.find(p => p.farmId === farm.id);
            const mySheds = farmProfileEntry?.profile?.sheds || [];

            return (
              <Grid item xs={12} sm={6} md={4} key={farm.id}>
                <Card
                  onClick={() => {
                    setActiveFarmId(farm.id);
                    localStorage.setItem("activeFarm", JSON.stringify(farm));
                    setShowFarmSelection(false);
                  }}
                  className="h-full cursor-pointer hover:shadow-xl transition-all duration-300 border-t-4 border-t-primary rounded-xl"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <h4 className="font-semibold text-lg text-foreground">{farm.name}</h4>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        {t('workerDashboard.view')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{farm.address || "—"}</p>

                    <div className="flex flex-wrap gap-1 mt-2">
                      {mySheds.length > 0 ? mySheds.map(s => (
                        <Badge key={s.id} variant="secondary" className="text-[10px] py-0 px-2">📍 {s.name}</Badge>
                      )) : <span className="text-xs italic text-muted-foreground">{t('workerDashboard.allShades')}</span>}
                    </div>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {hasMoreFarms && (
          <div className="flex justify-center mt-4">
            <Button variant="outline" onClick={loadMoreFarms}>{t('common.loadMore')}</Button>
          </div>
        )}

        {farms.length === 0 && !loading && (
          <div className="py-20 text-center">
            <p className="text-muted-foreground italic">{t('workerDashboard.noFarmsAssigned')}</p>
          </div>
        )}
    </div>

      {/* Pending invitations panel */}
      {invitations.length > 0 && (
        <div className="mt-8 bg-card border border-yellow-300 rounded-xl p-5 shadow-card">
          <h3 className="font-semibold text-foreground mb-3">{t('workers.pendingInvitations')}</h3>
          {invitationMsg.text && (
            <div className={`mb-3 px-3 py-2 rounded text-sm ${invitationMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {invitationMsg.text}
            </div>
          )}
          <div className="space-y-3">
            {visibleInvitations.map((inv) => (
              <div key={inv.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-border rounded-lg px-4 py-3">
                <div>
                  <p className="font-medium text-foreground">{inv.farmName}</p>
                  <p className="text-sm text-muted-foreground">{inv.farmAddress || '—'}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => respondToInvitation(inv.id, true)}
                    className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
                  >
                    {t('workers.accept')}
                  </button>
                  <button
                    onClick={() => respondToInvitation(inv.id, false)}
                    className="px-3 py-1.5 rounded-lg bg-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-300 transition-colors"
                  >
                    {t('workers.decline')}
                  </button>
                </div>
              </div>
            ))}
          </div>
          {hasMoreInvitations && (
            <div className="flex justify-center mt-4">
              <Button variant="outline" onClick={loadMoreInvitations}>{t('common.loadMore')}</Button>
            </div>
          )}
        </div>
      )}
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
              {activeFarm.name}
            </h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFarmSelection(true)}
              className="h-8 rounded-full border-primary/25 bg-primary/5 px-3 text-xs font-medium text-primary shadow-sm transition-all hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
            >
              <ChevronsUpDown className="w-3.5 h-3.5 mr-1" />
              {t('workerDashboard.switchFarm')}
            </Button>
          </div>
          <p className="text-muted-foreground">
            {user?.name?.split(' ')[0] || t('dashboard.welcome')}{t('workerDashboard.workspaceLabel')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={isRefreshing}
            onClick={async () => {
              setIsRefreshing(true);
              await refreshTodayEntries();
              setIsRefreshing(false);
            }}
            className="gap-2"
          >
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
            {t('workerDashboard.refresh')}
          </Button>
          <Button onClick={() => navigate(`/milk/add/${farmId}`)} className="gap-2">
            <Plus className="w-5 h-5" />
            {t('workerDashboard.addMilkEntry')}
          </Button>
        </div>
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
        <h3 className="font-semibold text-foreground mb-4">{t('workerDashboard.todayEntryStatus')}</h3>
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
                ? t('workerDashboard.entriesRecorded', { count: todayEntries.length })
                : t('workerDashboard.noEntriesYet')}
            </p>
            <p className="text-sm text-muted-foreground">
              {todayEntries.length > 0
                ? t('workerDashboard.keepUpGoodWork')
                : t('workerDashboard.startRecordingMilk')}
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
            <h3 className="font-semibold text-foreground">{t('workerDashboard.todayEntries')}</h3>
            <Button variant="outline" size="sm" onClick={() => setShowEntries(false)}>
              {t('workerDashboard.close')}
            </Button>
          </div>
          <div className="space-y-2">
            {visibleTodayEntries.map((entry, idx) => (
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
          {hasMoreTodayEntries && (
            <div className="flex justify-center mt-4">
              <Button variant="outline" onClick={loadMoreTodayEntries}>{t('common.loadMore')}</Button>
            </div>
          )}
        </motion.div>
      )}

      {/* Sections and Cattle List removed from here to be part of the active farm view */}

      {/* Cattle List - Filtered by Worker's Assigned Shades */}
      {(() => {
        const farmProfile = myProfileOptions.find(p => p.farmId == farmId);
        const myShedIds = farmProfile?.profile?.sheds?.map(s => s.id) || [];

        // Filter cattle that match the worker's assigned shades
        const cattleToShow = cattle.filter(c => {
          if (!c.shed?.id) return false; // Cattle must be assigned to a shade
          return myShedIds.includes(c.shed.id);
        });

        if (cattleToShow.length === 0) {
          if (cattle.length > 0) {
            return (
              <div className="bg-card border border-border rounded-xl p-8 text-center shadow-card">
                <p className="text-muted-foreground italic">
                  No cattle found in your assigned shades for this farm.
                </p>
                {myShedIds.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    (You haven't been assigned to any specific shades by the owner yet)
                  </p>
                )}
              </div>
            );
          }
          return null;
        }

        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card border border-border rounded-xl p-5 shadow-card"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">{t('workerDashboard.cattleForMilking')}</h3>
              <Badge variant="secondary" className="font-normal">
                {t('workerDashboard.cattleInYourShades', { count: cattleToShow.length })}
              </Badge>
            </div>
            <div className="divide-y divide-border">
              {cattleToShow
                .map((c) => {
                  // Check which sessions are completed for this cattle
                  const hasMorning = farmTodayEntries.some(
                    e => e.cattleTagId === c.tagId && e.session === "MORNING"
                  );
                  const hasEvening = farmTodayEntries.some(
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
                        <p className="text-sm text-muted-foreground">
                          {c.breed || "—"} • {c.shed?.name || "No Shade"}
                        </p>
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

              {/* If all visible cattle have their sessions completed */}
              {cattleToShow.length > 0 &&
                cattleToShow.every(c =>
                  farmTodayEntries.some(e => e.cattleTagId === c.tagId && e.session === "MORNING") &&
                  farmTodayEntries.some(e => e.cattleTagId === c.tagId && e.session === "EVENING")
                ) && (
                  <div className="py-8 text-center">
                    <p className="text-sm text-muted-foreground">✅ All milking for your assigned cattle is complete!</p>
                  </div>
                )}
            </div>
          </motion.div>
        );
      })()}

      {farms.length === 0 && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-card border border-border rounded-xl p-12 text-center shadow-card"
        >
          <p className="text-muted-foreground">No farms assigned yet.</p>
        </motion.div>
      )}

      {/* Pending invitations panel */}
      {invitations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-yellow-300 rounded-xl p-5 shadow-card"
        >
          <h3 className="font-semibold text-foreground mb-3">{t('workers.pendingInvitations')}</h3>
          {invitationMsg.text && (
            <div className={`mb-3 px-3 py-2 rounded text-sm ${invitationMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {invitationMsg.text}
            </div>
          )}
          <div className="space-y-3">
            {visibleInvitations.map((inv) => (
              <div key={inv.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-border rounded-lg px-4 py-3">
                <div>
                  <p className="font-medium text-foreground">{inv.farmName}</p>
                  <p className="text-sm text-muted-foreground">{inv.farmAddress || '—'}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => respondToInvitation(inv.id, true)}
                    className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
                  >
                    {t('workers.accept')}
                  </button>
                  <button
                    onClick={() => respondToInvitation(inv.id, false)}
                    className="px-3 py-1.5 rounded-lg bg-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-300 transition-colors"
                  >
                    {t('workers.decline')}
                  </button>
                </div>
              </div>
            ))}
          </div>
          {hasMoreInvitations && (
            <div className="flex justify-center mt-4">
              <Button variant="outline" onClick={loadMoreInvitations}>{t('common.loadMore')}</Button>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
