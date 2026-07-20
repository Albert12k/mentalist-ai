import { ClassDay, Subject } from "../types/Subject";

export type StudyRecommendation = { subject: Subject; reason: string; priority: number };

const weekdayKeys: ClassDay[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function daysSince(date?: string): number | undefined {
  if (!date) return undefined;
  const value = new Date(date).getTime();
  return Number.isNaN(value) ? undefined : Math.max(0, Math.floor((Date.now() - value) / 86_400_000));
}

function nearestEvent(subject: Subject) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return subject.events.filter((event) => !event.completed).map((event) => ({ event, days: Math.round((new Date(`${event.date}T12:00:00`).getTime() - today.getTime()) / 86_400_000) })).filter((item) => item.days >= 0).sort((a, b) => a.days - b.days)[0];
}

// A prioridade usa somente informações que o estudante realmente registra:
// calendário, prazos, conteúdos, faltas e histórico de estudo.
export function generateStudyPlan(subjects: Subject[]): StudyRecommendation[] {
  const todayClassDay = weekdayKeys[new Date().getDay()];
  return subjects.map((subject) => {
    const inactiveDays = daysSince(subject.lastStudied);
    const upcoming = nearestEvent(subject);
    const pendingContents = subject.contents.filter((content) => !content.completed).length;
    let priority = 10;
    if ((subject.classDays ?? []).includes(todayClassDay)) priority += 18;
    if (inactiveDays === undefined) priority += 22;
    else priority += Math.min(inactiveDays * 4, 24);
    if (upcoming?.days === 0) priority += 35;
    else if (upcoming && upcoming.days <= 3) priority += 25;
    else if (upcoming && upcoming.days <= 7) priority += 14;
    priority += Math.min(pendingContents * 3, 15);
    priority += Math.min(subject.absences * 2, 8);
    priority += Math.round((100 - subject.retention) * 0.12);

    let reason = "Boa opção para manter sua rotina";
    if (upcoming?.days === 0) reason = `${upcoming.event.title} vence hoje`;
    else if (upcoming && upcoming.days <= 3) reason = `Prazo próximo: ${upcoming.event.title}`;
    else if (inactiveDays === undefined) reason = "Você ainda não estudou esta matéria";
    else if (inactiveDays >= 3) reason = `${inactiveDays} dias sem registrar estudo`;
    else if ((subject.classDays ?? []).includes(todayClassDay)) reason = "Você tem aula desta matéria hoje";
    else if (pendingContents) reason = `${pendingContents} conteúdo(s) pendente(s)`;

    return { subject, reason, priority: Math.min(priority, 100) };
  }).sort((a, b) => b.priority - a.priority);
}

export function getStudyByMode(plan: StudyRecommendation[], mode: "manual" | "guided" | "auto" | null) {
  if (mode === "manual") return plan;
  if (mode === "guided") return plan.slice(0, 2);
  if (mode === "auto") return plan.slice(0, 5);
  return [];
}
