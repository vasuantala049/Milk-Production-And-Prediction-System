import { apiFetch } from './client';

export const farmApi = {
  // Get all farms, optionally filtered by location (city/area/address)
  getAllFarms: async (location) => {
    let url = '/farms';
    if (location && location.trim() !== '') {
      url += `?location=${encodeURIComponent(location.trim())}`;
    }
    return apiFetch(url);
  },

  // Get farms by city (backed by the same location parameter)
  getFarmsByCity: async (city) => {
    return apiFetch(`/farms?location=${encodeURIComponent(city)}`);
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
