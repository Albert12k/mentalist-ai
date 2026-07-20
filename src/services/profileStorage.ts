import AsyncStorage from "@react-native-async-storage/async-storage";

import { defaultUserProfile, UserProfile } from "../types/Profile";

const KEY = "@mentalis:profile";

function getKey(userId: string) {
  return `${KEY}:${userId}`;
}

export async function getProfile(userId: string, defaultName?: string): Promise<UserProfile> {
  const fallback = { ...defaultUserProfile, name: defaultName?.trim() || defaultUserProfile.name };
  try {
    const data = await AsyncStorage.getItem(getKey(userId));
    if (!data) return fallback;

    const savedProfile = JSON.parse(data) as Partial<UserProfile>;
    return {
      name: savedProfile.name?.trim() || fallback.name,
      avatar: typeof savedProfile.avatar === "string" ? savedProfile.avatar : undefined,
      avatarPath: typeof savedProfile.avatarPath === "string" ? savedProfile.avatarPath : undefined,
      weeklyGoalMinutes: Math.max(30, Math.min(savedProfile.weeklyGoalMinutes ?? fallback.weeklyGoalMinutes, 2_400)),
      bonusXP: Math.max(0, savedProfile.bonusXP ?? 0),
      claimedChallengeIds: Array.isArray(savedProfile.claimedChallengeIds)
        ? savedProfile.claimedChallengeIds.filter((id): id is string => typeof id === "string")
        : [],
    };
  } catch (error) {
    console.log("Erro ao carregar perfil:", error);
    return fallback;
  }
}

export async function saveProfile(userId: string, profile: UserProfile) {
  try {
    await AsyncStorage.setItem(getKey(userId), JSON.stringify(profile));
  } catch (error) {
    console.log("Erro ao salvar perfil:", error);
  }
}
