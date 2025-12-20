import { useState } from "react";
import { apiFetch } from "../api/client";

export default function AddFarm({ onBack, onCreated }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        setError("You must be logged in as a farm owner to add a farm.");
        return;
      }
      const user = JSON.parse(storedUser);
      const ownerId = user.id;

      const payload = {
        name,
        address,
        ownerId, // backend currently expects ownerId in CreateFarmDto
      };

      const farm = await apiFetch("/farms", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      onCreated?.(farm);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to save farm.");
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
          <p className="text-xs text-gray-500">Farm Management</p>
          <p className="font-semibold text-gray-800">Add New Farm</p>
        </div>
      </div>

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-sm p-6 space-y-5"
      >
        <InputField
          label="Farm Name"
          placeholder="Enter farm name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <InputField
          label="Farm Address"
          placeholder="Enter full farm address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
        />

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save Farm"}
        </button>
      </form>
    </div>
  );
}

function InputField({ label, placeholder, value, onChange, type = "text", required }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
      />
    </div>
  );
}
