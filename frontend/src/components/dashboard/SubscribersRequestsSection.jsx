import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { apiFetch } from "../../api/client";
import { subscriptionApi } from "../../api/subscriptionApi";
import { orderApi } from "../../api/orderApi";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import { CheckCircle, XCircle } from "lucide-react";

export function SubscribersRequestsSection({ farmId }) {
  const [pendingSubscriptions, setPendingSubscriptions] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);

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

        setPendingSubscriptions(Array.isArray(subscriptions) ? subscriptions : []);
        // Filter orders to only show PENDING
        const pending = Array.isArray(orders)
          ? orders.filter((o) => o.status === "PENDING")
          : [];
        setPendingOrders(pending);
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
      await subscriptionApi.approveSubscription(subscriptionId);
      setPendingSubscriptions((prev) =>
        prev.filter((s) => s.id !== subscriptionId)
      );
    } catch (err) {
      alert("Failed to approve: " + (err.message || "Unknown error"));
    } finally {
      setApprovingId(null);
    }
  };

  // Handle reject subscription
  const handleRejectSubscription = async (subscriptionId) => {
    setRejectingId(subscriptionId);
    try {
      await subscriptionApi.rejectSubscription(subscriptionId);
      setPendingSubscriptions((prev) =>
        prev.filter((s) => s.id !== subscriptionId)
      );
    } catch (err) {
      alert("Failed to reject: " + (err.message || "Unknown error"));
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
      alert("Failed to approve: " + (err.message || "Unknown error"));
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
      alert("Failed to reject: " + (err.message || "Unknown error"));
    } finally {
      setRejectingId(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 shadow-card">
        <p className="text-xs text-muted-foreground">Loading requests...</p>
      </div>
    );
  }

  const totalRequests =
    pendingSubscriptions.length + pendingOrders.length;

  if (totalRequests === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 shadow-card">
        <h3 className="font-semibold text-foreground text-sm mb-2">
          Pending Requests
        </h3>
        <p className="text-xs text-muted-foreground">
          No pending requests for this farm.
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
      {/* Subscription Requests */}
      {pendingSubscriptions.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground text-sm">
              Subscription Requests
            </h3>
            <span className="text-xs text-muted-foreground">
              {pendingSubscriptions.length} pending
            </span>
          </div>

          <div className="space-y-2">
            {pendingSubscriptions.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between text-xs border border-border/60 rounded-md px-3 py-2"
              >
                <div className="flex-1">
                  <p className="font-medium text-foreground">
                    {sub.buyerName || `Buyer #${sub.buyerId}`}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {sub.quantity}L/day • {sub.session} • Start:{" "}
                    {sub.startDate}
                  </p>
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
                        Approve
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
                        Reject
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* One-Time Buy Requests */}
      {pendingOrders.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground text-sm">
              One-Time Buy Requests
            </h3>
            <span className="text-xs text-muted-foreground">
              {pendingOrders.length} pending
            </span>
          </div>

          <div className="space-y-2">
            {pendingOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between text-xs border border-border/60 rounded-md px-3 py-2"
              >
                <div className="flex-1">
                  <p className="font-medium text-foreground">
                    {order.buyerName || `Buyer #${order.buyerId}`}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {order.quantity}L • {order.session} • {order.orderDate}
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
                        Approve
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
                        Reject
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
