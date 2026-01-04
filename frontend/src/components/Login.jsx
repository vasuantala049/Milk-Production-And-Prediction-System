import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client";
import {
  TextField,
  Button,
  InputAdornment,
  IconButton,
  CircularProgress
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

export default function Login() {
  const navigate = useNavigate();

  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: identity,
          password
        })
      });

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/farms", { replace: true });
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        setError("Invalid email or password");
      } else {
        setError(err.message || "Network error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-7 sm:p-8 card-glow card-hover">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-gray-900">
            DairyFlow
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Secure access to your dairy operations
          </p>
        </div>

        {/* Image */}
        <div className="mb-8 overflow-hidden rounded-xl">
          <img
            src="https://images.unsplash.com/photo-1500595046743-cd271d694d30"
            alt="Dairy"
            className="w-full h-40 object-cover"
          />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-7">
          <div>
            <TextField
              fullWidth
              label="Email address"
              variant="outlined"
              value={identity}
              onChange={(e) => setIdentity(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </div>

          <div>
            <TextField
              fullWidth
              label="Password"
              variant="outlined"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            className="btn-primary w-full !py-3 !rounded-xl"
            sx={{ fontWeight: 600 }}
          >
            {loading ? (
              <CircularProgress size={22} color="inherit" />
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-8">
          Don’t have an account?{" "}
          <button
            onClick={() => navigate("/register")}
            className="text-gray-800 font-medium hover:underline"
          >
            Create an account
          </button>
        </p>
      </div>
    </div>
  );
}
