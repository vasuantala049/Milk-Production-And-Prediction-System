import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client";

export default function EditCattle() {
  const { farmId, cattleId } = useParams();
  const navigate = useNavigate();

  const [tagId, setTagId] = useState("");
  const [breed, setBreed] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const dto = await apiFetch(`/cattle/${cattleId}`);
        if (!mounted) return;
        setTagId(dto.tagId || "");
        setBreed(dto.breed || "");
        setStatus(dto.status || "ACTIVE");
      } catch (err) {
        setError(err.message || "Failed to load cattle");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [cattleId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await apiFetch(`/cattle/${cattleId}`, {
        method: "PATCH",
        body: JSON.stringify({ breed, status }),
      });
      navigate(`/cattle/${farmId}`);
    } catch (err) {
      setError(err.message || "Failed to update cattle");
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 px-6 py-4">
      <button onClick={() => navigate(`/cattle/${farmId}`)}>← Back</button>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl mt-4 max-w-md">
        {error && <div className="mb-3 text-red-600 font-semibold">{error}</div>}

        <label className="text-xs text-gray-600">Tag ID (cannot be changed)</label>
        <input
          className="w-full mb-3 border p-2 bg-gray-100"
          value={tagId}
          disabled
        />

        <label className="text-xs text-gray-600">Breed</label>
        <input
          className="w-full mb-3 border p-2"
          placeholder="Breed"
          value={breed}
          onChange={(e) => setBreed(e.target.value)}
        />

        <label className="text-xs text-gray-600">Status</label>
        <select
          className="w-full mb-3 border p-2"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="ACTIVE">Active</option>
          <option value="SICK">Sick</option>
          <option value="SOLD">Sold</option>
        </select>

        <button className="w-full bg-green-500 text-white py-2 rounded">Save Changes</button>
      </form>
    </div>
  );
}
