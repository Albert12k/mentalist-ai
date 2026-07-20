import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";

import { isAuthConfigured } from "../services/authConfig";
import { supabase } from "../services/supabase";

type AuthContextType = {
  loading: boolean;
  signedIn: boolean;
  continueInPreview: () => Promise<void>;
  signOutPreview: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  resetPassword: (email: string) => Promise<string | null>;
  resendConfirmation: (email: string) => Promise<string | null>;
  signInWithGoogle: () => Promise<string | null>;
};

const SESSION_KEY = "@mentalis:preview-session";
const AuthContext = createContext<AuthContextType | null>(null);

// Até a conexão com o Supabase ser adicionada, esta sessão só libera o modo
// de teste local. Ela será substituída pela sessão segura do serviço de login.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    if (isAuthConfigured && supabase) {
      supabase.auth.getSession()
        .then(({ data }) => setSignedIn(Boolean(data.session)))
        .finally(() => setLoading(false));

      const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
        setSignedIn(Boolean(session));
        setLoading(false);
      });
      return () => subscription.subscription.unsubscribe();
    }

    AsyncStorage.getItem(SESSION_KEY)
      .then((value) => setSignedIn(value === "true"))
      .finally(() => setLoading(false));
  }, []);

  async function continueInPreview() {
    await AsyncStorage.setItem(SESSION_KEY, "true");
    setSignedIn(true);
  }

  async function signOutPreview() {
    if (isAuthConfigured && supabase) {
      await supabase.auth.signOut();
      return;
    }
    await AsyncStorage.removeItem(SESSION_KEY);
    setSignedIn(false);
  }

  async function signIn(email: string, password: string) {
    if (!supabase) return "A conexão com o Supabase ainda não foi configurada.";
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  }

  async function signUp(email: string, password: string, name: string) {
    if (!supabase) return { error: "A conexão com o Supabase ainda não foi configurada.", needsConfirmation: false };
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name }, emailRedirectTo: getWebRedirectUrl() },
    });
    return { error: error?.message ?? null, needsConfirmation: !data.session };
  }

  async function resetPassword(email: string) {
    if (!supabase) return "A conexão com o Supabase ainda não foi configurada.";
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: getWebRedirectUrl() });
    return error?.message ?? null;
  }

  async function resendConfirmation(email: string) {
    if (!supabase) return "A conexão com o Supabase ainda não foi configurada.";
    const { error } = await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: getWebRedirectUrl() } });
    return error?.message ?? null;
  }

  async function signInWithGoogle() {
    if (!supabase) return "A conexão com o Supabase ainda não foi configurada.";
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: getWebRedirectUrl() } });
    return error?.message ?? null;
  }

  return <AuthContext.Provider value={{ loading, signedIn, continueInPreview, signOutPreview, signIn, signUp, resetPassword, resendConfirmation, signInWithGoogle }}>{children}</AuthContext.Provider>;
}

function getWebRedirectUrl(): string | undefined {
  return Platform.OS === "web" && typeof window !== "undefined" ? window.location.origin : undefined;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return context;
}
