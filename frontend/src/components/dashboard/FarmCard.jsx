import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MapPin, Beef, Milk, Users, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Loader2 } from 'lucide-react';
import StorefrontIcon from "@mui/icons-material/Storefront";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";

export function FarmCard({ farm, delay = 0, onDelete, onToggleSelling, isToggling = false }) {
  const availabilityPercent = farm.todayMilk > 0
    ? ((farm.availableMilk || 0) / farm.todayMilk) * 100
    : 0;
  const availabilityStatus =
    availabilityPercent > 50 ? 'high' :
      availabilityPercent > 20 ? 'medium' : 'low';

  // Robust check for selling status
  const currentIsSelling = farm.isSelling === true || farm.selling === true;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      onViewportEnter={() => {
        // Log once for each card to help debug if it's missing
        if (delay === 0) console.log(`Farm: ${farm.name}, isSelling:`, farm.isSelling, 'selling:', farm.selling);
      }}
    >
      <div className="block bg-card border border-border rounded-xl p-5 shadow-card hover:shadow-elevated transition-all duration-300 hover:border-primary/30 group">
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-2">
            <div>
              <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                {farm.name || "—"}
              </h3>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                <MapPin className="w-3.5 h-3.5" />
                {farm.address || "No address"}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <Badge
                variant="outline"
                className={cn(
                  "font-medium shadow-sm transition-colors",
                  currentIsSelling
                    ? "border-primary text-primary bg-primary/5"
                    : "border-muted-foreground/30 text-muted-foreground bg-muted/5"
                )}
              >
                {currentIsSelling ? "Selling ON" : "Selling OFF"}
              </Badge>

            </div>
          </div>
          {/* Top right area left empty for YourFarms.jsx action buttons */}
          <div className="w-24 h-8" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Beef className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">{farm.herdCount ?? farm.cattleCount ?? "—"}</p>
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
              <p className="text-lg font-semibold text-foreground">{farm.workerCount ?? "—"}</p>
              <p className="text-xs text-muted-foreground">Workers</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 pt-4 border-t border-border gap-3">
          <div className="text-sm">
            <div className="text-muted-foreground mr-1">Prices:</div>
            <div className="flex flex-col gap-0.5">
              {/* <span className="font-semibold text-foreground">
                Base: {farm.pricePerLiter != null ? `₹${farm.pricePerLiter}/L` : "—"}
              </span> */}
              {farm.cowPrice != null && <span className="text-xs text-muted-foreground">Cow: ₹{farm.cowPrice}/L</span>}
              {farm.buffaloPrice != null && <span className="text-xs text-muted-foreground">Buffalo: ₹{farm.buffaloPrice}/L</span>}
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled={isToggling}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleSelling && onToggleSelling(farm);
            }}
            className={cn(
              "h-8 gap-2 ml-4 px-3 min-w-[120px]",
              currentIsSelling
                ? "border-primary text-primary hover:bg-primary/5"
                : "border-muted-foreground text-muted-foreground hover:bg-muted/5"
            )}
          >
            {isToggling ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : currentIsSelling ? (
              <ShoppingBagIcon sx={{ fontSize: 18 }} />
            ) : (
              <StorefrontIcon sx={{ fontSize: 18 }} />
            )}
            <span className="font-medium">
              {isToggling ? "Updating..." : currentIsSelling ? "Stop Selling" : "Start Selling"}
            </span>
          </Button>

          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all ml-auto" />
        </div>
      </div>
    </motion.div >
  );
}
