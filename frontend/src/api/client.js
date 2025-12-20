const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });
  } catch (networkErr) {
    console.error("Network error fetching", `${API_BASE}${path}`, networkErr);
    const error = new Error(
      `Network error: failed to reach API at ${API_BASE}${path}. Check backend server and CORS settings.`
    );
    error.code = "NETWORK_ERROR";
    throw error;
  }

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!res.ok) {
    const message = data?.message || `Request failed (${res.status})`;
    const error = new Error(message);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}


