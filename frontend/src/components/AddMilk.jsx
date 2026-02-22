
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
} from "@mui/material";

export default function AddMilk() {
  const { farmId } = useParams();
  const navigate = useNavigate();

  const [tagId, setTagId] = useState("");
  const [session, setSession] = useState("");
  const [milkLiters, setMilkLiters] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showScanner, setShowScanner] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!tagId || !session || !milkLiters) {
      setError("All fields are required");
      return;
    }

    if (Number(milkLiters) <= 0) {
      setError("Milk liters must be greater than 0");
      return;
    }

    setLoading(true);

    try {
      await apiFetch("/milk/today", {
        method: "POST",
        body: JSON.stringify({
          farmId: localStorage.getItem("activeFarm")
            ? JSON.parse(localStorage.getItem("activeFarm")).id
            : Number(farmId),
          tagId,
          session,
          milkLiters: Number(milkLiters),
        }),
      });

      navigate("/dashboard");
    } catch (err) {
      setError(err?.message || "Failed to add milk entry");
    } finally {
      setLoading(false);
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
            {error && (
              <div className="text-red-600 font-semibold mb-2">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* 🔥 ALL spacing controlled here */}
              <Stack spacing={2}>
                {/* Tag ID */}
                <TextField
                  fullWidth
                  label="Tag ID"
                  value={tagId}
                  onChange={(e) => setTagId(e.target.value)}
                  placeholder="Scan or enter tag ID"
                />

                <Button
                  variant="outlined"
                  onClick={() => setShowScanner(true)}
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
                  <MenuItem value="">Select session</MenuItem>
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
                />

                <Button
                  type="submit"
                  variant="contained"
                  color="success"
                  fullWidth
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Milk Entry"}
                </Button>
              </Stack>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
