import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { Loader2, Plus, Eye, AlertCircle, TrendingUp, Users, Beef, Milk, CheckCircle2, Clock, ListTodo } from 'lucide-react';
import { Button } from './ui/button';
import { apiFetch } from '../api/client';
import { farmApi } from '../api/farmApi';
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PeopleIcon from "@mui/icons-material/People";
import AnalyticsIcon from "@mui/icons-material/Analytics";

export default function FarmManager() {
  const navigate = useNavigate();
  const [farms, setFarms] = useState([]);
  const [activeFarm, setActiveFarm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [todayStats, setTodayStats] = useState(null);
  const [pendingOrders, setPendingOrders] = useState([]);

  useEffect(() => {
    loadFarms();
  }, []);

  useEffect(() => {
    if (activeFarm) {
      loadFarmStats(activeFarm.id);
      localStorage.setItem('activeFarm', JSON.stringify(activeFarm));
    }
  }, [activeFarm]);

  async function loadFarms() {
    try {
      setLoading(true);
      const data = await farmApi.getMyFarms();
      setFarms(data || []);
      if (data && data.length > 0) {
        setActiveFarm(data[0]);
      }
    } catch (err) {
      setError(err.message || "Failed to load farms");
    } finally {
      setLoading(false);
    }
  }

  async function loadFarmStats(farmId) {
    try {
      const [breakdown, cattle, workers, orders] = await Promise.all([
        apiFetch(`/milk/today/breakdown?farmId=${farmId}`).catch(() => null),
        apiFetch(`/farms/${farmId}/herd-count`).catch(() => 0),
        apiFetch(`/farms/${farmId}/worker-count`).catch(() => 0),
        apiFetch(`/farms/${farmId}/pending-orders`).catch(() => [])
      ]);

      setTodayStats({
        morning: breakdown?.morning || 0,
        evening: breakdown?.evening || 0,
        totalToday: (breakdown?.morning || 0) + (breakdown?.evening || 0),
        cattleCount: cattle || 0,
        workerCount: workers || 0
      });
      setPendingOrders(Array.isArray(orders) ? orders : []);
    } catch (err) {
      console.error("Failed to load stats:", err);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!activeFarm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4 md:p-8">
        <div className="max-w-4xl mx-auto text-center py-20">
          <h1 className="text-3xl font-bold text-foreground mb-4">No Farms Yet</h1>
          <p className="text-muted-foreground mb-6">Create your first farm to get started managing your dairy operations</p>
          <Button onClick={() => navigate('/farms/add')} className="gap-2">
            <Plus className="w-4 h-4" />
            Create First Farm
          </Button>
        </div>
      </div>
    );
  }

  const quickActions = [
    { label: 'Add Milk Entry', icon: Milk, path: `/milk/add/${activeFarm.id}`, color: 'bg-blue-500/10' },
    { label: 'Add Cattle', icon: Beef, path: `/cattle/add/${activeFarm.id}`, color: 'bg-amber-500/10' },
    { label: 'Add Worker', icon: Users, path: `/farms/${activeFarm.id}/add-worker`, color: 'bg-green-500/10' },
    { label: 'Daily Checklist', icon: ListTodo, path: `/farms/${activeFarm.id}/checklist`, color: 'bg-sky-500/10' },
    { label: 'View Analytics', icon: AnalyticsIcon, path: `/farms/${activeFarm.id}/analytics`, color: 'bg-purple-500/10', isMui: true }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground">Farm Manager</h1>
              <p className="text-muted-foreground mt-2">Manage your dairy farm efficiently</p>
            </div>
            <Button onClick={() => navigate('/farms')} variant="outline" className="gap-2">
              <Eye className="w-4 h-4" />
              View All Farms
            </Button>
          </div>
        </motion.div>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </motion.div>
        )}

        {/* Active Farm Selector */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-3">Current Farm</p>
          <select
            value={activeFarm?.id || ''}
            onChange={(e) => {
              const farm = farms.find(f => f.id === parseInt(e.target.value));
              setActiveFarm(farm);
            }}
            className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground"
          >
            {farms.map(farm => (
              <option key={farm.id} value={farm.id}>{farm.name} - {farm.address}</option>
            ))}
          </select>
        </motion.div>

        {/* Today's Stats */}
        {todayStats && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatBox
              title="Today's Production"
              value={`${todayStats.totalToday.toFixed(1)}L`}
              subtitle={`Morning: ${todayStats.morning}L | Evening: ${todayStats.evening}L`}
              icon={Milk}
              color="bg-blue-500/10"
            />
            <StatBox
              title="Cattle"
              value={todayStats.cattleCount}
              subtitle="Active cattle"
              icon={Beef}
              color="bg-amber-500/10"
            />
            <StatBox
              title="Workers"
              value={todayStats.workerCount}
              subtitle="Assigned workers"
              icon={Users}
              color="bg-green-500/10"
            />
            <StatBox
              title="Pending Orders"
              value={pendingOrders.length}
              subtitle="Waiting to fulfill"
              icon={Clock}
              color="bg-purple-500/10"
            />
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {quickActions.map((action, idx) => {
              const Icon = action.isMui ? action.icon : action.icon;
              return (
                <motion.button
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => navigate(action.path)}
                  className={`p-4 rounded-lg border border-border hover:shadow-lg transition-all ${action.color}`}
                >
                  <div className="flex flex-col items-center gap-2 text-center">
                    {action.isMui ? (
                      <Icon fontSize="small" className="w-6 h-6" />
                    ) : (
                      <Icon className="w-6 h-6" />
                    )}
                    <span className="text-sm font-medium text-foreground">{action.label}</span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Pending Orders */}
        {pendingOrders.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Pending Orders ({pendingOrders.length})
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {pendingOrders.map((order, idx) => (
                <div key={idx} className="p-4 bg-muted/50 rounded-lg border border-border hover:border-primary transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">
                        {order.quantity}L Order
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Status: {order.status || 'Pending'}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/farms/${activeFarm.id}/pending-orders`)}
                    >
                      Manage
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button
              className="w-full mt-4"
              onClick={() => navigate(`/farms/${activeFarm.id}/pending-orders`)}
            >
              View All Orders
            </Button>
          </motion.div>
        )}

        {/* Farm Actions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Farm Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ActionCard
              title="Manage Cattle"
              description="View and edit cattle health, production stats"
              icon={Beef}
              onClick={() => navigate(`/cattle/${activeFarm.id}`)}
              color="bg-amber-500/10"
            />
            <ActionCard
              title="Manage Workers"
              description="Assign, edit, and track worker performance"
              icon={Users}
              onClick={() => navigate(`/workers/${activeFarm.id}`)}
              color="bg-green-500/10"
            />
            <ActionCard
              title="Production Analytics"
              description="View trends, forecasts, and detailed reports"
              icon={TrendingUp}
              onClick={() => navigate(`/farms/${activeFarm.id}/analytics`)}
              color="bg-purple-500/10"
            />
            <ActionCard
              title="Edit Farm"
              description="Update farm details and settings"
              icon={EditIcon}
              onClick={() => navigate(`/edit-farm/${activeFarm.id}`)}
              color="bg-blue-500/10"
              isMui={true}
            />
          </div>
        </motion.div>

        {/* Bottom Stats */}
        {todayStats && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20">
            <div>
              <p className="text-muted-foreground text-sm mb-1">Farm Name</p>
              <p className="text-lg font-semibold text-foreground">{activeFarm.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm mb-1">Location</p>
              <p className="text-lg font-semibold text-foreground">{activeFarm.address}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm mb-1">Selling Status</p>
              <p className={`text-lg font-semibold ${activeFarm.isSelling ? 'text-green-600' : 'text-red-600'}`}>
                {activeFarm.isSelling ? 'Active' : 'Inactive'}
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// eslint-disable-next-line no-unused-vars
function StatBox({ title, value, subtitle, icon: Icon, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${color} border border-border rounded-lg p-5`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-2">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>}
        </div>
        <Icon className="w-8 h-8 text-muted-foreground opacity-30" />
      </div>
    </motion.div>
  );
}

// eslint-disable-next-line no-unused-vars
function ActionCard({ title, description, icon: Icon, onClick, color, isMui }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={`${color} border border-border rounded-lg p-6 text-left hover:shadow-lg hover:border-primary transition-all hover:scale-105 transform`}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          {isMui ? (
            <Icon className="w-8 h-8 text-foreground" fontSize="small" />
          ) : (
            <Icon className="w-8 h-8 text-foreground" />
          )}
        </div>
        <div>
          <h3 className="font-semibold text-foreground mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </motion.button>
  );
}
