import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client";
import BarcodeScanner from "./BarcodeScanner";

export default function AddCattle() {
  const { farmId } = useParams();
  const navigate = useNavigate();

  const [tagId, setTagId] = useState("");
  const [breed, setBreed] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [showScanner, setShowScanner] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await apiFetch("/cattle", {
        method: "POST",
        body: JSON.stringify({
          tagId,
          breed,
          status,
          farmId: Number(farmId),
        }),
      });
      navigate(`/cattle/${farmId}`);
    } catch (err) {
      if (err.status === 409) {
        setError("Cattle with this tag ID already exists in this farm.");
      } else {
        setError(err.message || "Failed to add cattle.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 px-6 py-4">
      <button onClick={() => navigate(`/cattle/${farmId}`)}>← Back</button>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl mt-4">
        {error && (
          <div className="mb-3 text-red-600 font-semibold">{error}</div>
        )}
        <input
          className="w-full mb-3 border p-2"
          placeholder="Tag ID"
          value={tagId}
          onChange={(e) => setTagId(e.target.value)}
        />

        <button type="button" onClick={() => setShowScanner(true)}>
          Scan
        </button>

        {showScanner && (
                  <BarcodeScanner
                    onScanSuccess={(value) => setTagId(value)}
                    onClose={() => setShowScanner(false)}
                  />
                )}

        <input
          className="w-full mb-3 border p-2"
          placeholder="Breed"
          value={breed}
          onChange={(e) => setBreed(e.target.value)}
        />

        <select
          className="w-full mb-3 border p-2"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="ACTIVE">Active</option>
          <option value="SICK">Sick</option>
          <option value="SOLD">Sold</option>
        </select>

        <button className="w-full bg-green-500 text-white py-2 rounded">
          Save Cattle
        </button>
      </form>
    </div>
  );
}
