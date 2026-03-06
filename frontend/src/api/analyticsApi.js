// src/api/analyticsApi.js
import { apiFetch } from "./client";

export async function getForecast(farmId) {
  return apiFetch(`/milk/forecast?farmId=${farmId}`);
}

export async function getNextForecast(farmId, days = 7) {
  return apiFetch(`/milk/forecast/next?farmId=${farmId}&days=${days}`);
}

export async function getProductionReport(farmId, days = 30) {
  return apiFetch(`/milk/report?farmId=${farmId}&days=${days}`);
}

export async function getMilkHistory(farmId, days = 7) {
  return apiFetch(`/milk/history?farmId=${farmId}&days=${days}`);
}
