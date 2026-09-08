import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { AuthProvider } from "./context/AuthProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleGuard from "./components/RoleGuard";
import EmptyState from "./components/EmptyState";
import AppLayout from "./layouts/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import DocumentsPage from "./pages/DocumentsPage";
import DocumentDetailPage from "./pages/DocumentDetailPage";
import NewDocumentPage from "./pages/NewDocumentPage";
import UploadDocumentPage from "./pages/UploadDocumentPage";
import ScanPage from "./pages/ScanPage";
import AuditPage from "./pages/AuditPage";
import SecurityPage from "./pages/SecurityPage";
import LoginPage from "./pages/LoginPage";

function AuditForbidden() {
  return (
    <div className="mt-6">
      <EmptyState
        icon={ShieldAlert}
        title="Access denied"
        description="Audit trails are available to ADMIN users only."
        action={
          <Link to="/documents" className="btn btn-secondary">
            Back to documents
          </Link>
        }
      />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="documents/new" element={<NewDocumentPage />} />
            <Route path="documents/scan" element={<ScanPage />} />
            <Route path="documents/upload" element={<UploadDocumentPage />} />
            <Route path="documents/:id" element={<DocumentDetailPage />} />
            <Route
              path="documents/:id/audit"
              element={
                <RoleGuard roles={["ADMIN"]} fallback={<AuditForbidden />}>
                  <AuditPage />
                </RoleGuard>
              }
            />
            <Route path="security" element={<SecurityPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;