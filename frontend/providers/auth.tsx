import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, clearToken, getToken } from "../lib/api";

type User = { id: string; email: string; name: string; created_at: string } | null;
type Ctx = {
  user: User;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthCtx = createContext<Ctx>({} as Ctx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  (async () => {
    try {
      const t = await getToken();

      if (!t) {
        return;
      }

      const me = await api.me();
      setUser(me);
    } catch {
      await clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  })();
}, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const r = await api.login(email, password);
    setUser(r.user);
  }, []);
  const signUp = useCallback(async (email: string, password: string, name: string) => {
    const r = await api.register(email, password, name);
    setUser(r.user);
  }, []);
  const signOut = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  return (
    <AuthCtx.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);