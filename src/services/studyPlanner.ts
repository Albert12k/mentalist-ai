// ==================================================
// 🧠 STUDY PLANNER
// Primeiro sistema inteligente do Mentalis
// Responsável por escolher o que estudar
// ==================================================


// =========================
// 🎨 TIPOS
// =========================

import { Subject } from "../types/Subject";




// =========================
// 📌 TIPO DO RESULTADO
// =========================

export type StudyRecommendation = {

  // 📚 matéria recomendada
  subject: Subject;


  // 🧠 explicação da IA
  reason: string;


  // 📊 prioridade
  priority: number;

};

function getDaysSinceLastStudy(lastStudied?: string): number | null {
  if (!lastStudied) return null;

  const lastStudiedTime = new Date(lastStudied).getTime();
  if (Number.isNaN(lastStudiedTime)) return null;

  return Math.max(0, Math.floor((Date.now() - lastStudiedTime) / 86_400_000));
}

type UpcomingEvent = {
  title: string;
  daysUntil: number;
};

function getUpcomingEvent(subject: Subject): UpcomingEvent | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingEvents = subject.events
    .map((event) => {
      const eventDate = new Date(`${event.date}T12:00:00`);
      const daysUntil = Math.round((eventDate.getTime() - today.getTime()) / 86_400_000);

      return { title: event.title, daysUntil };
    })
    .filter((event) => !Number.isNaN(event.daysUntil) && event.daysUntil >= 0)
    .sort((first, second) => first.daysUntil - second.daysUntil);

  return upcomingEvents[0] ?? null;
}





// ==================================================
// 🧠 CALCULAR PRIORIDADE
// ==================================================

function calculatePriority(
  subject: Subject
): number {


  let score = 0;



  // =========================
  // 📊 RETENÇÃO
  // =========================
  // menor retenção = maior urgência

  score +=
    (100 - subject.retention) * 0.5;

  // Matérias que nunca foram estudadas ou ficaram esquecidas precisam voltar
  // ao plano. Esse valor passa a refletir as sessões registradas no app.
  const daysSinceLastStudy = getDaysSinceLastStudy(subject.lastStudied);

  if (daysSinceLastStudy === null) {
    score += 15;
  } else {
    score += Math.min(daysSinceLastStudy * 3, 20);
  }

  const upcomingEvent = getUpcomingEvent(subject);

  if (upcomingEvent) {
    if (upcomingEvent.daysUntil <= 1) {
      score += 25;
    } else if (upcomingEvent.daysUntil <= 3) {
      score += 20;
    } else if (upcomingEvent.daysUntil <= 7) {
      score += 12;
    } else if (upcomingEvent.daysUntil <= 14) {
      score += 5;
    }
  }




  // =========================
  // 🧠 DIFICULDADE
  // =========================

  if(subject.difficulty === "hard") {

    score += 25;

  }

  else if(subject.difficulty === "medium") {

    score += 15;

  }

  else {

    score += 5;

  }




  // =========================
  // 📅 FREQUÊNCIA
  // =========================

  if(subject.frequency === "daily") {

    score += 15;

  }

  else if(subject.frequency === "three_times") {

    score += 10;

  }

  else {

    score += 5;

  }




  // =========================
  // 🎯 OBJETIVO
  // =========================

  if(subject.goal === "exam") {

    score += 20;

  }

  else if(subject.goal === "contest") {

    score += 18;

  }

  else if(subject.goal === "career") {

    score += 15;

  }

  else if(subject.goal === "college") {

    score += 12;

  }

  else {

    score += 5;

  }




  // limite máximo

  return Math.min(
    Math.round(score),
    100
  );

}







// ==================================================
// 🧠 GERAR PLANO DE ESTUDO
// ==================================================

export function generateStudyPlan(

  subjects: Subject[]

): StudyRecommendation[] {



  return subjects

    .map((subject) => {



      const priority =
        calculatePriority(subject);



      let reason =
        "Boa matéria para evolução";





      // =========================
      // 🔎 EXPLICAÇÃO DA IA
      // =========================

      const daysSinceLastStudy = getDaysSinceLastStudy(subject.lastStudied);
      const upcomingEvent = getUpcomingEvent(subject);

      if(upcomingEvent && upcomingEvent.daysUntil <= 3) {

        reason =
          `Prazo próximo: ${upcomingEvent.title}`;

      }

      else if(daysSinceLastStudy === null) {

        reason =
          "Você ainda não estudou esta matéria";

      }

      else if(daysSinceLastStudy >= 3) {

        reason =
          "Está há alguns dias sem revisão";

      }

      else if(subject.retention < 40) {


        reason =
          "Sua retenção está baixa";


      }


      else if(subject.difficulty === "hard") {


        reason =
          "Matéria considerada difícil";


      }


      else if(subject.goal === "exam") {


        reason =
          "Foco em preparação para prova";


      }





      return {


        subject,


        priority,


        reason,


      };


    })


    // 🔥 maior prioridade primeiro

    .sort(

      (a,b) =>
        b.priority - a.priority

    );

}







// ==================================================
// 🧠 FILTRAR PLANO PELO MODO DE ESTUDO
// ==================================================

export function getStudyByMode(

  plan: StudyRecommendation[],

  mode:
    | "manual"
    | "guided"
    | "auto"
    | null

): StudyRecommendation[] {



  // =========================
  // 📝 MANUAL
  // Usuário escolhe sozinho
  // =========================

  if(mode === "manual") {

    // No modo manual, mostramos todas as matérias para que a pessoa escolha
    // livremente qual sessão deseja iniciar.
    return plan;

  }





  // =========================
  // 🧠 GUIADO
  // IA recomenda poucas matérias
  // =========================

  if(mode === "guided") {

    return plan.slice(0, 2);

  }





  // =========================
  // 🤖 AUTOMÁTICO
  // IA cria treino maior
  // =========================

  if(mode === "auto") {

    return plan.slice(0, 5);

  }





  // =========================
  // ❌ NENHUM MODO ESCOLHIDO
  // =========================

  return [];

}
