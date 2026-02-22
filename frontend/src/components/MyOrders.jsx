import React, { useState, useEffect } from "react";
import { apiFetch } from "../api/client";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { motion } from "framer-motion";
import { cn } from "../lib/utils";

export default function MyOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                const data = await apiFetch("/orders/my-orders");
                setOrders(data || []);
            } catch (err) {
                setError(err.message || "Failed to load orders");
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
                return "bg-destructive/10 border-destructive/30 text-destructive";
            default:
                return "bg-muted border-muted text-muted-foreground";
        }
    };

    const getStatusMessage = (status) => {
        switch (status) {
            case "PENDING":
                return "Awaiting farm owner approval";
            case "CONFIRMED":
                return "Approved and confirmed";
            case "COMPLETED":
                return "Delivered";
            case "CANCELLED":
                return "Rejected or cancelled";
            default:
                return "";
        }
    };

    return (

            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-display font-bold text-foreground">
                        My Orders
                    </h1>
                    <p className="text-muted-foreground">
                        Track your milk purchase orders
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
                            No orders yet. Start by buying milk from a farm!
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
                                                <p className="text-sm text-muted-foreground">Farm ID</p>
                                                <p className="font-medium">{order.farmId}</p>
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

                                        {order.status === "PENDING" && (
                                            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                                                <p className="text-sm text-amber-800">
                                                    ⏳ {getStatusMessage(order.status)}
                                                </p>
                                            </div>
                                        )}

                                        {order.status === "CANCELLED" && (
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
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

    );
}
