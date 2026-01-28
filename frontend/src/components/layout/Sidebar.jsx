import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";
import {
  LayoutDashboard,
  Warehouse,
  Milk,
  Users,
  LogOut,
  Menu,
  X,
  Beef,
  ShoppingBag,
} from "lucide-react";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback } from "../ui/avatar";

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const activeFarm = JSON.parse(localStorage.getItem("activeFarm") || "null");

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  const handleCattleClick = () => {
    if (!activeFarm?.id) {
      navigate("/farms");
      return;
    }
    navigate(`/cattle/${activeFarm.id}`);
    setIsMobileOpen(false);
  };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
            <Milk className="w-6 h-6 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-sidebar-foreground">
              DairyFlow
            </h1>
            <p className="text-xs text-sidebar-foreground/60">
              Farm Management
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {/* Dashboard */}
        <Link
          to="/dashboard"
          onClick={() => setIsMobileOpen(false)}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
            "hover:bg-sidebar-accent",
            location.pathname === "/dashboard"
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "text-sidebar-foreground/80"
          )}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="font-medium">Dashboard</span>
        </Link>

        {/* Farms - Visible to ALL */}
        <Link
          to="/farms"
          onClick={() => setIsMobileOpen(false)}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
            "hover:bg-sidebar-accent",
            location.pathname.startsWith("/farms")
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "text-sidebar-foreground/80"
          )}
        >
          <Warehouse className="w-5 h-5" />
          <span className="font-medium">Farms</span>
        </Link>

        {/* Cattle - Hide for CUSTOMER */}
        {user?.role !== "BUYER" && (
          <button
            onClick={handleCattleClick}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left",
              "hover:bg-sidebar-accent",
              location.pathname.startsWith("/cattle")
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/80"
            )}
          >
            <Beef className="w-5 h-5" />
            <span className="font-medium flex-1">Cattle</span>
          </button>
        )}

        {/* My Orders - Visible only to BUYERS */}
        {user?.role === "BUYER" && (
          <Link
            to="/my-orders"
            onClick={() => setIsMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
              "hover:bg-sidebar-accent",
              location.pathname === "/my-orders"
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/80"
            )}
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="font-medium">My Orders</span>
          </Link>
        )}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground font-semibold">
              {user?.name?.charAt(0) ||
                user?.email?.charAt(0) ||
                "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sidebar-foreground truncate">
              {user?.name || user?.email || "User"}
            </p>
            {activeFarm && (
              <p className="text-xs text-sidebar-foreground/60 truncate">
                {activeFarm.name}
              </p>
            )}
          </div>
        </div>

        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-sidebar border-b border-sidebar-border z-40 flex items-center px-4">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2 text-sidebar-foreground hover:bg-sidebar-accent rounded-lg"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2 ml-3">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <Milk className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <span className="font-display font-bold text-sidebar-foreground">
            DairyFlow
          </span>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40"
              onClick={() => setIsMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-[280px] bg-sidebar z-50"
            >
              <button
                onClick={() => setIsMobileOpen(false)}
                className="absolute top-4 right-4 p-2 text-sidebar-foreground hover:bg-sidebar-accent rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
              <NavContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[280px] bg-sidebar border-r border-sidebar-border flex-col z-30">
        <NavContent />
      </aside>
    </>
  );
}
