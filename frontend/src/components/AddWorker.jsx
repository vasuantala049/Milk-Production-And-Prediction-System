import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../api/client";

export default function AddWorker() {
  const { farmId } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await apiFetch("/users", {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          password,
          role: "WORKER",
          farmId: Number(farmId),
        }),
      });

      navigate("/farms");
    } catch (err) {
      setError(err.message || "Failed to create worker");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7faf7] px-6 py-6">
      <div className="max-w-md mx-auto bg-white rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Add Worker</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="w-full p-2 border rounded" required />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" className="w-full p-2 border rounded" required />
          <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" className="w-full p-2 border rounded" required />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-2">
            <button className="bg-green-500 text-white px-4 py-2 rounded" type="submit">{loading ? 'Creating...' : 'Create Worker'}</button>
            <button type="button" onClick={() => navigate('/farms')} className="px-4 py-2 border rounded">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
