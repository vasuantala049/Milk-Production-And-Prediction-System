import { useState } from "react";
import { apiFetch } from "../api/client";

export default function AddCattle({ farm, onBack, onCreated }) {
  const [tagId, setTagId] = useState("");
  const [breed, setBreed] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
            Add Cattle {farm ? `- ${farm.name}` : ""}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-sm p-6 space-y-5"
      >
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Tag ID
          </label>
          <div className="flex gap-2">
            <input
              value={tagId}
              onChange={(e) => setTagId(e.target.value)}
              placeholder="Unique tag identifier"
              required
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            {/* Simple mobile camera trigger using file input */}
            <label className="px-3 py-2 bg-gray-100 border rounded-lg text-xs text-gray-600 cursor-pointer hover:bg-gray-200">
              Scan
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  // Placeholder: here you can integrate a barcode scanning library
                  // like jsQR or Quagga to read the image and setTagId(result).
                  if (e.target.files?.length) {
                    console.log("Image captured for barcode scanning", e.target.files[0]);
                  }
                }}
              />
            </label>
          </div>
          <p className="text-[10px] text-gray-400 mt-1">
            You can type the tag or tap Scan on mobile to capture a barcode.
          </p>
        </div>

        <Field
          label="Breed"
          value={breed}
          onChange={(e) => setBreed(e.target.value)}
          placeholder="Breed (optional)"
        />

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
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
          className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition disabled:opacity-60"
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
        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
      />
    </div>
  );
}


