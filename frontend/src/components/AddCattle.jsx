import { useState } from "react";
import { apiFetch } from "../api/client";
import BarcodeScanner from "./BarcodeScanner";

export default function AddCattle({ farm, onBack, onCreated }) {
  const [tagId, setTagId] = useState("");
  const [breed, setBreed] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showScanner, setShowScanner] = useState(false); // ✅ FIX

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!farm) {
        setError("No farm selected.");
        return;
      }

      const payload = {
        tagId,
        breed,
        status,
        farmId: farm.id,
      };

      const created = await apiFetch("/cattle", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      onCreated?.(created);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to save cattle.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 px-6 py-4">
      {/* Top Bar */}
      <div className="flex items-center gap-3 mb-6">
        <button type="button" onClick={onBack} className="text-xl text-gray-600">
          ←
        </button>
        <div>
          <p className="text-xs text-gray-500">Cattle Management</p>
          <p className="font-semibold text-gray-800">
            Add Cattle {farm ? `- ${farm.name}` : ""}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-lg p-6 space-y-5"
      >
        {/* TAG ID */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Tag ID
          </label>

          <div className="flex gap-2">
            <input
              value={tagId}
              onChange={(e) => setTagId(e.target.value)}
              placeholder="Scan or enter tag ID"
              required
              className="flex-1 px-4 py-2 border bg-gray-50 rounded-lg focus:ring-2 focus:ring-green-400"
            />

            <button
              type="button"
              onClick={() => setShowScanner(true)}
              className="px-3 py-2 bg-gray-100 border rounded-lg text-xs"
            >
              Scan
            </button>
          </div>
        </div>

        {/* BARCODE SCANNER */}
        {showScanner && (
          <BarcodeScanner
            onScan={(value) => {
              setTagId(value);
              setShowScanner(false);
            }}
            onClose={() => setShowScanner(false)}
          />
        )}

        {/* BREED */}
        <Field
          label="Breed"
          value={breed}
          onChange={(e) => setBreed(e.target.value)}
          placeholder="Breed (optional)"
        />

        {/* STATUS */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-4 py-2 border bg-gray-50 rounded-lg focus:ring-2 focus:ring-green-400"
          >
            <option value="ACTIVE">Active</option>
            <option value="SICK">Sick</option>
            <option value="SOLD">Sold</option>
          </select>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save Cattle"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, required }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">
        {label}
      </label>
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-2 border bg-gray-50 rounded-lg focus:ring-2 focus:ring-green-400"
      />
    </div>
  );
}
