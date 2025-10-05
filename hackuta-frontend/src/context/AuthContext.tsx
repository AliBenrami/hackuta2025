"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  destroySession,
  getCurrentUser,
  getLoginUrl,
  getLogoutUrl,
  getSignupUrl,
  persistSession,
  setSessionToken as setSessionTokenInStorage,
  type User,
} from "@/lib/api";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: () => void;
  signup: () => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setSessionToken: (token: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
  initialUser?: User | null;
}

export function AuthProvider({
  children,
  initialUser = null,
}: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [loading, setLoading] = useState(!initialUser);
  const [error, setError] = useState<string | null>(null);

  const loadUser = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch user";
      setError(message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const setSessionToken = useCallback(
    async (token: string) => {
      if (!token) return;

      setLoading(true);
      setError(null);
      setSessionTokenInStorage(token);
      await persistSession(token);
      await loadUser();
    },
    [loadUser]
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      void loadUser();
      return;
    }

    const url = new URL(window.location.href);
    const token = url.searchParams.get("token");
    const authError = url.searchParams.get("error");

    if (authError) {
      setError(decodeURIComponent(authError));
      url.searchParams.delete("error");
      const newSearch = url.searchParams.toString();
      const cleanedUrl = `${url.pathname}${newSearch ? `?${newSearch}` : ""}${
        url.hash
      }`;
      window.history.replaceState({}, "", cleanedUrl);
    }

    if (token) {
      void (async () => {
        await setSessionToken(token);
        const redirectPath = url.searchParams.get("redirect") ?? "/dashboard";
        url.searchParams.delete("token");
        url.searchParams.delete("redirect");
        const newSearch = url.searchParams.toString();
        const cleanedUrl = `${url.pathname}${newSearch ? `?${newSearch}` : ""}${
          url.hash
        }`;
        window.history.replaceState({}, "", cleanedUrl);

        if (redirectPath && redirectPath.startsWith("/")) {
          window.location.replace(redirectPath);
        }
      })();
    } else {
      void loadUser();
    }
  }, [loadUser, setSessionToken]);

  const login = useCallback(() => {
    window.location.href = getLoginUrl();
  }, []);

  const signup = useCallback(() => {
    window.location.href = getSignupUrl();
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await destroySession(false);
      try {
        await fetch(getLogoutUrl(), { credentials: "include" });
      } catch (logoutError) {
        console.error("Failed to call backend logout", logoutError);
      }
    } finally {
      setUser(null);
      setLoading(false);
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading: loading,
      error,
      login,
      signup,
      logout,
      refreshUser: loadUser,
      setSessionToken,
    }),
    [user, loading, error, login, signup, logout, loadUser, setSessionToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
