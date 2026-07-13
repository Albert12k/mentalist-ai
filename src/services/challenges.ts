import { Subject } from "../types/Subject";

export type Challenge = {
  id: string;
  title: string;
  description: string;
  current: number;
  target: number;
  rewardXP: number;
};

function getDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getWeekStart(): Date {
  const date = new Date();
  const daysSinceMonday = (date.getDay() + 6) % 7;

  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - daysSinceMonday);
  return date;
}

/**
 * Transforma os dados já existentes (matérias, sessões e conteúdos) em
 * desafios. Não salva nenhum progresso novo: por isso a tela sempre reflete
 * imediatamente uma sessão que acabou de ser registrada.
 */
export function buildChallenges(subjects: Subject[], weeklyGoalMinutes: number): Challenge[] {
  const allSessions = subjects.flatMap((subject) => subject.studyHistory);
  const todayKey = getDayKey(new Date());
  const weekStart = getWeekStart();
  const todaySessions = allSessions.filter((session) => getDayKey(new Date(session.date)) === todayKey);
  const weeklyMinutes = allSessions.reduce(
    (total, session) => new Date(session.date) >= weekStart ? total + session.duration : total,
    0,
  );
  const completedContents = subjects.reduce(
    (total, subject) => total + subject.contents.filter((content) => content.completed).length,
    0,
  );

  return [
    {
      // O dia na chave permite resgatar este desafio novamente amanhã.
      id: `daily-session-${todayKey}`,
      title: "Comece o dia",
      description: "Registre uma sessão de estudo hoje.",
      current: todaySessions.length,
      target: 1,
      rewardXP: 15,
    },
    {
      // A semana na chave cria um novo desafio toda segunda-feira.
      id: `weekly-goal-${getDayKey(weekStart)}`,
      title: "Meta semanal",
      description: `Alcance sua meta de ${weeklyGoalMinutes} minutos nesta semana.`,
      current: weeklyMinutes,
      target: weeklyGoalMinutes,
      rewardXP: 50,
    },
    {
      id: "three-subjects",
      title: "Base de estudos",
      description: "Cadastre três matérias para organizar sua rotina.",
      current: subjects.length,
      target: 3,
      rewardXP: 30,
    },
    {
      id: "five-contents",
      title: "Conhecimento conquistado",
      description: "Conclua cinco conteúdos de estudo.",
      current: completedContents,
      target: 5,
      rewardXP: 40,
    },
  ];
}
