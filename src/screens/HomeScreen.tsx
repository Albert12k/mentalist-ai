import { useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

import ProgressBar from "../components/ProgressBar";
import XPBar from "../components/XPBar";
import { useProfile } from "../contexts/ProfileContext";
import { useSubjects } from "../contexts/SubjectsContext";
import { getActivityReminders, getDaysUntil } from "../services/activityReminders";
import { getDueFlashcards } from "../services/flashcardReview";
import { generateStudyPlan, StudyRecommendation } from "../services/studyPlanner";
import { getLevelProgress, getTotalXP } from "../services/xpSystem";
import { askAiTutor } from "../services/aiTutor";
import { colors } from "../theme/colors";

type StudyMode = "manual" | "guided" | "auto";

const modeInformation: Record<StudyMode, { number: string; title: string; description: string; detail: string }> = {
  manual: { number: "01", title: "Escolher matéria", description: "Você tem o controle", detail: "Veja todas as matérias e comece pela que quiser." },
  guided: { number: "02", title: "Treino guiado", description: "Decida com ajuda", detail: "O Mentalis separa as 2 prioridades mais importantes." },
  auto: { number: "03", title: "Treino automático", description: "Só seguir o plano", detail: "Uma fila completa de até 5 matérias para estudar." },
};

function getTodayKey() {
  const today = new Date();
  return today.toISOString().slice(0, 10);
}

function getWeekStart() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return date;
}

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { subjects } = useSubjects();
  const { profile } = useProfile();
  const [studyMode, setStudyMode] = useState<StudyMode>("guided");
  const [aiPlan, setAiPlan] = useState<string | null>(null);
  const [loadingAiPlan, setLoadingAiPlan] = useState(false);
  const plan = useMemo(() => generateStudyPlan(subjects), [subjects]);
  const selectedRecommendations = studyMode === "manual" ? plan : studyMode === "guided" ? plan.slice(0, 2) : plan.slice(0, 5);
  const totalXP = getTotalXP(subjects, profile.bonusXP);
  const levelProgress = getLevelProgress(totalXP);
  const activityReminders = getActivityReminders(subjects);
  const dueFlashcards = subjects.reduce((total, subject) => total + getDueFlashcards(subject.flashcards).length, 0);
  const allSessions = subjects.flatMap((subject) => subject.studyHistory);
  const todayMinutes = allSessions
    .filter((session) => session.date.slice(0, 10) === getTodayKey())
    .reduce((total, session) => total + session.duration, 0);
  const weekStart = getWeekStart();
  const weeklyMinutes = allSessions.reduce((total, session) => (
    new Date(session.date) >= weekStart ? total + session.duration : total
  ), 0);
  const weeklyProgress = Math.min(Math.round((weeklyMinutes / profile.weeklyGoalMinutes) * 100), 100);
  const nextEvent = subjects
    .flatMap((subject) => subject.events
      .filter((event) => !event.completed && getDaysUntil(event.date) >= 0)
      .map((event) => ({ subject, event, daysUntil: getDaysUntil(event.date) })))
    .sort((first, second) => first.daysUntil - second.daysUntil)[0];
  const firstName = profile.name.trim().split(" ")[0] || "Estudante";

  function startTraining(items: StudyRecommendation[], mode: StudyMode) {
    if (!items.length) {
      navigation.navigate("Matérias");
      return;
    }
    navigation.navigate("Training", { mode, subjectIds: items.map((item) => item.subject.id) });
  }

  function handlePrimaryAction() {
    if (dueFlashcards > 0) {
      navigation.navigate("ReviewQueue");
      return;
    }
    if (nextEvent) {
      navigation.navigate("SubjectDetails", { subject: nextEvent.subject });
      return;
    }
    startTraining(plan.slice(0, 1), "manual");
  }

  async function explainTodayPlan() {
    if (loadingAiPlan) return;
    setLoadingAiPlan(true);
    const result = await askAiTutor("Crie um plano curto para o meu estudo de hoje: diga a prioridade, o motivo e uma ação prática.", subjects);
    setAiPlan(result.answer ?? "Não foi possível gerar o plano agora. Use a prioridade sugerida abaixo.");
    setLoadingAiPlan(false);
  }

  const primaryAction = dueFlashcards > 0
    ? { eyebrow: "REVISÃO PENDENTE", title: `${dueFlashcards} flashcard(s) para revisar`, description: "Fortaleça o que você já estudou.", button: "Começar revisão" }
    : nextEvent
      ? { eyebrow: "PRÓXIMO PRAZO", title: nextEvent.event.title, description: `${nextEvent.subject.name} · ${nextEvent.daysUntil === 0 ? "vence hoje" : `em ${nextEvent.daysUntil} dia(s)`}`, button: "Ver atividade" }
      : plan[0]
        ? { eyebrow: "MELHOR PRÓXIMO PASSO", title: plan[0].subject.name, description: plan[0].reason, button: "Começar a estudar" }
        : { eyebrow: "COMECE POR AQUI", title: "Crie sua primeira matéria", description: "Organize seus conteúdos para receber recomendações.", button: "Criar matéria" };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.greeting}>Olá, {firstName}</Text>
        <Text style={styles.subtitle}>Vamos transformar seu estudo de hoje em progresso.</Text>

        <View style={styles.dayGrid}>
          <View style={styles.dayMetric}><Text style={styles.dayValue}>{todayMinutes}</Text><Text style={styles.dayLabel}>min hoje</Text></View>
          <View style={styles.dayMetric}><Text style={styles.dayValue}>{dueFlashcards}</Text><Text style={styles.dayLabel}>revisões</Text></View>
          <View style={styles.dayMetric}><Text style={styles.dayValue}>{nextEvent ? Math.max(nextEvent.daysUntil, 0) : "–"}</Text><Text style={styles.dayLabel}>dias p/ prazo</Text></View>
        </View>

        <Pressable onPress={handlePrimaryAction} style={styles.primaryCard}>
          <Text style={styles.primaryEyebrow}>{primaryAction.eyebrow}</Text>
          <Text style={styles.primaryTitle}>{primaryAction.title}</Text>
          <Text style={styles.primaryDescription}>{primaryAction.description}</Text>
          <View style={styles.primaryButton}><Text style={styles.primaryButtonText}>{primaryAction.button}</Text></View>
        </Pressable>

        <View style={styles.aiPlanCard}>
          <Text style={styles.primaryEyebrow}>PLANO DE HOJE COM IA</Text>
          <Text style={styles.aiPlanText}>{aiPlan ?? (plan[0] ? `${plan[0].subject.name}: ${plan[0].reason}` : "Adicione uma matéria para receber seu plano.")}</Text>
          <Pressable onPress={() => void explainTodayPlan()} style={styles.aiPlanButton}><Text style={styles.primaryButtonText}>{loadingAiPlan ? "IA pensando..." : "Explicar meu plano"}</Text></Pressable>
        </View>

        <View style={styles.goalCard}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>Meta semanal</Text>
            <Text style={styles.goalPercent}>{weeklyProgress}%</Text>
          </View>
          <Text style={styles.goalText}>{weeklyMinutes} de {profile.weeklyGoalMinutes} min</Text>
          <ProgressBar value={weeklyProgress} color="#7C4DFF" />
        </View>

        {activityReminders.length > 0 ? (
          <View style={styles.reminderCard}>
            <Text style={styles.reminderTitle}>Lembretes importantes</Text>
            {activityReminders.map((reminder) => (
              <Pressable key={`${reminder.subject.id}-${reminder.event.id}`} onPress={() => navigation.navigate("SubjectDetails", { subject: reminder.subject })} style={styles.reminderItem}>
                <View style={{ flex: 1 }}><Text style={styles.reminderItemTitle}>{reminder.event.title}</Text><Text style={styles.reminderItemSubject}>{reminder.subject.name}</Text></View>
                <Text style={styles.reminderDays}>{reminder.daysUntil} dia(s)</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Como você quer estudar?</Text>
        <Text style={styles.sectionHint}>Escolha um modo. Você pode trocar quando quiser.</Text>
        <View style={styles.modeList}>
          {(Object.keys(modeInformation) as StudyMode[]).map((mode) => (
            <Pressable key={mode} onPress={() => setStudyMode(mode)} style={[styles.modeButton, studyMode === mode && styles.modeButtonActive]}>
              <View style={styles.modeHeader}>
                <View style={[styles.modeNumber, studyMode === mode && styles.modeNumberActive]}><Text style={[styles.modeNumberText, studyMode === mode && styles.modeNumberTextActive]}>{modeInformation[mode].number}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modeTitle}>{modeInformation[mode].title}</Text>
                  <Text style={styles.modeDescription}>{modeInformation[mode].description}</Text>
                </View>
                {studyMode === mode ? <Text style={styles.selectedMark}>Selecionado</Text> : null}
              </View>
              <Text style={styles.modeDetail}>{modeInformation[mode].detail}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.trainingCard}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.trainingEyebrow}>SEU PLANO AGORA</Text>
              <Text style={styles.cardTitle}>{modeInformation[studyMode].title}</Text>
            </View>
            <Text style={styles.trainingCount}>{selectedRecommendations.length}</Text>
          </View>
          <Text style={styles.muted}>{modeInformation[studyMode].detail}</Text>
          {selectedRecommendations.length === 0 ? (
            <Text style={styles.muted}>Crie uma matéria para montar seu primeiro treino.</Text>
          ) : (
            <>
              {selectedRecommendations.map((item, index) => (
                <Pressable key={item.subject.id} onPress={() => startTraining([item], "manual")} style={[styles.recommendation, { borderLeftColor: item.subject.color }]}>
                  <View style={styles.rowBetween}><Text style={styles.recommendationTitle}>{index + 1}. {item.subject.name}</Text><Text style={styles.priority}>{item.priority}%</Text></View>
                  <Text style={styles.recommendationReason}>{item.reason}</Text>
                  {studyMode === "manual" ? <Text style={styles.quickStart}>Toque para estudar esta matéria</Text> : null}
                </Pressable>
              ))}
              <Pressable onPress={() => startTraining(selectedRecommendations, studyMode)} style={styles.startButton}>
                <Text style={styles.startButtonText}>{studyMode === "manual" ? "Começar pela primeira matéria" : studyMode === "guided" ? "Iniciar treino guiado" : "Iniciar sequência automática"}</Text>
              </Pressable>
            </>
          )}
        </View>

        <View style={styles.card}><XPBar level={levelProgress.level} xp={levelProgress.progressPercent} /></View>
        <Pressable onPress={() => navigation.navigate("Tutor")} style={styles.tutorCard}>
          <Text style={styles.cardTitle}>Precisa de ajuda para estudar?</Text>
          <Text style={styles.muted}>Converse com o tutor sobre prioridades, prazos e técnicas.</Text>
          <Text style={styles.tutorAction}>Abrir tutor</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = {
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  greeting: { color: "white", fontSize: 30, fontWeight: "800" },
  subtitle: { color: colors.subtitle, marginTop: 5, marginBottom: 18 },
  dayGrid: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  dayMetric: { width: "31%", backgroundColor: "#161625", borderRadius: 13, padding: 12 },
  dayValue: { color: "white", fontWeight: "800", fontSize: 21 },
  dayLabel: { color: "#9290A9", fontSize: 11, marginTop: 4 },
  primaryCard: { backgroundColor: "#342769", borderRadius: 18, padding: 18, marginBottom: 16 },
  aiPlanCard: { backgroundColor: "#161625", borderRadius: 18, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: "#342769" },
  aiPlanText: { color: "#E8E8F2", lineHeight: 21, marginTop: 8 },
  aiPlanButton: { backgroundColor: "#5E35B1", borderRadius: 10, padding: 11, marginTop: 14, alignSelf: "flex-start" },
  primaryEyebrow: { color: "#CFC2FF", fontWeight: "800", fontSize: 11, letterSpacing: 0.5 },
  primaryTitle: { color: "white", fontWeight: "800", fontSize: 22, marginTop: 9 },
  primaryDescription: { color: "#D6CFFF", marginTop: 7, lineHeight: 20 },
  primaryButton: { alignSelf: "flex-start", backgroundColor: "#7C4DFF", paddingHorizontal: 14, paddingVertical: 11, borderRadius: 10, marginTop: 16 },
  primaryButtonText: { color: "white", fontWeight: "800" },
  goalCard: { backgroundColor: "#161625", borderRadius: 16, padding: 16, marginBottom: 16 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitle: { color: "white", fontSize: 17, fontWeight: "700" },
  goalPercent: { color: "#C5B5FF", fontWeight: "800" },
  goalText: { color: "#B9A8FF", marginTop: 8, marginBottom: 11, fontWeight: "700" },
  reminderCard: { backgroundColor: "#33231A", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#B35C00", marginBottom: 18 },
  reminderTitle: { color: "#FFD180", fontSize: 17, fontWeight: "700" },
  reminderItem: { flexDirection: "row", alignItems: "center", backgroundColor: "#221810", padding: 12, borderRadius: 10, marginTop: 10 },
  reminderItemTitle: { color: "white", fontWeight: "700" },
  reminderItemSubject: { color: "#D9B99C", marginTop: 3, fontSize: 12 },
  reminderDays: { color: "#FFD180", fontWeight: "800", marginLeft: 10 },
  sectionTitle: { color: "white", fontSize: 20, fontWeight: "800" },
  sectionHint: { color: "#9290A9", marginTop: 5, marginBottom: 12 },
  modeList: { marginBottom: 16 },
  modeButton: { backgroundColor: "#161625", borderWidth: 1, borderColor: "#29283B", borderRadius: 14, padding: 13, marginBottom: 9 },
  modeButtonActive: { backgroundColor: "#282043", borderColor: "#7C4DFF" },
  modeHeader: { flexDirection: "row", alignItems: "center" },
  modeNumber: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#29283B", alignItems: "center", justifyContent: "center", marginRight: 11 },
  modeNumberActive: { backgroundColor: "#B9A8FF" },
  modeNumberText: { color: "#BEBBCD", fontWeight: "800", fontSize: 11 },
  modeNumberTextActive: { color: "#251A4A" },
  modeTitle: { color: "white", fontSize: 15, fontWeight: "800" },
  modeDescription: { color: "#BBB7CE", fontSize: 12, marginTop: 3 },
  modeDetail: { color: "#AAA7B8", fontSize: 12, lineHeight: 18, marginTop: 10, marginLeft: 47 },
  selectedMark: { color: "#D8CEFF", fontSize: 11, fontWeight: "800", marginLeft: 8 },
  card: { backgroundColor: "#161625", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 16 },
  trainingCard: { backgroundColor: "#161625", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#3B3261", marginBottom: 16 },
  trainingEyebrow: { color: "#B9A8FF", fontSize: 10, fontWeight: "800", letterSpacing: 0.6, marginBottom: 4 },
  trainingCount: { color: "#C9BEFF", backgroundColor: "#2E2850", borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5, fontWeight: "800" },
  muted: { color: colors.subtitle, marginTop: 8, lineHeight: 19 },
  recommendation: { marginTop: 12, padding: 12, borderRadius: 10, backgroundColor: "#141424", borderLeftWidth: 4 },
  recommendationTitle: { color: "white", fontSize: 16, fontWeight: "700", flex: 1, marginRight: 8 },
  priority: { color: "#B9A8FF", fontWeight: "800" },
  recommendationReason: { color: "#AAA", marginTop: 6 },
  quickStart: { color: "#C1B5FF", fontSize: 11, fontWeight: "700", marginTop: 9 },
  startButton: { backgroundColor: colors.primary, padding: 14, borderRadius: 12, marginTop: 15 },
  startButtonText: { color: "white", textAlign: "center", fontWeight: "800" },
  tutorCard: { backgroundColor: "#1B2930", borderRadius: 16, padding: 16 },
  tutorAction: { color: "#9BE7FF", fontWeight: "800", marginTop: 13 },
} as const;
