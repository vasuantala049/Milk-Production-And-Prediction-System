import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../api/client";
import { useLazyList } from "../hooks/useLazyList";
import { Card, CardContent, Button, TextField, Stack, Alert, Select, MenuItem, OutlinedInput, Checkbox, ListItemText, Chip } from '@mui/material';
import { Trash2 } from "lucide-react";
import { InlineMessage } from "./ui/InlineMessage";
import { InlineConfirmDialog } from "./ui/InlineConfirmDialog";

export default function WorkersList() {
  const { farmId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignEmail, setAssignEmail] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState("");
  const [assignSuccess, setAssignSuccess] = useState("");
  const [pendingInvitations, setPendingInvitations] = useState([]);

  const [shades, setShades] = useState([]);
  const [editingWorkerId, setEditingWorkerId] = useState(null);
  const [editShedIds, setEditShedIds] = useState([]);
  const [deletingWorkerId, setDeletingWorkerId] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [confirmWorker, setConfirmWorker] = useState(null);

  const {
    visibleItems: visibleInvitations,
    hasMore: hasMoreInvitations,
    loadMore: loadMoreInvitations,
  } = useLazyList(pendingInvitations, 5, 5);

  const {
    visibleItems: visibleWorkers,
    hasMore: hasMoreWorkers,
    loadMore: loadMoreWorkers,
  } = useLazyList(workers, 8, 8);

  const handleDeleteWorker = async (worker) => {
    setDeletingWorkerId(worker.id);
    try {
      await apiFetch(`/farms/${farmId}/workers/${worker.id}`, { method: "DELETE" });
      refreshWorkers();
      setMessage({ type: "success", text: t('workers.workerDeletedSuccess') });
    } catch (err) {
      setMessage({ type: "error", text: err?.message || t('messages.errorOccurred') });
    } finally {
      setDeletingWorkerId(null);
      setConfirmWorker(null);
    }
  };

  useEffect(() => {
    refreshWorkers();
    loadShades();
    refreshInvitations();
  }, [farmId]);

  const loadShades = async () => {
    try {
      const data = await apiFetch(`/farms/${farmId}/sheds`);
      setShades(data || []);
    } catch (err) {
      console.error("Failed to load shades:", err);
    }
  };

  const refreshWorkers = () => {
    setLoading(true);
    apiFetch(`/farms/${farmId}/workers`)
      .then((data) => setWorkers(data || []))
      .catch(() => setWorkers([]))
      .finally(() => setLoading(false));
  };

  const refreshInvitations = async () => {
    try {
      const data = await apiFetch(`/farms/${farmId}/invitations`);
      setPendingInvitations(data || []);
    } catch (err) {
      setPendingInvitations([]);
    }
  };

  const handleAssignExisting = async (e) => {
    e.preventDefault();
    setAssignError("");
    setAssignSuccess("");
    if (!assignEmail) {
      setAssignError(t('workers.enterWorkerEmail'));
      return;
    }
    setAssignLoading(true);
    try {
      await apiFetch(`/farms/${farmId}/assign-worker`, {
        method: "POST",
        body: JSON.stringify({ email: assignEmail })
      });
      setAssignSuccess(t('workers.invitationSent'));
      setAssignEmail("");
      refreshInvitations();
    } catch (err) {
      setAssignError(err?.message || t('workers.assignError'));
    } finally {
      setAssignLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="max-w-4xl mx-auto">
        <InlineMessage
          type={message.type}
          message={message.text}
          onClose={() => setMessage({ type: "", text: "" })}
          className="mb-4"
        />

        <div className="mb-4">
          <Button onClick={() => navigate('/dashboard')} variant="text">{t('workers.backToDashboard')}</Button>
        </div>

        {/* Send invitation card */}
        <Card className="mb-4">
          <CardContent>
            <p className="text-sm text-gray-500 mb-3">{t('workers.invitationHint')}</p>
            <form onSubmit={handleAssignExisting}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                <TextField
                  label={t('workers.workerEmail')}
                  type="email"
                  value={assignEmail}
                  onChange={(e) => setAssignEmail(e.target.value)}
                  size="small"
                />
                <Button variant="contained" color="success" type="submit" disabled={assignLoading}>
                  {assignLoading ? t('workers.assignLoading') : t('workers.sendInvitation')}
                </Button>
              </Stack>
            </form>
            {assignError && <Alert severity="error" className="mt-2">{assignError}</Alert>}
            {assignSuccess && <Alert severity="success" className="mt-2">{assignSuccess}</Alert>}
          </CardContent>
        </Card>

        {/* Pending invitations */}
        {pendingInvitations.length > 0 && (
          <Card className="mb-4">
            <CardContent>
              <p className="font-semibold mb-2">{t('workers.pendingInvitations')} ({pendingInvitations.length})</p>
              <div className="space-y-2">
                {visibleInvitations.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between border rounded-lg px-3 py-2">
                    <div>
                      <p className="font-medium">{inv.workerName}</p>
                      <p className="text-sm text-gray-500">{inv.workerEmail}</p>
                    </div>
                    <Chip label={t('workers.awaitingResponse')} color="warning" size="small" />
                  </div>
                ))}
              </div>
              {hasMoreInvitations && (
                <div className="flex justify-center mt-3">
                  <Button variant="outlined" onClick={loadMoreInvitations}>{t('common.loadMore')}</Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!loading && workers.length === 0 && (
          <p className="italic text-gray-600">{t('workers.noWorkersAssigned')}</p>
        )}

        <div className="space-y-3 mb-32">
          {visibleWorkers.map((w) => {
            const isEditing = editingWorkerId === w.id;
            const currentShadesText = w.sheds && w.sheds.length > 0
              ? w.sheds.map(s => s.name).join(", ")
              : t('workers.allShedsUnassigned');

            return (
              <Card key={w.id} className="rounded-xl">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start w-full gap-3">
                    <div className="flex-1">
                      <p className="font-semibold text-lg">{w.name}</p>
                      <p className="text-sm text-gray-500">{w.email}</p>
                    </div>
                    <div className="text-right min-w-[250px]">
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{t('workers.assignedShades')}</p>

                      {isEditing ? (
                        <div className="flex flex-col gap-2">
                          <Select
                            multiple
                            size="small"
                            displayEmpty
                            value={editShedIds}
                            onChange={(e) => setEditShedIds(e.target.value)}
                            input={<OutlinedInput size="small" />}
                            renderValue={(selected) => {
                              if (selected.length === 0) return <em>{t('cattle.none')}</em>;
                              return shades
                                .filter((s) => selected.includes(s.id))
                                .map((s) => s.name)
                                .join(", ");
                            }}
                          >
                            {shades.map((shade) => (
                              <MenuItem key={shade.id} value={shade.id}>
                                <Checkbox checked={editShedIds.indexOf(shade.id) > -1} />
                                <ListItemText primary={shade.name} />
                              </MenuItem>
                            ))}
                          </Select>
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => setEditingWorkerId(null)}
                            >
                              {t('common.cancel')}
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              onClick={async () => {
                                try {
                                  await apiFetch(`/farms/${farmId}/workers/${w.id}/shed`, {
                                    method: "PATCH",
                                    body: JSON.stringify({ shedIds: editShedIds })
                                  });
                                  setEditingWorkerId(null);
                                  refreshWorkers();
                                  setMessage({ type: "success", text: t('common.success') });
                                } catch (e) {
                                  setMessage({ type: "error", text: e.message || t('messages.errorOccurred') });
                                }
                              }}
                            >
                              {t('common.save')}
                            </Button>
                          </Stack>
                        </div>
                      ) : (
                        <>
                          <p className="font-medium text-gray-700 mb-2">{currentShadesText}</p>
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => {
                              setEditShedIds((w.sheds || []).map(s => s.id));
                              setEditingWorkerId(w.id);
                            }}
                          >
                            {t('workers.editShades')}
                          </Button>
                        </>
                      )}
                    </div>
                    <button
                      title="Remove worker"
                      disabled={deletingWorkerId === w.id}
                      onClick={() => setConfirmWorker(w)}
                      className="ml-2 p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {hasMoreWorkers && (
          <div className="flex justify-center mb-32">
            <Button variant="outlined" onClick={loadMoreWorkers}>{t('common.loadMore')}</Button>
          </div>
        )}

        <InlineConfirmDialog
          open={confirmWorker != null}
          title={t('common.confirm')}
          message={confirmWorker ? `Remove "${confirmWorker.name}" from this farm? They will also be unassigned from all sheds.` : ""}
          confirmLabel={t('common.delete')}
          cancelLabel={t('common.cancel')}
          busy={deletingWorkerId != null}
          onCancel={() => setConfirmWorker(null)}
          onConfirm={() => confirmWorker && handleDeleteWorker(confirmWorker)}
        />
      </div>
    </div>
  );
}
