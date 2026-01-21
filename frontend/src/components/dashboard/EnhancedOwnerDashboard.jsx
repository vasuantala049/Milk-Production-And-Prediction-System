import { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Card,
  CardContent,
  Grid,
  Alert,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  ShoppingCart as OrdersIcon,
  Subscriptions as SubscriptionsIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import OrdersList from '../OrdersList';
import SubscriptionsList from '../SubscriptionsList';
import { apiFetch } from '../../api/client';

function TabPanel({ children, value, index }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      style={{ paddingTop: 24 }}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

export function EnhancedOwnerDashboard() {
  const [tabValue, setTabValue] = useState(0);
  const [activeFarm, setActiveFarm] = useState(null);
  const [stats, setStats] = useState({
    morningMilk: 0,
    eveningMilk: 0,
    totalMilk: 0,
    herdCount: 0,
    workerCount: 0,
  });

  useEffect(() => {
    // Load active farm from localStorage
    try {
      const farmData = localStorage.getItem('activeFarm');
      if (farmData) {
        setActiveFarm(JSON.parse(farmData));
      }
    } catch (error) {
      console.error('Failed to load active farm:', error);
    }
  }, []);

  useEffect(() => {
    if (!activeFarm?.id) return;

    const loadStats = async () => {
      try {
        const [breakdown, herdCount, workerCount] = await Promise.all([
          apiFetch(`/milk/today/breakdown?farmId=${activeFarm.id}`),
          apiFetch(`/farms/${activeFarm.id}/herd-count`),
          apiFetch(`/farms/${activeFarm.id}/worker-count`),
        ]);

        setStats({
          morningMilk: breakdown?.morning || 0,
          eveningMilk: breakdown?.evening || 0,
          totalMilk: (breakdown?.morning || 0) + (breakdown?.evening || 0),
          herdCount: herdCount || 0,
          workerCount: workerCount || 0,
        });
      } catch (error) {
        console.error('Failed to load stats:', error);
      }
    };

    loadStats();
  }, [activeFarm?.id]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (!activeFarm) {
    return (
      <Box p={3}>
        <Alert severity="info">
          Please select a farm to view the dashboard.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          {activeFarm.name}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Farm Owner Dashboard
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="owner dashboard tabs"
        >
          <Tab
            icon={<DashboardIcon />}
            iconPosition="start"
            label="Overview"
          />
          <Tab
            icon={<OrdersIcon />}
            iconPosition="start"
            label="Orders"
          />
          <Tab
            icon={<SubscriptionsIcon />}
            iconPosition="start"
            label="Subscriptions"
          />
          <Tab
            icon={<InventoryIcon />}
            iconPosition="start"
            label="Inventory"
          />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        {/* Overview Tab */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Today's Total Milk
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="primary">
                  {stats.totalMilk.toFixed(1)} L
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  Morning: {stats.morningMilk.toFixed(1)}L | Evening: {stats.eveningMilk.toFixed(1)}L
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Cattle
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {stats.herdCount}
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  Head of cattle
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Workers
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {stats.workerCount}
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  Assigned workers
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Alert severity="info">
              <strong>Note:</strong> Available milk shown to customers is automatically calculated as:
              Total Production - Allocated Orders - Active Subscriptions
            </Alert>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {/* Orders Tab */}
        <OrdersList farmId={activeFarm.id} />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {/* Subscriptions Tab */}
        <SubscriptionsList farmId={activeFarm.id} />
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        {/* Inventory Tab */}
        <Alert severity="info">
          <Typography variant="body2">
            <strong>Inventory Management:</strong> Total production remains unchanged in records.
            Available milk for sale is calculated in real-time by subtracting all allocations
            (orders and subscriptions) from total production.
          </Typography>
        </Alert>
        <Box mt={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Today's Inventory Breakdown
              </Typography>
              <Grid container spacing={2} mt={1}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    Total Production
                  </Typography>
                  <Typography variant="h5" color="success.main">
                    {stats.totalMilk.toFixed(1)} L
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    Allocated
                  </Typography>
                  <Typography variant="h5" color="warning.main">
                    — L
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    (Orders + Subscriptions)
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    Available for Sale
                  </Typography>
                  <Typography variant="h5" color="primary.main">
                    — L
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      </TabPanel>
    </Box>
  );
}

export default EnhancedOwnerDashboard;
