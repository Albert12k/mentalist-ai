import { StudyHistory, Subject } from "../types/Subject";
import { calculateRetentionAfterStudy } from "./retention";
import { calculateStudyXP } from "./xpSystem";

export type StudySessionInput = {
  durationMinutes: number;
  contentId?: string;
  completeContent: boolean;
};

export type RecordedStudySession = {
  subject: Subject;
  session: StudyHistory;
};

/**
 * Centraliza a regra de negócio do estudo. A tela apenas recolhe os dados;
 * este serviço cria o histórico e devolve uma nova matéria, sem mutar o
 * estado existente.
 */
export function recordStudySession(
  subject: Subject,
  input: StudySessionInput,
): RecordedStudySession {
  const durationMinutes = Math.min(Math.max(Math.round(input.durationMinutes), 1), 180);
  const studiedAt = new Date().toISOString();
  const xpEarned = calculateStudyXP(durationMinutes, input.completeContent);
  const session: StudyHistory = {
    id: `${Date.now()}-${subject.id}`,
    date: studiedAt,
    duration: durationMinutes,
    xpEarned,
    completedContent: input.completeContent,
    ...(input.contentId ? { contentId: input.contentId } : {}),
  };

  return {
    session,
    subject: {
      ...subject,
      retention: calculateRetentionAfterStudy(subject.retention, durationMinutes),
      lastStudied: studiedAt,
      contents: subject.contents.map((content) =>
        input.completeContent && content.id === input.contentId
          ? { ...content, completed: true }
          : content,
      ),
      studyHistory: [...subject.studyHistory, session],
    },
  };
}

// Usado ao editar ou excluir uma sessão para que os indicadores derivados não
// continuem contando um registro que já não existe.
export function recalculateSubjectStudy(subject: Subject): Subject {
  const orderedSessions = [...subject.studyHistory].sort((a, b) => a.date.localeCompare(b.date));
  const retention = orderedSessions.reduce((value, session) => calculateRetentionAfterStudy(value, session.duration), 0);
  return { ...subject, retention, lastStudied: orderedSessions.at(-1)?.date };
}
