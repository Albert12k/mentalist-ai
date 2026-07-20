import { Subject } from "../types/Subject";
import { supabase } from "./supabase";

type AiTutorResult = { answer?: string; error?: string };

// Transforma os dados da conta em um contexto enxuto. PDF, foto e áudio terão
// uma etapa própria de leitura/transcrição antes de poderem entrar na IA.
function buildStudyContext(subjects: Subject[]): string {
  if (subjects.length === 0) return "O estudante ainda não cadastrou matérias.";
  return subjects.map((subject) => {
    const contents = subject.contents.slice(0, 20).map((content) => `- Conteúdo: ${content.title}${content.description ? ` — ${content.description}` : ""} (${content.completed ? "concluído" : "pendente"})`).join("\n");
    const events = subject.events.filter((event) => !event.completed).slice(0, 10).map((event) => `- ${event.type}: ${event.title} em ${event.date}`).join("\n");
    return [
      `MATÉRIA: ${subject.name}`,
      `Progresso: retenção ${subject.retention}%, faltas ${subject.absences}.`,
      contents || "- Nenhum conteúdo cadastrado.",
      events ? `Próximos compromissos:\n${events}` : "Sem próximos compromissos.",
      subject.notes ? `Anotações: ${subject.notes.slice(0, 1_500)}` : "",
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
