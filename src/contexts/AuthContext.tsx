import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import type { Session } from "@supabase/supabase-js";
import { makeRedirectUri } from "expo-auth-session";
import * as QueryParams from "expo-auth-session/build/QueryParams";
import * as WebBrowser from "expo-web-browser";

import { isAuthConfigured } from "../services/authConfig";
import { supabase } from "../services/supabase";

type AuthContextType = {
  loading: boolean;
  signedIn: boolean;
  userId: string | null;
  displayName: string | undefined;
  userEmail: string | undefined;
  isAdmin: boolean;
  continueInPreview: () => Promise<void>;
  signOutPreview: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  resetPassword: (email: string) => Promise<string | null>;
  resendConfirmation: (email: string) => Promise<string | null>;
  signInWithGoogle: () => Promise<string | null>;
  updatePassword: (password: string) => Promise<string | null>;
};

const SESSION_KEY = "@mentalis:preview-session";
const AuthContext = createContext<AuthContextType | null>(null);

WebBrowser.maybeCompleteAuthSession();

// Até a conexão com o Supabase ser adicionada, esta sessão só libera o modo
// de teste local. Ela será substituída pela sessão segura do serviço de login.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | undefined>();
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [isAdmin, setIsAdmin] = useState(false);

  function applySession(session: Session | null) {
    const appMetadata = session?.user.app_metadata as Record<string, unknown> | undefined;
    setSignedIn(Boolean(session));
    setUserId(session?.user.id ?? null);
    setDisplayName(typeof session?.user.user_metadata?.name === "string" ? session.user.user_metadata.name : undefined);
    setUserEmail(session?.user.email);
    setIsAdmin(appMetadata?.role === "admin" || appMetadata?.is_admin === true);
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
    setIsAdmin(false);
  }

  async function signOutPreview() {
    if (isAuthConfigured && supabase) {
      await supabase.auth.signOut();
      return;
    }
    await AsyncStorage.removeItem(SESSION_KEY);
    setSignedIn(false);
    setUserId(null);
    setUserEmail(undefined);
    setIsAdmin(false);
  }

  async function signIn(email: string, password: string) {
    if (!supabase) return "A conexão com o Supabase ainda não foi configurada.";
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return translateAuthError(error?.message);
  }

  async function signUp(email: string, password: string, name: string) {
    if (!supabase) return { error: "A conexão com o Supabase ainda não foi configurada.", needsConfirmation: false };
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name }, emailRedirectTo: getWebRedirectUrl() },
    });
    return { error: translateAuthError(error?.message), needsConfirmation: !data.session };
  }

  async function resetPassword(email: string) {
    if (!supabase) return "A conexão com o Supabase ainda não foi configurada.";
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: getWebRedirectUrl() });
    return translateAuthError(error?.message);
  }

  async function resendConfirmation(email: string) {
    if (!supabase) return "A conexão com o Supabase ainda não foi configurada.";
    const { error } = await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: getWebRedirectUrl() } });
    return translateAuthError(error?.message);
  }

  async function signInWithGoogle() {
    if (!supabase) return "A conexão com o Supabase ainda não foi configurada.";

    const redirectTo = Platform.OS === "web" && typeof window !== "undefined"
      ? window.location.origin
      : makeRedirectUri({ scheme: "trilume", path: "auth/callback" });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) return translateAuthError(error.message);
    if (!error && !data.url) return "O Supabase não retornou a URL de acesso do Google.";

    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.location.assign(data.url);
      return null;
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== "success") return "Acesso com Google cancelado.";

    const { params, errorCode } = QueryParams.getQueryParams(result.url);
    if (errorCode) return `O Google não concluiu o acesso (${errorCode}).`;

    if (typeof params.code === "string") {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(params.code);
      return translateAuthError(exchangeError?.message);
    }

    if (typeof params.access_token !== "string" || typeof params.refresh_token !== "string") {
      return "O Google não devolveu uma sessão válida para o aplicativo.";
    }

    const { error: sessionError } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    return translateAuthError(sessionError?.message);
  }

  async function updatePassword(password: string) {
    if (!supabase) return "A conexão com o Supabase ainda não foi configurada.";
    const { error } = await supabase.auth.updateUser({ password });
    return translateAuthError(error?.message);
  }

  return <AuthContext.Provider value={{ loading, signedIn, userId, displayName, userEmail, isAdmin, continueInPreview, signOutPreview, signIn, signUp, resetPassword, resendConfirmation, signInWithGoogle, updatePassword }}>{children}</AuthContext.Provider>;
}

function getWebRedirectUrl(): string | undefined {
  return Platform.OS === "web" && typeof window !== "undefined" ? window.location.origin : undefined;
}

function translateAuthError(message?: string): string | null {
  if (!message) return null;
  const normalized = message.toLowerCase();
  if (normalized.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (normalized.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  if (normalized.includes("user already registered")) return "Já existe uma conta com este e-mail.";
  if (normalized.includes("password should be")) return "A senha não atende aos requisitos de segurança.";
  if (normalized.includes("rate limit") || normalized.includes("too many")) return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
  return "Não foi possível concluir o acesso agora. Tente novamente.";
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return context;
}
