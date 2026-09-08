import { getSession } from "./authService";

// Current user is resolved from the authenticated session. Returns null when there is no active session.
export function getCurrentUser() {
  return getSession()?.user ?? null;
}

// User directory used to resolve user IDs in audit records.
export function getUsers() {
  const current = getCurrentUser();
  const known = [
    { id: 1, username: "Sajal", role: "ADMIN" },
    { id: 2, username: "Sajalagg", role: "USER" },
    { id: 3, username: "sajal", role: "ADMIN" },
    { id: 4, username: "admin", role: "ADMIN" },
    { id: 5, username: "alice", role: "USER" },
  ];
  if (current && !known.some((u) => u.id === current.id)) {
    known.push(current);
  }
  return known;
}