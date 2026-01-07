import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

const variants = {
  default: "bg-card border-border",
  primary: "bg-primary/5 border-primary/20",
  success: "bg-success/5 border-success/20",
  warning: "bg-warning/5 border-warning/20",
};

const iconVariants = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
  delay = 0,
  onClick
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      onClick={onClick}
      className={cn(
        "rounded-xl border p-5 shadow-card transition",
        variants[variant],
        onClick && "cursor-pointer hover:scale-[1.02] hover:bg-muted"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-display font-bold text-foreground">
            {value}
          </p>

          {subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          )}

          {trend && (
            <div className="mt-2 flex items-center gap-1">
              <span
                className={cn(
                  "text-sm font-medium",
                  trend.isPositive ? "text-success" : "text-destructive"
                )}
              >
                {trend.isPositive ? "+" : ""}
                {trend.value}%
              </span>
              <span className="text-sm text-muted-foreground">
                from yesterday
              </span>
            </div>
          )}
        </div>

        {Icon && (
          <div
            className={cn(
              "p-3 rounded-xl",
              iconVariants[variant]
            )}
          >
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </motion.div>
  );
}
