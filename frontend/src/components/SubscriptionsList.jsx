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
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { subscriptionApi } from '../api/subscriptionApi';

const SubscriptionsList = ({ farmId, initialStatus = 'ACTIVE' }) => {
  const { t } = useTranslation();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState(initialStatus);

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
      setSubscriptions(data);
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
        return 'error';
      case 'COMPLETED':
        return 'info';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
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
          <ToggleButton value="COMPLETED">{t('common.completed')}</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {subscriptions.length === 0 ? (
        <Alert severity="info">{t('subscriptions.noSubscriptionsStatus')}</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>{t('subscriptions.id')}</strong></TableCell>
                <TableCell><strong>{t('subscriptions.customerId')}</strong></TableCell>
                <TableCell><strong>{t('orders.quantityLiters')}</strong></TableCell>
                <TableCell><strong>{t('orders.session')}</strong></TableCell>
                <TableCell><strong>{t('subscriptions.startDate')}</strong></TableCell>
                <TableCell><strong>{t('subscriptions.endDate')}</strong></TableCell>
                <TableCell><strong>{t('orders.status')}</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {subscriptions.map((sub) => (
                <TableRow key={sub.id} hover>
                  <TableCell>{sub.id}</TableCell>
                  <TableCell>
                    {sub.buyerId || 'N/A'}
                    {sub.buyerName ? ` - ${sub.buyerName}` : ''}
                  </TableCell>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        {t('subscriptions.totalSubscriptionsCount', { count: subscriptions.length })}
      </Typography>
    </Box>
  );
};

export default SubscriptionsList;
