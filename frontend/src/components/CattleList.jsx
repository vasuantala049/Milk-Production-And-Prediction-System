import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Plus, Milk as MilkIcon, Trash2 } from "lucide-react";
import { apiFetch } from "../api/client";
import { DashboardLayout } from "./layout/DashboardLayout";
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
import { cn } from "../lib/utils";

export default function CattleList() {
  const { farmId } = useParams();
  const navigate = useNavigate();

  const [cattle, setCattle] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isOwner = user.role === "FARM_OWNER";

  useEffect(() => {
    setLoading(true);
    apiFetch(`/cattle/farm/${farmId}`)
      .then((data) => setCattle(data || []))
      .catch(() => setCattle([]))
      .finally(() => setLoading(false));
  }, [farmId]);

  const filteredCattle = useMemo(() => {
    return cattle.filter((c) => {
      const matchesSearch =
        c.tagId?.toLowerCase().includes(search.toLowerCase()) ||
        c.breed?.toLowerCase().includes(search.toLowerCase()) ||
        c.name?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        status === "all" || c.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [cattle, search, status]);

  const handleDeleteCattle = async (cattleId) => {
    if (!confirm("Are you sure you want to delete this cattle?")) return;

    try {
      await apiFetch(`/cattle/${cattleId}`, { method: "DELETE" });
      setCattle(cattle.filter((c) => c.id !== cattleId));
    } catch (err) {
      alert(err.message || "Failed to delete cattle");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
              Cattle Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Track and manage your cattle
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(`/milk/add/${farmId}`)}
              className="gap-2"
            >
              <MilkIcon className="w-4 h-4" />
              Add Milk
            </Button>
            {isOwner && (
              <Button onClick={() => navigate(`/cattle/add/${farmId}`)} className="gap-2">
                <Plus className="w-5 h-5" />
                Add Cattle
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
              placeholder="Search by tag ID, name, or breed..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-12"
            />
          </div>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-40 h-12">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="SICK">Sick</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Loading */}
        {loading && (
          <p className="text-muted-foreground">Loading cattle…</p>
        )}

        {/* Empty */}
        {!loading && filteredCattle.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-card border border-border rounded-xl p-12 text-center shadow-card"
          >
            <p className="text-muted-foreground">
              {search || status !== "all" ? "No cattle found matching your filters." : "No cattle found."}
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
          {filteredCattle.map((c, index) => (
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
                      <span className="text-muted-foreground">Type</span>
                      <span className="font-medium text-foreground">
                        {c.type || "—"}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Breed</span>
                      <span className="font-medium text-foreground">
                        {c.breed || "—"}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Age</span>
                      <span className="font-medium text-foreground">
                        {c.age != null ? `${c.age} years` : "—"}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avg. Milk/Day</span>
                      <span className="font-semibold text-foreground">
                        {c.avgMilkPerDay != null ? `${c.avgMilkPerDay.toFixed(2)}L` : "—"}
                      </span>
                    </div>
                  </div>

                  {/* Footer */}
                  {c.farmName && (
                    <div className="pt-3 border-t text-sm text-muted-foreground">
                      Farm:{" "}
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
      </div>
    </DashboardLayout>
  );
}
