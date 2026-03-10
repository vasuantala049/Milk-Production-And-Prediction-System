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
import { subscriptionApi } from '../api/subscriptionApi';

const SubscriptionsList = ({ farmId, initialStatus = 'ACTIVE' }) => {
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
      setError(err.message || 'Failed to load subscriptions');
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
          <ToggleButton value="ALL">All</ToggleButton>
          <ToggleButton value="ACTIVE">Active</ToggleButton>
          <ToggleButton value="CANCELLED">Cancelled</ToggleButton>
          <ToggleButton value="COMPLETED">Completed</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {subscriptions.length === 0 ? (
        <Alert severity="info">No subscriptions found for this farm.</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Customer ID</strong></TableCell>
                <TableCell><strong>Quantity (L)</strong></TableCell>
                <TableCell><strong>Session</strong></TableCell>
                <TableCell><strong>Start Date</strong></TableCell>
                <TableCell><strong>End Date</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
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
                  <TableCell>{sub.endDate || 'Ongoing'}</TableCell>
                  <TableCell>
                    <Chip
                      label={sub.status}
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
        Total Subscriptions: {subscriptions.length}
      </Typography>
    </Box>
  );
};

export default SubscriptionsList;
