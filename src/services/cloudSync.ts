import { UserProfile } from "../types/Profile";
import { Subject } from "../types/Subject";
import { supabase } from "./supabase";

// O banco recebe apenas os dados estruturados. Arquivos (PDF, fotos e áudio)
// continuam locais por enquanto e serão enviados ao Storage em uma próxima etapa.
export async function loadCloudProfile(userId: string): Promise<UserProfile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("mentalis_profiles").select("data").eq("id", userId).maybeSingle();
  if (error || !data?.data || typeof data.data !== "object") return null;
  return data.data as UserProfile;
}

export async function saveCloudProfile(userId: string, profile: UserProfile): Promise<void> {
  if (!supabase) return;
  await supabase.from("mentalis_profiles").upsert({ id: userId, data: profile, updated_at: new Date().toISOString() });
}

export async function loadCloudSubjects(userId: string): Promise<Subject[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("mentalis_study_data").select("subjects").eq("user_id", userId).maybeSingle();
  if (error || !Array.isArray(data?.subjects)) return null;
  return data.subjects as Subject[];
}

export async function saveCloudSubjects(userId: string, subjects: Subject[]): Promise<void> {
  if (!supabase) return;
  await supabase.from("mentalis_study_data").upsert({ user_id: userId, subjects, updated_at: new Date().toISOString() });
}
