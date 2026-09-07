import { getSession } from "./authService";

// Current user is resolved from the authenticated session (mock today, real
// backend session later). Returns null when there is no active session.
export function getCurrentUser() {
  return getSession()?.user ?? null;
}