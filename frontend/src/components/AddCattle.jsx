import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client";
import BarcodeScanner from "./BarcodeScanner";
import { TextField, Button, Card, CardContent } from '@mui/material';

export default function AddCattle() {
  const { farmId } = useParams();
  const navigate = useNavigate();

  const [tagId, setTagId] = useState("");
  const [breed, setBreed] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [showScanner, setShowScanner] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await apiFetch("/cattle", {
        method: "POST",
        body: JSON.stringify({
          tagId,
          breed,
          status,
          farmId: Number(farmId),
        }),
      });
      navigate(`/cattle/${farmId}`);
    } catch (err) {
      if (err.status === 409) {
        setError("Cattle with this tag ID already exists in this farm.");
      } else {
        setError(err.message || "Failed to add cattle.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="max-w-md mx-auto">
        <Button onClick={() => navigate(`/cattle/${farmId}`)} variant="text">← Back</Button>

        <Card className="mt-4">
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="text-red-600 font-semibold">{error}</div>}

              <TextField fullWidth label="Tag ID" value={tagId} onChange={(e) => setTagId(e.target.value)} />

              <div className="flex gap-2 items-center">
                <Button type="button" variant="outlined" onClick={() => setShowScanner(true)}>Scan</Button>
                <TextField label="Breed" value={breed} onChange={(e) => setBreed(e.target.value)} fullWidth />
              </div>

              <TextField select fullWidth label="Status" value={status} onChange={(e) => setStatus(e.target.value)} SelectProps={{ native: true }}>
                <option value="ACTIVE">Active</option>
                <option value="SICK">Sick</option>
                <option value="SOLD">Sold</option>
              </TextField>

              <div className="flex gap-2">
                <Button variant="contained" color="primary" type="submit" fullWidth>Save Cattle</Button>
              </div>

              {showScanner && (
                <BarcodeScanner onScan={(v) => { setTagId(v); setShowScanner(false); }} onClose={() => setShowScanner(false)} />
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
