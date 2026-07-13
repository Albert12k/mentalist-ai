import { Subject } from "../types/Subject";
import { generateStudyPlan } from "./studyPlanner";

export type TutorMessage = {
  id: string;
  author: "student" | "tutor";
  text: string;
};

function getUpcomingEvents(subjects: Subject[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return subjects
    .flatMap((subject) => subject.events.map((event) => ({ ...event, subjectName: subject.name })))
    .map((event) => ({
      ...event,
      daysUntil: Math.round((new Date(`${event.date}T12:00:00`).getTime() - today.getTime()) / 86_400_000),
    }))
    .filter((event) => event.daysUntil >= 0)
    .sort((first, second) => first.daysUntil - second.daysUntil);
}

/**
 * Esta é a primeira versão do Tutor: uma resposta local e previsível,
 * baseada nos dados que o usuário já cadastrou. Mantemos a decisão em uma
 * função isolada para poder trocar depois por uma chamada de API de IA sem
 * reescrever a tela de conversa.
 */
export function buildTutorResponse(question: string, subjects: Subject[]): string {
  const normalizedQuestion = question
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (subjects.length === 0) {
    return "Vamos começar criando uma matéria. Depois eu consigo sugerir prioridades, prazos e uma rotina de estudo.";
  }

  if (/(estudar|hoje|treino|prioridade)/.test(normalizedQuestion)) {
    const recommendations = generateStudyPlan(subjects).slice(0, 3);
    const suggestions = recommendations
      .map((item, index) => `${index + 1}. ${item.subject.name} — ${item.reason.toLocaleLowerCase("pt-BR")}.`)
      .join("\n");

    return `Para hoje, eu sugiro:\n${suggestions}\n\nComece com 25 minutos e registre a sessão quando terminar.`;
  }

  if (/(prazo|prova|trabalho|data|evento)/.test(normalizedQuestion)) {
    const events = getUpcomingEvents(subjects).slice(0, 3);
    if (events.length === 0) return "Você ainda não tem datas importantes cadastradas. Adicione provas ou trabalhos no detalhe de uma matéria.";

    return `Seus próximos prazos são:\n${events
      .map((event) => `• ${event.title} (${event.subjectName}) em ${event.daysUntil === 0 ? "hoje" : `${event.daysUntil} dia(s)`}.`)
      .join("\n")}`;
  }

  if (/(progresso|retencao|retencao|evolucao|xp)/.test(normalizedQuestion)) {
    const totalSessions = subjects.reduce((total, subject) => total + subject.studyHistory.length, 0);
    const averageRetention = Math.round(
      subjects.reduce((total, subject) => total + subject.retention, 0) / subjects.length,
    );
    const weakestSubject = subjects.slice().sort((first, second) => first.retention - second.retention)[0];

    return `Você registrou ${totalSessions} sessão(ões) e sua retenção média está em ${averageRetention}%. ${weakestSubject ? `A melhor oportunidade de revisão agora é ${weakestSubject.name}, com ${weakestSubject.retention}% de retenção.` : ""}`;
  }

  if (/(como|metodo|memorizar|aprender|revisar)/.test(normalizedQuestion)) {
    return "Experimente este ciclo: leia um trecho curto, feche o material e explique com suas palavras. Depois responda duas perguntas sem consultar. Registre o que ainda ficou difícil como um conteúdo pendente para revisar mais tarde.";
  }

  return "Posso ajudar com: o que estudar hoje, prazos, progresso ou métodos de revisão. Por enquanto esta versão funciona com seus dados locais; uma integração com IA real pode ser adicionada depois.";
}
