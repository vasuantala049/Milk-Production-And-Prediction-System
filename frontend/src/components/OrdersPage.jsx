import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import OrdersList from './OrdersList';
import { Button } from './ui/button';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function OrdersPage() {
    const { farmId } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const activeFarm = JSON.parse(localStorage.getItem("activeFarm") || "{}");

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-4"
            >
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/dashboard')}
                    className="rounded-full hover:bg-muted"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <div className="flex items-center gap-2 text-primary mb-1">
                        <ShoppingBag size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">{t('orders.orderManagement')}</span>
                    </div>
                    <h1 className="text-3xl font-display font-bold text-foreground">
                        {t('orders.farmOrdersTitle', { name: activeFarm.name || t('farms.farmName') })}
                    </h1>
                    <p className="text-muted-foreground">
                        {t('orders.viewManageOrders')}
                    </p>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card border border-border rounded-2xl p-6 shadow-sm"
            >
                <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-2">{t('orders.orderHistory')}</h2>
                    <p className="text-sm text-muted-foreground italic">
                        {t('orders.useStatusFilter')}
                    </p>
                </div>
                <OrdersList farmId={farmId} initialStatus="CONFIRMED" />
            </motion.div>
        </div>
    );
}
