import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";

type AuthContextType = {
  loading: boolean;
  signedIn: boolean;
  continueInPreview: () => Promise<void>;
  signOutPreview: () => Promise<void>;
};

const SESSION_KEY = "@mentalis:preview-session";
const AuthContext = createContext<AuthContextType | null>(null);

// Até a conexão com o Supabase ser adicionada, esta sessão só libera o modo
// de teste local. Ela será substituída pela sessão segura do serviço de login.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(SESSION_KEY)
      .then((value) => setSignedIn(value === "true"))
      .finally(() => setLoading(false));
  }, []);

  async function continueInPreview() {
    await AsyncStorage.setItem(SESSION_KEY, "true");
    setSignedIn(true);
  }

  async function signOutPreview() {
    await AsyncStorage.removeItem(SESSION_KEY);
    setSignedIn(false);
  }

  return <AuthContext.Provider value={{ loading, signedIn, continueInPreview, signOutPreview }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return context;
}
