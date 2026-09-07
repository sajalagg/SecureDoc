import { useAuth } from "../context/useAuth";

// UX-only role guard for hiding actions a role cannot perform. This is NOT a
// security boundary — real authorization is enforced by the backend.
export default function RoleGuard({ roles = [], children }) {
  const { role } = useAuth();
  if (!roles.includes(role)) {
    return null;
  }
  return children;
}