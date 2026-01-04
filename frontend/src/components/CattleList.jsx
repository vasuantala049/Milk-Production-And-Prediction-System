import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../api/client";
import { Button, Card, CardContent } from "@mui/material";

export default function CattleList() {
  const { farmId } = useParams();
  const navigate = useNavigate();
  const [cattle, setCattle] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/cattle/farm/${farmId}`)
      .then((data) => setCattle(data || []))
      .finally(() => setLoading(false));
  }, [farmId]);

  return (
    <div className="min-h-screen bg-gray-200/60 px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back */}
        <div>
          <Button onClick={() => navigate("/dashboard")} variant="text">
            ← Back to Dashboard
          </Button>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Cattle
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            View and manage cattle for this farm
          </p>
        </div>

        {/* Loading / Empty */}
        {loading && (
          <p className="text-sm text-gray-500">
            Loading cattle…
          </p>
        )}

        {!loading && cattle.length === 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm text-gray-600 text-sm">
            No cattle added yet. Start by adding your first cattle.
          </div>
        )}

        {/* List */}
        <div className="space-y-3 mb-36">
          {cattle.map((c) => (
            <Card
              key={c.id}
              className="rounded-2xl cursor-pointer card-hover soft-border bg-white"
              onClick={() => navigate(`/cattle/edit/${farmId}/${c.id}`)}
            >
              <CardContent className="flex flex-col gap-1">
                <p className="font-semibold text-gray-900">
                  Tag ID: {c.tagId}
                </p>
                <p className="text-sm text-gray-500">
                  Breed: {c.breed || "N/A"} · Status: {c.status}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Floating Actions */}
        <div className="fixed bottom-24 right-6">
          <Button
            variant="contained"
            onClick={() => navigate(`/milk/add/${farmId}`)}
            className="!rounded-full !px-5 !py-3 shadow-lg"
          >
            + Add Milk
          </Button>
        </div>

        <div className="fixed bottom-8 right-6">
          <Button
            variant="contained"
            color="success"
            onClick={() => navigate(`/cattle/add/${farmId}`)}
            className="!rounded-full !px-5 !py-3 shadow-lg"
          >
            + Add Cattle
          </Button>
        </div>
      </div>
    </div>
  );
}
