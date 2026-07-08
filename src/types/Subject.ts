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
// - Função de 1º grau ✅
// - Derivada ❌
// - Matrizes ❌
//

export type SubjectContent = {

  id: string;

  title: string;

  completed: boolean;

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

  id: string;

  title: string;

  date: string;

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

  id: string;

  date: string;

  duration: number; // minutos

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