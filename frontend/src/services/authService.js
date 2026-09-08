// Mock authentication service.
//
// TEMPORARY: this is mock-only authentication for frontend development. It does
// not contact the FastAPI backend and must not be treated as real security.
// Later phases will replace this module with requests to POST /auth/login and
// POST /auth/register.
//
// The persisted session is stored under "secureDoc.mockSession" in
// localStorage for refresh persistence. It contains demo identity/role
// information only — never passwords, tokens, keys, or document content.

import { delay } from "../lib/async";
import { mockUsers } from "../data/mockData";

export const SESSION_STORAGE_KEY = "secureDoc.mockSession";

// Demo-only credentials, clearly not production values.
const MOCK_CREDENTIALS = [
  { username: "alex.chen", password: "demo-user" },
  { username: "maria.santos", password: "demo-admin" },
];

export const DEMO_ACCOUNTS = [
  { username: "alex.chen", role: "USER", password: "demo-user" },
  { username: "maria.santos", role: "ADMIN", password: "demo-admin" },
];

function buildSession(user) {
  return {
    user: { id: user.id, username: user.username, role: user.role },
    issuedAt: new Date().toISOString(),
  };
}

export async function login({ username, password }) {
  await delay(450);
  const normalized = String(username ?? "")
    .trim()
    .toLowerCase();
  const credential = MOCK_CREDENTIALS.find(
    (candidate) => candidate.username === normalized,
  );
  const user = mockUsers.find(
    (candidate) => candidate.username === normalized,
  );
  if (!credential || !user || credential.password !== password) {
    throw new Error("Invalid username or password.");
  }
  const session = buildSession(user);
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  return session;
}

export async function logout() {
  await delay(150);
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

// Synchronous read of the persisted mock session. Returns null when no valid
// session exists (including tampered or stale stored data).
export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const user = mockUsers.find(
      (candidate) =>
        candidate.username === parsed?.user?.username &&
        candidate.role === parsed?.user?.role,
    );
    if (!user) return null;
    return buildSession(user);
  } catch {
    return null;
  }
}

// Async session restore used by the auth context on startup so the UI can
// show a "restoring session" state. Later this will validate against the
// real backend instead of localStorage.
export async function restoreSession() {
  await delay(120);
  return getSession();
}