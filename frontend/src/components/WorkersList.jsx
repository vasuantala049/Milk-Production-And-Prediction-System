import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../api/client";
import { Card, CardContent, Button, TextField, Stack, Alert, Select, MenuItem, OutlinedInput, Checkbox, ListItemText } from '@mui/material';

export default function WorkersList() {
  const { farmId } = useParams();
  const navigate = useNavigate();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignEmail, setAssignEmail] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState("");
  const [assignSuccess, setAssignSuccess] = useState("");

  // New state for shades and inline editing
  const [shades, setShades] = useState([]);
  const [editingWorkerId, setEditingWorkerId] = useState(null);
  const [editShedIds, setEditShedIds] = useState([]);

  useEffect(() => {
    refreshWorkers();
    loadShades();
  }, [farmId]);

  const loadShades = async () => {
    try {
      const data = await apiFetch(`/farms/${farmId}/sheds`);
      setShades(data || []);
    } catch (err) {
      console.error("Failed to load shades:", err);
    }
  };

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



        <Card className="mb-4">
          <CardContent>
            <form onSubmit={handleAssignExisting}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                <TextField
                  label="Worker Email"
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
          {workers.map((w) => {
            const isEditing = editingWorkerId === w.id;
            // w.sheds is now an array of objects: [{ id, name }]
            const currentShadesText = w.sheds && w.sheds.length > 0
              ? w.sheds.map(s => s.name).join(", ")
              : "All Sheds / Unassigned";

            return (
              <Card key={w.id} className="rounded-xl">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center w-full">
                    <div>
                      <p className="font-semibold text-lg">{w.name}</p>
                      <p className="text-sm text-gray-500">{w.email}</p>
                    </div>
                    <div className="text-right min-w-[250px]">
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Assigned Shades</p>

                      {isEditing ? (
                        <div className="flex flex-col gap-2">
                          <Select
                            multiple
                            size="small"
                            displayEmpty
                            value={editShedIds}
                            onChange={(e) => setEditShedIds(e.target.value)}
                            input={<OutlinedInput size="small" />}
                            renderValue={(selected) => {
                              if (selected.length === 0) return <em>None</em>;
                              return shades
                                .filter((s) => selected.includes(s.id))
                                .map((s) => s.name)
                                .join(", ");
                            }}
                          >
                            {shades.map((shade) => (
                              <MenuItem key={shade.id} value={shade.id}>
                                <Checkbox checked={editShedIds.indexOf(shade.id) > -1} />
                                <ListItemText primary={shade.name} />
                              </MenuItem>
                            ))}
                          </Select>
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => setEditingWorkerId(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              onClick={async () => {
                                try {
                                  await apiFetch(`/farms/${farmId}/workers/${w.id}/shed`, {
                                    method: "PATCH",
                                    body: JSON.stringify({ shedIds: editShedIds })
                                  });
                                  setEditingWorkerId(null);
                                  refreshWorkers();
                                } catch (e) {
                                  alert(e.message);
                                }
                              }}
                            >
                              Save
                            </Button>
                          </Stack>
                        </div>
                      ) : (
                        <>
                          <p className="font-medium text-gray-700 mb-2">{currentShadesText}</p>
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => {
                              setEditShedIds((w.sheds || []).map(s => s.id));
                              setEditingWorkerId(w.id);
                            }}
                          >
                            Edit Shades
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
