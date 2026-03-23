import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { apiFetch } from "../api/client";
import { farmApi } from "../api/farmApi";
import { FarmCard } from "./dashboard/FarmCard";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useLazyList } from "../hooks/useLazyList";
import { InlineMessage } from "./ui/InlineMessage";
import { InlineConfirmDialog } from "./ui/InlineConfirmDialog";

import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import DeleteIcon from "@mui/icons-material/Delete";
import PeopleIcon from "@mui/icons-material/People";
import EditIcon from "@mui/icons-material/Edit";
import ReceiptIcon from "@mui/icons-material/Receipt";
import StorefrontIcon from "@mui/icons-material/Storefront";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import LayersIcon from "@mui/icons-material/Layers";

export default function YourFarms() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [area, setArea] = useState("");
  const [togglingFarms, setTogglingFarms] = useState(new Set());
  const [message, setMessage] = useState({ type: "", text: "" });
  const [deleteFarmId, setDeleteFarmId] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      setError(t('farms.loggedInRequired'));
      setLoading(false);
      return;
    }
    const storedUserObj = JSON.parse(storedUser);

    async function loadFarms() {
      try {
        setLoading(true);
        setError("");

        let list = [];
        if (storedUserObj.role === "BUYER") {
          list = await farmApi.getAllFarms(area);
        } else {
          list = await farmApi.getMyFarms();
        }

        list = list || [];
        setFarms(list);

        if (list.length > 0 && !localStorage.getItem("activeFarm") && storedUserObj.role !== "BUYER") {
          localStorage.setItem("activeFarm", JSON.stringify(list[0]));
        }
      } catch (err) {
        setError(err.message || t('messages.errorOccurred'));
      } finally {
        setLoading(false);
      }
    }

    loadFarms();
  }, [area]);

  const handleViewFarm = (farm) => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user.role === "BUYER") {
      navigate(`/buy-milk?farm=${farm.id}`);
      return;
    }
    localStorage.setItem("activeFarm", JSON.stringify(farm));
    navigate("/dashboard");
  };

  const handleDeleteFarm = async (farmId) => {
    try {
      await apiFetch(`/farms/${farmId}`, { method: "DELETE" });
      setFarms((prev) => prev.filter((f) => f.id !== farmId));
      setMessage({ type: "success", text: t('farms.farmDeletedSuccess') });
    } catch (err) {
      setMessage({ type: "error", text: err.message || t('messages.errorOccurred') });
    } finally {
      setDeleteFarmId(null);
    }
  };

  const handleToggleSelling = async (farm) => {
    if (togglingFarms.has(farm.id)) return;

    try {
      setTogglingFarms(prev => new Set(prev).add(farm.id));
      const currentStatus = farm.isSelling === true || farm.selling === true;
      const newStatus = !currentStatus;

      await apiFetch(`/farms/${farm.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isSelling: newStatus }),
      });
      setFarms((prev) =>
        prev.map((f) => (f.id === farm.id ? { ...f, isSelling: newStatus, selling: newStatus } : f))
      );
    } catch (err) {
      setMessage({ type: "error", text: err.message || t('messages.errorOccurred') });
    } finally {
      setTogglingFarms(prev => {
        const next = new Set(prev);
        next.delete(farm.id);
        return next;
      });
    }
  };

  const filteredFarms = useMemo(
    () => farms.filter(
      (farm) =>
        farm.name?.toLowerCase().includes(search.toLowerCase()) ||
        farm.address?.toLowerCase().includes(search.toLowerCase()) ||
        farm.city?.toLowerCase().includes(search.toLowerCase())
    ),
    [farms, search]
  );

  const {
    visibleItems: visibleFarms,
    hasMore: hasMoreFarms,
    loadMore: loadMoreFarms,
  } = useLazyList(filteredFarms, 6, 6);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
            {t('farms.farmsTitle')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {user.role === 'BUYER' ? t('farms.findFreshMilk') : t('farms.manageFarmsSubtitle')}
          </p>
        </div>

        {user.role === "FARM_OWNER" && (
          <Button onClick={() => navigate("/farms/add")} className="gap-2">
            <AddIcon fontSize="small" />
            {t('farms.addFarm')}
          </Button>
        )}
      </motion.div>

      <InlineMessage
        type={message.type}
        message={message.text}
        onClose={() => setMessage({ type: "", text: "" })}
      />

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3 max-w-3xl"
      >
        {user.role === "BUYER" && (
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('farms.searchByArea')}
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
        )}
        <div className="flex-1 relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('farms.searchFarms')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-12"
          />
        </div>
      </motion.div>

      {/* Loading / Error */}
      {loading && <p className="text-muted-foreground">{t('farms.loadingFarms')}</p>}

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-md">
          {error}
        </div>
      )}

      {/* Farms Grid */}
      {!loading && filteredFarms.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleFarms.map((farm, index) => (
            <motion.div
              key={farm.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + index * 0.05 }}
              className="relative group"
            >
              <div
                onClick={() => handleViewFarm(farm)}
                className="cursor-pointer"
              >
                <FarmCard
                  farm={farm}
                  onToggleSelling={user.role === "FARM_OWNER" ? () => handleToggleSelling(farm) : undefined}
                  isToggling={togglingFarms.has(farm.id)}
                />
              </div>

              {user.role === "FARM_OWNER" && (
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (farm.id) navigate(`/edit-farm/${farm.id}`);
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <EditIcon fontSize="small" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/workers/${farm.id}`);
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <PeopleIcon fontSize="small" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/farms/${farm.id}/pending-orders`);
                    }}
                    className="h-8 w-8 p-0"
                    title={t('orders.pendingOrders')}
                  >
                    <ReceiptIcon fontSize="small" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/farms/${farm.id}/sheds`);
                    }}
                    className="h-8 w-8 p-0"
                    title={t('dashboard.manageSheds')}
                  >
                    <LayersIcon fontSize="small" />
                  </Button>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteFarmId(farm.id);
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <DeleteIcon fontSize="small" />
                  </Button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {!loading && filteredFarms.length > 0 && hasMoreFarms && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={loadMoreFarms}>{t('common.loadMore')}</Button>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredFarms.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-card border border-border rounded-xl p-12 text-center shadow-card"
        >
          <p className="text-muted-foreground">
            {search ? t('farms.noMatchSearch') : t('farms.noFarmsYet')}
          </p>
        </motion.div>
      )}

      <InlineConfirmDialog
        open={deleteFarmId != null}
        title={t('common.confirm')}
        message={t('farms.deleteFarmConfirm')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onCancel={() => setDeleteFarmId(null)}
        onConfirm={() => deleteFarmId != null && handleDeleteFarm(deleteFarmId)}
      />
    </div>
  );
}
