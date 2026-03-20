import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { apiFetch } from "../api/client";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Milk, Eye, EyeOff } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Login() {
  const navigate = useNavigate();
  const { t } = useTranslation();

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
      navigate("/dashboard", { replace: true });
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        setError(t('auth.invalidEmailOrPassword'));
      } else {
        setError(err.message || t('auth.networkError'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        </div>
        
        <div className="relative z-10 flex flex-col justify-center p-12 lg:p-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                <Milk className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-display font-bold text-white">{t('common.appName')}</h1>
                <p className="text-white/70">{t('common.tagline')}</p>
              </div>
            </div>

            <h2 className="text-4xl lg:text-5xl font-display font-bold text-white leading-tight mb-6">
              {t('auth.manageYourDairyFarmWithEase')}
            </h2>
            <p className="text-lg text-white/80 max-w-md">
              {t('auth.trackMilkProduction')}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-background">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <Milk className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">{t('common.appName')}</h1>
            </div>
          </div>

          <div className="flex justify-between items-center mb-8">
            <div className="text-center lg:text-left">
              <h2 className="text-2xl font-display font-bold text-foreground">{t('auth.login')}</h2>
              <p className="text-muted-foreground mt-2">{t('auth.dontHaveAccount')} <button onClick={() => navigate("/register")} className="text-primary font-medium hover:underline">{t('auth.register')}</button></p>
            </div>
            <LanguageSwitcher />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('auth.email')}
                value={identity}
                onChange={(e) => setIdentity(e.target.value)}
                className="h-12"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t('auth.password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-sm text-primary font-medium hover:underline"
                >
                  {t('auth.forgotPassword')}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
              {loading ? t('common.loading') : t('auth.login')}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t('auth.dontHaveAccount')}{" "}
            <button
              onClick={() => navigate("/register")}
              className="text-primary font-medium hover:underline"
            >
              {t('auth.register')}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
