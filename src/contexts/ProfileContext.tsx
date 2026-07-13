import { createContext, useCallback, useContext, useEffect, useState } from "react";

import { getProfile, saveProfile } from "../services/profileStorage";
import { defaultUserProfile, UserProfile } from "../types/Profile";

type ProfileContextType = {
  profile: UserProfile;
  updateProfile: (profile: UserProfile) => void;
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

  return (
    <ProfileContext.Provider value={{ profile, updateProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);

  if (!context) throw new Error("useProfile deve ser usado dentro de ProfileProvider");
  return context;
}
