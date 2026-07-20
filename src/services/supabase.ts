import "react-native-url-polyfill/auto";
import "expo-sqlite/localStorage/install";
import { createClient } from "@supabase/supabase-js";

import { authConfig, isAuthConfigured } from "./authConfig";

// O cliente usa a chave pública e guarda apenas a sessão do usuário no
// aparelho. As permissões dos dados serão protegidas por regras do Supabase.
export const supabase = isAuthConfigured
  ? createClient(authConfig.url, authConfig.publishableKey, {
    auth: {
      storage: localStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  })
  : null;
