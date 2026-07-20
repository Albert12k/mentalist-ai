import { StudyHistory, Subject } from "../types/Subject";

export type ProgressPeriod = "week" | "month" | "all";
export type SessionWithSubject = { session: StudyHistory; subject: Subject };

function startOfDay(date: Date) { const value = new Date(date); value.setHours(0, 0, 0, 0); return value; }
function dayKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }

export function getPeriodLength(period: ProgressPeriod): number | undefined { return period === "week" ? 7 : period === "month" ? 30 : undefined; }

export function getSessions(subjects: Subject[], period: ProgressPeriod, previous = false): SessionWithSubject[] {
  const length = getPeriodLength(period);
  const today = startOfDay(new Date());
  const end = new Date(today);
  const start = new Date(0);
  if (length) {
    start.setTime(today.getTime());
    start.setDate(today.getDate() - (previous ? length * 2 - 1 : length - 1));
    if (previous) end.setDate(today.getDate() - length);
  }
  return subjects.flatMap((subject) => subject.studyHistory.map((session) => ({ subject, session }))).filter(({ session }) => {
    const date = new Date(session.date);
    return (!length || date >= start) && date < new Date(end.getTime() + 86_400_000);
  }).sort((a, b) => b.session.date.localeCompare(a.session.date));
}

export function buildTrend(subjects: Subject[], period: ProgressPeriod) {
  const length = getPeriodLength(period) ?? 180;
  const bucketCount = period === "week" ? 7 : period === "month" ? 6 : 6;
  const bucketSize = Math.ceil(length / bucketCount);
  const sessions = getSessions(subjects, period);
  return Array.from({ length: bucketCount }, (_, index) => {
    const endOffset = (bucketCount - 1 - index) * bucketSize;
    const startOffset = endOffset + bucketSize - 1;
    const start = startOfDay(new Date()); start.setDate(start.getDate() - startOffset);
    const end = startOfDay(new Date()); end.setDate(end.getDate() - endOffset);
    const minutes = sessions.filter(({ session }) => { const date = new Date(session.date); return date >= start && date < new Date(end.getTime() + 86_400_000); }).reduce((total, item) => total + item.session.duration, 0);
    const label = period === "week" ? start.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "") : `${start.getDate()}/${start.getMonth() + 1}`;
    return { key: dayKey(start), label, minutes };
  });
}

export function countScheduledClasses(subject: Subject): number {
  if (!(subject.classDays ?? []).length) return 0;
  const cursor = startOfDay(new Date(subject.createdAt));
  const today = startOfDay(new Date());
  const keys = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;
  let count = 0;
  while (cursor <= today) {
    if (subject.classDays.includes(keys[cursor.getDay()])) count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

export function getAttentionReasons(subject: Subject, periodMinutes: number): string[] {
  const reasons: string[] = [];
  const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const hasRecentStudy = subject.studyHistory.some((session) => new Date(session.date) >= sevenDaysAgo);
  const overdue = subject.events.filter((event) => !event.completed && new Date(`${event.date}T23:59:59`) < new Date()).length;
  const upcoming = subject.events.filter((event) => { const days = Math.ceil((new Date(`${event.date}T12:00:00`).getTime() - Date.now()) / 86_400_000); return !event.completed && days >= 0 && days <= 7; }).length;
  if (!hasRecentStudy) reasons.push("sem estudo nos últimos 7 dias");
  if (periodMinutes < 30) reasons.push("menos de 30 minutos no período");
  if (subject.absences >= 2) reasons.push(`${subject.absences} faltas registradas`);
  if (overdue) reasons.push(`${overdue} atividade(s) atrasada(s)`);
  if (upcoming) reasons.push(`${upcoming} prazo(s) nos próximos 7 dias`);
  return reasons;
}
