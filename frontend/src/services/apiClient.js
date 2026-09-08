// Central API client for the FastAPI backend.
// Handles authentication headers, JSON/FormData payloads, and unified error parsing.

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
export const SESSION_STORAGE_KEY = "secureDoc.session";

export function getStoredSession() {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredSession(session) {
  if (session) {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }
}

export function getAuthToken() {
  const session = getStoredSession();
  return session?.token || null;
}

export async function apiRequest(path, options = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  const headers = new Headers(options.headers || {});

  const token = getAuthToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let body = options.body;
  if (body && !(body instanceof FormData) && typeof body === "object") {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    body = JSON.stringify(body);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    body,
  });

  if (!response.ok) {
    let errorMessage = `Request failed (${response.status})`;
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        errorMessage = typeof errorData.detail === "string"
          ? errorData.detail
          : JSON.stringify(errorData.detail);
      } else if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
      try {
        const text = await response.text();
        if (text) errorMessage = text;
      } catch {
        // Fallback to default
      }
    }
    const error = new Error(errorMessage);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}
