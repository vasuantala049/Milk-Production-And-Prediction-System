import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client";
import {
  TextField,
  Button,
  Card,
  CardContent,
  MenuItem
} from "@mui/material";

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("BUYER");
  const [farmName, setFarmName] = useState("");
  const [farmAddress, setFarmAddress] = useState("");

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-10">
      <Card className="w-full max-w-md rounded-2xl shadow-lg">
        <CardContent className="p-7 sm:p-8">
          {/* App name */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">
              DairyFlow
            </h1>
          </div>

          {/* Page title */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-semibold text-gray-900">
              Create Account
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Enter your details to get started
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-7">
            <div>
              <TextField
                fullWidth
                label="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <TextField
                fullWidth
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div>
              <TextField
                select
                fullWidth
                label="Role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                InputLabelProps={{ shrink: true }}
              >
                <MenuItem value="BUYER">Buyer</MenuItem>
                <MenuItem value="FARM_OWNER">Farm Owner</MenuItem>
                <MenuItem value="WORKER">Worker</MenuItem>
              </TextField>
            </div>

            {/* Farm Owner fields */}
            {isFarmOwner && (
              <div className="space-y-7 rounded-xl bg-gray-50 p-4">
                <TextField
                  fullWidth
                  label="Farm name"
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  required
                />
                <TextField
                  fullWidth
                  label="Farm address"
                  value={farmAddress}
                  onChange={(e) => setFarmAddress(e.target.value)}
                  required
                />
              </div>
            )}

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              variant="contained"
              fullWidth
              className="!py-3 !rounded-xl"
              sx={{ fontWeight: 600 }}
            >
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm text-gray-500 mt-8">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-gray-900 font-medium hover:underline"
            >
              Login
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
