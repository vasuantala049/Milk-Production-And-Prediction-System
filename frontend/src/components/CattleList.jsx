import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";

export default function CattleList({ farm, onBack, onAddCattle }) {
  const [cattle, setCattle] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!farm) {
      setError("No farm selected.");
      setLoading(false);
      return;
    }

    const fetchCattle = async () => {
      try {
        const data = await apiFetch(`/cattle/farm/${farm.id}`);
        setCattle(data || []);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load cattle.");
      } finally {
        setLoading(false);
      }
    };

    fetchCattle();
  }, [farm]);

  return (
    <div className="min-h-screen bg-[#f7faf7] px-6 py-4">
      {/* Top Bar */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={onBack}
          className="text-xl text-gray-600"
        >
          ←
        </button>
        <div>
          <p className="text-xs text-gray-500">Cattle Management</p>
          <p className="font-semibold text-gray-800">
            {farm ? farm.name : "Select Farm"}
          </p>
        </div>
      </div>

      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Cattle</h1>
        <p className="text-sm text-gray-500">
          View and manage cattle for this farm.
        </p>
      </div>

      {loading && <p className="text-sm text-gray-500">Loading cattle...</p>}
      {error && !loading && (
        <p className="text-sm text-red-500 mb-4">{error}</p>
      )}

      <div className="space-y-3 mb-20">
        {!loading &&
          !error &&
          cattle.map((c) => (
            <CattleRow
              key={c.id}
              animal={c}
              onDeleted={() =>
                setCattle((prev) => prev.filter((x) => x.id !== c.id))
              }
            />
          ))}

        {!loading && !error && cattle.length === 0 && (
          <p className="text-sm text-gray-500">
            No cattle found. Add your first animal.
          </p>
        )}
      </div>

      <button
        onClick={onAddCattle}
        className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white px-5 py-3 rounded-full font-medium shadow-lg"
      >
        + Add Cattle
      </button>
    </div>
  );
}

async function deleteCattle(id, onDeleted, setError) {
  try {
    if (!window.confirm("Delete this animal? This cannot be undone.")) return;
    await apiFetch(`/cattle/${id}`, { method: "DELETE" });
    onDeleted?.();
  } catch (err) {
    console.error(err);
    setError(err.message || "Failed to delete cattle.");
  }
}

function CattleRow({ animal, onDeleted }) {
  const [error, setError] = useState("");

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm flex justify-between items-center gap-3">
      <div>
        <p className="font-semibold text-gray-800">Tag: {animal.tagId}</p>
        <p className="text-xs text-gray-500">
          Breed: {animal.breed || "N/A"} | Status: {animal.status}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1">
        {/* For now, edit would reuse AddCattle with prefilled values in future */}
        <button
          type="button"
          onClick={() => deleteCattle(animal.id, onDeleted, setError)}
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