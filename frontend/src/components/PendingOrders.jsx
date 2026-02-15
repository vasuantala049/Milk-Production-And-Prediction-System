import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../api/client";
import { DashboardLayout } from "./layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { motion } from "framer-motion";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

export default function PendingOrders() {
    const { farmId } = useParams();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [processingId, setProcessingId] = useState(null);

    const fetchPendingOrders = async () => {
        try {
            setLoading(true);
            const data = await apiFetch(`/orders/farm/${farmId}/pending`);
            setOrders(data || []);
        } catch (err) {
            setError(err.message || "Failed to load pending orders");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (farmId) {
            fetchPendingOrders();
        }
    }, [farmId]);

    const handleApprove = async (orderId) => {
        setProcessingId(orderId);
        try {
            await apiFetch(`/orders/${orderId}/approve`, { method: "PATCH" });
            alert("Order approved successfully!");
            fetchPendingOrders(); // Refresh list
        } catch (err) {
            alert(err.message || "Failed to approve order");
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (orderId) => {
        if (!confirm("Are you sure you want to reject this order?")) return;

        setProcessingId(orderId);
        try {
            await apiFetch(`/orders/${orderId}/reject`, { method: "PATCH" });
            alert("Order rejected");
            fetchPendingOrders(); // Refresh list
        } catch (err) {
            alert(err.message || "Failed to reject order");
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-display font-bold text-foreground">
                        Pending Orders
                    </h1>
                    <p className="text-muted-foreground">
                        Review and approve buyer milk requests
                    </p>
                </div>

                {loading && <p className="text-muted-foreground">Loading orders...</p>}

                {error && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-md">
                        {error}
                    </div>
                )}

                {!loading && orders.length === 0 && (
                    <Card>
                        <CardContent className="py-10 text-center text-muted-foreground">
                            No pending orders at the moment
                        </CardContent>
                    </Card>
                )}

                {!loading && orders.length > 0 && (
                    <div className="grid gap-4">
                        {orders.map((order, index) => (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-lg">Order #{order.id}</CardTitle>
                                            <Badge variant="outline" className="bg-amber-50 border-amber-200 text-amber-700">
                                                PENDING
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Buyer ID</p>
                                                <p className="font-medium">{order.buyerId}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Quantity</p>
                                                <p className="font-medium">{order.quantity}L</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Session</p>
                                                <p className="font-medium">{order.session}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Order Date</p>
                                                <p className="font-medium">{order.orderDate}</p>
                                            </div>
                                        </div>

                                        {JSON.parse(localStorage.getItem("user") || "{}").role === "FARM_OWNER" && (
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => handleApprove(order.id)}
                                                    disabled={processingId === order.id}
                                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                                                >
                                                    <CheckCircleIcon fontSize="small" className="mr-2" />
                                                    {processingId === order.id ? "Processing..." : "Approve"}
                                                </Button>
                                                <Button
                                                    onClick={() => handleReject(order.id)}
                                                    disabled={processingId === order.id}
                                                    variant="destructive"
                                                    className="flex-1"
                                                >
                                                    <CancelIcon fontSize="small" className="mr-2" />
                                                    Reject
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
