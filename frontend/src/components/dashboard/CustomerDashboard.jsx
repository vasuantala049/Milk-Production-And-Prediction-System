import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, ShoppingCart, Milk, Clock, CheckCircle, Pause, ChevronRight } from "lucide-react";
import { apiFetch } from "../../api/client";
import { farmApi } from "../../api/farmApi";
import { subscriptionApi } from "../../api/subscriptionApi";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { cn } from "../../lib/utils";
import { sortOrdersByDateAndPending, sortSubscriptionsByDateAndPending } from "../../lib/requestSort";
import { useLazyList } from "../../hooks/useLazyList";
import { useTranslation } from 'react-i18next';
import { InlineMessage } from "../ui/InlineMessage";
import { InlineConfirmDialog } from "../ui/InlineConfirmDialog";

export function CustomerDashboard() {
  const { t } = useTranslation();
  const today = new Date().toISOString().slice(0, 10);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [farms, setFarms] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState(user.address || user.location || "");
  const [city, setCity] = useState(user.city || "");
  const [savingLocation, setSavingLocation] = useState(false);
  const [processingSubscriptionPaymentId, setProcessingSubscriptionPaymentId] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [confirmState, setConfirmState] = useState({
    open: false,
    message: "",
    confirmLabel: "",
    onConfirm: null,
  });

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
        setSubscriptions(sortSubscriptionsByDateAndPending(subsData));
        setOrders(sortOrdersByDateAndPending(ordersData));
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

  const activeSubscriptions = useMemo(
    () => subscriptions.filter((subscription) => subscription.status === 'ACTIVE'),
    [subscriptions]
  );
  const pendingSubscriptions = useMemo(
    () => subscriptions.filter((subscription) => subscription.status === 'PENDING'),
    [subscriptions]
  );
  const farmNameById = useMemo(() => {
    const entries = farms
      .filter((farm) => farm?.id != null && farm?.name)
      .map((farm) => [String(farm.id), farm.name]);
    return new Map(entries);
  }, [farms]);

  const resolveFarmName = (farmId, explicitFarmName) => {
    if (explicitFarmName && explicitFarmName.trim() !== "") return explicitFarmName;
    return farmNameById.get(String(farmId)) || `Farm #${farmId}`;
  };
  const recentOrders = orders.slice(0, 5);

  const {
    visibleItems: visibleActiveSubscriptions,
    hasMore: hasMoreActiveSubscriptions,
    loadMore: loadMoreActiveSubscriptions,
  } = useLazyList(activeSubscriptions, 4, 4);

  const {
    visibleItems: visiblePendingSubscriptions,
    hasMore: hasMorePendingSubscriptions,
    loadMore: loadMorePendingSubscriptions,
  } = useLazyList(pendingSubscriptions, 4, 4);

  const {
    visibleItems: visibleFarms,
    hasMore: hasMoreFarms,
    loadMore: loadMoreFarms,
  } = useLazyList(farms, 6, 6);

  const {
    visibleItems: visibleOrders,
    hasMore: hasMoreOrders,
    loadMore: loadMoreOrders,
  } = useLazyList(orders, 8, 8);

  const formatRupees = (value) => {
    if (value == null || Number.isNaN(Number(value))) return "₹0.00";
    return `₹${Number(value).toFixed(2)}`;
  };

  const openConfirmation = (messageText, onConfirm, confirmLabel = t('common.confirm')) => {
    setConfirmState({
      open: true,
      message: messageText,
      confirmLabel,
      onConfirm,
    });
  };

  const handleDialogConfirm = async () => {
    if (typeof confirmState.onConfirm === "function") {
      await confirmState.onConfirm();
    }
    setConfirmState({ open: false, message: "", confirmLabel: "", onConfirm: null });
  };

  async function handleSaveLocation() {
    if (!user?.id || !address || !city) return;
    try {
      setSavingLocation(true);
      await apiFetch(`/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ address, city, location: address }),
      });

      const updatedUser = { ...user, address, city, location: address };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      window.location.reload();
    } catch (e) {
      setMessage({ type: "error", text: e.message || t('dashboard.failedSaveAddressCity') });
    } finally {
      setSavingLocation(false);
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
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t('dashboard.yourAddress')}
                className="h-8 w-52"
              />
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder={t('dashboard.yourCity')}
                className="h-8 w-40"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={savingLocation || !address || !city}
              onClick={handleSaveLocation}
            >
              {savingLocation ? t('dashboard.saving') : t('dashboard.saveAddressCity')}
            </Button>
          </div>
        </div>
        <Button onClick={() => navigate("/buy-milk")} className="gap-2">
          <ShoppingCart className="w-5 h-5" />
          {t('dashboard.buyMilk')}
        </Button>
      </motion.div>

      <InlineMessage
        type={message.type}
        message={message.text}
        onClose={() => setMessage({ type: "", text: "" })}
      />
      
      {/* Active Subscriptions */}
      {activeSubscriptions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-5 shadow-card"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">{t('dashboard.activeSubscriptions')}</h3>
          </div>

          <div className="space-y-3">
            {visibleActiveSubscriptions.map((sub) => {
              const farmName = resolveFarmName(sub.farmId, sub.farmName);
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
                      <p className="font-medium text-foreground">{farmName}</p>
                      <p className="text-sm text-muted-foreground">
                        #{sub.displayCode || String(sub.id).padStart(6, '0')} • {sub.quantity || "—"}L/day • {sub.session}
                      </p>
                      <p className="text-xs mt-1 text-muted-foreground">
                        {t('subscriptions.billingDays')}: <span className="font-semibold text-foreground">{sub.billingDayCounter || 0}/{sub.maxBillingDays || 30}</span>
                      </p>
                      {sub.paymentRequired && (
                        <p className="text-xs mt-1 text-emerald-700 font-medium">
                          {t('subscriptions.paymentDue')}: {formatRupees(sub.billingAmountDue)}
                        </p>
                      )}
                      {sub.skipDate === today && (
                        <p className="text-xs text-amber-600 mt-1">{t('subscriptions.skippedToday')}</p>
                      )}
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
                        <><CheckCircle className="w-3 h-3 mr-1" /> {t('common.active')}</>
                      ) : (
                        <><Pause className="w-3 h-3 mr-1" /> {t('common.paused')}</>
                      )}
                    </Badge>

                    {sub.status === 'ACTIVE' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={sub.skipDate === today || sub.paymentRequired}
                          onClick={() => {
                            openConfirmation(t('subscriptions.skipTodayConfirm'), async () => {
                              try {
                                const updated = await subscriptionApi.skipToday(sub.id);
                                setSubscriptions(prev => sortSubscriptionsByDateAndPending(prev.map(s => s.id === sub.id ? updated : s)));
                              } catch (e) {
                                setMessage({ type: "error", text: `${t('subscriptions.skipTodayFailed')}: ${e.message}` });
                              }
                            }, t('subscriptions.skipToday'));
                          }}
                        >
                          {sub.skipDate === today ? t('subscriptions.skippedToday') : t('subscriptions.skipToday')}
                        </Button>
                        {sub.paymentRequired && (
                          <Button
                            variant="default"
                            size="sm"
                            disabled={processingSubscriptionPaymentId === sub.id}
                            onClick={() => {
                              openConfirmation(
                                t('subscriptions.payCycleConfirm', { amount: formatRupees(sub.billingAmountDue) }),
                                async () => {
                                  try {
                                    setProcessingSubscriptionPaymentId(sub.id);
                                    const updated = await subscriptionApi.payCycle(sub.id, sub.billingAmountDue);
                                    setSubscriptions(prev => sortSubscriptionsByDateAndPending(prev.map(s => s.id === sub.id ? updated : s)));
                                  } catch (e) {
                                    setMessage({ type: "error", text: `${t('subscriptions.payCycleFailed')}: ${e.message}` });
                                  } finally {
                                    setProcessingSubscriptionPaymentId(null);
                                  }
                                },
                                t('subscriptions.payNow', { amount: formatRupees(sub.billingAmountDue) })
                              );
                            }}
                          >
                            {processingSubscriptionPaymentId === sub.id
                              ? t('subscriptions.processingPayment')
                              : t('subscriptions.payNow', { amount: formatRupees(sub.billingAmountDue) })}
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            const hasOutstandingAmount = Number(sub.billingAmountDue || 0) > 0;
                            const confirmMessage = hasOutstandingAmount
                              ? t('subscriptions.cancelWithPaymentConfirm', { amount: formatRupees(sub.billingAmountDue) })
                              : t('subscriptions.cancelConfirm');

                            openConfirmation(confirmMessage, async () => {
                              try {
                                const updated = await subscriptionApi.cancelSubscription(
                                  sub.id,
                                  hasOutstandingAmount ? sub.billingAmountDue : null
                                );
                                setSubscriptions(prev => sortSubscriptionsByDateAndPending(prev.map(s => s.id === sub.id ? updated : s)));
                              } catch (e) {
                                setMessage({ type: "error", text: `${t('subscriptions.cancelFailed')}: ${e.message}` });
                              }
                            }, t('common.cancel'));
                          }}
                        >
                          {t('common.cancel')}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {hasMoreActiveSubscriptions && (
            <div className="flex justify-center mt-4">
              <Button variant="outline" onClick={loadMoreActiveSubscriptions}>{t('common.loadMore')}</Button>
            </div>
          )}
        </motion.div>
      )}

      {/* Pending Subscriptions */}
      {pendingSubscriptions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card border border-border rounded-xl p-5 shadow-card"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">{t('common.pending')} {t('subscriptions.subscriptions')}</h3>
          </div>

          <div className="space-y-3">
            {visiblePendingSubscriptions.map((sub) => {
              const farmName = resolveFarmName(sub.farmId, sub.farmName);
              return (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-warning/10">
                      <Clock className="w-5 h-5 text-warning" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{farmName}</p>
                      <p className="text-sm text-muted-foreground">
                        #{sub.displayCode || String(sub.id).padStart(6, '0')} • {sub.quantity || "—"}L/day • {sub.session}
                      </p>
                      <p className="text-xs mt-1 text-amber-700 font-medium">{t('orders.awaitingApproval')}</p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-warning/10 border-warning/30 text-warning"
                  >
                    <Clock className="w-3 h-3 mr-1" /> {t('common.pending')}
                  </Badge>
                </div>
              );
            })}
          </div>

          {hasMorePendingSubscriptions && (
            <div className="flex justify-center mt-4">
              <Button variant="outline" onClick={loadMorePendingSubscriptions}>{t('common.loadMore')}</Button>
            </div>
          )}
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
            <h3 className="font-semibold text-foreground">{t('dashboard.availableFarms')}</h3>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleFarms.map((farm, index) => (
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
                      {farm.city && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {farm.city}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex flex-wrap gap-2 mt-0.5">
                        {farm.cowPrice != null && farm.cowPrice > 0 && (
                          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{t('cattle.cow')}: ₹{farm.cowPrice}</span>
                        )}
                        {farm.buffaloPrice != null && farm.buffaloPrice > 0 && (
                          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{t('cattle.buffalo')}: ₹{farm.buffaloPrice}</span>
                        )}
                        {farm.sheepPrice != null && farm.sheepPrice > 0 && (
                          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{t('cattle.sheep')}: ₹{farm.sheepPrice}</span>
                        )}
                        {farm.goatPrice != null && farm.goatPrice > 0 && (
                          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{t('cattle.goat')}: ₹{farm.goatPrice}</span>
                        )}
                        {farm.pricePerLiter != null && farm.pricePerLiter > 0 && (
                          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{t('dashboard.basePrice')}: ₹{farm.pricePerLiter}</span>
                        )}
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

          {hasMoreFarms && (
            <div className="flex justify-center mt-4">
              <Button variant="outline" onClick={loadMoreFarms}>{t('common.loadMore')}</Button>
            </div>
          )}
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
            <h3 className="font-semibold text-foreground">{t('dashboard.myOrders')}</h3>
            <span className="text-xs text-muted-foreground">{t('dashboard.totalSubs', { count: orders.length })}</span>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {visibleOrders.map((order) => {
              const farmName = resolveFarmName(order.farmId, order.farmName);
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
                      order.status === "TIMEOUT_REJECTED" && "bg-red-50 text-red-700 border border-red-200",
                      order.status === "COMPLETED" && "bg-blue-50 text-blue-700 border border-blue-200",
                    )}>
                      {order.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-muted-foreground">
                    <span>#{order.displayCode || String(order.id).padStart(6, '0')}</span>
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

          {hasMoreOrders && (
            <div className="flex justify-center mt-4">
              <Button variant="outline" onClick={loadMoreOrders}>{t('common.loadMore')}</Button>
            </div>
          )}
        </motion.div>
      )}

      {farms.length === 0 && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-card border border-border rounded-xl p-12 text-center shadow-card"
        >
          <p className="text-muted-foreground">{t('dashboard.noFarmsAvailable')}</p>
        </motion.div>
      )}

      <InlineConfirmDialog
        open={confirmState.open}
        title={t('common.confirm')}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel || t('common.confirm')}
        cancelLabel={t('common.cancel')}
        busy={processingSubscriptionPaymentId != null}
        onCancel={() => setConfirmState({ open: false, message: "", confirmLabel: "", onConfirm: null })}
        onConfirm={handleDialogConfirm}
      />
    </div>
  );
}
