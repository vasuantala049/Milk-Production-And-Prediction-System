import { apiFetch } from './client';

export const farmApi = {
  // Get all farms
  getAllFarms: async () => {
    return apiFetch('/farms');
  },

  // Get farms by city
  getFarmsByCity: async (city) => {
    return apiFetch(`/farms?city=${encodeURIComponent(city)}`);
  },

  // Get farm by ID
  getFarmById: async (farmId) => {
    return apiFetch(`/farms/${farmId}`);
  },

  // Get farms owned by current user
  getMyFarms: async () => {
    return apiFetch('/farms/my-farms');
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
