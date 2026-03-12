import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../../api/client";
import {
    Card,
    CardContent,
    Button,
    TextField,
    Stack,
    Alert,
    IconButton,
} from "@mui/material";
import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function ShadePage() {
    const { farmId } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [shades, setShades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newShadeName, setNewShadeName] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        // Only FARM_OWNER is allowed
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (user.role !== "FARM_OWNER") {
            navigate(`/dashboard`);
            return;
        }
        loadShades();
    }, [farmId, navigate]);

    const loadShades = async () => {
        setLoading(true);
        try {
            const data = await apiFetch(`/farms/${farmId}/sheds`);
            setShades(data || []);
        } catch (err) {
            setError(t('common.error'));
            setShades([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddShade = async (e) => {
        e.preventDefault();
        if (!newShadeName.trim()) return;

        setError("");
        setSuccess("");
        setActionLoading(true);

        try {
            await apiFetch(`/farms/${farmId}/sheds`, {
                method: "POST",
                body: JSON.stringify({ name: newShadeName.trim() }),
            });
            setSuccess(t('sheds.shadeCreatedSuccess'));
            setNewShadeName("");
            loadShades();
        } catch (err) {
            setError(err?.message || t('sheds.failedToCreateShade'));
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteShade = async (shedId) => {
        if (!window.confirm(t('sheds.deleteShadeConfirm'))) {
            return;
        }

        setError("");
        setSuccess("");
        setActionLoading(true);

        try {
            await apiFetch(`/farms/${farmId}/sheds/${shedId}`, {
                method: "DELETE",
            });
            setSuccess(t('sheds.shadeDeletedSuccess'));
            loadShades();
        } catch (err) {
            setError(err?.message || t('sheds.failedToDeleteShade'));
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="p-6">{t('sheds.loadingShades')}</div>;

    return (
        <div className="min-h-screen bg-background px-4 py-6">
            <div className="max-w-2xl mx-auto">
                <div className="mb-4">
                    <Button onClick={() => navigate(-1)} variant="text">
                        {t('common.back')}
                    </Button>
                </div>

                <h1 className="text-2xl font-bold mb-6">{t('sheds.manageShades')}</h1>

                <Card className="mb-8">
                    <CardContent>
                        <h2 className="text-lg font-semibold mb-4">{t('sheds.addNewShade')}</h2>
                        <form onSubmit={handleAddShade}>
                            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label={t('sheds.shadeName')}
                                    placeholder={t('sheds.shadeNamePlaceholder')}
                                    value={newShadeName}
                                    onChange={(e) => setNewShadeName(e.target.value)}
                                    disabled={actionLoading}
                                />
                                <Button
                                    variant="contained"
                                    color="primary"
                                    type="submit"
                                    disabled={actionLoading || !newShadeName.trim()}
                                    className="whitespace-nowrap"
                                >
                                    {t('sheds.addShadeBtn')}
                                </Button>
                            </Stack>
                        </form>

                        {error && <Alert severity="error" className="mt-4">{error}</Alert>}
                        {success && <Alert severity="success" className="mt-4">{success}</Alert>}
                    </CardContent>
                </Card>

                <h2 className="text-lg font-semibold mb-4">{t('sheds.currentShades')}</h2>

                {shades.length === 0 ? (
                    <p className="text-gray-500 italic">{t('sheds.noShadesCreated')}</p>
                ) : (
                    <div className="space-y-3">
                        {shades.map((shade) => (
                            <Card key={shade.id} className="rounded-xl">
                                <CardContent className="p-4 flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-lg">{shade.name}</p>
                                    </div>
                                    <IconButton
                                        color="error"
                                        onClick={() => handleDeleteShade(shade.id)}
                                        disabled={actionLoading}
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </IconButton>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
