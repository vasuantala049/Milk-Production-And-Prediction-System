import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../api/client";
import { DashboardLayout } from "./layout/DashboardLayout";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { motion } from "framer-motion";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";

export default function EditFarm() {
    const { farmId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        address: "",
    });

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (user.role !== "FARM_OWNER") {
            navigate("/farms");
            return;
        }

        console.log("EditFarm mounted. FarmID:", farmId);
        setLoading(true);
        apiFetch(`/farms/${farmId}`)
            .then((data) => {
                setFormData({
                    name: data.name || "",
                    address: data.address || "",
                });
            })
            .catch((err) => {
                setError(err.message || "Failed to load farm details.");
            })
            .finally(() => setLoading(false));
    }, [farmId, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");

        try {
            await apiFetch(`/farms/${farmId}`, {
                method: "PATCH",
                body: JSON.stringify(formData),
            });
            navigate("/farms");
        } catch (err) {
            setError(err.message || "Failed to update farm.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <p className="text-muted-foreground">Loading farm details...</p>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-2xl mx-auto space-y-6">
                <Button
                    variant="ghost"
                    onClick={() => navigate("/farms")}
                    className="gap-2 -ml-2"
                >
                    <ArrowBackIcon fontSize="small" />
                    Back to Farms
                </Button>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-2xl font-display">Edit Farm</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Farm Name</label>
                                    <Input
                                        required
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({ ...formData, name: e.target.value })
                                        }
                                        placeholder="e.g. Green Valley Dairy"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Address</label>
                                    <Input
                                        required
                                        value={formData.address}
                                        onChange={(e) =>
                                            setFormData({ ...formData, address: e.target.value })
                                        }
                                        placeholder="e.g. 123 Farm Lane"
                                    />
                                </div>

                                {error && (
                                    <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                                        {error}
                                    </p>
                                )}

                                <div className="pt-4">
                                    <Button type="submit" className="w-full gap-2" disabled={saving}>
                                        <SaveIcon fontSize="small" />
                                        {saving ? "Saving Changes..." : "Save Changes"}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </DashboardLayout>
    );
}
