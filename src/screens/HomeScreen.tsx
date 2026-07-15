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
import { colors } from "../theme/colors";

type StudyMode = "manual" | "guided" | "auto";

const modeInformation: Record<StudyMode, { title: string; description: string }> = {
  manual: { title: "Escolher matéria", description: "Você decide por onde começar." },
  guided: { title: "Treino guiado", description: "Duas prioridades recomendadas." },
  auto: { title: "Treino automático", description: "Uma sequência pronta para seguir." },
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

        <Text style={styles.sectionTitle}>Seu treino</Text>
        <View style={styles.modeRow}>
          {(Object.keys(modeInformation) as StudyMode[]).map((mode) => (
            <Pressable key={mode} onPress={() => setStudyMode(mode)} style={[styles.modeButton, studyMode === mode && styles.modeButtonActive]}>
              <Text style={styles.modeTitle}>{modeInformation[mode].title}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{modeInformation[studyMode].title}</Text>
          <Text style={styles.muted}>{modeInformation[studyMode].description}</Text>
          {selectedRecommendations.length === 0 ? (
            <Text style={styles.muted}>Crie uma matéria para montar seu primeiro treino.</Text>
          ) : (
            <>
              {selectedRecommendations.map((item, index) => (
                <Pressable key={item.subject.id} onPress={() => startTraining([item], "manual")} style={[styles.recommendation, { borderLeftColor: item.subject.color }]}>
                  <View style={styles.rowBetween}><Text style={styles.recommendationTitle}>{index + 1}. {item.subject.name}</Text><Text style={styles.priority}>{item.priority}%</Text></View>
                  <Text style={styles.recommendationReason}>{item.reason}</Text>
                </Pressable>
              ))}
              <Pressable onPress={() => startTraining(selectedRecommendations, studyMode)} style={styles.startButton}>
                <Text style={styles.startButtonText}>{studyMode === "manual" ? "Estudar matéria selecionada" : "Iniciar treino"}</Text>
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
  sectionTitle: { color: "white", fontSize: 20, fontWeight: "800", marginBottom: 12 },
  modeRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 8 },
  modeButton: { backgroundColor: "#161625", paddingHorizontal: 11, paddingVertical: 9, borderRadius: 10, marginRight: 8, marginBottom: 8 },
  modeButtonActive: { backgroundColor: "#7C4DFF" },
  modeTitle: { color: "white", fontSize: 12, fontWeight: "700" },
  card: { backgroundColor: "#161625", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 16 },
  muted: { color: colors.subtitle, marginTop: 8, lineHeight: 19 },
  recommendation: { marginTop: 12, padding: 12, borderRadius: 10, backgroundColor: "#141424", borderLeftWidth: 4 },
  recommendationTitle: { color: "white", fontSize: 16, fontWeight: "700", flex: 1, marginRight: 8 },
  priority: { color: "#B9A8FF", fontWeight: "800" },
  recommendationReason: { color: "#AAA", marginTop: 6 },
  startButton: { backgroundColor: colors.primary, padding: 14, borderRadius: 12, marginTop: 15 },
  startButtonText: { color: "white", textAlign: "center", fontWeight: "800" },
  tutorCard: { backgroundColor: "#1B2930", borderRadius: 16, padding: 16 },
  tutorAction: { color: "#9BE7FF", fontWeight: "800", marginTop: 13 },
} as const;
