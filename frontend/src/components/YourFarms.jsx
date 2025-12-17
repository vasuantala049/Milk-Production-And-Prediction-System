import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";

export default function YourFarms({ onSelectFarm, onAddFarm }) {
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
    if (user.role !== "FARM_OWNER") {
      setError("Only farm owners have farms associated with their account.");
      setLoading(false);
      return;
    }

    const fetchFarms = async () => {
      try {
        const data = await apiFetch(`/farms/owner/${user.id}`);
        setFarms(data || []);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load farms.");
      } finally {
        setLoading(false);
      }
    };

    fetchFarms();
  }, []);

  return (
    <div className="min-h-screen bg-[#f7faf7] px-6 py-4">
      {/* Top Bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-full bg-gray-200"></div>
        <div>
          <p className="text-xs text-gray-500">Welcome</p>
          <p className="font-semibold text-gray-800">Select Your Farm</p>
        </div>
      </div>

      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Your Farms</h1>
        <p className="text-sm text-gray-500">
          Choose a farm to view its dashboard.
        </p>
      </div>

      {loading && <p className="text-sm text-gray-500">Loading farms...</p>}
      {error && !loading && (
        <p className="text-sm text-red-500 mb-4">{error}</p>
      )}

      {/* Farms List */}
      <div className="space-y-4">
        {!loading &&
          !error &&
          farms.map((farm) => (
            <FarmCard
              key={farm.id}
              farm={farm}
              onSelect={() => onSelectFarm?.(farm)}
              onDeleted={() =>
                setFarms((prev) => prev.filter((f) => f.id !== farm.id))
              }
            />
          ))}
        {!loading && !error && farms.length === 0 && (
          <p className="text-sm text-gray-500">
            You don&apos;t have any farms yet. Add one to get started.
          </p>
        )}
      </div>

      {/* Add Farm Button */}
      <button
        onClick={() => onAddFarm?.()}
        className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white px-5 py-3 rounded-full font-medium shadow-lg"
      >
        + Add Farm
      </button>
    </div>
  );
}

async function deleteFarm(id, onDeleted, setError) {
  try {
    if (!window.confirm("Delete this farm? This cannot be undone.")) return;
    await apiFetch(`/farms/${id}`, { method: "DELETE" });
    onDeleted?.();
  } catch (err) {
    console.error(err);
    setError(err.message || "Failed to delete farm.");
  }
}

function FarmCard({ farm, onSelect, onDeleted }) {
  const [error, setError] = useState("");

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm flex justify-between items-center gap-3">
      <div
        onClick={onSelect}
        className="flex-1 cursor-pointer hover:opacity-90 transition"
      >
        <p className="font-semibold text-gray-800">{farm.name}</p>
        <p className="text-xs text-gray-500">{farm.address}</p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={onSelect}
          className="text-xs text-blue-600 hover:underline"
        >
          View
        </button>
        <button
          type="button"
          onClick={() => deleteFarm(farm.id, onDeleted, setError)}
          className="text-xs text-red-500 hover:underline"
        >
          Delete
        </button>
      </div>
      {error && (
        <p className="text-[10px] text-red-500 mt-1 text-right">{error}</p>
      )}
    </div>
  );
}
