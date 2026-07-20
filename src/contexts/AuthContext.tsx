import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";
import { Linking, Platform } from "react-native";

import { isAuthConfigured } from "../services/authConfig";
import { supabase } from "../services/supabase";

type AuthContextType = {
  loading: boolean;
  signedIn: boolean;
  userId: string | null;
  displayName: string | undefined;
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
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | undefined>();

  function applySession(session: { user: { id: string; user_metadata?: { name?: unknown } } } | null) {
    setSignedIn(Boolean(session));
    setUserId(session?.user.id ?? null);
    setDisplayName(typeof session?.user.user_metadata?.name === "string" ? session.user.user_metadata.name : undefined);
  }

  useEffect(() => {
    if (isAuthConfigured && supabase) {
      // Uma conexão lenta ou uma sessão local corrompida não pode prender o
      // aplicativo eternamente na splash. Depois de 4 segundos liberamos a
      // tela de acesso; se a sessão responder depois, ela ainda será aplicada.
      const timeout = setTimeout(() => setLoading(false), 4000);
      supabase.auth.getSession()
        .then(({ data }) => applySession(data.session))
        .finally(() => setLoading(false));

      const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
        applySession(session);
        setLoading(false);
      });
      return () => {
        clearTimeout(timeout);
        subscription.subscription.unsubscribe();
      };
    }

    AsyncStorage.getItem(SESSION_KEY)
      .then((value) => setSignedIn(value === "true"))
      .finally(() => setLoading(false));
  }, []);

  async function continueInPreview() {
    await AsyncStorage.setItem(SESSION_KEY, "true");
    setSignedIn(true);
    setUserId("preview-user");
  }

  async function signOutPreview() {
    if (isAuthConfigured && supabase) {
      await supabase.auth.signOut();
      return;
    }
    await AsyncStorage.removeItem(SESSION_KEY);
    setSignedIn(false);
    setUserId(null);
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
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      // Controlamos a abertura da URL abaixo para evitar que alguns navegadores
      // bloqueiem o redirecionamento iniciado depois de uma ação assíncrona.
      options: { redirectTo: getWebRedirectUrl(), skipBrowserRedirect: true },
    });
    if (!error && data.url) {
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.location.assign(data.url);
      } else {
        await Linking.openURL(data.url);
      }
    }
    if (!error && !data.url) return "O Supabase não retornou a URL de acesso do Google.";
    return error?.message ?? null;
  }

  return <AuthContext.Provider value={{ loading, signedIn, userId, displayName, continueInPreview, signOutPreview, signIn, signUp, resetPassword, resendConfirmation, signInWithGoogle }}>{children}</AuthContext.Provider>;
}

function getWebRedirectUrl(): string | undefined {
  return Platform.OS === "web" && typeof window !== "undefined" ? window.location.origin : undefined;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return context;
}
