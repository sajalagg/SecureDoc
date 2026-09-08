import { getSession } from "./authService";
import { mockUsers } from "../data/mockData";

// Current user is resolved from the authenticated session (mock today, real
// backend session later). Returns null when there is no active session.
export function getCurrentUser() {
  return getSession()?.user ?? null;
}

// Mock user directory used to resolve user IDs in audit records.
export function getUsers() {
  return mockUsers;
}