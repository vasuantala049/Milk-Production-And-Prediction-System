import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../api/client";

export default function WorkersList() {
  const { farmId } = useParams();
  const navigate = useNavigate();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/farms/${farmId}/workers`)
      .then((data) => setWorkers(data || []))
      .catch(() => setWorkers([]))
      .finally(() => setLoading(false));
  }, [farmId]);

  return (
    <div className="min-h-screen bg-[#f7faf7] px-6 py-4">
      <button onClick={() => navigate("/dashboard")} className="mb-4 text-gray-600">← Back to Dashboard</button>

      <h1 className="text-2xl font-bold mb-4">Workers</h1>

      {!loading && workers.length === 0 && (
        <p className="italic text-gray-600">No workers assigned to this farm</p>
      )}

      <div className="space-y-3 mb-32">
        {workers.map((w) => (
          <div key={w.id} className="bg-white p-4 rounded-xl shadow-sm">
            <p className="font-semibold">{w.name}</p>
            <p className="text-xs text-gray-500">{w.email}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
