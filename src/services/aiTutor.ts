import { Subject, SubjectFlashcard, SubjectQuiz, SubjectQuizQuestion } from "../types/Subject";
import { supabase } from "./supabase";

type AiTutorResult = { answer?: string; error?: string };

// Transforma os dados da conta em um contexto enxuto. PDF, foto e áudio terão
// uma etapa própria de leitura/transcrição antes de poderem entrar na IA.
function buildStudyContext(subjects: Subject[]): string {
  if (subjects.length === 0) return "O estudante ainda não cadastrou matérias.";
  return subjects.map((subject) => {
    const contents = subject.contents.slice(0, 20).map((content) => `- Conteúdo: ${content.title}${content.description ? ` — ${content.description}` : ""} (${content.completed ? "concluído" : "pendente"})`).join("\n");
    const events = subject.events.filter((event) => !event.completed).slice(0, 10).map((event) => `- ${event.type}: ${event.title} em ${event.date}`).join("\n");
    const extractedMaterials = subject.materials.filter((material) => material.extractedText).slice(0, 8).map((material) => `- ${material.title}: ${material.extractedText!.slice(0, 1_500)}`).join("\n");
    return [
      `MATÉRIA: ${subject.name}`,
      `Progresso: retenção ${subject.retention}%, faltas ${subject.absences}.`,
      contents || "- Nenhum conteúdo cadastrado.",
      events ? `Próximos compromissos:\n${events}` : "Sem próximos compromissos.",
      subject.notes ? `Anotações: ${subject.notes.slice(0, 1_500)}` : "",
      extractedMaterials ? `Texto extraído dos materiais:\n${extractedMaterials}` : "",
    ].filter(Boolean).join("\n");
  }).join("\n\n");
}

export async function askAiTutor(question: string, subjects: Subject[]): Promise<AiTutorResult> {
  if (!supabase) return { error: "Conecte o Supabase para usar o Tutor IA." };
  const { data, error } = await supabase.functions.invoke<AiTutorResult>("mentalis-ai", {
    body: { question, studyContext: buildStudyContext(subjects) },
  });
  if (error) return { error: "Não foi possível acessar a IA agora. Verifique sua conexão e tente novamente." };
  return data ?? { error: "A IA não retornou uma resposta." };
}

export async function generateAiSummary(subject: Subject): Promise<string | undefined> {
  const result = await askAiTutor(`Crie um resumo de revisão da matéria ${subject.name}, com conceitos principais, pontos para revisar e próximos passos.`, [subject]);
  return result.answer;
}

export async function extractMaterialText(assetUrl: string, mimeType: string): Promise<{ text?: string; error?: string }> {
  if (!supabase) return { error: "Conecte o Supabase para ler materiais com IA." };
  const { data, error } = await supabase.functions.invoke<{ extractedText?: string; error?: string }>("mentalis-ai", { body: { mode: "extract", assetUrl, mimeType } });
  if (error) {
    // Funções do Supabase podem devolver o detalhe em uma Response; tentamos
    // lê-lo para que a tela mostre a causa em vez de um erro genérico.
    const context = (error as { context?: { clone?: () => { json: () => Promise<{ error?: string }> } } }).context;
    try {
      const detail = context?.clone ? await context.clone().json() : undefined;
      return { error: detail?.error ?? error.message ?? "Não foi possível chamar a IA." };
    } catch {
      return { error: error.message || "Não foi possível chamar a IA." };
    }
  }
  return { text: data?.extractedText?.trim(), error: data?.error };
}

async function askAssessment(mode: "quiz" | "flashcards", subject: Subject): Promise<string | undefined> {
  if (!supabase) return undefined;
  const { data } = await supabase.functions.invoke<AiTutorResult>("mentalis-ai", { body: { mode, question: `Gere material de revisão para ${subject.name}.`, studyContext: buildStudyContext([subject]) } });
  return data?.answer;
}

export async function generateAiQuiz(subject: Subject): Promise<SubjectQuiz | null> {
  try {
    const parsed = JSON.parse((await askAssessment("quiz", subject)) ?? "{}") as { questions?: Array<Omit<SubjectQuizQuestion, "id">> };
    const questions = parsed.questions?.filter((item) => item.question && item.options?.length === 4 && Number.isInteger(item.correctOptionIndex) && item.correctOptionIndex >= 0 && item.correctOptionIndex < 4).map((item) => ({ ...item, id: `quiz-question-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` }));
    return questions?.length ? { id: `quiz-ai-${Date.now()}`, title: `Quiz IA: ${subject.name}`, questions, createdAt: new Date().toISOString(), sourceContentIds: subject.contents.map((content) => content.id) } : null;
  } catch { return null; }
}

export async function generateAiFlashcards(subject: Subject): Promise<SubjectFlashcard[]> {
  try {
    const parsed = JSON.parse((await askAssessment("flashcards", subject)) ?? "{}") as { flashcards?: Array<{ question?: string; answer?: string }> };
    return (parsed.flashcards ?? []).filter((item) => item.question && item.answer).map((item) => ({ id: `flashcard-ai-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, question: item.question!, answer: item.answer!, createdAt: new Date().toISOString(), reviewCount: 0, nextReviewAt: new Date().toISOString() }));
  } catch { return []; }
}
