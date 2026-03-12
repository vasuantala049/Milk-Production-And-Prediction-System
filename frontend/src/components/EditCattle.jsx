// Define cattle types and their breeds (same as AddCattle.jsx)
const CATTLE_TYPES = {
  "COW": ["Holstein", "Jersey", "Guernsey", "Ayrshire", "Brown Swiss", "Milking Shorthorn", "Sahiwal", "Gir", "Red Sindhi"],
  "BUFFALO": ["Murrah", "Nili Ravi", "Surti", "Jaffarabadi", "Bhadawari"],
  "SHEEP": ["Merino", "Suffolk", "Dorper", "Rambouillet", "Lincoln", "Awassi"],
  "GOAT": ["Saanen", "Toggenburg", "Alpine", "LaMancha", "Boer", "Nubian", "Angora"]
};

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../api/client";
import {
  TextField,
  Button,
  Card,
  CardContent,
  Stack,
  MenuItem,
} from "@mui/material";

export default function EditCattle() {
  const { farmId, cattleId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [status, setStatus] = useState("ACTIVE");
  const [shedId, setShedId] = useState("");
  const [shades, setShades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user.role !== "FARM_OWNER") {
      navigate(`/cattle/${farmId}`);
      return;
    }

    let mounted = true;

    async function load() {
      try {
        const [dto, shadesData] = await Promise.all([
          apiFetch(`/cattle/${cattleId}`),
          apiFetch(`/farms/${farmId}/sheds`).catch(() => [])
        ]);
        if (!mounted) return;
        setStatus(dto.status || "ACTIVE");
        setShedId(dto.shed?.id || "");
        setShades(shadesData || []);
      } catch (err) {
        setError(err.message || t('cattle.cattleUpdatedSuccess'));
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [cattleId, navigate, farmId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await apiFetch(`/cattle/${cattleId}`, {
        method: "PATCH",
        body: JSON.stringify({ status, shedId: shedId || null }),
      });
      navigate(`/cattle/${farmId}`);
    } catch (err) {
      setError(err.message || t('addCattle.error'));
    }
  };

  if (loading) {
    return <div className="p-6">{t('common.loading')}</div>;
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="max-w-md mx-auto">
        <Button
          onClick={() => navigate(`/cattle/${farmId}`)}
          variant="text"
        >
          {t('common.back')}
        </Button>

        <Card className="mt-4">
          <CardContent>
            {error && (
              <div className="text-red-600 font-semibold mb-2">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <TextField
                  select
                  fullWidth
                  label={t('cattle.statusLabel')}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <MenuItem value="ACTIVE">{t('cattle.active')}</MenuItem>
                  <MenuItem value="SICK">{t('cattle.sick')}</MenuItem>
                  <MenuItem value="INACTIVE">{t('cattle.inactive')}</MenuItem>
                </TextField>

                <TextField
                  select
                  fullWidth
                  label={t('cattle.shadeOptional')}
                  value={shedId}
                  onChange={(e) => setShedId(e.target.value)}
                >
                  <MenuItem value=""><em>{t('cattle.none')}</em></MenuItem>
                  {shades.map((shade) => (
                    <MenuItem key={shade.id} value={shade.id}>
                      {shade.name}
                    </MenuItem>
                  ))}
                </TextField>

                <Stack direction="row" spacing={2}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="success"
                    fullWidth
                  >
                    {t('cattle.saveChanges')}
                  </Button>

                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => navigate(`/cattle/${farmId}`)}
                  >
                    {t('common.cancel')}
                  </Button>
                </Stack>
              </Stack>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
