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
    Chip,
} from "@mui/material";
import { Trash2, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLazyList } from "../../hooks/useLazyList";
import { InlineConfirmDialog } from "../ui/InlineConfirmDialog";

export default function ShadePage() {
    const { farmId } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [shades, setShades] = useState([]);
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newShadeName, setNewShadeName] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [confirmShedId, setConfirmShedId] = useState(null);
    const {
        visibleItems: visibleShades,
        hasMore: hasMoreShades,
        loadMore: loadMoreShades,
    } = useLazyList(shades, 8, 8);

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
            const [shadesData, workersData] = await Promise.all([
                apiFetch(`/farms/${farmId}/sheds`),
                apiFetch(`/farms/${farmId}/workers`).catch(() => []),
            ]);
            setShades(shadesData || []);
            setWorkers(Array.isArray(workersData) ? workersData : []);
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
            setConfirmShedId(null);
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
                        {visibleShades.map((shade) => {
                            const shedWorkers = workers.filter(w =>
                                Array.isArray(w.sheds) && w.sheds.some(s => s.id === shade.id)
                            );
                            return (
                            <Card key={shade.id} className="rounded-xl">
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <p className="font-semibold text-lg">{shade.name}</p>
                                            {shedWorkers.length > 0 ? (
                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                    <Users className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                                                    {shedWorkers.map(w => (
                                                        <Chip
                                                            key={w.id}
                                                            label={w.name}
                                                            size="small"
                                                            variant="outlined"
                                                            className="text-xs"
                                                        />
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-gray-400 mt-1 italic">{t('sheds.noWorkersAssigned')}</p>
                                            )}
                                        </div>
                                        <IconButton
                                            color="error"
                                            onClick={() => setConfirmShedId(shade.id)}
                                            disabled={actionLoading}
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </IconButton>
                                    </div>
                                </CardContent>
                            </Card>
                            );
                        })}
                    </div>
                )}

                {shades.length > 0 && hasMoreShades && (
                    <div className="flex justify-center mt-4">
                        <Button variant="outlined" onClick={loadMoreShades}>{t('common.loadMore')}</Button>
                    </div>
                )}

                <InlineConfirmDialog
                    open={confirmShedId != null}
                    title={t('common.confirm')}
                    message={t('sheds.deleteShadeConfirm')}
                    confirmLabel={t('common.delete')}
                    cancelLabel={t('common.cancel')}
                    busy={actionLoading}
                    onCancel={() => setConfirmShedId(null)}
                    onConfirm={() => confirmShedId != null && handleDeleteShade(confirmShedId)}
                />
            </div>
        </div>
    );
}
