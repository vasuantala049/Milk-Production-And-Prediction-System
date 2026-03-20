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
  TextField,
  Button,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { orderApi } from '../api/orderApi';
import { useLazyList } from '../hooks/useLazyList';
import { sortOrdersByDateAndPending } from '../lib/requestSort';
import { InlineConfirmDialog } from './ui/InlineConfirmDialog';

const OrdersList = ({ farmId, initialStatus = 'CONFIRMED' }) => {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [processingOrderId, setProcessingOrderId] = useState(null);
  const [confirmOrderId, setConfirmOrderId] = useState(null);
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

  const handleApproveOrder = async (orderId) => {
    setProcessingOrderId(orderId);
    try {
      await orderApi.approveOrder(orderId);
      setOrders((prev) => {
        const updatedOrders = prev.map((order) =>
          order.id === orderId ? { ...order, status: 'CONFIRMED' } : order
        );
        const nextOrders = statusFilter === 'PENDING'
          ? updatedOrders.filter((order) => order.id !== orderId)
          : updatedOrders;
        return sortOrdersByDateAndPending(nextOrders);
      });
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleRejectOrder = async (orderId) => {
    setProcessingOrderId(orderId);
    try {
      await orderApi.rejectOrder(orderId);
      setOrders((prev) => {
        const updatedOrders = prev.map((order) =>
          order.id === orderId ? { ...order, status: 'CANCELLED' } : order
        );
        const nextOrders = statusFilter === 'PENDING'
          ? updatedOrders.filter((order) => order.id !== orderId)
          : updatedOrders;
        return sortOrdersByDateAndPending(nextOrders);
      });
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setProcessingOrderId(null);
      setConfirmOrderId(null);
    }
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
                <TableCell><strong>{t('orders.session')}</strong></TableCell>
                <TableCell><strong>{t('orders.status')}</strong></TableCell>
                <TableCell><strong>{t('orders.buyerId')}</strong></TableCell>
                <TableCell><strong>{t('dashboard.quickActions')}</strong></TableCell>
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
                      label={order.timeSlot || order.session}
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
                  <TableCell>
                    {order.status === 'PENDING' ? (
                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          variant="contained"
                          disabled={processingOrderId === order.id}
                          onClick={() => handleApproveOrder(order.id)}
                        >
                          {processingOrderId === order.id ? t('pendingOrders.processing') : t('pendingOrders.approve')}
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          disabled={processingOrderId === order.id}
                          onClick={() => setConfirmOrderId(order.id)}
                        >
                          {t('pendingOrders.rejectRequest')}
                        </Button>
                      </Stack>
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

      {orders.length > 0 && hasMoreOrders && (
        <Box display="flex" justifyContent="center" sx={{ mt: 2 }}>
          <Button variant="outlined" onClick={loadMoreOrders}>{t('common.loadMore')}</Button>
        </Box>
      )}

      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        {t('orders.totalOrders', { count: orders.length })}
      </Typography>

      <InlineConfirmDialog
        open={confirmOrderId != null}
        title={t('common.confirm')}
        message={t('pendingOrders.rejectOrderConfirm')}
        confirmLabel={t('pendingOrders.rejectRequest')}
        cancelLabel={t('common.cancel')}
        busy={processingOrderId != null}
        onCancel={() => setConfirmOrderId(null)}
        onConfirm={() => confirmOrderId != null && handleRejectOrder(confirmOrderId)}
      />
    </Box>
  );
};

export default OrdersList;
