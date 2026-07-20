import { Subject } from "../types/Subject";

export type StudyWeekDay = {
  key: string;
  label: string;
  active: boolean;
  today: boolean;
};

function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function calendarDayNumber(date: Date): number {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
}

export function buildStudyActivity(subjects: Subject[], protectedDates: string[] = []) {
  const studiedDays = new Set(subjects.flatMap((subject) => subject.studyHistory.map((session) => dayKey(new Date(session.date)))));
  const protectedDays = new Set(protectedDates);
  const activeDays = new Set([...studiedDays, ...protectedDays]);
  const today = startOfDay(new Date());
  const cursor = new Date(today);

  // A sequência pode continuar a partir de ontem quando a pessoa ainda não
  // estudou hoje, evitando que ela veja o número zerar logo pela manhã.
  if (!activeDays.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let currentStreak = 0;
  while (activeDays.has(dayKey(cursor))) {
    currentStreak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const sortedDays = [...activeDays].map((key) => startOfDay(new Date(`${key}T12:00:00`))).sort((a, b) => a.getTime() - b.getTime());
  let bestStreak = 0;
  let runningStreak = 0;
  let previous: Date | undefined;
  sortedDays.forEach((date) => {
    const consecutive = previous && calendarDayNumber(date) - calendarDayNumber(previous) === 1;
    runningStreak = consecutive ? runningStreak + 1 : 1;
    bestStreak = Math.max(bestStreak, runningStreak);
    previous = date;
  });

  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const labels = ["S", "T", "Q", "Q", "S", "S", "D"];
  const week: StudyWeekDay[] = labels.map((label, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return { key: dayKey(date), label, active: studiedDays.has(dayKey(date)), today: dayKey(date) === dayKey(today) };
  });

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const dayBeforeYesterday = new Date(today);
  dayBeforeYesterday.setDate(today.getDate() - 2);
  const protectableDate = !activeDays.has(dayKey(yesterday)) && activeDays.has(dayKey(dayBeforeYesterday)) ? dayKey(yesterday) : undefined;

  return { currentStreak, bestStreak, totalActiveDays: studiedDays.size, week, protectableDate };
}
