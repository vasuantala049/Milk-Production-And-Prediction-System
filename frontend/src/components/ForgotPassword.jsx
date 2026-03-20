import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Milk } from "lucide-react";
import { apiFetch } from "../api/client";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { InlineMessage } from "./ui/InlineMessage";
import LanguageSwitcher from "./LanguageSwitcher";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [step, setStep] = useState("request");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    setLoading(true);

    try {
      const data = await apiFetch("/auth/forgot-password/request-otp", {
        method: "POST",
        body: JSON.stringify({ email })
      });

      setStep("reset");
      setMessage({ type: "success", text: data?.message || t("auth.otpSent") });
    } catch (err) {
      setMessage({ type: "error", text: err.message || t("auth.requestOtpFailed") });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: t("auth.passwordsDoNotMatch") });
      return;
    }

    setLoading(true);

    try {
      const data = await apiFetch("/auth/forgot-password/reset", {
        method: "POST",
        body: JSON.stringify({
          email,
          otp,
          newPassword
        })
      });

      setMessage({ type: "success", text: data?.message || t("auth.passwordResetSuccess") });
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setMessage({ type: "error", text: err.message || t("auth.resetPasswordFailed") });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 lg:p-12 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center">
              <Milk className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-display font-bold text-foreground">{t("common.appName")}</h1>
          </div>
          <LanguageSwitcher />
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-card">
          <h2 className="text-2xl font-display font-bold text-foreground mb-1">{t("auth.forgotPassword")}</h2>
          <p className="text-sm text-muted-foreground mb-5">{t("auth.otpInstruction")}</p>

          <InlineMessage
            type={message.type || "info"}
            message={message.text}
            onClose={() => setMessage({ type: "", text: "" })}
            className="mb-4"
          />

          {step === "request" ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("auth.email")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12"
                  required
                />
              </div>

              <Button type="submit" className="w-full h-12" disabled={loading}>
                {loading ? t("common.loading") : t("auth.sendOtp")}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="otp">{t("auth.otp")}</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder={t("auth.otp")}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="h-12"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">{t("profile.newPassword")}</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder={t("profile.newPassword")}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-12"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder={t("auth.confirmPassword")}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12"
                  required
                />
              </div>

              <Button type="submit" className="w-full h-12" disabled={loading}>
                {loading ? t("common.loading") : t("auth.resetPassword")}
              </Button>
            </form>
          )}

          <div className="mt-5 text-center">
            <button
              type="button"
              className="text-sm text-primary font-medium hover:underline"
              onClick={() => navigate("/login")}
            >
              {t("auth.backToLogin")}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
