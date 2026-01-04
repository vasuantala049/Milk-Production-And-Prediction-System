import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../api/client";
import { Card, CardContent, Button } from '@mui/material';

export default function WorkersList() {
  const { farmId } = useParams();
  const navigate = useNavigate();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/farms/${farmId}/workers`)
      .then((data) => setWorkers(data || []))
      .catch(() => setWorkers([]))
      .finally(() => setLoading(false));
  }, [farmId]);

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4">
          <Button onClick={() => navigate('/dashboard')} variant="text">← Back to Dashboard</Button>
        </div>

        <h1 className="text-2xl font-bold mb-4">Workers</h1>

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
