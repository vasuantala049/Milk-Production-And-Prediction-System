import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

export default function Login({ onLoginSuccess, onSwitchToRegister }) {
  const [identity, setIdentity] = useState("");   // email
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: identity,
          password: password,
        }),
      });

      if (!res.ok) {
        setError("Invalid email or password");
        return;
      }

      const data = await res.json(); // { token, type, user }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (onLoginSuccess) {
        onLoginSuccess(data);
      }
    } catch (err) {
      console.error(err);
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7faf7] px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-semibold text-gray-800">DairyFlow</h1>
        </div>

        {/* Image */}
        <div className="flex justify-center mb-6">
          <img
            src="https://images.unsplash.com/photo-1500595046743-cd271d694d30"
            alt="Dairy"
            className="rounded-xl h-48 object-cover w-full"
          />
        </div>

        {/* Welcome Text */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
          <p className="text-sm text-gray-500">
            Log in to manage your dairy production.
          </p>
        </div>

        {/* Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Identity */}
          <div>
            <label className="text-sm font-medium text-gray-600">
              Email
            </label>
            <div className="mt-1 relative">
              <input
                type="email"
                value={identity}
                onChange={(e) => setIdentity(e.target.value)}
                placeholder="Email"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-sm font-medium text-gray-600">
              Password
            </label>
            <div className="mt-1 relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-400 text-sm"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="text-sm text-red-500">
              {error}
            </div>
          )}

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#79d079] py-2.5 rounded-lg font-semibold hover:bg-green-600 transition disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Secure Login"}
          </button>
        </form>


        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="grow border-t"></div>
          <span className="mx-3 text-xs text-gray-400">OR LOGIN WITH</span>
          <div className="grow border-t"></div>
        </div>

        {/* Social Login */}
        <div className="flex justify-center">
          <button className="h-12 w-12 rounded-full border flex items-center justify-center hover:bg-gray-50">
            <span className="text-green-500 text-xl">🐮</span>
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Don’t have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-primary font-medium cursor-pointer"
          >
            Create an account
          </button>
        </p>
      </div>
    </div>
  );
}
