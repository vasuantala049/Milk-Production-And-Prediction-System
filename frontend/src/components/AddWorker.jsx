import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [shedIds, setShedIds] = useState([]);
  const [sheds, setSheds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user.role !== "FARM_OWNER") {
      navigate("/farms");
    }
  }, [navigate]);

  useEffect(() => {
    apiFetch(`/farms/${farmId}/sheds`)
      .then((data) => setSheds(data || []))
      .catch((err) => console.error("Failed to load sheds:", err));
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
          shedIds,
        }),
      });

      navigate("/farms");
    } catch (err) {
      setError(err.message || t('addWorker.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="max-w-md mx-auto">
        <Card>
          <CardContent>
            <h2 className="text-xl font-semibold mb-4">{t('workers.addWorkerTitle')}</h2>

            <form onSubmit={handleSubmit} className="space-y-3">
              <TextField fullWidth label={t('workers.fullName')} value={name} onChange={(e) => setName(e.target.value)} required />
              <TextField fullWidth label={t('workers.email')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <TextField fullWidth label={t('auth.password')} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <Select
                multiple
                fullWidth
                displayEmpty
                value={shedIds}
                onChange={(e) => setShedIds(e.target.value)}
                input={<OutlinedInput />}
                renderValue={(selected) => {
                  if (selected.length === 0) {
                    return <em>{t('workers.selectSheds')}</em>;
                  }
                  return sheds
                    .filter((s) => selected.includes(s.id))
                    .map((s) => s.name)
                    .join(", ");
                }}
              >
                {sheds.map((shed) => (
                  <MenuItem key={shed.id} value={shed.id}>
                    <Checkbox checked={shedIds.indexOf(shed.id) > -1} />
                    <ListItemText primary={shed.name} />
                  </MenuItem>
                ))}
              </Select>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex gap-2">
                <Button variant="contained" color="success" type="submit" disabled={loading}>
                  {loading ? t('workers.creating') : t('workers.createWorker')}
                </Button>
                <Button variant="outlined" onClick={() => navigate('/farms')} disabled={loading}>{t('common.cancel')}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
