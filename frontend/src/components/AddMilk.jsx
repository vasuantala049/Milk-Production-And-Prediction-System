import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../api/client";

export default function AddMilk() {
  const { farmId } = useParams();
  const navigate = useNavigate();

  const [tagId, setTagId] = useState("");
  const [session, setSession] = useState("");
  const [milkLiters, setMilkLiters] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!tagId || !session || !milkLiters) {
      setError("All fields are required");
      return;
    }

    if (Number(milkLiters) <= 0) {
      setError("Milk liters must be greater than 0");
      return;
    }

    setLoading(true);

    try {
      await apiFetch("/api/milk/today", {
        method: "POST",
        body: JSON.stringify({
          tagId,
          session,
          milkLiters: Number(milkLiters),
        }),
      });

      navigate(`/cattle/${farmId}`);
    } catch (err) {
      setError("Enter valid tag ID");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7faf7] px-6 py-6">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 text-gray-600"
      >
        ← Back
      </button>

      <h1 className="text-2xl font-bold mb-6">Add Milk</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl shadow-sm space-y-4"
      >
        {/* Tag ID */}
        <div>
          <label className="block text-sm font-medium mb-1">Tag ID</label>
          <input
            type="text"
            value={tagId}
            onChange={(e) => setTagId(e.target.value)}
            placeholder="Scan or enter tag ID"
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>

        {/* Session */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Milk Session
          </label>
          <select
            value={session}
            onChange={(e) => setSession(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            <option value="">Select session</option>
            <option value="MORNING">Morning</option>
            <option value="EVENING">Evening</option>
          </select>
        </div>

        {/* Milk Liters */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Milk (Liters)
          </label>
          <input
            type="number"
            step="0.1"
            value={milkLiters}
            onChange={(e) => setMilkLiters(e.target.value)}
            placeholder="e.g. 8.5"
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>

        {error && (
          <p className="text-red-600 text-sm font-medium">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-500 text-white py-2 rounded-lg font-semibold disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Milk Entry"}
        </button>
      </form>
    </div>
  );
}
