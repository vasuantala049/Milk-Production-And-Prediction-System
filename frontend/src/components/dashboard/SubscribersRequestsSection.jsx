import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { apiFetch } from "../../api/client";
import { subscriptionApi } from "../../api/subscriptionApi";
import { orderApi } from "../../api/orderApi";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import { CheckCircle, XCircle } from "lucide-react";
import { useLazyList } from "../../hooks/useLazyList";
import { sortOrdersByDateAndPending, sortSubscriptionsByDateAndPending } from "../../lib/requestSort";
import { InlineMessage } from "../ui/InlineMessage";
import { useTranslation } from "react-i18next";

export function SubscribersRequestsSection({ farmId }) {
  const { t } = useTranslation();
  const [pendingSubscriptions, setPendingSubscriptions] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });

  const formatTimeSlot = (slot) => {
    if (!slot || typeof slot !== "string") return null;
    const value = slot.trim();
    if (!value) return null;
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(value)) {
      const [h, m] = value.split(":");
      const hour = Number(h);
      const minute = Number(m);
      if (!Number.isNaN(hour) && !Number.isNaN(minute)) {
        const d = new Date();
        d.setHours(hour, minute, 0, 0);
        return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      }
    }
    return value.replace(/_/g, " ");
  };

  const formatSession = (session) => {
    if (!session) return "--";
    if (session === "MORNING") return t('common.morning', { defaultValue: 'Morning' });
    if (session === "EVENING") return t('common.evening', { defaultValue: 'Evening' });
    return String(session);
  };

  const formatOrderTiming = (timeSlot, session) => {
    const formattedSlot = formatTimeSlot(timeSlot);
    if (formattedSlot) return formattedSlot;
    return formatSession(session);
  };

  // Load pending subscriptions
  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const [subscriptions, orders] = await Promise.all([
          subscriptionApi.getFarmSubscriptionsByStatus(farmId, "PENDING"),
          orderApi.getFarmOrders(farmId, 0, 50), // Get all orders and filter for pending
        ]);

        if (!mounted) return;

        setPendingSubscriptions(sortSubscriptionsByDateAndPending(subscriptions));
        // Filter orders to only show PENDING
        const pending = Array.isArray(orders)
          ? orders.filter((o) => o.status === "PENDING")
          : [];
        setPendingOrders(sortOrdersByDateAndPending(pending));
      } catch (err) {
        console.error("Failed to load requests:", err);
        if (!mounted) return;
        setPendingSubscriptions([]);
        setPendingOrders([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (farmId) {
      loadData();
    }

    return () => {
      mounted = false;
    };
  }, [farmId]);

  // Handle approve subscription
  const handleApproveSubscription = async (subscriptionId) => {
    setApprovingId(subscriptionId);
    try {
      await subscriptionApi.approveSubscription(subscriptionId, farmId);
      setPendingSubscriptions((prev) =>
        prev.filter((s) => s.id !== subscriptionId)
      );
    } catch (err) {
      setMessage({ type: "error", text: `${t('pendingOrders.failedApprove')}: ${err.message || t('common.unknownError')}` });
    } finally {
      setApprovingId(null);
    }
  };

  // Handle reject subscription
  const handleRejectSubscription = async (subscriptionId) => {
    setRejectingId(subscriptionId);
    try {
      await subscriptionApi.rejectSubscription(subscriptionId, farmId);
      setPendingSubscriptions((prev) =>
        prev.filter((s) => s.id !== subscriptionId)
      );
    } catch (err) {
      setMessage({ type: "error", text: `${t('pendingOrders.failedReject')}: ${err.message || t('common.unknownError')}` });
    } finally {
      setRejectingId(null);
    }
  };

  // Handle approve order
  const handleApproveOrder = async (orderId) => {
    setApprovingId(orderId);
    try {
      await apiFetch(`/orders/${orderId}/approve`, {
        method: "PATCH",
      });
      setPendingOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (err) {
      setMessage({ type: "error", text: `${t('pendingOrders.failedApprove')}: ${err.message || t('common.unknownError')}` });
    } finally {
      setApprovingId(null);
    }
  };

  // Handle reject order
  const handleRejectOrder = async (orderId) => {
    setRejectingId(orderId);
    try {
      await apiFetch(`/orders/${orderId}/reject`, {
        method: "PATCH",
      });
      setPendingOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (err) {
      setMessage({ type: "error", text: `${t('pendingOrders.failedReject')}: ${err.message || t('common.unknownError')}` });
    } finally {
      setRejectingId(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 shadow-card">
        <p className="text-xs text-muted-foreground">{t('pendingOrders.loadingRequests')}</p>
      </div>
    );
  }

  const totalRequests =
    pendingSubscriptions.length + pendingOrders.length;
  const {
    visibleItems: visibleSubscriptions,
    hasMore: hasMoreSubscriptions,
    loadMore: loadMoreSubscriptions,
  } = useLazyList(pendingSubscriptions, 5, 5);
  const {
    visibleItems: visibleOrders,
    hasMore: hasMoreOrders,
    loadMore: loadMoreOrders,
  } = useLazyList(pendingOrders, 5, 5);

  if (totalRequests === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 shadow-card">
        <h3 className="font-semibold text-foreground text-sm mb-2">
          {t('pendingOrders.pendingRequests')}
        </h3>
        <p className="text-xs text-muted-foreground">
          {t('pendingOrders.noPendingRequestsForFarm')}
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <InlineMessage
        type={message.type}
        message={message.text}
        onClose={() => setMessage({ type: "", text: "" })}
      />

      {/* Subscription Requests */}
      {pendingSubscriptions.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground text-sm">
              {t('pendingOrders.subscriptionRequests')}
            </h3>
            <span className="text-xs text-muted-foreground">
              {t('pendingOrders.pendingCount', { count: pendingSubscriptions.length })}
            </span>
          </div>

          <div className="space-y-2">
            {visibleSubscriptions.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between text-xs border border-border/60 rounded-md px-3 py-2"
              >
                <div className="flex-1">
                  <p className="font-medium text-foreground">
                    #{sub.displayCode || String(sub.id).padStart(6, '0')}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {sub.quantity}L{t('pendingOrders.perDay')} • {formatOrderTiming(sub.timeSlot, sub.session)} • {t('pendingOrders.startDate')}:{" "}
                    {sub.startDate}
                  </p>
                  {(sub.buyerAddress || sub.buyerCity) && (
                    <p className="text-[11px] text-muted-foreground">
                      {[sub.buyerAddress, sub.buyerCity].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <Button
                    size="xs"
                    variant="outline"
                    className="h-6 gap-1 text-xs"
                    disabled={approvingId === sub.id || rejectingId === sub.id}
                    onClick={() => handleApproveSubscription(sub.id)}
                  >
                    {approvingId === sub.id ? (
                      <span>...</span>
                    ) : (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        {t('pendingOrders.approve')}
                      </>
                    )}
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    className="h-6 gap-1 text-xs text-destructive hover:text-destructive"
                    disabled={approvingId === sub.id || rejectingId === sub.id}
                    onClick={() => handleRejectSubscription(sub.id)}
                  >
                    {rejectingId === sub.id ? (
                      <span>...</span>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" />
                        {t('pendingOrders.rejectRequest')}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}

            {hasMoreSubscriptions && (
              <div className="flex justify-center pt-2">
                <Button size="sm" variant="outline" onClick={loadMoreSubscriptions}>
                  {t('common.loadMore')}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* One-Time Buy Requests */}
      {pendingOrders.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground text-sm">
              {t('pendingOrders.oneTimeBuyRequests')}
            </h3>
            <span className="text-xs text-muted-foreground">
              {t('pendingOrders.pendingCount', { count: pendingOrders.length })}
            </span>
          </div>

          <div className="space-y-2">
            {visibleOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between text-xs border border-border/60 rounded-md px-3 py-2"
              >
                <div className="flex-1">
                  <p className="font-medium text-foreground">
                    #{order.displayCode || String(order.id).padStart(6, '0')}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {order.quantity}L • {formatOrderTiming(order.timeSlot, order.session)} • {order.orderDate}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <Button
                    size="xs"
                    variant="outline"
                    className="h-6 gap-1 text-xs"
                    disabled={approvingId === order.id || rejectingId === order.id}
                    onClick={() => handleApproveOrder(order.id)}
                  >
                    {approvingId === order.id ? (
                      <span>...</span>
                    ) : (
                      <>
                        <CheckCircle className="w-3 h-3" />
                        {t('pendingOrders.approve')}
                      </>
                    )}
                  </Button>
                  <Button
                    size="xs"
                    variant="outline"
                    className="h-6 gap-1 text-xs text-destructive hover:text-destructive"
                    disabled={approvingId === order.id || rejectingId === order.id}
                    onClick={() => handleRejectOrder(order.id)}
                  >
                    {rejectingId === order.id ? (
                      <span>...</span>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" />
                        {t('pendingOrders.rejectRequest')}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}

            {hasMoreOrders && (
              <div className="flex justify-center pt-2">
                <Button size="sm" variant="outline" onClick={loadMoreOrders}>
                  {t('common.loadMore')}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
