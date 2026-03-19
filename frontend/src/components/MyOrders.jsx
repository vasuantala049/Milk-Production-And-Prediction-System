import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client";
import { useTranslation } from "react-i18next";
import { orderApi } from "../api/orderApi";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { motion } from "framer-motion";
import { useLazyList } from "../hooks/useLazyList";
import { cn } from "../lib/utils";
import { sortOrdersByDateAndPending } from "../lib/requestSort";

const loadRazorpayCheckout = () => {
    return new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }

        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

export default function MyOrders() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [processingPaymentId, setProcessingPaymentId] = useState(null);

    const {
        visibleItems: visibleOrders,
        hasMore: hasMoreOrders,
        loadMore: loadMoreOrders,
    } = useLazyList(orders, 8, 8);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                const data = await apiFetch("/orders/my-orders");
                const sortedOrders = sortOrdersByDateAndPending(data);
                setOrders(sortedOrders);
            } catch (err) {
                setError(err.message || t('messages.errorOccurred'));
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case "PENDING":
                return "bg-amber-50 border-amber-200 text-amber-700";
            case "CONFIRMED":
                return "bg-blue-50 border-blue-200 text-blue-700";
            case "COMPLETED":
                return "bg-success/10 border-success/30 text-success";
            case "CANCELLED":
            case "TIMEOUT_REJECTED":
                return "bg-destructive/10 border-destructive/30 text-destructive";
            default:
                return "bg-muted border-muted text-muted-foreground";
        }
    };

    const getStatusMessage = (status) => {
        switch (status) {
            case "PENDING":
                return t('orders.awaitingApproval');
            case "CONFIRMED":
                return t('orders.approvedConfirmed');
            case "COMPLETED":
                return t('orders.delivered');
            case "CANCELLED":
            case "TIMEOUT_REJECTED":
                return t('orders.rejectedCancelled');
            default:
                return "";
        }
    };

    const formatRupees = (value) => {
        const amount = Number(value || 0);
        return `\u20B9${amount.toFixed(2)}`;
    };

    const formatPaidAt = (value) => {
        if (!value) return "";
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return "";
        return parsed.toLocaleString();
    };

    const handlePayOrder = async (order) => {
        setProcessingPaymentId(order.id);
        setError("");
        try {
            const checkoutLoaded = await loadRazorpayCheckout();
            if (!checkoutLoaded) {
                throw new Error("Unable to load Razorpay checkout. Please try again.");
            }

            const paymentOrder = await orderApi.createRazorpayPaymentOrder(order.id);
            const user = JSON.parse(localStorage.getItem("user") || "{}");

            const paidOrder = await new Promise((resolve, reject) => {
                const razorpay = new window.Razorpay({
                    key: paymentOrder.keyId,
                    amount: paymentOrder.amount,
                    currency: paymentOrder.currency || "INR",
                    name: "DairyFlow",
                    description: `Payment for Order #${order.displayCode || String(order.id).padStart(6, "0")}`,
                    order_id: paymentOrder.razorpayOrderId,
                    prefill: {
                        name: user?.name || "",
                        email: user?.email || "",
                    },
                    handler: async (response) => {
                        try {
                            const verified = await orderApi.verifyRazorpayPayment(order.id, {
                                amount: order.totalPrice,
                                razorpayOrderId: response.razorpay_order_id,
                                razorpayPaymentId: response.razorpay_payment_id,
                                razorpaySignature: response.razorpay_signature,
                            });
                            resolve(verified);
                        } catch (verifyError) {
                            reject(verifyError);
                        }
                    },
                    modal: {
                        ondismiss: () => reject(new Error("Payment cancelled")),
                    },
                    theme: {
                        color: "#16a34a",
                    },
                });

                razorpay.on("payment.failed", (response) => {
                    reject(new Error(response?.error?.description || "Payment failed"));
                });

                razorpay.open();
            });

            setOrders((prev) =>
                sortOrdersByDateAndPending(prev.map((o) => (o.id === order.id ? { ...o, ...paidOrder } : o)))
            );
        } catch (err) {
            setError(err.message || t('messages.errorOccurred'));
        } finally {
            setProcessingPaymentId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <Button variant="outline" size="sm" className="mb-3" onClick={() => navigate('/dashboard')}>
                    {t('common.back')}
                </Button>
                <h1 className="text-3xl font-display font-bold text-foreground">
                    {t('orders.myOrdersTitle')}
                </h1>
                <p className="text-muted-foreground">
                    {t('orders.trackPurchase')}
                </p>
            </div>

            {loading && <p className="text-muted-foreground">{t('orders.loadingOrders')}</p>}

            {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-md">
                    {error}
                </div>
            )}

            {!loading && orders.length === 0 && (
                <Card>
                    <CardContent className="py-10 text-center text-muted-foreground">
                        {t('orders.noOrdersYet')}
                    </CardContent>
                </Card>
            )}

            {!loading && orders.length > 0 && (
                <div className="grid gap-4">
                    {visibleOrders.map((order, index) => (
                        <motion.div
                            key={order.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg">{t('orders.orderNumber', { id: order.displayCode || String(order.id).padStart(6, '0') })}</CardTitle>
                                        <Badge
                                            variant="outline"
                                            className={cn(getStatusColor(order.status))}
                                        >
                                            {order.status}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground">{t('farms.farmName')}</p>
                                            <p className="font-medium">{order.farmName || order.farmId}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">{t('orders.quantity')}</p>
                                            <p className="font-medium">{order.quantity}L</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">{t('orders.sessionLabel')}</p>
                                            <p className="font-medium">{order.session}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">{t('orders.orderDate')}</p>
                                            <p className="font-medium">{order.orderDate}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">{t('orders.totalAmount')}</p>
                                            <p className="font-medium">{formatRupees(order.totalPrice)}</p>
                                        </div>
                                    </div>

                                    {order.status === "PENDING" && (
                                        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                                            <p className="text-sm text-amber-800">
                                                ⏳ {getStatusMessage(order.status)}
                                            </p>
                                        </div>
                                    )}

                                    {(order.status === "CANCELLED" || order.status === "TIMEOUT_REJECTED") && (
                                        <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                                            <p className="text-sm text-destructive">
                                                ❌ {getStatusMessage(order.status)}
                                            </p>
                                        </div>
                                    )}

                                    {order.status === "CONFIRMED" && (
                                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                            <p className="text-sm text-blue-800">
                                                ✅ {getStatusMessage(order.status)}
                                            </p>
                                            {order.paid ? (
                                                <div className="mt-2 space-y-1">
                                                    <p className="text-sm font-semibold text-emerald-700">
                                                        {t('orders.paidBadge')}
                                                    </p>
                                                    {order.paidAt && (
                                                        <p className="text-xs text-emerald-700/80">
                                                            {t('orders.paidOn', { date: formatPaidAt(order.paidAt) })}
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                <Button
                                                    className="mt-3"
                                                    onClick={() => handlePayOrder(order)}
                                                    disabled={processingPaymentId === order.id}
                                                >
                                                    {processingPaymentId === order.id
                                                        ? t('orders.processingPayment')
                                                        : `${t('orders.pay')} ${formatRupees(order.totalPrice)}`}
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}

            {!loading && orders.length > 0 && hasMoreOrders && (
                <div className="flex justify-center">
                    <Button variant="outline" onClick={loadMoreOrders}>{t('common.loadMore')}</Button>
                </div>
            )}
        </div>
    );
}
