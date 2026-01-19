import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { apiFetch } from "../api/client";
import { DashboardLayout } from "./layout/DashboardLayout";
import { FarmCard } from "./dashboard/FarmCard";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import DeleteIcon from "@mui/icons-material/Delete";
import PeopleIcon from "@mui/icons-material/People";

export default function YourFarms() {
  const navigate = useNavigate();
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      setError("You must be logged in to view farms.");
      setLoading(false);
      return;
    }

    apiFetch(`/farms/me`)
      .then((data) => {
        const list = data || [];
        setFarms(list);

        if (list.length > 0 && !localStorage.getItem("activeFarm")) {
          localStorage.setItem("activeFarm", JSON.stringify(list[0]));
        }
      })
      .catch((err) => {
        setError(err.message || "Failed to load farms.");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleViewFarm = (farm) => {
    localStorage.setItem("activeFarm", JSON.stringify(farm));
    navigate("/dashboard");
  };

  const handleDeleteFarm = async (farmId) => {
    if (!window.confirm("Delete this farm?")) return;
    try {
      await apiFetch(`/farms/${farmId}`, { method: "DELETE" });
      setFarms((prev) => prev.filter((f) => f.id !== farmId));
    } catch (err) {
      alert(err.message || "Failed to delete farm");
    }
  };

  const filteredFarms = farms.filter(
    (farm) =>
      farm.name?.toLowerCase().includes(search.toLowerCase()) ||
      farm.address?.toLowerCase().includes(search.toLowerCase())
  );

  const user = JSON.parse(localStorage.getItem("user") || "{}");

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
              Farms
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your dairy farms and track production
            </p>
          </div>

          {user.role === "FARM_OWNER" && (
            <Button onClick={() => navigate("/farms/add")} className="gap-2">
              <AddIcon fontSize="small" />
              Add Farm
            </Button>
          )}
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative max-w-md"
        >
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search farms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-12"
          />
        </motion.div>

        {/* Loading / Error */}
        {loading && <p className="text-muted-foreground">Loading farms…</p>}

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-md">
            {error}
          </div>
        )}

        {/* Farms Grid */}
        {!loading && filteredFarms.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFarms.map((farm, index) => (
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
                  <FarmCard farm={farm} />
                </div>

                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/farms/${farm.id}/add-worker`);
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <PeopleIcon fontSize="small" />
                  </Button>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFarm(farm.id);
                    }}
                    className="h-8 w-8 p-0"
                  >
                    <DeleteIcon fontSize="small" />
                  </Button>
                </div>
              </motion.div>
            ))}
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
              {search
                ? "No farms found matching your search."
                : "You don't have any farms yet."}
            </p>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
