import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../api/client";
import BarcodeScanner from "./BarcodeScanner";
import {
  TextField,
  Button,
  Card,
  CardContent,
  MenuItem,
  Stack,
} from "@mui/material";

// Define cattle types and their breeds
const CATTLE_TYPES = {
  "COW": ["Holstein", "Jersey", "Guernsey", "Ayrshire", "Brown Swiss", "Milking Shorthorn", "Sahiwal", "Gir", "Red Sindhi"],
  "BUFFALO": ["Murrah", "Nili Ravi", "Surti", "Jaffarabadi", "Bhadawari"],
  "SHEEP": ["Merino", "Suffolk", "Dorper", "Rambouillet", "Lincoln", "Awassi"],
  "GOAT": ["Saanen", "Toggenburg", "Alpine", "LaMancha", "Boer", "Nubian", "Angora"]
};

export default function AddCattle() {
  const { farmId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user.role !== "FARM_OWNER") {
      navigate(`/cattle/${farmId}`);
    }
  }, [navigate, farmId]);

  const [tagId, setTagId] = useState("");
  const [type, setType] = useState("");
  const [breed, setBreed] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [shedId, setShedId] = useState("");
  const [shades, setShades] = useState([]);
  const [showScanner, setShowScanner] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch(`/farms/${farmId}/sheds`)
      .then((data) => setShades(data || []))
      .catch((err) => console.error("Failed to load shades:", err));
  }, [farmId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
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
      navigate(`/cattle/${farmId}`);
    } catch (err) {
      if (err.status === 409) {
        setError(t('cattle.tagAlreadyExists'));
      } else {
        setError(err.message || t('addCattle.error'));
      }
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3">
            <Button variant="text" onClick={() => navigate(`/cattle/${farmId}`)}>
              {t('common.back')}
            </Button>
            <h1 className="text-lg font-bold">{t('addCattle.title')}</h1>
        </div>
        

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
                  fullWidth
                  label={t('cattle.tagId')}
                  value={tagId}
                  onChange={(e) => setTagId(e.target.value)}
                  placeholder={t('cattle.scanOrEnterTagId')}
                />

                <Button
                  variant="outlined"
                  onClick={() => setShowScanner(true)}
                >
                  {t('cattle.scanBarcode')}
                </Button>

                {showScanner && (
                  <BarcodeScanner
                    onScanSuccess={(value) => {
                      setTagId(value);
                      setShowScanner(false);
                    }}
                    onClose={() => setShowScanner(false)}
                  />
                )}

                <TextField
                  select
                  fullWidth
                  label={t('cattle.typeLabel')}
                  value={type}
                  onChange={(e) => {
                    setType(e.target.value);
                    setBreed("");
                  }}
                >
                  <MenuItem value="COW">{t('cattle.cow')}</MenuItem>
                  <MenuItem value="BUFFALO">{t('cattle.buffalo')}</MenuItem>
                  <MenuItem value="SHEEP">{t('cattle.sheep')}</MenuItem>
                  <MenuItem value="GOAT">{t('cattle.goat')}</MenuItem>
                </TextField>

                {type && (
                  <TextField
                    select
                    fullWidth
                    label={t('cattle.breedLabel')}
                    value={breed}
                    onChange={(e) => setBreed(e.target.value)}
                  >
                    {CATTLE_TYPES[type].map((breedOption) => (
                      <MenuItem key={breedOption} value={breedOption}>
                        {breedOption}
                      </MenuItem>
                    ))}
                  </TextField>
                )}

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

                <Button
                  type="submit"
                  variant="contained"
                  color="success"
                  fullWidth
                >
                  {t('cattle.saveCattle')}
                </Button>
              </Stack>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
