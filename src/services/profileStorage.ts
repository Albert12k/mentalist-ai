import AsyncStorage from "@react-native-async-storage/async-storage";

import { defaultUserProfile, UserProfile } from "../types/Profile";

const KEY = "@mentalis:profile";

export async function getProfile(): Promise<UserProfile> {
  try {
    const data = await AsyncStorage.getItem(KEY);
    if (!data) return defaultUserProfile;

    const savedProfile = JSON.parse(data) as Partial<UserProfile>;
    return {
      name: savedProfile.name?.trim() || defaultUserProfile.name,
      avatar: typeof savedProfile.avatar === "string" ? savedProfile.avatar : undefined,
      weeklyGoalMinutes: Math.max(30, Math.min(savedProfile.weeklyGoalMinutes ?? defaultUserProfile.weeklyGoalMinutes, 2_400)),
      bonusXP: Math.max(0, savedProfile.bonusXP ?? 0),
      claimedChallengeIds: Array.isArray(savedProfile.claimedChallengeIds)
        ? savedProfile.claimedChallengeIds.filter((id): id is string => typeof id === "string")
        : [],
    };
  } catch (error) {
    console.log("Erro ao carregar perfil:", error);
    return defaultUserProfile;
  }
}

export async function saveProfile(profile: UserProfile) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(profile));
  } catch (error) {
    console.log("Erro ao salvar perfil:", error);
  }
}
