import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../api/client";
import { Card, CardContent, Button, TextField, Stack, Alert } from '@mui/material';

export default function WorkersList() {
  const { farmId } = useParams();
  const navigate = useNavigate();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignEmail, setAssignEmail] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState("");
  const [assignSuccess, setAssignSuccess] = useState("");

  useEffect(() => {
    refreshWorkers();
  }, [farmId]);

  const refreshWorkers = () => {
    setLoading(true);
    apiFetch(`/farms/${farmId}/workers`)
      .then((data) => setWorkers(data || []))
      .catch(() => setWorkers([]))
      .finally(() => setLoading(false));
  };

  const handleAssignExisting = async (e) => {
    e.preventDefault();
    setAssignError("");
    setAssignSuccess("");
    if (!assignEmail) {
      setAssignError("Enter a worker email");
      return;
    }
    setAssignLoading(true);
    try {
      await apiFetch(`/farms/${farmId}/assign-worker`, {
        method: "POST",
        body: JSON.stringify({ email: assignEmail })
      });
      setAssignSuccess("Worker assigned");
      setAssignEmail("");
      refreshWorkers();
    } catch (err) {
      setAssignError(err?.message || "Failed to assign worker");
    } finally {
      setAssignLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <Button onClick={() => navigate('/dashboard')} variant="text">← Back to Dashboard</Button>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h1 className="text-2xl font-bold">Workers</h1>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={() => navigate(`/farms/${farmId}/add-worker`)}>Create New Worker</Button>
          </Stack>
        </div>

        <Card className="mb-4">
          <CardContent>
            <form onSubmit={handleAssignExisting}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                <TextField
                  label="Existing Worker Email"
                  type="email"
                  value={assignEmail}
                  onChange={(e) => setAssignEmail(e.target.value)}
                  size="small"
                />
                <Button variant="contained" color="success" type="submit" disabled={assignLoading}>
                  {assignLoading ? "Assigning..." : "Assign to Farm"}
                </Button>
              </Stack>
            </form>
            {assignError && <Alert severity="error" className="mt-2">{assignError}</Alert>}
            {assignSuccess && <Alert severity="success" className="mt-2">{assignSuccess}</Alert>}
          </CardContent>
        </Card>

        {!loading && workers.length === 0 && (
          <p className="italic text-gray-600">No workers assigned to this farm</p>
        )}

        <div className="space-y-3 mb-32">
          {workers.map((w) => (
            <Card key={w.id} className="rounded-xl">
              <CardContent>
                <p className="font-semibold">{w.name}</p>
                <p className="text-xs text-gray-500">{w.email}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
