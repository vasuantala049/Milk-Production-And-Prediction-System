import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client";

export default function AddFarm() {
  const navigate = useNavigate();
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) return;
    const user = JSON.parse(stored);
    if (user.role !== "FARM_OWNER") {
      navigate("/farms");
    }
  }, []);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const user = JSON.parse(localStorage.getItem("user"));
    await apiFetch("/farms", {
      method: "POST",
      body: JSON.stringify({ name, address }),
    });

    navigate("/farms");
  };

  return (
    <div className="min-h-screen bg-[#f7faf7] px-6 py-4">
      <button onClick={() => navigate("/farms")}>← Back</button>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl mt-4">
        <input
          className="w-full mb-3 border p-2"
          placeholder="Farm name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="w-full mb-3 border p-2"
          placeholder="Farm address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <button className="w-full bg-green-500 text-white py-2 rounded">
          {loading ? "Saving..." : "Save Farm"}
        </button>
      </form>
    </div>
  );
}
