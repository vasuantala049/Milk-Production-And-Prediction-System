import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Search, Plus, Milk as MilkIcon, Trash2 } from "lucide-react";
import { apiFetch } from "../api/client";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useLazyList } from "../hooks/useLazyList";
import { cn } from "../lib/utils";

export default function CattleList() {
  const { farmId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [cattle, setCattle] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isOwner = user.role === "FARM_OWNER";

  useEffect(() => {
    setLoading(true);
    apiFetch(`/cattle/farm/${farmId}`)
      .then((data) => setCattle(data || []))
      .catch(() => setCattle([]))
      .finally(() => setLoading(false));
  }, [farmId]);

  const cattleTypes = useMemo(() => {
    return Array.from(new Set(cattle.map((entry) => entry.type).filter(Boolean)));
  }, [cattle]);

  const filteredCattle = useMemo(() => {
    return cattle.filter((c) => {
      const matchesSearch =
        c.tagId?.toLowerCase().includes(search.toLowerCase()) ||
        c.breed?.toLowerCase().includes(search.toLowerCase()) ||
        c.name?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        status === "all" || c.status === status;

      const matchesType =
        type === "all" || c.type === type;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [cattle, search, status, type]);

  const {
    visibleItems: visibleCattle,
    hasMore: hasMoreCattle,
    loadMore: loadMoreCattle,
  } = useLazyList(filteredCattle, 9, 9);

  const handleDeleteCattle = async (cattleId) => {
    if (!confirm(t('cattle.deleteConfirm'))) return;

    try {
      await apiFetch(`/cattle/${cattleId}`, { method: "DELETE" });
      setCattle(cattle.filter((c) => c.id !== cattleId));
    } catch (err) {
      alert(err.message || t('cattle.cattleDeletedSuccess'));
    }
  };

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
            {t('cattle.cattleManagement')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('cattle.trackAndManage')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/milk/add/${farmId}`)}
            className="gap-2"
          >
            <MilkIcon className="w-4 h-4" />
            {t('cattle.addMilkButton')}
          </Button>
          {isOwner && (
            <Button onClick={() => navigate(`/cattle/add/${farmId}`)} className="gap-2">
              <Plus className="w-5 h-5" />
              {t('cattle.addCattle')}
            </Button>
          )}
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder={t('cattle.searchByTagOrBreed')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-12"
          />
        </div>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full sm:w-40 h-12">
            <SelectValue placeholder={t('cattle.allStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('cattle.allStatus')}</SelectItem>
            <SelectItem value="ACTIVE">{t('cattle.active')}</SelectItem>
            <SelectItem value="SICK">{t('cattle.sick')}</SelectItem>
            <SelectItem value="INACTIVE">{t('cattle.inactive')}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-full sm:w-44 h-12">
            <SelectValue placeholder={t('cattle.allTypes')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('cattle.allTypes')}</SelectItem>
            {cattleTypes.map((cattleType) => (
              <SelectItem key={cattleType} value={cattleType}>
                {t(`cattle.${cattleType.toLowerCase()}`, cattleType)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* Loading */}
      {loading && (
        <p className="text-muted-foreground">{t('cattle.loadingCattle')}</p>
      )}

      {/* Empty */}
      {!loading && filteredCattle.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-card border border-border rounded-xl p-12 text-center shadow-card"
        >
          <p className="text-muted-foreground">
            {search || status !== "all" || type !== "all" ? t('cattle.noMatchingFilter') : t('cattle.noCattleFound')}
          </p>
        </motion.div>
      )}

      {/* Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {visibleCattle.map((c, index) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + index * 0.03 }}
          >
            <Card
              onClick={() => isOwner && navigate(`/cattle/edit/${farmId}/${c.id}`)}
              className={cn(
                "rounded-xl transition-all",
                isOwner ? "cursor-pointer hover:shadow-elevated hover:border-primary/30" : "cursor-default"
              )}
            >
              <CardContent className="p-5 space-y-4">
                {/* Top Row */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-lg text-foreground">
                      {c.tagId || "—"}
                    </p>
                    {c.name && (
                      <p className="text-sm text-muted-foreground">{c.name}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        c.status === "ACTIVE" && "bg-success/10 border-success/30 text-success",
                        c.status === "SICK" && "bg-destructive/10 border-destructive/30 text-destructive",
                        c.status === "INACTIVE" && "bg-muted border-muted text-muted-foreground"
                      )}
                    >
                      {c.status || "—"}
                    </Badge>

                    {isOwner && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCattle(c.id);
                        }}
                        className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('cattle.type')}</span>
                    <span className="font-medium text-foreground">
                      {c.type || "—"}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('cattle.shed')}</span>
                    <span className="font-medium text-foreground">
                      {c.shed?.name || t('cattle.unassigned')}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('cattle.breedLabel')}</span>
                    <span className="font-medium text-foreground">
                      {c.breed || "—"}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('cattle.age')}</span>
                    <span className="font-medium text-foreground">
                      {c.age != null ? t('cattle.years', { count: c.age }) : "—"}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('cattle.avgMilkDay')}</span>
                    <span className="font-semibold text-foreground">
                      {c.avgMilkPerDay != null ? `${c.avgMilkPerDay.toFixed(2)}L` : "—"}
                    </span>
                  </div>
                </div>

                {/* Footer */}
                {c.farmName && (
                  <div className="pt-3 border-t text-sm text-muted-foreground">
                    {t('cattle.farmLabel')}:{" "}
                    <span className="font-medium text-foreground">
                      {c.farmName}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {!loading && hasMoreCattle && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={loadMoreCattle}>{t('common.loadMore')}</Button>
        </div>
      )}
    </div>
  );
}
