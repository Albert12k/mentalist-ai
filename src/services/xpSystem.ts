import { StudyHistory, Subject } from "../types/Subject";

const BASE_XP_PER_SESSION = 10;
const XP_PER_MINUTE = 1;
const XP_PER_COMPLETED_CONTENT = 15;
const XP_PER_LEVEL = 100;

export type LevelProgress = {
  level: number;
  currentXP: number;
  progressPercent: number;
};

export function calculateStudyXP(
  durationMinutes: number,
  completedContent: boolean,
): number {
  const safeDuration = Math.min(Math.max(Math.round(durationMinutes), 1), 180);

  return (
    BASE_XP_PER_SESSION +
    safeDuration * XP_PER_MINUTE +
    (completedContent ? XP_PER_COMPLETED_CONTENT : 0)
  );
}

export function getTotalXP(subjects: Subject[], bonusXP: number = 0): number {
  const studyXP = subjects.reduce(
    (total, subject) =>
      total + subject.studyHistory.reduce(
        (subjectXP, session: StudyHistory) => subjectXP + session.xpEarned,
        0,
      ),
    0,
  );

  return studyXP + Math.max(bonusXP, 0);
}

export function getLevelProgress(totalXP: number): LevelProgress {
  const safeXP = Math.max(totalXP, 0);

  return {
    level: Math.floor(safeXP / XP_PER_LEVEL) + 1,
    currentXP: safeXP % XP_PER_LEVEL,
    progressPercent: (safeXP % XP_PER_LEVEL),
  };
}
