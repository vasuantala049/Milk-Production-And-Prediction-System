import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../api/client";
import {
  TextField,
  Button,
  Card,
  CardContent,
  Stack,
  Alert,
  Select,
  OutlinedInput,
  Checkbox,
  ListItemText,
  MenuItem,
} from "@mui/material";

export default function AddWorker() {
  const { farmId } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [shedIds, setShedIds] = useState([]); // Changed from 'shed' to 'shedIds'
  const [shades, setShades] = useState([]); // New state for available shades
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user.role !== "FARM_OWNER") {
      navigate("/farms");
    }
  }, [navigate]);

  useEffect(() => {
    // Fetch available shades for this farm
    apiFetch(`/farms/${farmId}/sheds`)
      .then((data) => setShades(data || []))
      .catch((err) => console.error("Failed to load shades:", err));
  }, [farmId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await apiFetch(`/farms/${farmId}/workers`, {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          password,
          role: "WORKER",
          farmId: Number(farmId),
          shedIds, // Changed from 'shed' to 'shedIds'
        }),
      });

      navigate("/farms");
    } catch (err) {
      setError(err.message || "Failed to create worker");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="max-w-md mx-auto">
        <Card>
          <CardContent>
            <h2 className="text-xl font-semibold mb-4">Add Worker</h2>

            <form onSubmit={handleSubmit} className="space-y-3">
              <TextField fullWidth label="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
              <TextField fullWidth label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <TextField fullWidth label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              {/* Multi-select for shades */}
              <Select
                multiple
                fullWidth
                displayEmpty
                value={shedIds}
                onChange={(e) => setShedIds(e.target.value)}
                input={<OutlinedInput />}
                renderValue={(selected) => {
                  if (selected.length === 0) {
                    return <em>Select Shades (Optional)</em>;
                  }
                  return shades
                    .filter((s) => selected.includes(s.id))
                    .map((s) => s.name)
                    .join(", ");
                }}
              >
                {shades.map((shade) => (
                  <MenuItem key={shade.id} value={shade.id}>
                    <Checkbox checked={shedIds.indexOf(shade.id) > -1} />
                    <ListItemText primary={shade.name} />
                  </MenuItem>
                ))}
              </Select>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex gap-2">
                <Button variant="contained" color="success" type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Worker'}</Button>
                <Button variant="outlined" onClick={() => navigate('/farms')} disabled={loading}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
