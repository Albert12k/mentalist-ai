import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return new Response("Método não permitido", { status: 405, headers: corsHeaders });
  const authorization = request.headers.get("Authorization");
  if (!authorization) return Response.json({ error: "Sessão não encontrada." }, { status: 401, headers: corsHeaders });
  const url = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } });
  const { data, error } = await userClient.auth.getUser();
  if (error || !data.user) return Response.json({ error: "Sessão inválida." }, { status: 401, headers: corsHeaders });
  const admin = createClient(url, serviceKey);
  // Remove inclusive arquivos antigos que já não estejam referenciados no
  // perfil atual. As pastas seguem o padrão criado pelo aplicativo.
  const areas = ["avatars", "subjects", "materials"];
  const paths: string[] = [];
  for (const area of areas) {
    const { data: files } = await admin.storage.from("mentalis-files").list(`${data.user.id}/${area}`, { limit: 1000 });
    paths.push(...(files ?? []).filter((file) => file.id).map((file) => `${data.user!.id}/${area}/${file.name}`));
  }
  if (paths.length) await admin.storage.from("mentalis-files").remove(paths);
  const { error: deleteError } = await admin.auth.admin.deleteUser(data.user.id);
  if (deleteError) return Response.json({ error: "Não foi possível excluir a conta." }, { status: 500, headers: corsHeaders });
  return Response.json({ deleted: true }, { headers: corsHeaders });
});
