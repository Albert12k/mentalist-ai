// As chaves serão adicionadas quando o projeto Supabase estiver criado.
// Mantemos a configuração isolada para não espalhar detalhes do serviço pelas telas.
export const authConfig = {
  url: process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
  anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "",
};

export const isAuthConfigured = Boolean(authConfig.url && authConfig.anonKey);
