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

      if(subject.retention < 40) {


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

    return [];

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