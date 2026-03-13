import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../api/client";
import {
  TextField,
  Button,
  Card,
  CardContent,
  MenuItem
} from "@mui/material";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Register() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("BUYER");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [farmName, setFarmName] = useState("");
  const [farmAddress, setFarmAddress] = useState("");
  const [farmCity, setFarmCity] = useState("");

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
      address,
      city,
      farm:
        role === "FARM_OWNER"
          ? { name: farmName, address: farmAddress, city: farmCity }
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
        setError(t('auth.emailAlreadyExists'));
      } else {
        setError(err.message || t('messages.errorOccurred'));
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
          <div className="flex justify-between items-center mb-6">
            {/* App name */}
            <h1 className="text-2xl font-semibold text-gray-900">
              DairyFlow
            </h1>
            <LanguageSwitcher />
          </div>

          {/* Page title */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-semibold text-gray-900">
              {t('auth.register')}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {t('auth.dontHaveAccount')}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-7">
            <div>
              <TextField
                fullWidth
                label={t('auth.firstName')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <TextField
                fullWidth
                label={t('auth.email')}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <TextField
                fullWidth
                label={t('auth.password')}
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
                label={t('workers.role')}
                value={role}
                onChange={(e) => setRole(e.target.value)}
                InputLabelProps={{ shrink: true }}
              >
                <MenuItem value="BUYER">{t('auth.khariddar')}</MenuItem>
                <MenuItem value="FARM_OWNER">{t('auth.khetarNaMalik')}</MenuItem>
                <MenuItem value="WORKER">{t('auth.karmachari')}</MenuItem>
              </TextField>
            </div>

            <div>
              <TextField
                fullWidth
                label={t('farms.address')}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div>
              <TextField
                fullWidth
                label={t('farms.city')}
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>

            {/* Farm Owner fields */}
            {isFarmOwner && (
              <div className="space-y-7 rounded-xl bg-gray-50 p-4">
                <TextField
                  fullWidth
                  label={t('farms.farmName')}
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  required
                />
                <TextField
                  fullWidth
                  label={t('farms.address')}
                  value={farmAddress}
                  onChange={(e) => setFarmAddress(e.target.value)}
                  required
                />
                <TextField
                  fullWidth
                  label={t('farms.city')}
                  value={farmCity}
                  onChange={(e) => setFarmCity(e.target.value)}
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
              {loading ? t('common.loading') : t('auth.register')}
            </Button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm text-gray-500 mt-8">
            {t('auth.alreadyHaveAccount')}{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-gray-900 font-medium hover:underline"
            >
              {t('auth.login')}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
