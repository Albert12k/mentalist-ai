import "react-native-url-polyfill/auto";
import "expo-sqlite/localStorage/install";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

import { authConfig, isAuthConfigured } from "./authConfig";

// O cliente usa a chave pública e guarda apenas a sessão do usuário no
// aparelho. As permissões dos dados serão protegidas por regras do Supabase.
export const supabase = isAuthConfigured
  ? createClient(authConfig.url, authConfig.publishableKey, {
    auth: {
      storage: localStorage,
      autoRefreshToken: true,
      persistSession: true,
      // Na web, Supabase retorna da confirmação de e-mail e do Google pela URL.
      // No app nativo, o deep link será configurado antes do lançamento mobile.
      detectSessionInUrl: Platform.OS === "web",
    },
  })
  : null;
