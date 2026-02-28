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
  cancelSubscription: async (subscriptionId) => {
    return apiFetch(`/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
    });
  },

  // Approve subscription (Owner)
  approveSubscription: async (subscriptionId) => {
    return apiFetch(`/subscriptions/${subscriptionId}/approve`, {
      method: 'POST',
    });
  },

  // Reject subscription (Owner)
  rejectSubscription: async (subscriptionId) => {
    return apiFetch(`/subscriptions/${subscriptionId}/reject`, {
      method: 'POST',
    });
  },
};
