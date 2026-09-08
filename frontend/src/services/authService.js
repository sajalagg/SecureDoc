// Real authentication service integrated with FastAPI backend.
// Manages authentication tokens and sessions in localStorage.

import {
  apiRequest,
  getStoredSession,
  setStoredSession,
  SESSION_STORAGE_KEY,
} from "./apiClient";

export { SESSION_STORAGE_KEY };

export const DEMO_ACCOUNTS = [
  { username: "alice", role: "USER", password: "AlicePass123!" },
  { username: "admin", role: "ADMIN", password: "AdminPass123!" },
];

export async function login({ username, password }) {
  const normalized = String(username ?? "").trim();
  const data = await apiRequest("/auth/login", {
    method: "POST",
    body: { username: normalized, password },
  });

  const session = {
    token: data.access_token,
    user: data.user,
    issuedAt: new Date().toISOString(),
  };
  setStoredSession(session);
  return session;
}

export async function register({ username, password }) {
  const normalized = String(username ?? "").trim();
  const data = await apiRequest("/auth/register", {
    method: "POST",
    body: { username: normalized, password },
  });

  const session = {
    token: data.access_token,
    user: data.user,
    issuedAt: new Date().toISOString(),
  };
  setStoredSession(session);
  return session;
}

export async function logout() {
  setStoredSession(null);
}

export function getSession() {
  return getStoredSession();
}

export async function restoreSession() {
  const session = getStoredSession();
  if (!session?.token) {
    return null;
  }
  try {
    const user = await apiRequest("/auth/me");
    const updatedSession = {
      ...session,
      user,
    };
    setStoredSession(updatedSession);
    return updatedSession;
  } catch {
    setStoredSession(null);
    return null;
  }
}