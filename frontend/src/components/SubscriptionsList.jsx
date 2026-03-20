import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
  Box,
  CircularProgress,
  Alert,
  Button,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { subscriptionApi } from '../api/subscriptionApi';
import { useLazyList } from '../hooks/useLazyList';
import { sortSubscriptionsByDateAndPending } from '../lib/requestSort';
import { InlineConfirmDialog } from './ui/InlineConfirmDialog';

const SubscriptionsList = ({ farmId, initialStatus = 'ACTIVE' }) => {
  const { t } = useTranslation();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [processingSubscriptionId, setProcessingSubscriptionId] = useState(null);
  const [confirmSubscriptionId, setConfirmSubscriptionId] = useState(null);
  const {
    visibleItems: visibleSubscriptions,
    hasMore: hasMoreSubscriptions,
    loadMore: loadMoreSubscriptions,
  } = useLazyList(subscriptions, 10, 10);

  useEffect(() => {
    fetchSubscriptions();
  }, [farmId, statusFilter]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      setError(null);
      let data;
      if (statusFilter === 'ALL') {
        data = await subscriptionApi.getFarmSubscriptions(farmId);
      } else {
        data = await subscriptionApi.getFarmSubscriptionsByStatus(farmId, statusFilter);
      }
      setSubscriptions(sortSubscriptionsByDateAndPending(data));
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'CANCELLED':
      case 'TIMEOUT_REJECTED':
        return 'error';
      case 'PENDING':
        return 'warning';
      case 'COMPLETED':
        return 'info';
      default:
        return 'default';
    }
  };

  const handleApproveSubscription = async (subscriptionId) => {
    setProcessingSubscriptionId(subscriptionId);
    try {
      await subscriptionApi.approveSubscription(subscriptionId, farmId);
      setSubscriptions((prev) => {
        const updatedSubscriptions = prev.map((subscription) =>
          subscription.id === subscriptionId
            ? { ...subscription, status: 'ACTIVE' }
            : subscription
        );
        const nextSubscriptions = statusFilter === 'PENDING'
          ? updatedSubscriptions.filter((subscription) => subscription.id !== subscriptionId)
          : updatedSubscriptions;
        return sortSubscriptionsByDateAndPending(nextSubscriptions);
      });
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setProcessingSubscriptionId(null);
    }
  };

  const handleRejectSubscription = async (subscriptionId) => {
    setProcessingSubscriptionId(subscriptionId);
    try {
      await subscriptionApi.rejectSubscription(subscriptionId, farmId);
      setSubscriptions((prev) => {
        const updatedSubscriptions = prev.map((subscription) =>
          subscription.id === subscriptionId
            ? { ...subscription, status: 'CANCELLED' }
            : subscription
        );
        const nextSubscriptions = statusFilter === 'PENDING'
          ? updatedSubscriptions.filter((subscription) => subscription.id !== subscriptionId)
          : updatedSubscriptions;
        return sortSubscriptionsByDateAndPending(nextSubscriptions);
      });
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setProcessingSubscriptionId(null);
      setConfirmSubscriptionId(null);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <ToggleButtonGroup
          value={statusFilter}
          exclusive
          onChange={(e, newValue) => {
            if (newValue !== null) {
              setStatusFilter(newValue);
            }
          }}
          size="small"
        >
          <ToggleButton value="ALL">{t('common.all')}</ToggleButton>
          <ToggleButton value="ACTIVE">{t('common.active')}</ToggleButton>
          <ToggleButton value="CANCELLED">{t('common.cancelled')}</ToggleButton>
          <ToggleButton value="PENDING">{t('common.pending')}</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {subscriptions.length === 0 ? (
        <Alert severity="info">{t('subscriptions.noSubscriptionsStatus')}</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>{t('subscriptions.id')}</strong></TableCell>
                <TableCell><strong>{t('orders.quantityLiters')}</strong></TableCell>
                <TableCell><strong>{t('orders.session')}</strong></TableCell>
                <TableCell><strong>{t('subscriptions.startDate')}</strong></TableCell>
                <TableCell><strong>{t('subscriptions.endDate')}</strong></TableCell>
                <TableCell><strong>{t('orders.status')}</strong></TableCell>
                <TableCell><strong>{t('dashboard.quickActions')}</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleSubscriptions.map((sub) => (
                <TableRow key={sub.id} hover>
                  <TableCell>{sub.displayCode || String(sub.id).padStart(6, '0')}</TableCell>
                  <TableCell>{sub.quantity.toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip
                      label={sub.session}
                      size="small"
                      color={sub.session === 'MORNING' ? 'primary' : 'secondary'}
                    />
                  </TableCell>
                  <TableCell>{sub.startDate}</TableCell>
                  <TableCell>{sub.endDate || t('subscriptions.ongoing')}</TableCell>
                  <TableCell>
                    <Chip
                      label={t(`common.${sub.status.toLowerCase()}`, sub.status)}
                      size="small"
                      color={getStatusColor(sub.status)}
                    />
                  </TableCell>
                  <TableCell>
                    {sub.status === 'PENDING' ? (
                      <Box display="flex" gap={1}>
                        <Button
                          size="small"
                          variant="contained"
                          disabled={processingSubscriptionId === sub.id}
                          onClick={() => handleApproveSubscription(sub.id)}
                        >
                          {processingSubscriptionId === sub.id ? t('pendingOrders.processing') : t('pendingOrders.approve')}
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          disabled={processingSubscriptionId === sub.id}
                          onClick={() => setConfirmSubscriptionId(sub.id)}
                        >
                          {t('pendingOrders.rejectRequest')}
                        </Button>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        -
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {subscriptions.length > 0 && hasMoreSubscriptions && (
        <Box display="flex" justifyContent="center" sx={{ mt: 2 }}>
          <Button variant="outlined" onClick={loadMoreSubscriptions}>{t('common.loadMore')}</Button>
        </Box>
      )}

      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        {t('subscriptions.totalSubscriptionsCount', { count: subscriptions.length })}
      </Typography>

      <InlineConfirmDialog
        open={confirmSubscriptionId != null}
        title={t('common.confirm')}
        message={t('pendingOrders.rejectSubConfirm')}
        confirmLabel={t('pendingOrders.rejectRequest')}
        cancelLabel={t('common.cancel')}
        busy={processingSubscriptionId != null}
        onCancel={() => setConfirmSubscriptionId(null)}
        onConfirm={() => confirmSubscriptionId != null && handleRejectSubscription(confirmSubscriptionId)}
      />
    </Box>
  );
};

export default SubscriptionsList;
