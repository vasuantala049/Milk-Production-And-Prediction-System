import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../api/client";
import { TextField, Button, Card, CardContent } from '@mui/material';

export default function AddWorker() {
  const { farmId } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [shed, setShed] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user.role !== "FARM_OWNER") {
      navigate("/farms");
    }
  }, [navigate]);

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
          shed,
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
              <TextField fullWidth label="Assigned Shed (Optional)" value={shed} onChange={(e) => setShed(e.target.value)} />

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex gap-2">
                <Button variant="contained" color="success" type="submit">{loading ? 'Creating...' : 'Create Worker'}</Button>
                <Button variant="outlined" onClick={() => navigate('/farms')}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
