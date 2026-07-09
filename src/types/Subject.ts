/**
 * ============================================
 * 🧠 TIPOS DE INTELIGÊNCIA DA MATÉRIA
 * ============================================
 *
 * Esses dados ajudam o Mentalis a entender
 * como planejar os estudos futuramente.
 */



// ============================================
// 📊 DIFICULDADE
// ============================================

export type SubjectDifficulty =
  | "easy"       // 🟢 Fácil
  | "medium"     // 🟡 Médio
  | "hard";      // 🔴 Difícil





// ============================================
// 🎯 OBJETIVO
// ============================================

export type StudyGoal =
  | "exam"       // 📝 Provas / ENEM
  | "college"    // 🎓 Faculdade
  | "contest"    // 🏆 Concurso
  | "career"     // 💼 Trabalho
  | "personal";  // 🧠 Interesse pessoal





// ============================================
// 📅 FREQUÊNCIA
// ============================================

export type StudyFrequency =
  | "daily"
  | "three_times"
  | "weekend";








// ============================================
// 📚 CONTEÚDOS DA MATÉRIA
// ============================================
//
// Exemplo:
//
// Matemática
//
// - Função de 1º grau
// - Derivada
// - Matrizes
//
// Futuramente usado para:
// - checklist
// - progresso
// - IA recomendar assuntos
//

export type SubjectContent = {


  // 🆔 identificação

  id: string;



  // 📖 nome do conteúdo

  title: string;



  // 📝 explicação opcional

  description?: string;



  // ✅ concluído ou não

  completed: boolean;



  // 📅 criação

  createdAt: string;


};









// ============================================
// 📅 DATAS IMPORTANTES
// ============================================
//
// Exemplo:
//
// Prova de matemática
// Trabalho
// Revisão
//

export type SubjectEvent = {


  // 🆔 identificação

  id: string;



  // 📌 nome do evento

  title: string;



  // 📅 data

  date: string;



  // 🏷️ tipo do evento

  type:
    | "exam"        // prova
    | "assignment"  // trabalho
    | "review";     // revisão


};









// ============================================
// 🧠 HISTÓRICO DE ESTUDO
// ============================================
//
// Guarda evolução do aluno.
//
// Futuramente usado para:
// - gráficos
// - XP
// - revisão espaçada
//

export type StudyHistory = {


  // 🆔 identificação

  id: string;



  // 📅 quando estudou

  date: string;



  // ⏱️ duração em minutos

  duration: number;



  // ⚡ experiência ganha

  xpEarned: number;


};









// ============================================
// 📚 MODELO PRINCIPAL DA MATÉRIA
// ============================================

export type Subject = {



  // =========================
  // 🆔 IDENTIFICAÇÃO
  // =========================

  id: string;






  // =========================
  // 📖 INFORMAÇÕES BÁSICAS
  // =========================

  name: string;



  description?: string;



  color: string;

image?: string;








  // =========================
  // 🧠 INFORMAÇÕES INTELIGENTES
  // =========================

  difficulty: SubjectDifficulty;



  goal: StudyGoal;



  frequency: StudyFrequency;








  // =========================
  // 📊 DESEMPENHO
  // =========================

  /**
   * 0 = esqueceu tudo
   * 100 = domínio completo
   */

  retention: number;








  // =========================
  // 📚 CONTEÚDOS
  // =========================

  contents: SubjectContent[];








  // =========================
  // 📅 DATAS IMPORTANTES
  // =========================

  events: SubjectEvent[];








  // =========================
  // 📝 ANOTAÇÕES
  // =========================

  notes: string;








  // =========================
  // 🧠 HISTÓRICO
  // =========================

  studyHistory: StudyHistory[];








  // =========================
  // ⏳ CONTROLE
  // =========================

  lastStudied?: string;



  createdAt: string;



};