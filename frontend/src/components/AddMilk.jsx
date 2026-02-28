import { useState } from "react";
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
  const [showScanner, setShowScanner] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!tagId || !session || !milkLiters) {
      setError("All fields are required");
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
      navigate("/dashboard");
    } catch (err) {
      setError(err?.message || "Failed to add milk entry");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="max-w-md mx-auto">
        <Button variant="text" onClick={() => navigate(-1)}>
          ← Back
        </Button>

        <Card className="mt-4">
          <CardContent>
            <h2 className="text-xl font-bold mb-4">Add Milk Entry</h2>

            {error && (
              <Alert severity="error" className="mb-4">
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                {/* Tag ID Input */}
                <TextField
                  fullWidth
                  label="Cattle Tag ID"
                  placeholder="Enter or scan Tag ID"
                  value={tagId}
                  onChange={(e) => setTagId(e.target.value)}
                  disabled={submitting}
                />

                <div className="flex items-center gap-2">
                  <div className="flex-1 border-t border-gray-100" />
                  <span className="text-xs text-muted-foreground">OR</span>
                  <div className="flex-1 border-t border-gray-100" />
                </div>

                <Button
                  variant="outlined"
                  onClick={() => setShowScanner(true)}
                  disabled={submitting}
                >
                  Scan Barcode
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
                  label="Milk Session"
                  value={session}
                  onChange={(e) => setSession(e.target.value)}
                >
                  <MenuItem value="MORNING">Morning</MenuItem>
                  <MenuItem value="EVENING">Evening</MenuItem>
                </TextField>

                {/* Milk Liters */}
                <TextField
                  fullWidth
                  type="number"
                  label="Milk (Liters)"
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
                  {submitting ? "Saving..." : "Save Milk Entry"}
                </Button>
              </Stack>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
