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
  Stack,
  CircularProgress,
  Alert,
  TextField,
  Button,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { orderApi } from '../api/orderApi';
import { useLazyList } from '../hooks/useLazyList';
import { sortOrdersByDateAndPending } from '../lib/requestSort';

const OrdersList = ({ farmId, initialStatus = 'CONFIRMED' }) => {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);

  const formatTimeSlot = (slot) => {
    if (!slot) return null;
    const [h, m] = String(slot).split(':');
    const hour = Number(h);
    const minute = Number(m);
    if (Number.isNaN(hour) || Number.isNaN(minute)) return String(slot);
    const d = new Date();
    d.setHours(hour, minute, 0, 0);
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  const formatSession = (session) => {
    if (!session) return '--';
    if (session === 'MORNING') return t('common.morning', { defaultValue: 'Morning' });
    if (session === 'EVENING') return t('common.evening', { defaultValue: 'Evening' });
    return String(session);
  };

  const formatOrderSlot = (order) => {
    const formattedSlot = formatTimeSlot(order?.timeSlot);
    if (formattedSlot) return formattedSlot;
    return formatSession(order?.session);
  };
  const {
    visibleItems: visibleOrders,
    hasMore: hasMoreOrders,
    loadMore: loadMoreOrders,
  } = useLazyList(orders, 10, 10);

  useEffect(() => {
    fetchOrders();
  }, [farmId, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      let data = await orderApi.getFarmOrders(farmId);
      if (statusFilter !== 'ALL') {
        data = data.filter(o => o.status === statusFilter);
      }
      setOrders(sortOrdersByDateAndPending(data));
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilter = async () => {
    if (!startDate || !endDate) {
      setError(t('orders.selectDates'));
      return;
    }
    try {
      setLoading(true);
      setError(null);
      let data = await orderApi.getFarmOrdersByDateRange(farmId, startDate, endDate);
      if (statusFilter !== 'ALL') {
        data = data.filter(o => o.status === statusFilter);
      }
      setOrders(sortOrdersByDateAndPending(data));
    } catch (err) {
      setError(err.message || t('orders.failedToFilter'));
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilter = () => {
    setStartDate('');
    setEndDate('');
    setStatusFilter(initialStatus);
    fetchOrders();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'CONFIRMED':
        return 'info';
      case 'PENDING':
        return 'warning';
      case 'CANCELLED':
      case 'TIMEOUT_REJECTED':
        return 'error';
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

  return (
    <Box>
      <Stack direction="row" spacing={2} sx={{ mb: 3 }} alignItems="center">
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
          <ToggleButton value="CONFIRMED">{t('common.approved')}</ToggleButton>
          <ToggleButton value="CANCELLED">{t('orders.rejected')}</ToggleButton>
          <ToggleButton value="PENDING">{t('common.pending')}</ToggleButton>
        </ToggleButtonGroup>

        <Box sx={{ flexGrow: 1 }} />

        <TextField
          label={t('orders.startDate')}
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          size="small"
        />
        <TextField
          label={t('orders.endDate')}
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          size="small"
        />
        <Button variant="contained" onClick={handleDateFilter}>
          {t('common.filter')}
        </Button>
        <Button variant="outlined" onClick={handleClearFilter}>
          {t('orders.clear')}
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {orders.length === 0 ? (
        <Alert severity="info">{t('orders.noOrdersStatus', { status: statusFilter === 'ALL' ? '' : t(`common.${statusFilter.toLowerCase()}`) })}</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>{t('orders.orderId')}</strong></TableCell>
                <TableCell><strong>{t('orders.date')}</strong></TableCell>
                <TableCell><strong>{t('orders.quantityLiters')}</strong></TableCell>
                <TableCell><strong>{t('buyMilk.timeSlot')}</strong></TableCell>
                <TableCell><strong>{t('orders.status')}</strong></TableCell>
                <TableCell><strong>{t('orders.buyerId')}</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleOrders.map((order) => (
                <TableRow key={order.id} hover>
                  <TableCell>{order.displayCode || String(order.id).padStart(6, '0')}</TableCell>
                  <TableCell>{order.orderDate}</TableCell>
                  <TableCell>{order.quantity.toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip
                      label={formatOrderSlot(order)}
                      size="small"
                      color={order.session === 'MORNING' ? 'primary' : 'secondary'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={t(`common.${order.status.toLowerCase()}`, order.status)}
                      size="small"
                      color={getStatusColor(order.status)}
                    />
                  </TableCell>
                  <TableCell>{order.buyerId}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {orders.length > 0 && hasMoreOrders && (
        <Box display="flex" justifyContent="center" sx={{ mt: 2 }}>
          <Button variant="outlined" onClick={loadMoreOrders}>{t('common.loadMore')}</Button>
        </Box>
      )}

      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        {t('orders.totalOrders', { count: orders.length })}
      </Typography>
    </Box>
  );
};

export default OrdersList;
