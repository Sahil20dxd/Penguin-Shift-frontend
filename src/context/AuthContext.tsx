// src/context/AuthContext.tsx
import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

const API_BASE = "https://penguinshift-production.up.railway.app/";

export interface User {
  name: string;
  email: string;
  username: string;
}

type AuthFetchInit = RequestInit & { json?: unknown };

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (userData: User, token?: string) => void;
  logout: () => void;
  getToken: () => string | null;
  authFetch: (input: RequestInfo | URL, init?: AuthFetchInit) => Promise<Response>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

function looksLikeJwt(t: string | null | undefined) {
  if (!t) return false;
  const parts = t.split(".");
  return parts.length === 3 && parts.every(Boolean);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const getToken = useCallback(() => token ?? localStorage.getItem("authToken"), [token]);

  const isAuthenticated = !!user;

  const authFetch = useCallback(
    async (input: RequestInfo | URL, init: AuthFetchInit = {}) => {
      const maybeToken = getToken();
      const headers = new Headers(init.headers || {});
      if (looksLikeJwt(maybeToken)) {
        headers.set("Authorization", `Bearer ${maybeToken}`);
      }
      if (init.json !== undefined) headers.set("Content-Type", "application/json");

      return fetch(input, {
        ...init,
        headers,
        credentials: "include",
        body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
      });
    },
    [getToken]
  );

  useEffect(() => {
    const cached = localStorage.getItem("penguinshift_user");
    if (cached) setUser(JSON.parse(cached));

    const stored = localStorage.getItem("authToken");
    if (stored && looksLikeJwt(stored)) {
      setToken(stored);
    } else if (stored) {
      localStorage.removeItem("authToken");
    }

    const tryBearer =
      stored && looksLikeJwt(stored)
        ? fetch(`${API_BASE}/auth/me`, {
            headers: { Authorization: `Bearer ${stored}` },
            credentials: "include",
          })
        : Promise.resolve(null as unknown as Response);

    const tryCookie = () => fetch(`${API_BASE}/auth/me`, { credentials: "include" });

    (async () => {
      try {
        let res = await tryBearer;
        if (!res || !res.ok) res = await tryCookie();

        if (res && res.ok) {
          const data = await res.json();
          const u: User = {
            name: data.username || data.name || "User",
            email: data.email,
            username:
              data.username ||
              data.name?.toLowerCase().replace(/\s+/g, "") ||
              "user" + Math.floor(Math.random() * 1000),
          };
          setUser(u);
          localStorage.setItem("penguinshift_user", JSON.stringify(u));
        } else {
          localStorage.removeItem("authToken");
          localStorage.removeItem("penguinshift_user");
          setUser(null);
          setToken(null);
        }
      } catch {
        localStorage.removeItem("authToken");
        localStorage.removeItem("penguinshift_user");
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = (userData: User, incomingToken?: string) => {
    const username =
      userData.username ||
      userData.name?.toLowerCase().replace(/\s+/g, "") ||
      "user" + Math.floor(Math.random() * 1000);

    const finalUser: User = { ...userData, username };
    setUser(finalUser);
    localStorage.setItem("penguinshift_user", JSON.stringify(finalUser));

    if (incomingToken && looksLikeJwt(incomingToken)) {
      setToken(incomingToken);
      localStorage.setItem("authToken", incomingToken);
    } else {
      localStorage.removeItem("authToken");
      setToken(null);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("penguinshift_user");
    localStorage.removeItem("authToken");
    fetch(`${API_BASE}/auth/logout`, { method: "POST", credentials: "include" }).catch(() => {});
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, isAuthenticated, login, logout, getToken, authFetch }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
