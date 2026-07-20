import { File, Paths } from "expo-file-system";
import { Platform } from "react-native";

import { UserProfile } from "../types/Profile";
import { Subject } from "../types/Subject";
import { deleteUserAsset } from "./cloudStorage";
import { supabase } from "./supabase";

export async function exportAccountData(profile: UserProfile, subjects: Subject[]): Promise<string> {
  const content = JSON.stringify({ exportedAt: new Date().toISOString(), profile, subjects }, null, 2);
  const fileName = `mentalis-dados-${new Date().toISOString().slice(0, 10)}.json`;
  if (Platform.OS === "web" && typeof document !== "undefined") {
    const url = URL.createObjectURL(new Blob([content], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url; link.download = fileName; link.click(); URL.revokeObjectURL(url);
    return "Download iniciado.";
  }
  const file = new File(Paths.document, fileName);
  file.create({ overwrite: true });
  file.write(content);
  return `Arquivo salvo em ${file.uri}`;
}

export async function deleteCurrentAccount(subjects: Subject[], avatarPath?: string): Promise<void> {
  if (!supabase) throw new Error("O Supabase não está configurado.");
  const paths = [avatarPath, ...subjects.flatMap((subject) => [subject.imagePath, ...subject.materials.map((material) => material.storagePath)])].filter((path): path is string => Boolean(path));
  await Promise.all(paths.map((path) => deleteUserAsset(path).catch(() => undefined)));
  const { error } = await supabase.functions.invoke("delete-account");
  if (error) throw error;
}
