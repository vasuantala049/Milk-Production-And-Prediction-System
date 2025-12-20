import { useState } from "react";
import { apiFetch } from "../api/client";

export default function Register({ onRegisterSuccess, onSwitchToLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("BUYER"); // BUYER, FARM_OWNER, WORKER
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
          ? {
              name: farmName,
              address: farmAddress,
            }
          : null,
      farmId: role === "WORKER" && farmId ? Number(farmId) : null,
    };

    try {
      const data = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (onRegisterSuccess) {
        onRegisterSuccess(data);
      }
    } catch (err) {
      console.error(err);
      if (err.status === 409) {
        setError("A user with this email already exists.");
      } else {
        setError(err.message || "Failed to create account. Check your connection.");
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
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-semibold text-gray-800">DairyFlow</h1>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Create Account</h2>
          <p className="text-sm text-gray-500">
            Enter your details to start managing your dairy operations.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Name */}
          <div>
            <label className="text-sm font-medium text-gray-600">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="mt-1 w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-medium text-gray-600">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1 w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-sm font-medium text-gray-600">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Choose a strong password"
              className="mt-1 w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          {/* Role */}
          <div>
            <label className="text-sm font-medium text-gray-600">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1 w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
            >
              <option value="BUYER">Buyer</option>
              <option value="FARM_OWNER">Farm Owner</option>
              <option value="WORKER">Worker</option>
            </select>
            <p className="text-xs text-gray-400 mt-1">
              Farm owner can register a new farm. Worker must provide an existing farm ID.
            </p>
          </div>

          {/* Farm Owner extra fields */}
          {isFarmOwner && (
            <>
              <div>
                <label className="text-sm font-medium text-gray-600">Farm Name</label>
                <input
                  type="text"
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  placeholder="Your farm name"
                  className="mt-1 w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Farm Address</label>
                <input
                  type="text"
                  value={farmAddress}
                  onChange={(e) => setFarmAddress(e.target.value)}
                  placeholder="Farm address"
                  className="mt-1 w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
            </>
          )}

          {/* Worker extra fields */}
          {isWorker && (
            <div>
              <label className="text-sm font-medium text-gray-600">Assigned Farm ID</label>
              <input
                type="number"
                value={farmId}
                onChange={(e) => setFarmId(e.target.value)}
                placeholder="Existing farm ID"
                className="mt-1 w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                Ask the farm owner or admin for the correct farm ID.
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-sm text-red-500">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#79d079] py-2.5 rounded-lg font-semibold hover:bg-green-600 transition disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        {/* Switch to login */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-primary font-medium cursor-pointer"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
}


