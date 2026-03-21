import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../api/client";
import BarcodeScanner from "../components/BarcodeScanner";
import {
  TextField,
  Button,
  Card,
  CardContent,
  MenuItem,
  Stack,
  Alert,
} from "@mui/material";

export default function AddMilk() {
  const { t } = useTranslation();
  const { farmId } = useParams();
  const navigate = useNavigate();

  const [tagId, setTagId] = useState("");
  const [session, setSession] = useState(() => {
    const hour = new Date().getHours();
    return hour < 14 ? "MORNING" : "EVENING"; // Auto-detect session
  });
  const [milkLiters, setMilkLiters] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showScanner, setShowScanner] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!tagId || !session || !milkLiters) {
      setError(t('addMilk.errorRequired') || "All fields are required");
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch("/milk/today", {
        method: "POST",
        body: JSON.stringify({
          farmId: Number(farmId),
          tagId,
          session,
          milkLiters: Number(milkLiters),
        }),
      });
      // Success - clear fields and show success message
      setTagId("");
      setMilkLiters("");
      setSuccess(t('addMilk.success') || "Milk entry added");
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err?.message || t('addMilk.error') || "Failed to add milk entry");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="max-w-md mx-auto">
         <div className="flex items-center gap-3">
            <Button variant="text" onClick={() => navigate  (-1)}>
            {t('common.back') || '← Back'}
            </Button>
            <h1 className="text-lg font-bold">{t('addMilk.title') || 'Add Milk Entry'}</h1>
         </div>
  

        <Card className="mt-4">
          <CardContent>
            {/* <h2 className="text-xl font-bold mb-4">{t('addMilk.title')}</h2> */}

            {error && (
              <Alert severity="error" className="mb-4">
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" className="mb-4">
                {success}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                {/* Tag ID Input */}
                <TextField
                  fullWidth
                  label={t('addMilk.cattle') || 'Cattle Tag ID'}
                  placeholder={t('addMilk.tagPlaceholder') || 'Enter or scan Tag ID'}
                  value={tagId}
                  onChange={(e) => setTagId(e.target.value)}
                  disabled={submitting}
                />

                <div className="flex items-center gap-2">
                  <div className="flex-1 border-t border-gray-100" />
                  <span className="text-xs text-muted-foreground">{t('common.or') || 'OR'}</span>
                  <div className="flex-1 border-t border-gray-100" />
                </div>

                <Button
                  variant="outlined"
                  onClick={() => setShowScanner(true)}
                  disabled={submitting}
                >
                  {t('addMilk.scanBarcode') || 'Scan Barcode'}
                </Button>

                {showScanner && (
                  <BarcodeScanner
                    onScanSuccess={(value) => {
                      setTagId(value);
                      setShowScanner(false);
                    }}
                    onClose={() => setShowScanner(false)}
                  />
                )}

                {/* Session */}
                <TextField
                  select
                  fullWidth
                  label={t('addMilk.session') || 'Milk Session'}
                  value={session}
                  onChange={(e) => setSession(e.target.value)}
                >
                  <MenuItem value="MORNING">{t('addMilk.morning') || 'Morning'}</MenuItem>
                  <MenuItem value="EVENING">{t('addMilk.evening') || 'Evening'}</MenuItem>
                </TextField>

                {/* Milk Liters */}
                <TextField
                  fullWidth
                  type="number"
                  label={t('addMilk.quantity') || 'Milk (Liters)'}
                  inputProps={{ step: 0.1, min: 0 }}
                  value={milkLiters}
                  onChange={(e) => setMilkLiters(e.target.value)}
                  disabled={submitting}
                />

                <Button
                  type="submit"
                  variant="contained"
                  color="success"
                  fullWidth
                  size="large"
                  disabled={submitting || !tagId}
                >
                  {submitting ? t('addMilk.saving') || 'Saving...' : t('addMilk.submit') || 'Save Milk Entry'}
                </Button>
              </Stack>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
