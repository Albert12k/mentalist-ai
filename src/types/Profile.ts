export type UserProfile = {
  // Dados que a pessoa edita diretamente na aba Perfil.
  name: string;
  weeklyGoalMinutes: number;
  avatar?: string;
  // Caminho permanente no Supabase Storage; a URL exibida pode expirar.
  avatarPath?: string;

  // Recompensas de desafios ficam fora do histórico de uma matéria, mas
  // entram no XP total do usuário.
  bonusXP: number;
  claimedChallengeIds: string[];
  // Título cosmético conquistado na trilha de recompensas e exibido no perfil.
  selectedTitle?: string;
  selectedTheme?: "purple" | "emerald" | "sunset";
  // Cada data representa um dia perdido que foi coberto por uma proteção.
  streakFreezeDates?: string[];
  defaultPomodoroMinutes?: 15 | 25 | 45 | 60;
  remindersEnabled?: boolean;

  // A assinatura fica no perfil desde já. A cobrança será conectada depois,
  // sem precisar mudar as telas e regras que consultam o plano atual.
  plan: "free" | "pro";
  subscriptionStatus?: "active" | "inactive" | "canceled";
};

export const defaultUserProfile: UserProfile = {
  name: "Estudante",
  weeklyGoalMinutes: 180,
  bonusXP: 0,
  claimedChallengeIds: [],
  plan: "free",
  subscriptionStatus: "inactive",
  selectedTheme: "purple",
  streakFreezeDates: [],
  defaultPomodoroMinutes: 25,
  remindersEnabled: true,
};
