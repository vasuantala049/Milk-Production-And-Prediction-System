import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, ShoppingCart, Milk, Clock, CheckCircle, Pause, ChevronRight } from "lucide-react";
import { apiFetch } from "../../api/client";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";

export function CustomerDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [farms, setFarms] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const [farmsData, subsData, ordersData] = await Promise.all([
          apiFetch(`/farms`).catch(() => []),
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
            Welcome, {user?.name?.split(' ')[0] || "Customer"}! 🥛
          </h1>
          <p className="text-muted-foreground mt-1">
            Fresh milk from local farms, delivered to you
          </p>
        </div>
        <Button onClick={() => navigate("/buy-milk")} className="gap-2">
          <ShoppingCart className="w-5 h-5" />
          Buy Milk
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
            <Link to="/subscriptions" className="text-sm text-primary hover:underline">
              Manage all
            </Link>
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
            <Link to="/buy-milk" className="text-sm text-primary hover:underline">
              View all
            </Link>
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
                      <p className="text-2xl font-bold text-foreground">₹{farm.pricePerLiter != null ? farm.pricePerLiter : "—"}</p>
                      <p className="text-xs text-muted-foreground">per liter</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        (farm.availableMilk || 0) > 100
                          ? "bg-success/10 border-success/30 text-success"
                          : "bg-warning/10 border-warning/30 text-warning"
                      )}
                    >
                      {farm.availableMilk != null ? `${farm.availableMilk}L` : "—"} available
                    </Badge>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Order History */}
      {recentOrders.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-xl p-5 shadow-card"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Recent Orders</h3>
            <Link to="/orders" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>

          <div className="divide-y divide-border">
            {recentOrders.map((order) => {
              const farm = farms.find(f => f.id === order.farmId);
              return (
                <div key={order.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      order.status === 'delivered' ? "bg-success/10" :
                        order.status === 'pending' ? "bg-warning/10" : "bg-muted"
                    )}>
                      {order.status === 'delivered' ? (
                        <CheckCircle className="w-4 h-4 text-success" />
                      ) : (
                        <Clock className="w-4 h-4 text-warning" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {order.quantity || "—"}L from {farm?.name || "—"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">₹{order.totalPrice != null ? order.totalPrice : "—"}</p>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs capitalize",
                        order.status === 'delivered' && "text-success border-success/30",
                        order.status === 'pending' && "text-warning border-warning/30",
                        order.status === 'cancelled' && "text-muted-foreground"
                      )}
                    >
                      {order.status || "—"}
                    </Badge>
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
