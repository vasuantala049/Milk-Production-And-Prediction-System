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

export default function ShadePage() {
    const { farmId } = useParams();
    const navigate = useNavigate();
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
            setError("Failed to load shades");
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
            setSuccess("Shade created successfully!");
            setNewShadeName("");
            loadShades();
        } catch (err) {
            setError(err?.message || "Failed to create shade.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteShade = async (shedId) => {
        if (!window.confirm("Are you sure you want to delete this shade? Currently assigned cattle and workers will lose this assignment.")) {
            return;
        }

        setError("");
        setSuccess("");
        setActionLoading(true);

        try {
            await apiFetch(`/farms/${farmId}/sheds/${shedId}`, {
                method: "DELETE",
            });
            setSuccess("Shade deleted successfully!");
            loadShades();
        } catch (err) {
            setError(err?.message || "Failed to delete shade.");
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="p-6">Loading shades...</div>;

    return (
        <div className="min-h-screen bg-background px-4 py-6">
            <div className="max-w-2xl mx-auto">
                <div className="mb-4">
                    <Button onClick={() => navigate(-1)} variant="text">
                        ← Back
                    </Button>
                </div>

                <h1 className="text-2xl font-bold mb-6">Manage Shades</h1>

                <Card className="mb-8">
                    <CardContent>
                        <h2 className="text-lg font-semibold mb-4">Add New Shade</h2>
                        <form onSubmit={handleAddShade}>
                            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Shade Name"
                                    placeholder="e.g. Shade North, Lactating"
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
                                    Add Shade
                                </Button>
                            </Stack>
                        </form>

                        {error && <Alert severity="error" className="mt-4">{error}</Alert>}
                        {success && <Alert severity="success" className="mt-4">{success}</Alert>}
                    </CardContent>
                </Card>

                <h2 className="text-lg font-semibold mb-4">Current Shades</h2>

                {shades.length === 0 ? (
                    <p className="text-gray-500 italic">No shades created for this farm yet.</p>
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
