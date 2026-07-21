import { UserProfile } from "../types/Profile";
import { Subject } from "../types/Subject";
import { supabase } from "./supabase";

export type CloudRecord<T> = { value: T; updatedAt: string };

export class SyncConflictError extends Error {
  constructor() {
    super("Os dados foram alterados em outro dispositivo. Reabra o aplicativo antes de salvar novamente.");
    this.name = "SyncConflictError";
  }
}

export async function loadCloudProfile(userId: string): Promise<CloudRecord<UserProfile> | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("mentalis_profiles").select("data, updated_at").eq("id", userId).maybeSingle();
  if (error) throw error;
  if (!data?.data || typeof data.data !== "object") return null;
  return { value: data.data as UserProfile, updatedAt: data.updated_at };
}

export async function saveCloudProfile(userId: string, profile: UserProfile, expectedUpdatedAt?: string): Promise<string> {
  if (!supabase) return expectedUpdatedAt ?? "";
  const updatedAt = new Date().toISOString();
  if (expectedUpdatedAt) {
    const { data, error } = await supabase.from("mentalis_profiles").update({ data: profile, updated_at: updatedAt }).eq("id", userId).eq("updated_at", expectedUpdatedAt).select("updated_at").maybeSingle();
    if (error) throw error;
    if (!data) throw new SyncConflictError();
    return data.updated_at;
  }
  const { data, error } = await supabase.from("mentalis_profiles").insert({ id: userId, data: profile, updated_at: updatedAt }).select("updated_at").single();
  if (error) throw new SyncConflictError();
  return data.updated_at;
}

export async function loadCloudSubjects(userId: string): Promise<CloudRecord<Subject[]> | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("mentalis_study_data").select("subjects, updated_at").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  if (!Array.isArray(data?.subjects)) return null;
  return { value: data.subjects as Subject[], updatedAt: data.updated_at };
}

export async function saveCloudSubjects(userId: string, subjects: Subject[], expectedUpdatedAt?: string): Promise<string> {
  if (!supabase) return expectedUpdatedAt ?? "";
  const updatedAt = new Date().toISOString();
  if (expectedUpdatedAt) {
    const { data, error } = await supabase.from("mentalis_study_data").update({ subjects, updated_at: updatedAt }).eq("user_id", userId).eq("updated_at", expectedUpdatedAt).select("updated_at").maybeSingle();
    if (error) throw error;
    if (!data) throw new SyncConflictError();
    return data.updated_at;
  }
  const { data, error } = await supabase.from("mentalis_study_data").insert({ user_id: userId, subjects, updated_at: updatedAt }).select("updated_at").single();
  if (error) throw new SyncConflictError();
  return data.updated_at;
}
