import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../api/client";
import { subscriptionApi } from "../api/subscriptionApi";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useLazyList } from "../hooks/useLazyList";
import { sortOrdersByDateAndPending, sortSubscriptionsByDateAndPending } from "../lib/requestSort";
import { InlineMessage } from "./ui/InlineMessage";
import { InlineConfirmDialog } from "./ui/InlineConfirmDialog";
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
    const { t } = useTranslation();
    const [orders, setOrders] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState({ type: "", text: "" });
    const [processingId, setProcessingId] = useState(null);
    const [activeTab, setActiveTab] = useState("orders");
    const [confirmState, setConfirmState] = useState({
        open: false,
        message: "",
        actionType: "",
        targetId: null,
    });

    const {
        visibleItems: visibleOrders,
        hasMore: hasMoreOrders,
        loadMore: loadMoreOrders,
    } = useLazyList(orders, 6, 6);

    const {
        visibleItems: visibleSubscriptions,
        hasMore: hasMoreSubscriptions,
        loadMore: loadMoreSubscriptions,
    } = useLazyList(subscriptions, 6, 6);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [ordersData, subsData] = await Promise.all([
                apiFetch(`/orders/farm/${farmId}/pending`),
                subscriptionApi.getFarmSubscriptionsByStatus(farmId, "PENDING")
            ]);
            setOrders(sortOrdersByDateAndPending(ordersData || []));
            setSubscriptions(sortSubscriptionsByDateAndPending(subsData || []));
        } catch (err) {
            setError(err.message || t('messages.errorOccurred'));
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
            setMessage({ type: "error", text: err.message || t('messages.errorOccurred') });
        } finally {
            setProcessingId(null);
        }
    };

    const handleRejectOrder = async (orderId) => {
        setProcessingId(orderId);
        try {
            await apiFetch(`/orders/${orderId}/reject`, { method: "PATCH" });
            setOrders(prev => prev.filter(o => o.id !== orderId));
        } catch (err) {
            setMessage({ type: "error", text: err.message || t('messages.errorOccurred') });
        } finally {
            setProcessingId(null);
        }
    };

    const handleApproveSubscription = async (subId) => {
        setProcessingId(subId);
        try {
            await subscriptionApi.approveSubscription(subId, farmId);
            setSubscriptions(prev => prev.filter(s => s.id !== subId));
        } catch (err) {
            setMessage({ type: "error", text: err.message || t('messages.errorOccurred') });
        } finally {
            setProcessingId(null);
        }
    };

    const handleRejectSubscription = async (subId) => {
        setProcessingId(subId);
        try {
            await subscriptionApi.rejectSubscription(subId, farmId);
            setSubscriptions(prev => prev.filter(s => s.id !== subId));
        } catch (err) {
            setMessage({ type: "error", text: err.message || t('messages.errorOccurred') });
        } finally {
            setProcessingId(null);
        }
    };

    const openRejectConfirm = (actionType, targetId, messageText) => {
        setConfirmState({
            open: true,
            message: messageText,
            actionType,
            targetId,
        });
    };

    const handleConfirmReject = async () => {
        if (!confirmState.targetId) return;
        if (confirmState.actionType === "order") {
            await handleRejectOrder(confirmState.targetId);
        } else if (confirmState.actionType === "subscription") {
            await handleRejectSubscription(confirmState.targetId);
        }
        setConfirmState({ open: false, message: "", actionType: "", targetId: null });
    };

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const isOwner = user.role === "FARM_OWNER" || user.userRole === "FARM_OWNER";

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-display font-bold text-foreground tracking-tight">
                        {t('pendingOrders.pendingRequests')}
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        {t('pendingOrders.manageIncoming')}
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
                        {t('pendingOrders.oneTimeOrders')} ({orders.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("subscriptions")}
                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "subscriptions"
                            ? "bg-card text-foreground shadow-sm ring-1 ring-border/50"
                            : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        {t('pendingOrders.subscriptionsTab')} ({subscriptions.length})
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

            <InlineMessage
                type={message.type}
                message={message.text}
                onClose={() => setMessage({ type: "", text: "" })}
            />

            <div className="relative min-h-[400px]">
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                            <p className="text-muted-foreground font-medium animate-pulse">{t('pendingOrders.loadingRequests')}</p>
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
                                    <EmptyState message={t('pendingOrders.noPendingOrders')} />
                                ) : (
                                    visibleOrders.map((order) => (
                                        <RequestCard
                                            key={order.id}
                                            type="order"
                                            data={order}
                                            isOwner={isOwner}
                                            processingId={processingId}
                                            onApprove={handleApproveOrder}
                                            onReject={(id) => openRejectConfirm("order", id, t('pendingOrders.rejectOrderConfirm'))}
                                            t={t}
                                        />
                                    ))
                                )}

                                {hasMoreOrders && (
                                    <div className="flex justify-center">
                                        <Button variant="outline" onClick={loadMoreOrders}>{t('common.loadMore')}</Button>
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="subscriptions-list"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="grid gap-6"
                            >
                                {subscriptions.length === 0 ? (
                                    <EmptyState message={t('pendingOrders.noPendingSubscriptions')} />
                                ) : (
                                    visibleSubscriptions.map((sub) => (
                                        <RequestCard
                                            key={sub.id}
                                            type="subscription"
                                            data={sub}
                                            isOwner={isOwner}
                                            processingId={processingId}
                                            onApprove={handleApproveSubscription}
                                            onReject={(id) => openRejectConfirm("subscription", id, t('pendingOrders.rejectSubConfirm'))}
                                            t={t}
                                        />
                                    ))
                                )}

                                {hasMoreSubscriptions && (
                                    <div className="flex justify-center">
                                        <Button variant="outline" onClick={loadMoreSubscriptions}>{t('common.loadMore')}</Button>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </div>

            <InlineConfirmDialog
                open={confirmState.open}
                title={t('common.confirm')}
                message={confirmState.message}
                confirmLabel={t('pendingOrders.rejectRequest')}
                cancelLabel={t('common.cancel')}
                busy={processingId != null}
                onCancel={() => setConfirmState({ open: false, message: "", actionType: "", targetId: null })}
                onConfirm={handleConfirmReject}
            />
        </div>
    );
}

function RequestCard({ type, data, isOwner, processingId, onApprove, onReject, t }) {
    const isProcessing = processingId === data.id;
    const displayCode = data.displayCode || String(data.id).padStart(6, '0');

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
                                {type === 'order' ? t('pendingOrders.orderId', { id: displayCode }) : t('pendingOrders.subscriptionRequest', { id: displayCode })}
                            </CardTitle>
                            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                                {type === 'order' ? t('pendingOrders.oneTimePurchase') : t('pendingOrders.recurringSubscription')}
                            </p>
                        </div>
                    </div>
                    <Badge variant="outline" className="bg-amber-50 border-amber-200 text-amber-700 font-bold px-3 py-1">
                        {t('pendingOrders.pending')}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="pt-6 pb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                    <DetailItem icon={<Milk size={14} />} label={t('pendingOrders.quantity')}>
                        <span className="font-bold text-foreground">{data.quantity}L</span>
                        {type === 'subscription' && <span className="text-muted-foreground ml-1">{t('pendingOrders.perDay')}</span>}
                    </DetailItem>
                    <DetailItem icon={<Clock size={14} />} label={t('pendingOrders.sessionSlot')}>
                        <span className="font-bold text-foreground">{data.timeSlot || data.session}</span>
                    </DetailItem>
                    <DetailItem icon={<Milk size={14} />} label={t('pendingOrders.milkType')}>
                        <span className="font-bold text-foreground">{data.animalType || t('pendingOrders.any')}</span>
                    </DetailItem>
                    <DetailItem icon={<Calendar size={14} />} label={type === 'order' ? t('pendingOrders.orderDate') : t('pendingOrders.startDate')}>
                        <span className="font-bold text-foreground">{type === 'order' ? data.orderDate : data.startDate}</span>
                    </DetailItem>
                    {type === 'subscription' && (data.buyerAddress || data.buyerCity) && (
                        <DetailItem icon={<User size={14} />} label={t('pendingOrders.buyerAddress')}>
                            <span className="font-bold text-foreground">{data.buyerAddress || '—'}</span>
                            <span className="text-muted-foreground">{data.buyerCity || '—'}</span>
                        </DetailItem>
                    )}
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
                                    <span>{t('pendingOrders.processing')}</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <CheckCircleIcon size={18} />
                                    <span>{type === 'order' ? t('pendingOrders.approveOrder') : t('pendingOrders.approveSubscription')}</span>
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
                                <span>{t('pendingOrders.rejectRequest')}</span>
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
