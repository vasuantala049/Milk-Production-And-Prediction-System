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
  Snackbar,
  Alert,
} from "@mui/material";

export default function AddMilk() {
  const { farmId } = useParams();
  const navigate = useNavigate();

  const [tagId, setTagId] = useState("");

  const [session, setSession] = useState(() => {
    const hour = new Date().getHours();
    return hour < 14 ? "MORNING" : "EVENING";
  });

  const [milkLiters, setMilkLiters] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!tagId || !session || !milkLiters) {
      setSnackbar({
        open: true,
        message: "All fields are required",
        severity: "error",
      });
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

      setSnackbar({
        open: true,
        message: "Milk entry added successfully",
        severity: "success",
      });

      // Reset fields for next entry
      setTagId("");
      setMilkLiters("");

    } catch (err) {

      const msg = err?.message || "";

      if (
        err?.status === 409 ||
        msg.toLowerCase().includes("already")
      ) {
        setSnackbar({
          open: true,
          message: "This cattle has already been milked for this session",
          severity: "warning",
        });
      } else {
        setSnackbar({
          open: true,
          message: msg || "Unexpected error occurred",
          severity: "error",
        });
      }

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

            <h2 className="text-xl font-bold mb-4">
              Add Milk Entry
            </h2>

            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>

                {/* Tag ID */}
                <TextField
                  fullWidth
                  label="Cattle Tag ID"
                  placeholder="Enter or scan Tag ID"
                  value={tagId}
                  onChange={(e) => setTagId(e.target.value)}
                  disabled={submitting}
                />

                {/* Divider */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 border-t border-gray-200" />
                  <span className="text-xs text-gray-500">OR</span>
                  <div className="flex-1 border-t border-gray-200" />
                </div>

                {/* Scanner */}
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

                {/* Submit */}
                <Button
                  type="submit"
                  variant="contained"
                  color="success"
                  fullWidth
                  size="large"
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : "Save Milk Entry"}
                </Button>

              </Stack>
            </form>

          </CardContent>
        </Card>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
      
          onClose={() =>
            setSnackbar({ ...snackbar, open: false })
          }
        >
          <Alert severity={snackbar.severity} variant="filled">
            {snackbar.message}
          </Alert>
        </Snackbar>

      </div>
    </div>
  );
}