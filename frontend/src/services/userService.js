import { mockUser } from "../data/mockData";
import { delay } from "../lib/async";

// Phase 1: returns mock data. Later replaced by calls to the FastAPI backend.
export async function getCurrentUser() {
  await delay(150);
  return mockUser;
}
