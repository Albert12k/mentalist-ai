import { createContext, useCallback, useContext, useEffect, useState } from "react";

import { getProfile, saveProfile } from "../services/profileStorage";
import { defaultUserProfile, UserProfile } from "../types/Profile";
import { useAuth } from "./AuthContext";
import { loadCloudProfile, saveCloudProfile } from "../services/cloudSync";
import { getUserAssetUrl } from "../services/cloudStorage";

type ProfileContextType = {
  profile: UserProfile;
  updateProfile: (profile: UserProfile) => void;
  claimChallenge: (challengeId: string, xp: number) => void;
};

const ProfileContext = createContext<ProfileContextType | null>(null);

function normalizeProfile(profile: UserProfile): UserProfile {
  return {
    ...defaultUserProfile,
    ...profile,
    claimedChallengeIds: profile.claimedChallengeIds ?? [],
    streakFreezeDates: profile.streakFreezeDates ?? [],
    selectedTheme: profile.selectedTheme ?? "purple",
    plan: profile.plan ?? "free",
  };
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { userId, displayName } = useAuth();
  const [profile, setProfile] = useState<UserProfile>(defaultUserProfile);

  useEffect(() => {
    async function loadProfile() {
      if (!userId) { setProfile(defaultUserProfile); return; }
      const localProfile = await getProfile(userId, displayName);
      const cloudProfile = await loadCloudProfile(userId);
      const profileToUse = normalizeProfile(cloudProfile ?? localProfile);
      const cloudAvatarUrl = await getUserAssetUrl(profileToUse.avatarPath);
      if (cloudAvatarUrl) profileToUse.avatar = cloudAvatarUrl;
      setProfile(profileToUse);

      // Uma conta que já tinha dados locais é enviada ao banco na primeira vez
      // que entra, sem substituir dados que já existam na nuvem.
      if (!cloudProfile) void saveCloudProfile(userId, profileToUse);
    }

    loadProfile();
  }, [userId, displayName]);

  const updateProfile = useCallback((updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    if (userId) void saveProfile(userId, updatedProfile);
    if (userId) void saveCloudProfile(userId, updatedProfile);
  }, [userId]);

  // Centralizamos o resgate aqui para impedir que uma mesma recompensa seja
  // adicionada duas vezes por telas diferentes.
  const claimChallenge = useCallback((challengeId: string, xp: number) => {
    setProfile((currentProfile) => {
      if (currentProfile.claimedChallengeIds.includes(challengeId)) return currentProfile;

      const updatedProfile = {
        ...currentProfile,
        bonusXP: currentProfile.bonusXP + xp,
        claimedChallengeIds: [...currentProfile.claimedChallengeIds, challengeId],
      };

      if (userId) void saveProfile(userId, updatedProfile);
      if (userId) void saveCloudProfile(userId, updatedProfile);
      return updatedProfile;
    });
  }, [userId]);

  return (
    <ProfileContext.Provider value={{ profile, updateProfile, claimChallenge }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);

  if (!context) throw new Error("useProfile deve ser usado dentro de ProfileProvider");
  return context;
}
