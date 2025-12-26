import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client";

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("BUYER");
  const [farmName, setFarmName] = useState("");
  const [farmAddress, setFarmAddress] = useState("");
  const [farmId, setFarmId] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const payload = {
      name,
      email,
      password,
      role,
      farm:
        role === "FARM_OWNER"
          ? { name: farmName, address: farmAddress }
          : null,
      // Workers self-register without providing farmId; owners create workers from owner UI
      farmId: null,
    };

    try {
      const data = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate("/farms", { replace: true });
    } catch (err) {
      console.error(err);
      if (err.status === 409) {
        setError("A user with this email already exists.");
      } else {
        setError(err.message || "Failed to create account.");
      }
    } finally {
      setLoading(false);
    }
  };

  const isFarmOwner = role === "FARM_OWNER";
  const isWorker = role === "WORKER";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7faf7] px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-6">
        <div className="text-center mb-6">
          <h1 className="text-xl font-semibold text-gray-800">DairyFlow</h1>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Create Account</h2>
          <p className="text-sm text-gray-500">
            Enter your details to start managing your dairy operations.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <input
            type="email"
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg bg-white"
          >
            <option value="BUYER">Buyer</option>
            <option value="FARM_OWNER">Farm Owner</option>
            <option value="WORKER">Worker</option>
          </select>

          {isFarmOwner && (
            <>
              <input
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Farm name"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                required
              />
              <input
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Farm address"
                value={farmAddress}
                onChange={(e) => setFarmAddress(e.target.value)}
                required
              />
            </>
          )}

          {/* Workers self-register without specifying a farm; owners assign workers from their UI. */}

          {error && (
            <div className="text-sm text-red-500">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#79d079] py-2.5 rounded-lg font-semibold hover:bg-green-600 transition disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="text-primary font-medium cursor-pointer"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
}
