import { Navigate, useLocation } from "react-router-dom";
import { LoaderCircle, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/useAuth";

function RestoringSession() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-on-primary">
        <ShieldCheck size={20} aria-hidden="true" />
      </span>
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <LoaderCircle size={15} className="animate-spin" aria-hidden="true" />
        Restoring session…
      </div>
    </div>
  );
}

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <RestoringSession />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}