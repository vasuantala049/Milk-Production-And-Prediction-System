import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, ShoppingCart, Milk, Clock, CheckCircle, Pause, ChevronRight } from "lucide-react";
import { apiFetch } from "../../api/client";
import { farmApi } from "../../api/farmApi";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { cn } from "../../lib/utils";
import { useTranslation } from 'react-i18next';

export function CustomerDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [farms, setFarms] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState(user.city || user.location || "");
  const [savingCity, setSavingCity] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const [farmsData, subsData, ordersData] = await Promise.all([
          // Load all farms (not filtered by location) to ensure subscriptions show correct farm names
          farmApi.getAllFarms("").catch(() => []),
          apiFetch(`/subscriptions/my-subscriptions`).catch(() => []),
          apiFetch(`/orders/my-orders`).catch(() => [])
        ]);

        if (!mounted) return;
        setFarms(Array.isArray(farmsData) ? farmsData : []);
        setSubscriptions(Array.isArray(subsData) ? subsData : []);
        setOrders(Array.isArray(ordersData) ? ordersData.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate)) : []);
      } catch (err) {
        if (!mounted) return;
        console.error("Failed to load dashboard data", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => { mounted = false; };
  }, []);

  const activeSubscriptions = subscriptions.filter(s => s.status === 'ACTIVE');
  const recentOrders = orders.slice(0, 5);

  async function handleSaveCity() {
    if (!user?.id || !city) return;
    try {
      setSavingCity(true);
      await apiFetch(`/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ city, location: city }),
      });

      const updatedUser = { ...user, city, location: city };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      window.location.reload();
    } catch (e) {
      alert(e.message || "Failed to save city");
    } finally {
      setSavingCity(false);
    }
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
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
            {t('dashboard.welcome', { name: user?.name?.split(' ')[0] || t('common.customer') })}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('dashboard.freshMilkDelivery')}
          </p>

          <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder={t('dashboard.yourCity')}
                className="h-8 w-44"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={savingCity || !city}
              onClick={handleSaveCity}
            >
              {savingCity ? t('dashboard.saving') : t('dashboard.saveCity')}
            </Button>
          </div>
        </div>
        <Button onClick={() => navigate("/buy-milk")} className="gap-2">
          <ShoppingCart className="w-5 h-5" />
          {t('dashboard.buyMilk')}
        </Button>
      </motion.div>
      
      {/* Active Subscriptions */}
      {activeSubscriptions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-5 shadow-card"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Active Subscriptions</h3>
          </div>

          <div className="space-y-3">
            {activeSubscriptions.map((sub) => {
              const farm = farms.find(f => f.id === sub.farmId);
              return (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      sub.status === 'ACTIVE' ? "bg-success/10" : "bg-warning/10"
                    )}>
                      <Milk className={cn(
                        "w-5 h-5",
                        sub.status === 'ACTIVE' ? "text-success" : "text-warning"
                      )} />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{farm?.name || `Farm #${sub.farmId}`}</p>
                      <p className="text-sm text-muted-foreground">
                        {sub.quantity || "—"}L/day • {sub.session}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        sub.status === 'ACTIVE'
                          ? "bg-success/10 border-success/30 text-success"
                          : "bg-warning/10 border-warning/30 text-warning"
                      )}
                    >
                      {sub.status === 'ACTIVE' ? (
                        <><CheckCircle className="w-3 h-3 mr-1" /> Active</>
                      ) : (
                        <><Pause className="w-3 h-3 mr-1" /> Paused</>
                      )}
                    </Badge>

                    {sub.status === 'ACTIVE' && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={async () => {
                          if (!confirm("Cancel subscription?")) return;
                          try {
                            await apiFetch(`/subscriptions/${sub.id}/cancel`, { method: "POST" });
                            setSubscriptions(prev => prev.map(s => s.id === sub.id ? { ...s, status: 'CANCELLED' } : s));
                          } catch (e) {
                            alert("Failed to cancel: " + e.message);
                          }
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Nearby Farms */}
      {farms.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Available Farms</h3>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {farms.slice(0, 6).map((farm, index) => (
              <motion.div
                key={farm.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + index * 0.05 }}
              >
                <div
                  onClick={() => navigate(`/buy-milk?farm=${farm.id}`)}
                  className="block bg-card border border-border rounded-xl p-5 shadow-card hover:border-primary/30 transition-all group cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {farm.name || "—"}
                      </h4>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {farm.address || farm.location || "—"}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      {/* <p className="text-lg font-bold text-foreground">₹{farm.pricePerLiter != null ? farm.pricePerLiter : "—"}<span className="text-xs font-normal text-muted-foreground">/L base</span></p> */}
                      <div className="flex gap-2 mt-0.5">
                        {farm.cowPrice != null && <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">Cow: ₹{farm.cowPrice}</span>}
                        {farm.buffaloPrice != null && <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">Buf: ₹{farm.buffaloPrice}</span>}
                      </div>
                    </div>
                    {/* <Badge
                      variant="outline"
                      className={cn(
                        (farm.availableMilk || 0) > 100
                          ? "bg-success/10 border-success/30 text-success"
                          : "bg-warning/10 border-warning/30 text-warning"
                      )}
                    >
                      <div className="flex flex-col gap-1 text-center items-center">
                        <span className="font-semibold">{farm.availableMilk != null ? `${farm.availableMilk}L Available` : "—"}</span>
                        {(farm.cowAvailableMilk > 0 || farm.buffaloAvailableMilk > 0) && (
                          <div className="flex items-center gap-1.5 text-[10px] opacity-90 font-medium">
                            {farm.cowAvailableMilk > 0 && <span className="bg-background/20 px-1.5 py-0.5 rounded">🐮 {farm.cowAvailableMilk}L</span>}
                            {farm.buffaloAvailableMilk > 0 && <span className="bg-background/20 px-1.5 py-0.5 rounded">🐃 {farm.buffaloAvailableMilk}L</span>}
                          </div>
                        )}
                      </div>
                    </Badge> */}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Order History */}
      {orders.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-xl p-5 shadow-card"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">My Orders</h3>
            <span className="text-xs text-muted-foreground">{orders.length} total</span>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {orders.map((order) => {
              const farm = farms.find(f => f.id === order.farmId);
              const farmName = order.farmName || farm?.name || `Farm #${order.farmId}`;
              const animalEmoji = order.animalType === "COW" ? "🐮" : order.animalType === "BUFFALO" ? "🐃" : order.animalType === "SHEEP" ? "🐑" : order.animalType === "GOAT" ? "🐐" : "🐄";
              const animalLabel = order.animalType === "COW" ? "Cow" : order.animalType === "BUFFALO" ? "Buffalo" : order.animalType === "SHEEP" ? "Sheep" : order.animalType === "GOAT" ? "Goat" : "Any";
              return (
                <div key={order.id} className="border border-border/60 rounded-md px-3 py-2.5 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">{farmName}</span>
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
                    <span>{animalEmoji} {animalLabel} Milk</span>
                    <span>{order.session}</span>
                    {order.orderDate && <span>{new Date(order.orderDate).toLocaleDateString()}</span>}
                    {order.totalPrice != null && (
                      <span className="text-emerald-600 font-bold">₹{order.totalPrice.toFixed(2)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {farms.length === 0 && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-card border border-border rounded-xl p-12 text-center shadow-card"
        >
          <p className="text-muted-foreground">No farms available at the moment.</p>
        </motion.div>
      )}
    </div>
  );
}
