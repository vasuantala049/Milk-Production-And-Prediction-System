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
import { orderApi } from '../api/orderApi';

const OrdersList = ({ farmId, initialStatus = 'CONFIRMED' }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);

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
      setOrders(data);
    } catch (err) {
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilter = async () => {
    if (!startDate || !endDate) {
      alert('Please select both start and end dates');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      let data = await orderApi.getFarmOrdersByDateRange(farmId, startDate, endDate);
      if (statusFilter !== 'ALL') {
        data = data.filter(o => o.status === statusFilter);
      }
      setOrders(data);
    } catch (err) {
      setError(err.message || 'Failed to filter orders');
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

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
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
          <ToggleButton value="ALL">All</ToggleButton>
          <ToggleButton value="CONFIRMED">Approved</ToggleButton>
          <ToggleButton value="CANCELLED">Cancelled</ToggleButton>
        </ToggleButtonGroup>

        <Box sx={{ flexGrow: 1 }} />

        <TextField
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          size="small"
        />
        <TextField
          label="End Date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          size="small"
        />
        <Button variant="contained" onClick={handleDateFilter}>
          Filter
        </Button>
        <Button variant="outlined" onClick={handleClearFilter}>
          Clear
        </Button>
      </Stack>

      {orders.length === 0 ? (
        <Alert severity="info">No {statusFilter.toLowerCase()} orders found for this farm.</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Order ID</strong></TableCell>
                <TableCell><strong>Date</strong></TableCell>
                <TableCell><strong>Quantity (L)</strong></TableCell>
                <TableCell><strong>Session</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Buyer ID</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id} hover>
                  <TableCell>{order.id}</TableCell>
                  <TableCell>{order.orderDate}</TableCell>
                  <TableCell>{order.quantity.toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip
                      label={order.session}
                      size="small"
                      color={order.session === 'MORNING' ? 'primary' : 'secondary'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={order.status}
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

      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        Total Orders: {orders.length}
      </Typography>
    </Box>
  );
};

export default OrdersList;
