import { UserProfile } from "../types/Profile";

export type PlanFeature =
  | "aiTutor"
  | "aiMaterials"
  | "aiAssessments"
  | "advancedReports";

export const planDefinitions = {
  free: {
    name: "Mentalis Free",
    description: "Organização e acompanhamento para estudar todos os dias.",
    storageMb: 100,
    monthlyAiActions: 3,
  },
  pro: {
    name: "Mentalis Pro",
    description: "IA, materiais inteligentes e análises avançadas.",
    storageMb: 5_000,
    monthlyAiActions: 100,
  },
} as const;

const proFeatures = new Set<PlanFeature>([
  "aiTutor",
  "aiMaterials",
  "aiAssessments",
  "advancedReports",
]);

export function getPlanDefinition(profile: UserProfile) {
  return planDefinitions[profile.plan ?? "free"];
}

export function canUseFeature(profile: UserProfile, feature: PlanFeature, isAdmin = false): boolean {
  return isAdmin || !proFeatures.has(feature) || profile.plan === "pro";
}
