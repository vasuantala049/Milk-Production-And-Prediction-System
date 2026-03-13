import { apiFetch } from './client';

export const farmApi = {
  // Get all farms, optionally filtered by city.
  getAllFarms: async (city) => {
    let url = '/farms';
    if (city && city.trim() !== '') {
      url += `?city=${encodeURIComponent(city.trim())}`;
    }
    return apiFetch(url);
  },

  // Get farms by city.
  getFarmsByCity: async (city) => {
    return apiFetch(`/farms?city=${encodeURIComponent(city)}`);
  },

  // Get farm by ID
  getFarmById: async (farmId) => {
    return apiFetch(`/farms/${farmId}`);
  },

  // Get farms owned by current user
  getMyFarms: async () => {
    return apiFetch('/farms/me');
  },

  // Create farm
  createFarm: async (farmData) => {
    return apiFetch('/farms', {
      method: 'POST',
      body: JSON.stringify(farmData),
    });
  },

  // Update farm
  updateFarm: async (farmId, farmData) => {
    return apiFetch(`/farms/${farmId}`, {
      method: 'PATCH',
      body: JSON.stringify(farmData),
    });
  },
};
