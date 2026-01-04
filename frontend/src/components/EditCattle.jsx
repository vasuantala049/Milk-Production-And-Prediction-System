import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client";
import { TextField, Button, Card, CardContent } from '@mui/material';

export default function EditCattle() {
  const { farmId, cattleId } = useParams();
  const navigate = useNavigate();

  const [tagId, setTagId] = useState("");
  const [breed, setBreed] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const dto = await apiFetch(`/cattle/${cattleId}`);
        if (!mounted) return;
        setTagId(dto.tagId || "");
        setBreed(dto.breed || "");
        setStatus(dto.status || "ACTIVE");
      } catch (err) {
        setError(err.message || "Failed to load cattle");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [cattleId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await apiFetch(`/cattle/${cattleId}`, {
        method: "PATCH",
        body: JSON.stringify({ breed, status }),
      });
      navigate(`/cattle/${farmId}`);
    } catch (err) {
      setError(err.message || "Failed to update cattle");
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="max-w-md mx-auto">
        <Button onClick={() => navigate(`/cattle/${farmId}`)} variant="text">← Back</Button>

        <Card className="mt-4">
          <CardContent>
            {error && <div className="mb-3 text-red-600 font-semibold">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <TextField fullWidth label="Tag ID (cannot be changed)" value={tagId} InputProps={{ readOnly: true }} />

              <TextField fullWidth label="Breed" value={breed} onChange={(e) => setBreed(e.target.value)} />

              <TextField select fullWidth label="Status" value={status} onChange={(e) => setStatus(e.target.value)} SelectProps={{ native: true }}>
                <option value="ACTIVE">Active</option>
                <option value="SICK">Sick</option>
                <option value="SOLD">Sold</option>
              </TextField>

              <div className="flex gap-2">
                <Button type="submit" variant="contained" color="success" fullWidth>Save Changes</Button>
                <Button variant="outlined" onClick={() => navigate(`/cattle/${farmId}`)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
