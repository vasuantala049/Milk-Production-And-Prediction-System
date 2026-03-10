import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
 import { apiFetch } from "../../api/client";
import {
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Stack,
  CircularProgress,
} from "@mui/material";

export default function ShedPage() {
  const { farmId } = useParams();

  const [sheds, setSheds] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  const loadSheds = async () => {
    try {
      const data = await apiFetch(`/farms/${farmId}/sheds`);
      setSheds(data || []);
    } catch (err) {
      console.error("Failed to fetch sheds", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSheds();
  }, [farmId]);

  const createShed = async () => {
    if (!name.trim()) return;

    try {
      const newShed = await apiFetch(`/farms/${farmId}/sheds`, {
        method: "POST",
        body: JSON.stringify({ name }),
      });

      setSheds((prev) => [...prev, newShed]);
      setName("");
    } catch (err) {
      console.error("Create shed failed", err);
    }
  };

  const deleteShed = async (shedId) => {
    try {
      await apiFetch(`/farms/${farmId}/sheds/${shedId}`, {
        method: "DELETE",
      });

      setSheds((prev) => prev.filter((s) => s.id !== shedId));
    } catch (err) {
      console.error("Delete shed failed", err);
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardContent>
          <Typography variant="h6">Farm Sheds</Typography>

          <Stack spacing={2} mt={2}>
            <TextField
              label="Shed name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <Button variant="contained" onClick={createShed}>
              Add Shed
            </Button>
          </Stack>

          <Stack spacing={1} mt={3}>
            {sheds.map((shed) => (
              <Card key={shed.id}>
                <CardContent
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <Typography>{shed.name}</Typography>

                  <Button
                    color="error"
                    onClick={() => deleteShed(shed.id)}
                  >
                    Delete
                  </Button>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </div>
  );
}