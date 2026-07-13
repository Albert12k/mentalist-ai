import { createContext, useCallback, useContext, useEffect, useState } from "react";

import { getProfile, saveProfile } from "../services/profileStorage";
import { defaultUserProfile, UserProfile } from "../types/Profile";

type ProfileContextType = {
  profile: UserProfile;
  updateProfile: (profile: UserProfile) => void;
  claimChallenge: (challengeId: string, xp: number) => void;
};

const ProfileContext = createContext<ProfileContextType | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(defaultUserProfile);

  useEffect(() => {
    async function loadProfile() {
      setProfile(await getProfile());
    }

    loadProfile();
  }, []);

  const updateProfile = useCallback((updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    saveProfile(updatedProfile);
  }, []);

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

      saveProfile(updatedProfile);
      return updatedProfile;
    });
  }, []);

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
