// API Client configured for FastAPI backend on http://localhost:8000/api/v1

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

export async function apiClient(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.detail || errorData.message || `Request failed with status ${response.status}`);
      error.status = response.status;
      error.data = errorData;
      throw error;
    }
    return await response.json();
  } catch (err) {
    // Flag network errors
    if (err.name === "TypeError" && err.message.includes("fetch")) {
      err.isNetworkError = true;
      err.message = "The complaint tracking service is unavailable. Start the backend, then try again.";
    }
    throw err;
  }
}

export { BASE_URL };
