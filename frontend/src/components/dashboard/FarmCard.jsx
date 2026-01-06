import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MapPin, Beef, Milk, Users, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';

export function FarmCard({ farm, delay = 0, onDelete }) {
  const availabilityPercent = farm.todayMilk > 0 
    ? ((farm.availableMilk || 0) / farm.todayMilk) * 100 
    : 0;
  const availabilityStatus = 
    availabilityPercent > 50 ? 'high' : 
    availabilityPercent > 20 ? 'medium' : 'low';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <div className="block bg-card border border-border rounded-xl p-5 shadow-card hover:shadow-elevated transition-all duration-300 hover:border-primary/30 group">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
              {farm.name || "—"}
            </h3>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
              <MapPin className="w-3.5 h-3.5" />
              {farm.address || "No address"}
            </div>
          </div>
          {farm.availableMilk != null && farm.todayMilk > 0 && (
            <Badge 
              variant="outline" 
              className={cn(
                "font-medium",
                availabilityStatus === 'high' && "border-success/50 text-success bg-success/10",
                availabilityStatus === 'medium' && "border-warning/50 text-warning bg-warning/10",
                availabilityStatus === 'low' && "border-destructive/50 text-destructive bg-destructive/10"
              )}
            >
              {farm.availableMilk}L available
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Beef className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">{farm.herdCount || farm.cattleCount || "—"}</p>
              <p className="text-xs text-muted-foreground">Cattle</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-success/10">
              <Milk className="w-4 h-4 text-success" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">{farm.todayMilk != null ? `${farm.todayMilk}L` : "—"}</p>
              <p className="text-xs text-muted-foreground">Today</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-accent/10">
              <Users className="w-4 h-4 text-accent" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">{farm.workerCount != null ? farm.workerCount : "—"}</p>
              <p className="text-xs text-muted-foreground">Workers</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <p className="text-sm">
            <span className="text-muted-foreground">Price: </span>
            <span className="font-semibold text-foreground">
              {farm.pricePerLiter != null ? `₹${farm.pricePerLiter}/L` : "—"}
            </span>
          </p>
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    </motion.div>
  );
}
