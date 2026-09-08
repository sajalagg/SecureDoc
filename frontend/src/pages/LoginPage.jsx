import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { ChevronDown, LoaderCircle, ShieldCheck, TriangleAlert } from "lucide-react";
import { useAuth } from "../context/useAuth";
import { DEMO_ACCOUNTS } from "../services/authService";

const PIPELINE_STEPS = [
  "Readable document",
  "Sensitive fields detected",
  "Sensitive fragments protected",
  "Protected document",
  "Authorized retrieval",
];

function BrandMark() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-on-primary">
        <ShieldCheck size={18} aria-hidden="true" />
      </span>
      <span className="text-base font-semibold tracking-tight text-text-primary">
        SecureDoc
      </span>
    </span>
  );
}

export default function LoginPage() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  const from = location.state?.from ?? "/";

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  if (isLoading) {
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (pending) return;
    setError(null);
    setPending(true);
    try {
      await login({ username, password });
    } catch (err) {
      setError(err?.message || "Invalid username or password.");
    } finally {
      setPending(false);
    }
  };

  const handleSelectAccount = (account) => {
    setUsername(account.username);
    setPassword(account.password);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-2">
      <section
        className="hidden flex-col justify-between gap-12 border-r border-border p-10 lg:flex"
        aria-label="About SecureDoc"
      >
        <BrandMark />
        <div>
          <p className="tech-label">Selective field-level protection</p>
          <h1 className="mt-3 max-w-md text-3xl font-semibold tracking-tight text-text-primary">
            Protect sensitive fields without locking the entire document.
          </h1>
          <ol className="mt-8 space-y-0">
            {PIPELINE_STEPS.map((step, index) => (
              <li key={step} className="flex items-center gap-3">
                <span className="font-mono text-xs text-text-secondary">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-sm text-text-secondary">{step}</span>
                {index < PIPELINE_STEPS.length - 1 ? (
                  <ChevronDown
                    size={13}
                    className="text-border"
                    aria-hidden="true"
                  />
                ) : null}
              </li>
            ))}
          </ol>
        </div>
        <p className="tech-label">SECUREDOC · AES-256-GCM · RBAC</p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md">
          <div className="mb-6 lg:hidden">
            <BrandMark />
          </div>

          <div className="card p-6 sm:p-8">
            <p className="tech-label">AUTHENTICATION REQUIRED</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-text-primary">
              Sign in to SecureDoc
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              Access the selective document protection workspace.
            </p>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
              <div>
                <label htmlFor="login-username" className="field-label block">
                  Username
                </label>
                <input
                  id="login-username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  aria-invalid={error ? "true" : undefined}
                  aria-describedby={error ? "login-error" : undefined}
                  placeholder="e.g. alice"
                  className="input mt-1.5"
                />
              </div>

              <div>
                <label htmlFor="login-password" className="field-label block">
                  Password
                </label>
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  aria-invalid={error ? "true" : undefined}
                  aria-describedby={error ? "login-error" : undefined}
                  placeholder="••••••••"
                  className="input mt-1.5"
                />
              </div>

              {error ? (
                <div
                  id="login-error"
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-300"
                >
                  <TriangleAlert
                    size={15}
                    className="mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={pending}
                className="btn btn-primary w-full"
              >
                {pending ? (
                  <>
                    <LoaderCircle size={15} className="animate-spin" aria-hidden="true" />
                    Signing in…
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            <div className="mt-6 rounded-xl border border-dashed border-border bg-background/60 p-4">
              <p className="tech-label">Default system accounts (click to fill)</p>
              <ul className="mt-2 space-y-1.5">
                {DEMO_ACCOUNTS.map((account) => (
                  <li key={account.username}>
                    <button
                      type="button"
                      onClick={() => handleSelectAccount(account)}
                      className="w-full text-left font-mono text-xs text-text-secondary hover:text-text-primary rounded p-1 hover:bg-white/5 transition flex items-center justify-between"
                    >
                      <span>
                        <span className="text-text-primary font-semibold">{account.username}</span>
                        {" / "}
                        <span>{account.password}</span>
                      </span>
                      <span className="badge badge-subtle text-primary">{account.role}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-text-secondary">
            Authenticated via FastAPI with JWT Bearer tokens & AES-256-GCM.
          </p>
        </div>
      </section>
    </div>
  );
}