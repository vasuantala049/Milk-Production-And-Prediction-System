import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../api/client";
import { subscriptionApi } from "../api/subscriptionApi";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircle as CheckCircleIcon,
    XCircle as CancelIcon,
    Calendar,
    Clock,
    User,
    Milk,
    Info
} from "lucide-react";

export default function PendingOrders() {
    const { farmId } = useParams();
    const [orders, setOrders] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [processingId, setProcessingId] = useState(null);
    const [activeTab, setActiveTab] = useState("orders");

    const fetchData = async () => {
        try {
            setLoading(true);
            const [ordersData, subsData] = await Promise.all([
                apiFetch(`/orders/farm/${farmId}/pending`),
                subscriptionApi.getFarmSubscriptionsByStatus(farmId, "PENDING")
            ]);
            setOrders(ordersData || []);
            setSubscriptions(subsData || []);
        } catch (err) {
            setError(err.message || "Failed to load pending requests");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (farmId) {
            fetchData();
        }
    }, [farmId]);

    const handleApproveOrder = async (orderId) => {
        setProcessingId(orderId);
        try {
            await apiFetch(`/orders/${orderId}/approve`, { method: "PATCH" });
            setOrders(prev => prev.filter(o => o.id !== orderId));
        } catch (err) {
            alert(err.message || "Failed to approve order");
        } finally {
            setProcessingId(null);
        }
    };

    const handleRejectOrder = async (orderId) => {
        if (!confirm("Are you sure you want to reject this order?")) return;
        setProcessingId(orderId);
        try {
            await apiFetch(`/orders/${orderId}/reject`, { method: "PATCH" });
            setOrders(prev => prev.filter(o => o.id !== orderId));
        } catch (err) {
            alert(err.message || "Failed to reject order");
        } finally {
            setProcessingId(null);
        }
    };

    const handleApproveSubscription = async (subId) => {
        setProcessingId(subId);
        try {
            await subscriptionApi.approveSubscription(subId);
            setSubscriptions(prev => prev.filter(s => s.id !== subId));
        } catch (err) {
            alert(err.message || "Failed to approve subscription");
        } finally {
            setProcessingId(null);
        }
    };

    const handleRejectSubscription = async (subId) => {
        if (!confirm("Are you sure you want to reject this subscription?")) return;
        setProcessingId(subId);
        try {
            await subscriptionApi.rejectSubscription(subId);
            setSubscriptions(prev => prev.filter(s => s.id !== subId));
        } catch (err) {
            alert(err.message || "Failed to reject subscription");
        } finally {
            setProcessingId(null);
        }
    };

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const isOwner = user.role === "FARM_OWNER" || user.userRole === "FARM_OWNER";

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-display font-bold text-foreground tracking-tight">
                        Pending Requests
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        Manage your incoming milk orders and subscription requests
                    </p>
                </div>
                <div className="flex bg-muted/50 p-1 rounded-xl border border-border/50">
                    <button
                        onClick={() => setActiveTab("orders")}
                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "orders"
                                ? "bg-card text-foreground shadow-sm ring-1 ring-border/50"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        One-Time ({orders.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("subscriptions")}
                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "subscriptions"
                                ? "bg-card text-foreground shadow-sm ring-1 ring-border/50"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        Subscriptions ({subscriptions.length})
                    </button>
                </div>
            </header>

            {error && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-destructive/5 border border-destructive/20 text-destructive p-4 rounded-xl flex items-center gap-3"
                >
                    <Info className="w-5 h-5" />
                    <p className="font-medium">{error}</p>
                </motion.div>
            )}

            <div className="relative min-h-[400px]">
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                            <p className="text-muted-foreground font-medium animate-pulse">Loading requests...</p>
                        </div>
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        {activeTab === "orders" ? (
                            <motion.div
                                key="orders-list"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="grid gap-6"
                            >
                                {orders.length === 0 ? (
                                    <EmptyState message="No pending one-time orders found" />
                                ) : (
                                    orders.map((order) => (
                                        <RequestCard
                                            key={order.id}
                                            type="order"
                                            data={order}
                                            isOwner={isOwner}
                                            processingId={processingId}
                                            onApprove={handleApproveOrder}
                                            onReject={handleRejectOrder}
                                        />
                                    ))
                                )}</motion.div>
                        ) : (
                            <motion.div
                                key="subscriptions-list"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="grid gap-6"
                            >
                                {subscriptions.length === 0 ? (
                                    <EmptyState message="No pending subscription requests found" />
                                ) : (
                                    subscriptions.map((sub) => (
                                        <RequestCard
                                            key={sub.id}
                                            type="subscription"
                                            data={sub}
                                            isOwner={isOwner}
                                            processingId={processingId}
                                            onApprove={handleApproveSubscription}
                                            onReject={handleRejectSubscription}
                                        />
                                    ))
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}

function RequestCard({ type, data, isOwner, processingId, onApprove, onReject }) {
    const isProcessing = processingId === data.id;

    return (
        <Card className="overflow-hidden border-border/60 hover:border-primary/20 transition-colors group">
            <CardHeader className="bg-muted/30 border-b border-border/40 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${type === 'order' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                            {type === 'order' ? <Clock size={18} /> : <Calendar size={18} />}
                        </div>
                        <div>
                            <CardTitle className="text-base font-bold">
                                {type === 'order' ? `Order #${data.id}` : `Subscription Request #${data.id}`}
                            </CardTitle>
                            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                                {type === 'order' ? 'One-Time Purchase' : 'Recurring Subscription'}
                            </p>
                        </div>
                    </div>
                    <Badge variant="outline" className="bg-amber-50 border-amber-200 text-amber-700 font-bold px-3 py-1">
                        PENDING
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="pt-6 pb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                    <DetailItem icon={<User size={14} />} label="Buyer Details">
                        <span className="font-bold text-foreground">
                            {data.buyerName || data.buyerEmail || `ID: ${data.buyerId}`}
                        </span>
                    </DetailItem>
                    <DetailItem icon={<Milk size={14} />} label="Quantity">
                        <span className="font-bold text-foreground">{data.quantity}L</span>
                        {type === 'subscription' && <span className="text-muted-foreground ml-1">/ day</span>}
                    </DetailItem>
                    <DetailItem icon={<Clock size={14} />} label="Session Slot">
                        <span className="font-bold text-foreground">{data.session}</span>
                    </DetailItem>
                    <DetailItem icon={<Calendar size={14} />} label={type === 'order' ? "Order Date" : "Start Date"}>
                        <span className="font-bold text-foreground">{type === 'order' ? data.orderDate : data.startDate}</span>
                    </DetailItem>
                </div>

                {isOwner && (
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border/40">
                        <Button
                            onClick={() => onApprove(data.id)}
                            disabled={isProcessing}
                            className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all active:scale-[0.98]"
                        >
                            {isProcessing ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Processing...</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <CheckCircleIcon size={18} />
                                    <span>Approve {type === 'order' ? 'Order' : 'Subscription'}</span>
                                </div>
                            )}
                        </Button>
                        <Button
                            onClick={() => onReject(data.id)}
                            disabled={isProcessing}
                            variant="outline"
                            className="flex-1 h-12 border-destructive/20 text-destructive hover:bg-destructive hover:text-white font-bold rounded-xl transition-all active:scale-[0.98]"
                        >
                            <div className="flex items-center gap-2">
                                <CancelIcon size={18} />
                                <span>Reject Request</span>
                            </div>
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function DetailItem({ icon, label, children }) {
    return (
        <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-muted-foreground">
                {icon}
                <span className="text-xs font-semibold uppercase tracking-tight">{label}</span>
            </div>
            <div className="text-sm flex flex-col">{children}</div>
        </div>
    );
}

function EmptyState({ message }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 bg-muted/20 border border-dashed border-border/60 rounded-3xl"
        >
            <div className="p-4 bg-muted rounded-full mb-4">
                <Info size={32} className="text-muted-foreground/60" />
            </div>
            <p className="text-muted-foreground font-medium text-lg">{message}</p>
        </motion.div>
    );
}
