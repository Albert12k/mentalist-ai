import { UserProfile } from "../types/Profile";

export const planDefinitions = {
  free: {
    name: "Trilume Free",
    description: "Organização e acompanhamento para estudar todos os dias.",
    storageMb: 100,
  },
  pro: {
    name: "Trilume Pro",
    description: "Mais armazenamento, personalização e relatórios avançados.",
    storageMb: 5_000,
  },
} as const;

export function getPlanDefinition(profile: UserProfile) {
  return planDefinitions[profile.plan ?? "free"];
}
