import { apiFetch } from './client';

export const orderApi = {
  // Get user's orders (buyer)
  getMyOrders: async () => {
    return apiFetch('/orders/my-orders');
  },

  // Get orders for a specific farm (owner/worker)
  getFarmOrders: async (farmId, page = null, size = null) => {
    let url = `/orders/farm/${farmId}`;
    if (page !== null && size !== null) {
      url += `?page=${page}&size=${size}`;
    }
    return apiFetch(url);
  },

  // Get farm orders by date range
  getFarmOrdersByDateRange: async (farmId, startDate, endDate) => {
    return apiFetch(
      `/orders/farm/${farmId}/date-range?startDate=${startDate}&endDate=${endDate}`
    );
  },

  // Create order (buy milk)
  createOrder: async (orderData) => {
    // Backend endpoint is /BuyMilk (note the casing)
    return apiFetch('/BuyMilk', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },
};
