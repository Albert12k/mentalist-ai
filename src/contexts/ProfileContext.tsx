import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

import { getProfile, saveProfile } from "../services/profileStorage";
import { defaultUserProfile, UserProfile } from "../types/Profile";
import { useAuth } from "./AuthContext";
import { loadCloudProfile, saveCloudProfile } from "../services/cloudSync";
import { getUserAssetUrl } from "../services/cloudStorage";

type ProfileContextType = {
  profile: UserProfile;
  syncStatus: "loading" | "synced" | "local" | "error";
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
    defaultPomodoroMinutes: profile.defaultPomodoroMinutes ?? 25,
    remindersEnabled: profile.remindersEnabled !== false,
    plan: profile.plan ?? "free",
  };
}

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { userId, displayName } = useAuth();
  const [profile, setProfile] = useState<UserProfile>(defaultUserProfile);
  const [syncStatus, setSyncStatus] = useState<ProfileContextType["syncStatus"]>("loading");
  const cloudVersion = useRef<string | null | undefined>(undefined);
  const cloudQueue = useRef<Promise<void>>(Promise.resolve());
  const currentUserId = useRef<string | null>(userId);

  useEffect(() => {
    let active = true;
    currentUserId.current = userId;
    setSyncStatus("loading");
    async function loadProfile() {
      cloudVersion.current = undefined;
      if (!userId) { setProfile(defaultUserProfile); setSyncStatus("local"); return; }
      const localProfile = await getProfile(userId, displayName);
      let cloudProfile: UserProfile | null = null;
      try {
        const cloudRecord = await loadCloudProfile(userId);
        cloudVersion.current = cloudRecord?.updatedAt ?? null;
        cloudProfile = cloudRecord?.value ?? null;
        if (active) setSyncStatus(cloudRecord ? "synced" : "local");
      } catch {
        if (active) setSyncStatus("error");
      }
      const profileToUse = normalizeProfile(cloudProfile ?? localProfile);
      const cloudAvatarUrl = await getUserAssetUrl(profileToUse.avatarPath);
      if (cloudAvatarUrl) profileToUse.avatar = cloudAvatarUrl;
      if (!active) return;
      setProfile(profileToUse);

      // Uma conta que já tinha dados locais é enviada ao banco na primeira vez
      // que entra, sem substituir dados que já existam na nuvem.
      if (!cloudProfile && cloudVersion.current === null) {
        try { cloudVersion.current = await saveCloudProfile(userId, profileToUse); setSyncStatus("synced"); } catch { setSyncStatus("error"); }
      }
    }

    loadProfile();
    return () => { active = false; };
  }, [userId, displayName]);

  const enqueueCloudSave = useCallback((updatedProfile: UserProfile) => {
    if (!userId || cloudVersion.current === undefined) return;
    cloudQueue.current = cloudQueue.current.catch(() => undefined).then(async () => {
      try {
        cloudVersion.current = await saveCloudProfile(userId, updatedProfile, cloudVersion.current ?? undefined);
        if (currentUserId.current === userId) setSyncStatus("synced");
      } catch {
        if (currentUserId.current === userId) setSyncStatus("error");
      }
    });
  }, [userId]);

  const updateProfile = useCallback((updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    if (userId) void saveProfile(userId, updatedProfile);
    if (userId && cloudVersion.current !== undefined) enqueueCloudSave(updatedProfile);
  }, [userId, enqueueCloudSave]);

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
      if (userId) enqueueCloudSave(updatedProfile);
      return updatedProfile;
    });
  }, [userId, enqueueCloudSave]);

  return (
    <ProfileContext.Provider value={{ profile, syncStatus, updateProfile, claimChallenge }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);

  if (!context) throw new Error("useProfile deve ser usado dentro de ProfileProvider");
  return context;
}
