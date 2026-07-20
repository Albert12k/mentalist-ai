import { File } from "expo-file-system";
import { Platform } from "react-native";

import { supabase } from "./supabase";

export const STORAGE_BUCKET = "mentalis-files";

function safeExtension(fileName: string, fallback = "jpg") {
  const extension = fileName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
  return extension || fallback;
}

async function readFileAsArrayBuffer(uri: string): Promise<ArrayBuffer> {
  if (Platform.OS === "web") return fetch(uri).then((response) => response.arrayBuffer());
  return new File(uri).arrayBuffer();
}

// Cada arquivo fica dentro da pasta do id do usuário. As regras do Storage
// usam essa primeira pasta para permitir acesso somente ao dono do arquivo.
export async function uploadUserAsset(
  userId: string,
  uri: string,
  area: "avatars" | "subjects" | "materials",
  fileName: string,
  contentType = "image/jpeg",
): Promise<{ path: string; url: string }> {
  if (!supabase) throw new Error("A conexão com o Supabase ainda não foi configurada.");

  const extension = safeExtension(fileName);
  const path = `${userId}/${area}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
  const file = await readFileAsArrayBuffer(uri);
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, { contentType, upsert: false });
  if (error) throw error;

  const url = await getUserAssetUrl(path);
  if (!url) throw new Error("O arquivo foi enviado, mas não foi possível gerar o acesso seguro.");
  return { path, url };
}

export async function getUserAssetUrl(path?: string): Promise<string | undefined> {
  if (!supabase || !path) return undefined;
  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrl(path, 60 * 60 * 24 * 7);
  return error ? undefined : data.signedUrl;
}

// Ao excluir um material, removemos também a cópia privada na nuvem.
export async function deleteUserAsset(path?: string): Promise<void> {
  if (!supabase || !path) return;
  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([path]);
  if (error) throw error;
}
