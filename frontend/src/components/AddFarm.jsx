import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../api/client";
import { TextField, Button, Card, CardContent } from '@mui/material';

export default function AddFarm() {
  const navigate = useNavigate();
  const { t } = useTranslation();

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
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    await apiFetch("/farms", {
      method: "POST",
      body: JSON.stringify({ name, address, city }),
    });

    navigate("/farms");
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="max-w-md mx-auto">
         <div className="flex items-center gap-3">
            <Button onClick={() => navigate("/farms")} variant="text">{t('common.back')}</Button>
            <h1 className="text-lg font-bold">{t('addFarm.title')}</h1>
         </div>
        

        <Card className="mt-4">
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <TextField fullWidth label={t('addFarm.farmNameLabel')} value={name} onChange={(e) => setName(e.target.value)} />
              <TextField fullWidth label={t('addFarm.farmAddressLabel')} value={address} onChange={(e) => setAddress(e.target.value)} />
              <TextField fullWidth label={t('farms.city')} value={city} onChange={(e) => setCity(e.target.value)} />
              <Button type="submit" variant="contained" color="success" fullWidth>
                {loading ? t('addFarm.saving') : t('addFarm.saveFarm')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
