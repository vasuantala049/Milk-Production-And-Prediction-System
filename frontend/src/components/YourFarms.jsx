import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client";
import { Card, CardContent, Button } from "@mui/material";

export default function YourFarms() {
  const navigate = useNavigate();
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        console.error(err);
        setError(err.message || "Failed to load farms.");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleBackToDashboard = () => {
    if (farms.length === 0) {
      setError("You need at least one farm to see the dashboard.");
      return;
    }
    localStorage.setItem("activeFarm", JSON.stringify(farms[0]));
    navigate("/dashboard");
  };

  const handleViewFarm = (farm) => {
    localStorage.setItem("activeFarm", JSON.stringify(farm));
    navigate("/dashboard");
  };

  const handleDeleteFarm = async (farmId) => {
    if (!window.confirm("Delete this farm? This cannot be undone.")) return;
    try {
      await apiFetch(`/farms/${farmId}`, { method: "DELETE" });
      setFarms((prev) => {
        const updated = prev.filter((f) => f.id !== farmId);
        if (updated.length === 0) localStorage.removeItem("activeFarm");
        return updated;
      });
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to delete farm.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-200/60 px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back */}
        <div>
          <Button onClick={handleBackToDashboard} variant="text">
            ← Back to Dashboard
          </Button>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Your Farms
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Select a farm to continue to the dashboard
          </p>
        </div>

        {/* Loading / Error */}
        {loading && (
          <div className="text-sm text-gray-500">
            Loading farms…
          </div>
        )}

        {error && !loading && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
            {error}
          </div>
        )}

        {/* Farms List */}
        <div className="space-y-3">
          {farms.map((farm) => (
            <Card
              key={farm.id}
              className="rounded-2xl card-hover soft-border bg-white"
            >
              <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-900">
                    {farm.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {farm.address || "No address provided"}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="contained"
                    onClick={() => handleViewFarm(farm)}
                    className="btn-primary"
                  >
                    Open
                  </Button>

                  <Button
                    variant="outlined"
                    onClick={() => navigate(`/farms/${farm.id}/add-worker`)}
                    className="border border-gray-200"
                  >
                    Add Worker
                  </Button>

                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => handleDeleteFarm(farm.id)}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {!loading && !error && farms.length === 0 && (
          <div className="text-sm text-gray-500 bg-white rounded-xl p-4 shadow-sm">
            You don&apos;t have any farms yet.
            {(() => {
              const storedUser = localStorage.getItem("user");
              if (!storedUser) return "";
              const user = JSON.parse(storedUser);
              return user.role === "WORKER"
                ? " Your account is not assigned to a farm. Please contact your farm owner."
                : " Add one to continue.";
            })()}
          </div>
        )}

        {/* Add Farm (Owner only) */}
        {(() => {
          const storedUser = localStorage.getItem("user");
          if (!storedUser) return null;
          const user = JSON.parse(storedUser);
          if (user.role !== "FARM_OWNER") return null;

          return (
          <div className="fixed bottom-6 right-6">
  <Button
    variant="contained"
    onClick={() => navigate("/farms/add")}
    className="!rounded-md !px-6 !py-3 shadow-md !font-semibold !text-sm hover:shadow-lg transition"
  >
    Add Farm
  </Button>
</div>

          );
        })()}
      </div>
    </div>
  );
}
