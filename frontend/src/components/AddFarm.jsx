import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client";
import { TextField, Button, Card, CardContent } from '@mui/material';

export default function AddFarm() {
  const navigate = useNavigate();
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) return;
    const user = JSON.parse(stored);
    if (user.role !== "FARM_OWNER") {
      navigate("/farms");
    }
  }, []);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const user = JSON.parse(localStorage.getItem("user"));
    await apiFetch("/farms", {
      method: "POST",
      body: JSON.stringify({ name, address }),
    });

    navigate("/farms");
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="max-w-md mx-auto">
        <Button onClick={() => navigate("/farms")} variant="text">← Back</Button>

        <Card className="mt-4">
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <TextField fullWidth label="Farm name" value={name} onChange={(e) => setName(e.target.value)} />
              <TextField fullWidth label="Farm address" value={address} onChange={(e) => setAddress(e.target.value)} />
              <Button type="submit" variant="contained" color="success" fullWidth>{loading ? 'Saving...' : 'Save Farm'}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
