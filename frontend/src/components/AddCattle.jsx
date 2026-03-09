import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client";
import BarcodeScanner from "./BarcodeScanner";

import {
  TextField,
  Button,
  Card,
  CardContent,
  MenuItem,
  Stack,
  Typography,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";

const CATTLE_TYPES = {
  COW: ["Holstein Friesian", "Jersey", "Guernsey", "Ayrshire", "Brown Swiss", "Milking Shorthorn", "Gir", "Sahiwal", "Red Sindhi", "Tharparkar", "Rathi", "Kankrej", "Deoni", "HF Cross", "Jersey Cross", "Other"],
  BUFFALO: ["Murrah", "Nili Ravi", "Surti", "Jaffarabadi", "Bhadawari", "Mehsana", "Pandharpuri", "Nagpuri", "Other"],
  GOAT: ["Saanen", "Toggenburg", "Alpine", "LaMancha", "Nubian", "Jamunapari", "Beetal", "Barbari", "Malabari", "Other"]
};
export default function AddCattle() {
  const { farmId } = useParams();
  const navigate = useNavigate();
  const [tagId, setTagId] = useState("");
  const [type, setType] = useState("");
  const [breed, setBreed] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [shedId, setShedId] = useState("");

  const [sheds, setSheds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    loadSheds();
  }, [farmId]);

  const loadSheds = async () => {
    try {
      const data = await apiFetch(`/farms/${farmId}/sheds`);
      setSheds(data || []);
    } catch (err) {
      console.error("Failed to load sheds", err);
    }
  };

  const resetForm = () => {
    setTagId("");
    setType("");
    setBreed("");
    setStatus("ACTIVE");
    setShedId("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!tagId || !type || !breed) {
      setToast({
        open: true,
        message: "Tag, type and breed required",
        severity: "error",
      });
      return;
    }

    try {
      setLoading(true);

      await apiFetch("/cattle", {
        method: "POST",
        body: JSON.stringify({
          tagId,
          breed,
          type,
          status,
          shedId: shedId || null,
          farmId: Number(farmId),
        }),
      });

      resetForm();

      setToast({
        open: true,
        message: "Cattle added",
        severity: "success",
      });
    } catch (err) {
      setToast({
        open: true,
        message: err.message || "Failed to add cattle",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
       <Button variant="text" onClick={() => navigate(`/cattle/${farmId}`)}>
          ← Back
        </Button>
      <Card>
        <CardContent>
          <Typography variant="h6">Add Cattle</Typography>

          <form onSubmit={handleSubmit}>
            <Stack spacing={2} mt={2}>
              <TextField
                label="Tag ID"
                value={tagId}
                onChange={(e) => setTagId(e.target.value)}
              />

              <Button
                variant="outlined"
                onClick={() => setShowScanner(true)}
              >
                Scan Barcode
              </Button>

              {showScanner && (
                <BarcodeScanner
                  onScanSuccess={(v) => {
                    setTagId(v);
                    setShowScanner(false);
                  }}
                  onClose={() => setShowScanner(false)}
                />
              )}

              <TextField
                select
                label="Type"
                value={type}
                onChange={(e) => {
                  setType(e.target.value);
                  setBreed("");
                }}
              >
                <MenuItem value="COW">Cow</MenuItem>
                <MenuItem value="BUFFALO">Buffalo</MenuItem>
                <MenuItem value="SHEEP">Sheep</MenuItem>
                <MenuItem value="GOAT">Goat</MenuItem>
              </TextField>

              {type && (
                <TextField
                  select
                  label="Breed"
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                >
                  {CATTLE_TYPES[type].map((b) => (
                    <MenuItem key={b} value={b}>
                      {b}
                    </MenuItem>
                  ))}
                </TextField>
              )}

              <TextField
                select
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="SICK">Sick</MenuItem>
                <MenuItem value="INACTIVE">Inactive</MenuItem>
              </TextField>

              <TextField
                select
                label="Shed"
                value={shedId}
                onChange={(e) => setShedId(e.target.value)}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>

                {sheds.map((shed) => (
                  <MenuItem key={shed.id} value={shed.id}>
                    {shed.name}
                  </MenuItem>
                ))}
              </TextField>

              <Button type="submit" disabled={loading} variant="contained">
                {loading ? <CircularProgress size={20} /> : "Add Cattle"}
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast({ ...toast, open: false })}
      >
        <Alert severity={toast.severity} variant="filled">
          {toast.message}
        </Alert>
      </Snackbar>
    </div>
  );
}