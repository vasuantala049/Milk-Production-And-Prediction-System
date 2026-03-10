import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SubscriptionsList from './SubscriptionsList';
import { Button } from './ui/button';
import { ArrowLeft, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SubscriptionsPage() {
    const { farmId } = useParams();
    const navigate = useNavigate();
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
                        <Users size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">Subscription Management</span>
                    </div>
                    <h1 className="text-3xl font-display font-bold text-foreground">
                        {activeFarm.name || "Farm"} Subscriptions
                    </h1>
                    <p className="text-muted-foreground">
                        View and manage recurring milk subscriptions for this farm
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
                    <h2 className="text-xl font-semibold mb-2">Subscriber List</h2>
                    <p className="text-sm text-muted-foreground italic">
                        * Filters are available at the top of the table for different subscription statuses.
                    </p>
                </div>
                <SubscriptionsList farmId={farmId} initialStatus="ACTIVE" />
            </motion.div>
        </div>
    );
}
