import { apiFetch } from './client';

export const cattleApi = {
    // Get cattle by farm ID
    getCattleByFarm: async (farmId) => {
        return apiFetch(`/cattle/farm/${farmId}`);
    },

    // Get cattle by ID
    getCattleById: async (cattleId) => {
        return apiFetch(`/cattle/${cattleId}`);
    },

    // Create cattle
    createCattle: async (cattleData) => {
        return apiFetch('/cattle', {
            method: 'POST',
            body: JSON.stringify(cattleData),
        });
    },

    // Update cattle
    updateCattle: async (cattleId, cattleData) => {
        return apiFetch(`/cattle/${cattleId}`, {
            method: 'PATCH',
            body: JSON.stringify(cattleData),
        });
    },

    // Delete cattle
    deleteCattle: async (cattleId) => {
        return apiFetch(`/cattle/${cattleId}`, {
            method: 'DELETE',
        });
    },
};
