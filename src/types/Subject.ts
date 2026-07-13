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

  // Conteúdo estudado na sessão, quando o usuário o seleciona.
  // Mantemos este campo opcional para continuar aceitando os dados já salvos
  // em versões anteriores do aplicativo.
  contentId?: string;


};

// ============================================
// 📎 MATERIAIS DA MATÉRIA
// ============================================
//
// Um material é um arquivo que o estudante adiciona à matéria: PDF da aula,
// foto de uma anotação ou áudio gravado. A categoria é sugerida pelo app e
// pode ser ajustada antes de salvar.

export type SubjectMaterialType = "pdf" | "image" | "audio";

export type SubjectMaterialCategory =
  | "lesson"
  | "notes"
  | "review"
  | "exercise"
  | "other";

export type SubjectMaterial = {
  id: string;
  title: string;
  type: SubjectMaterialType;
  category: SubjectMaterialCategory;
  uri: string;
  mimeType?: string;
  size?: number;
  durationMillis?: number;

  // Data em que o arquivo foi incluído. Ela organiza a biblioteca da matéria.
  postedAt: string;
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

  // Quantidade de faltas registradas pelo estudante nesta matéria.
  absences: number;








  // =========================
  // 📚 CONTEÚDOS
  // =========================

  contents: SubjectContent[];

  // Arquivos e gravações organizados dentro desta matéria.
  materials: SubjectMaterial[];








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
