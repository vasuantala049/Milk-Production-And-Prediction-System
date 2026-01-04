import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../api/client";
import {
  TextField,
  Button,
  Card,
  CardContent,
  MenuItem
} from "@mui/material";

export default function AddMilk() {
  const { farmId } = useParams();
  const navigate = useNavigate();

  const [tagId, setTagId] = useState("");
  const [session, setSession] = useState("");
  const [milkLiters, setMilkLiters] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      const token = localStorage.getItem("token");

      if (!token) {
        setError("You must be logged in to perform this action");
        setLoading(false);
        navigate("/login");
        return;
      }

      await apiFetch("/milk/today", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          tagId,
          session,
          milkLiters: Number(milkLiters),
        }),
      });

      navigate(`/cattle/${farmId}`);
    } catch {
      setError("Failed to add milk record");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-200/60 px-4 py-10">
      <div className="max-w-md mx-auto space-y-6">
        {/* Back */}
        <Button
          onClick={() => navigate(`/cattle/${farmId}`)}
          variant="text"
        >
          ← Back to Cattle
        </Button>

        {/* Title */}
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Add Milk Record
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Record today&apos;s milk production for a cattle
          </p>
        </div>

        {/* Form */}
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-7">
            <form onSubmit={handleSubmit} className="space-y-7">
              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                  {error}
                </div>
              )}

              <div>
                <TextField
                  fullWidth
                  label="Tag ID"
                  value={tagId}
                  onChange={(e) => setTagId(e.target.value)}
                />
              </div>

              <div>
                <TextField
                  select
                  fullWidth
                  label="Session"
                  value={session}
                  onChange={(e) => setSession(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                >
                  <MenuItem value="">Select session</MenuItem>
                  <MenuItem value="MORNING">Morning</MenuItem>
                  <MenuItem value="EVENING">Evening</MenuItem>
                </TextField>
              </div>

              <div>
                <TextField
                  fullWidth
                  label="Milk (Liters)"
                  value={milkLiters}
                  onChange={(e) => setMilkLiters(e.target.value)}
                  type="number"
                  inputProps={{ min: 0, step: "0.1" }}
                  placeholder="e.g. 5.5"
                  InputLabelProps={{ shrink: true }}
                />
              </div>

              <Button
                type="submit"
                variant="contained"
                color="success"
                fullWidth
                disabled={loading}
                className="!py-3 !rounded-xl"
              >
                {loading ? "Saving..." : "Add Milk"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
