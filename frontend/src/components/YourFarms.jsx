import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client";

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

    const user = JSON.parse(storedUser);

    apiFetch(`/farms/owner/${user.id}`)
      .then((data) => {
        const list = data || [];
        setFarms(list);

        // ✅ Ensure default farm exists if at least one farm is present
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

    // ✅ Always ensure a default farm before dashboard
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

        // ❌ If no farms remain, remove activeFarm
        if (updated.length === 0) {
          localStorage.removeItem("activeFarm");
        }

        return updated;
      });
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to delete farm.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f7faf7] px-6 py-4">
      {/* Back Button */}
      <button
        onClick={handleBackToDashboard}
        className="mb-4 text-gray-600"
      >
        ← Back to Dashboard
      </button>

      <h1 className="text-2xl font-bold mb-4">Your Farms</h1>

      {loading && <p className="text-sm text-gray-500">Loading farms...</p>}

      {error && !loading && (
        <p className="text-sm text-red-500 mb-4">{error}</p>
      )}

      <div className="space-y-4">
        {!loading &&
          !error &&
          farms.map((farm) => (
            <div
              key={farm.id}
              className="bg-white rounded-xl p-4 shadow-sm flex justify-between items-center gap-3"
            >
              {/* Farm Info */}
              <div
                onClick={() => handleViewFarm(farm)}
                className="flex-1 cursor-pointer hover:opacity-90 transition"
              >
                <p className="font-semibold text-gray-800">{farm.name}</p>
                <p className="text-xs text-gray-500">{farm.address}</p>
              </div>

              {/* Actions */}
              <div className="flex flex-col items-end gap-1">
                <button
                  type="button"
                  onClick={() => handleViewFarm(farm)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  View
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteFarm(farm.id)}
                  className="text-xs text-red-500 hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

        {!loading && !error && farms.length === 0 && (
          <p className="text-sm text-gray-500">
            You don&apos;t have any farms yet. Add one to continue.
          </p>
        )}
      </div>

      {/* Add Farm Button */}
      <button
        onClick={() => navigate("/farms/add")}
        className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white px-5 py-3 rounded-full font-medium shadow-lg"
      >
        + Add Farm
      </button>
    </div>
  );
}
