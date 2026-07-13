import {
  Subject,
  SubjectFlashcard,
  SubjectQuiz,
  SubjectQuizQuestion,
} from "../types/Subject";

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function shorten(text: string, maxLength = 220): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength).trim()}…` : normalized;
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function getDistractors(subject: Subject, contentId: string, correctTitle: string): string[] {
  const contentTitles = subject.contents
    .filter((content) => content.id !== contentId)
    .map((content) => content.title);
  const materialTitles = subject.materials.map((material) => material.title);
  const fallbackTitles = [
    "Um prazo da matéria",
    "Uma anotação pessoal",
    "Um tema complementar",
  ];

  return unique([...contentTitles, ...materialTitles, ...fallbackTitles])
    .filter((title) => title !== correctTitle)
    .slice(0, 3);
}

// Gera uma carta para cada conteúdo ainda não usado. A descrição cadastrada é
// a resposta; por isso o estudante controla exatamente a fonte da revisão.
export function generateFlashcardsFromSubject(
  subject: Subject,
  existingFlashcards: SubjectFlashcard[],
): SubjectFlashcard[] {
  const contentIdsAlreadyUsed = new Set(
    existingFlashcards.map((flashcard) => flashcard.sourceContentId).filter(Boolean),
  );

  return subject.contents
    .filter((content) => !contentIdsAlreadyUsed.has(content.id))
    .map((content) => ({
      id: createId("flashcard"),
      question: `O que você consegue explicar sobre “${content.title}”?`,
      answer: content.description?.trim()
        || `Revise os materiais e as anotações cadastradas para o conteúdo “${content.title}”.`,
      createdAt: new Date().toISOString(),
      reviewCount: 0,
      nextReviewAt: new Date().toISOString(),
      sourceContentId: content.id,
    }));
}

// Cria perguntas de associação: a descrição de um conteúdo vira o enunciado,
// enquanto os demais conteúdos e materiais viram alternativas. Só usamos
// conteúdos com descrição para não inventar informações que o usuário não deu.
export function generateQuizFromSubject(subject: Subject): SubjectQuiz | null {
  const sourceContents = subject.contents.filter((content) => Boolean(content.description?.trim()));

  if (sourceContents.length === 0) return null;

  const questions: SubjectQuizQuestion[] = sourceContents.slice(0, 10).map((content, index) => {
    const correctTitle = content.title;
    const alternatives = [correctTitle, ...getDistractors(subject, content.id, correctTitle)];

    // Mantemos quatro opções, mesmo quando a matéria ainda tem poucos conteúdos.
    while (alternatives.length < 4) {
      alternatives.push(`Tema complementar ${alternatives.length}`);
    }

    // A posição correta muda em cada pergunta, evitando que a resposta esteja
    // sempre na alternativa A.
    const shift = index % alternatives.length;
    const options = [...alternatives.slice(shift), ...alternatives.slice(0, shift)];

    return {
      id: createId("quiz-question"),
      question: `Qual conteúdo corresponde à descrição: “${shorten(content.description ?? "")}”?`,
      options,
      correctOptionIndex: options.indexOf(correctTitle),
    };
  });

  return {
    id: createId("quiz"),
    title: `Quiz de revisão: ${subject.name}`,
    questions,
    createdAt: new Date().toISOString(),
    sourceContentIds: sourceContents.map((content) => content.id),
  };
}
