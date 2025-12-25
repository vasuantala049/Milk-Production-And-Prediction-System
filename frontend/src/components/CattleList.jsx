import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../api/client";

export default function CattleList() {
  const { farmId } = useParams();
  const navigate = useNavigate();
  const [cattle, setCattle] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/cattle/farm/${farmId}`)
      .then((data) => setCattle(data || []))
      .finally(() => setLoading(false));
  }, [farmId]);

  return (
    <div className="min-h-screen bg-[#f7faf7] px-6 py-4">
      <button
        onClick={() => navigate("/dashboard")}
        className="mb-4 text-gray-600"
      >
        ← Back to Dashboard
      </button>

      <h1 className="text-2xl font-bold mb-4">Cattle</h1>

      {!loading && cattle.length === 0 && (
        <p className="italic text-gray-600">Add your first cattle</p>
      )}

      <div className="space-y-3 mb-32">
        {cattle.map((c) => (
          <div key={c.id} className="bg-white p-4 rounded-xl shadow-sm">
            <p className="font-semibold">Tag: {c.tagId}</p>
            <p className="text-xs text-gray-500">
              Breed: {c.breed || "N/A"} | Status: {c.status}
            </p>
          </div>
        ))}
      </div>

      {/* Add Milk Button */}
      <button
        onClick={() => navigate(`/milk/add/${farmId}`)}
        className="fixed bottom-20 right-6 bg-blue-500 text-white px-5 py-3 rounded-full shadow-lg"
      >
        + Add Milk
      </button>

      {/* Add Cattle Button */}
      <button
        onClick={() => navigate(`/cattle/add/${farmId}`)}
        className="fixed bottom-6 right-6 bg-green-500 text-white px-5 py-3 rounded-full shadow-lg"
      >
        + Add Cattle
      </button>
    </div>
  );
}
