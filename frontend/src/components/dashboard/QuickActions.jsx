import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Milk, Beef, Users, Warehouse, Layers, ShoppingBag } from 'lucide-react';
import { cn } from '../../lib/utils';

const variantStyles = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  accent: 'bg-accent/10 text-accent-foreground hover:bg-accent/20 border border-accent/30',
};

export function QuickActions() {
  const activeFarm = JSON.parse(localStorage.getItem("activeFarm") || "null");
  const farmId = activeFarm?.id;

  const actions = [
    {
      icon: Milk,
      label: 'Add Milk Entry',
      href: farmId ? `/milk/add/${farmId}` : '/farms',
      variant: 'primary'
    },
    {
      icon: Beef,
      label: 'Add Cattle',
      href: farmId ? `/cattle/add/${farmId}` : '/farms',
      variant: 'secondary'
    },
    {
      icon: Warehouse,
      label: 'Manage Farms',
      href: '/farms',
      variant: 'secondary'
    },
    {
      icon: Layers,
      label: 'Manage Shades',
      href: farmId ? `/farms/${farmId}/sheds` : '/farms',
      variant: 'secondary'
    },
    {
      icon: ShoppingBag,
      label: 'Manage Orders',
      href: farmId ? `/farms/${farmId}/orders` : '/farms',
      variant: 'secondary'
    },
    {
      icon: Users,
      label: 'Subscriptions',
      href: farmId ? `/farms/${farmId}/subscriptions` : '/farms',
      variant: 'secondary'
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="bg-card border border-border rounded-xl p-5 shadow-card"
    >
      <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={action.href + action.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: 0.3 + index * 0.05 }}
            >
              <Link
                to={action.href}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-lg transition-all duration-200",
                  variantStyles[action.variant]
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium text-sm">{action.label}</span>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
