// //const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
// const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://192.168.101.220:8080/api";
// export async function apiFetch(path, options = {}) {
//   const token = localStorage.getItem("token");

//   const headers = {
//     "Content-Type": "application/json",
//     ...(options.headers || {}),
//   };

//   if (token) {
//     headers.Authorization = `Bearer ${token}`;
//   }

//   const res = await fetch(`${API_BASE}${path}`, {
//     ...options,
//     headers,
//   });

//   const text = await res.text();
//   let data;
//   try {
//     data = text ? JSON.parse(text) : null;
//   } catch {
//     data = null;
//   }

//   if (!res.ok) {
//     const message = data?.message || `Request failed (${res.status})`;
//     const error = new Error(message);
//     error.status = res.status;
//     error.data = data;
//     throw error;
//   }

//   return data;
// }


const API_BASE = import.meta.env.URL_BASE || "http://localhost:8080/api";

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

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
