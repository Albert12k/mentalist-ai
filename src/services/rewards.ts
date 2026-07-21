export type ProfileReward = {
  id: string;
  icon: string;
  title: string;
  description: string;
  requiredXP: number;
};

// A trilha transforma o XP em conquistas visíveis. Novas recompensas podem ser
// acrescentadas aqui sem alterar a tela ou os dados já salvos do usuário.
export const profileRewards: ProfileReward[] = [
  { id: "beginner", icon: "🌱", title: "Mente Curiosa", description: "Seu primeiro título no Trilume.", requiredXP: 0 },
  { id: "focused", icon: "🎯", title: "Foco em Ação", description: "Para quem começou a construir uma rotina.", requiredXP: 150 },
  { id: "consistent", icon: "🔥", title: "Estudante Persistente", description: "Uma recompensa pela sua consistência.", requiredXP: 400 },
  { id: "master", icon: "🏆", title: "Mestre dos Estudos", description: "Título especial para uma grande jornada.", requiredXP: 800 },
];

export const themeRewards = [
  { id: "purple", name: "Violeta Trilume", color: "#7C4DFF", requiredXP: 0 },
  { id: "emerald", name: "Foco Esmeralda", color: "#168A64", requiredXP: 300 },
  { id: "sunset", name: "Pôr do Sol", color: "#B85F32", requiredXP: 600 },
] as const;

export type AchievementBadge = { id: string; icon: string; title: string; description: string; unlocked: boolean };

export function buildAchievementBadges(stats: { subjects: number; sessions: number; completedContents: number; currentStreak: number }): AchievementBadge[] {
  return [
    { id: "organized", icon: "📚", title: "Organizador", description: "Criou 3 matérias", unlocked: stats.subjects >= 3 },
    { id: "first-focus", icon: "⏱️", title: "Primeiro foco", description: "Registrou uma sessão", unlocked: stats.sessions >= 1 },
    { id: "knowledge", icon: "🧠", title: "Conhecimento", description: "Concluiu 5 conteúdos", unlocked: stats.completedContents >= 5 },
    { id: "streak", icon: "🔥", title: "Em sequência", description: "Estudou por 7 dias seguidos", unlocked: stats.currentStreak >= 7 },
  ];
}
