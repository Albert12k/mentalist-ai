export type UserProfile = {
  // Dados que a pessoa edita diretamente na aba Perfil.
  name: string;
  weeklyGoalMinutes: number;

  // Recompensas de desafios ficam fora do histórico de uma matéria, mas
  // entram no XP total do usuário.
  bonusXP: number;
  claimedChallengeIds: string[];
};

export const defaultUserProfile: UserProfile = {
  name: "Estudante",
  weeklyGoalMinutes: 180,
  bonusXP: 0,
  claimedChallengeIds: [],
};
