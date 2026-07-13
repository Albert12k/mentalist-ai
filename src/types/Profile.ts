export type UserProfile = {
  name: string;
  weeklyGoalMinutes: number;
};

export const defaultUserProfile: UserProfile = {
  name: "Estudante",
  weeklyGoalMinutes: 180,
};
