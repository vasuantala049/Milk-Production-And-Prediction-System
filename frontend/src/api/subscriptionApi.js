import { apiFetch } from './client';

export const subscriptionApi = {
  // Get user's subscriptions
  getMySubscriptions: async () => {
    return apiFetch('/subscriptions/my-subscriptions');
  },

  // Get subscriptions for a specific farm (owner)
  getFarmSubscriptions: async (farmId, page = null, size = null) => {
    let url = `/subscriptions/farm/${farmId}`;
    if (page !== null && size !== null) {
      url += `?page=${page}&size=${size}`;
    }
    return apiFetch(url);
  },

  // Get farm subscriptions by status
  getFarmSubscriptionsByStatus: async (farmId, status) => {
    return apiFetch(`/subscriptions/farm/${farmId}/status/${status}`);
  },

  // Create subscription
  createSubscription: async (subscriptionData) => {
    return apiFetch('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(subscriptionData),
    });
  },

  // Cancel subscription
  cancelSubscription: async (subscriptionId, amount = null) => {
    return apiFetch(`/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
      ...(amount != null ? { body: JSON.stringify({ amount }) } : {}),
    });
  },

  skipToday: async (subscriptionId) => {
    return apiFetch(`/subscriptions/${subscriptionId}/skip-today`, {
      method: 'POST',
    });
  },

  payCycle: async (subscriptionId, amount) => {
    return apiFetch(`/subscriptions/${subscriptionId}/pay-cycle`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  },

  // Approve subscription (Owner) - farm-scoped
  approveSubscription: async (subscriptionId, farmId) => {
    return apiFetch(`/subscriptions/farm/${farmId}/${subscriptionId}/approve`, {
      method: 'POST',
    });
  },

  // Reject subscription (Owner) - farm-scoped
  rejectSubscription: async (subscriptionId, farmId) => {
    return apiFetch(`/subscriptions/farm/${farmId}/${subscriptionId}/reject`, {
      method: 'POST',
    });
  },
};
