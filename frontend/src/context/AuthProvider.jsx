import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./auth-context";
import * as authService from "../services/authService";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restore a persisted mock session after a refresh.
    let active = true;
    authService.restoreSession().then((session) => {
      if (active) {
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const session = await authService.login(credentials);
    setUser(session.user);
    return session;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      role: user?.role ?? null,
      isAuthenticated: user !== null,
      isLoading,
      login,
      logout,
    }),
    [user, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}