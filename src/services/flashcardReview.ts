import { SubjectFlashcard } from "../types/Subject";

export type FlashcardReviewRating = "again" | "hard" | "easy";

function addDays(date: Date, days: number): string {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate.toISOString();
}

// Cada avaliação muda o próximo encontro com a carta. Os intervalos são
// simples de propósito: são fáceis de entender e podem virar um algoritmo de
// repetição espaçada mais completo futuramente.
function getIntervalDays(flashcard: SubjectFlashcard, rating: FlashcardReviewRating): number {
  if (rating === "again") return 1;
  if (rating === "hard") return flashcard.reviewCount < 2 ? 2 : 4;

  if (flashcard.reviewCount < 2) return 4;
  if (flashcard.reviewCount < 5) return 10;
  return 21;
}

export function reviewFlashcard(
  flashcard: SubjectFlashcard,
  rating: FlashcardReviewRating,
): SubjectFlashcard {
  const reviewedAt = new Date();

  return {
    ...flashcard,
    reviewCount: flashcard.reviewCount + 1,
    lastReviewedAt: reviewedAt.toISOString(),
    nextReviewAt: addDays(reviewedAt, getIntervalDays(flashcard, rating)),
  };
}

// Cartas antigas, criadas antes deste recurso, não têm próxima revisão e por
// isso aparecem como pendentes para que o estudante não as perca.
export function getDueFlashcards(flashcards: SubjectFlashcard[], now = new Date()): SubjectFlashcard[] {
  return flashcards.filter((flashcard) => (
    !flashcard.nextReviewAt || new Date(flashcard.nextReviewAt).getTime() <= now.getTime()
  ));
}

export function formatNextReview(nextReviewAt?: string): string {
  if (!nextReviewAt) return "Revisar agora";

  const date = new Date(nextReviewAt);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const reviewDay = new Date(date);
  reviewDay.setHours(0, 0, 0, 0);

  if (reviewDay.getTime() <= today.getTime()) return "Revisar agora";
  return `Revisar em ${reviewDay.toLocaleDateString("pt-BR")}`;
}
