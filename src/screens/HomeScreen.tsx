import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import ProgressBar from "../components/ProgressBar";
import { classModeLabels } from "../constants/subjectSchedule";
import { useProfile } from "../contexts/ProfileContext";
import { useSubjects } from "../contexts/SubjectsContext";
import { getActivityReminders, getDaysUntil } from "../services/activityReminders";
import { getDueFlashcards } from "../services/flashcardReview";
import { buildStudyActivity } from "../services/studyActivity";
import { generateStudyPlan, StudyRecommendation } from "../services/studyPlanner";
import { ClassDay } from "../types/Subject";

type StudyMode = "manual" | "guided" | "auto";
const weekdayKeys: ClassDay[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const modeInformation = {
  manual: { title: "Manual", description: "Você escolhe" },
  guided: { title: "Guiado", description: "2 prioridades" },
  auto: { title: "Automático", description: "Até 5 matérias" },
} as const;

function localDayKey(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function weekStart() { const date = new Date(); date.setHours(0, 0, 0, 0); date.setDate(date.getDate() - ((date.getDay() + 6) % 7)); return date; }

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { subjects } = useSubjects();
  const { profile } = useProfile();
  const [studyMode, setStudyMode] = useState<StudyMode>("guided");
  const plan = useMemo(() => generateStudyPlan(subjects), [subjects]);
  const selectedRecommendations = studyMode === "manual" ? plan : studyMode === "guided" ? plan.slice(0, 2) : plan.slice(0, 5);
  const activity = useMemo(() => buildStudyActivity(subjects, profile.streakFreezeDates), [subjects, profile.streakFreezeDates]);
  const allSessions = subjects.flatMap((subject) => subject.studyHistory);
  const todayMinutes = allSessions.filter((session) => localDayKey(new Date(session.date)) === localDayKey()).reduce((total, session) => total + session.duration, 0);
  const weeklyMinutes = allSessions.filter((session) => new Date(session.date) >= weekStart()).reduce((total, session) => total + session.duration, 0);
  const weeklyProgress = Math.min(Math.round((weeklyMinutes / profile.weeklyGoalMinutes) * 100), 100);
  const dueFlashcards = subjects.reduce((total, subject) => total + getDueFlashcards(subject.flashcards).length, 0);
  const todayClasses = subjects.filter((subject) => (subject.classDays ?? []).includes(weekdayKeys[new Date().getDay()]));
  const eventItems = subjects.flatMap((subject) => subject.events.filter((event) => !event.completed).map((event) => ({ subject, event, days: getDaysUntil(event.date) }))).sort((a, b) => a.days - b.days);
  const todayTasks = eventItems.filter((item) => item.days === 0);
  const urgentEvent = eventItems.find((item) => item.days <= 1);
  const reminders = profile.remindersEnabled !== false ? getActivityReminders(subjects) : [];
  const firstName = profile.name.trim().split(" ")[0] || "Estudante";

  function startTraining(items: StudyRecommendation[], mode: StudyMode, openTimer = false) {
    if (!items.length) { navigation.navigate("Matérias"); return; }
    navigation.navigate("Training", { mode, subjectIds: items.map((item) => item.subject.id), openTimer });
  }

  function primaryAction() {
    if (urgentEvent) { navigation.navigate("SubjectDetails", { subject: urgentEvent.subject }); return; }
    if (dueFlashcards) { navigation.navigate("ReviewQueue"); return; }
    startTraining(plan.slice(0, 1), "manual", true);
  }

  const primary = urgentEvent
    ? { eyebrow: urgentEvent.days < 0 ? "ATIVIDADE ATRASADA" : urgentEvent.days === 0 ? "PARA HOJE" : "PARA AMANHÃ", title: urgentEvent.event.title, description: `${urgentEvent.subject.name} • ${urgentEvent.days < 0 ? `${Math.abs(urgentEvent.days)} dia(s) em atraso` : urgentEvent.days === 0 ? "vence hoje" : "vence amanhã"}`, button: "Ver atividade" }
    : dueFlashcards
      ? { eyebrow: "REVISÃO PENDENTE", title: `${dueFlashcards} flashcard(s) para revisar`, description: "Uma revisão curta ajuda a manter o conteúdo fresco.", button: "Começar revisão" }
      : plan[0]
        ? { eyebrow: "SUGESTÃO LOCAL PARA AGORA", title: plan[0].subject.name, description: plan[0].reason, button: "Iniciar Pomodoro" }
        : { eyebrow: "COMECE POR AQUI", title: "Crie sua primeira matéria", description: "Cadastre seus dias de aula e organize sua rotina.", button: "Criar matéria" };

  return <SafeAreaView style={styles.safeArea}><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <Text style={styles.greeting}>Olá, {firstName}</Text><Text style={styles.subtitle}>{new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}</Text>

    <View style={styles.dayGrid}><Metric value={String(todayClasses.length)} label="aulas hoje" /><Metric value={String(todayTasks.length)} label="atividades" /><Metric value={String(todayMinutes)} label="min estudados" /><Metric value={String(activity.currentStreak)} label="dias seguidos" /></View>

    {todayClasses.length ? <View style={styles.classesCard}><View style={styles.rowBetween}><Text style={styles.cardTitle}>Aulas de hoje</Text><Pressable onPress={() => navigation.navigate("Agenda")}><Text style={styles.link}>Ver agenda</Text></Pressable></View>{todayClasses.map((subject) => <Pressable key={subject.id} onPress={() => navigation.navigate("SubjectDetails", { subject })} style={styles.classItem}><View style={[styles.colorLine, { backgroundColor: subject.color }]} /><View style={{ flex: 1 }}><Text style={styles.className}>{subject.name}</Text><Text style={styles.muted}>{classModeLabels[subject.classMode ?? "in_person"]}</Text></View><Text style={styles.link}>Abrir →</Text></Pressable>)}</View> : null}

    <Pressable onPress={primaryAction} style={styles.primaryCard}><Text style={styles.primaryEyebrow}>{primary.eyebrow}</Text><Text style={styles.primaryTitle}>{primary.title}</Text><Text style={styles.primaryDescription}>{primary.description}</Text><View style={styles.primaryButton}><Text style={styles.primaryButtonText}>{primary.button}</Text></View></Pressable>

    <Text style={styles.sectionTitle}>Ações rápidas</Text><View style={styles.quickGrid}>
      <QuickAction icon="⏱" label="Pomodoro" onPress={() => startTraining(plan.slice(0, 1), "manual", true)} />
      <QuickAction icon="📅" label="Agenda" onPress={() => navigation.navigate("Agenda")} />
      <QuickAction icon="＋" label="Atividade" onPress={() => navigation.navigate("Agenda", { openCreate: true })} />
      <QuickAction icon="📚" label="Matérias" onPress={() => navigation.navigate("Matérias")} />
    </View>

    <View style={styles.goalCard}><View style={styles.rowBetween}><Text style={styles.cardTitle}>Meta semanal</Text><Text style={styles.goalPercent}>{weeklyProgress}%</Text></View><Text style={styles.goalText}>{weeklyMinutes} de {profile.weeklyGoalMinutes} min</Text><ProgressBar value={weeklyProgress} color="#7C4DFF" /></View>

    {reminders.length ? <View style={styles.reminderCard}><Text style={styles.reminderTitle}>Lembretes importantes</Text>{reminders.map((item) => <Pressable key={`${item.subject.id}-${item.event.id}`} onPress={() => navigation.navigate("SubjectDetails", { subject: item.subject })} style={styles.reminderItem}><View style={{ flex: 1 }}><Text style={styles.reminderItemTitle}>{item.event.title}</Text><Text style={styles.reminderItemSubject}>{item.subject.name}</Text></View><Text style={styles.reminderDays}>{item.daysUntil} dia(s)</Text></Pressable>)}</View> : null}

    <Text style={styles.sectionTitle}>Seu treino</Text><Text style={styles.sectionHint}>Escolha quanto controle você quer ter.</Text><View style={styles.modeRow}>{(Object.keys(modeInformation) as StudyMode[]).map((mode) => <Pressable key={mode} onPress={() => setStudyMode(mode)} style={[styles.modeButton, studyMode === mode && styles.modeActive]}><Text style={styles.modeTitle}>{modeInformation[mode].title}</Text><Text style={styles.modeDescription}>{modeInformation[mode].description}</Text></Pressable>)}</View>
    <View style={styles.trainingCard}>{selectedRecommendations.length ? <>{selectedRecommendations.map((item, index) => <Pressable key={item.subject.id} onPress={() => startTraining([item], "manual", true)} style={[styles.recommendation, { borderLeftColor: item.subject.color }]}><View style={styles.rowBetween}><Text style={styles.recommendationTitle}>{index + 1}. {item.subject.name}</Text><Text style={styles.priority}>{item.priority}%</Text></View><Text style={styles.recommendationReason}>{item.reason}</Text></Pressable>)}<Pressable onPress={() => startTraining(selectedRecommendations, studyMode)} style={styles.startButton}><Text style={styles.startButtonText}>{studyMode === "manual" ? "Escolher primeira matéria" : "Iniciar treino"}</Text></Pressable></> : <Text style={styles.muted}>Crie uma matéria para montar seu primeiro treino.</Text>}</View>

  </ScrollView></SafeAreaView>;
}

function Metric({ value, label }: { value: string; label: string }) { return <View style={styles.dayMetric}><Text style={styles.dayValue}>{value}</Text><Text style={styles.dayLabel}>{label}</Text></View>; }
function QuickAction({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) { return <Pressable onPress={onPress} style={styles.quickAction}><Text style={styles.quickIcon}>{icon}</Text><Text style={styles.quickLabel}>{label}</Text></Pressable>; }

const styles = {
  safeArea: { flex: 1, backgroundColor: "#080810" }, content: { padding: 20, paddingBottom: 45 }, greeting: { color: "white", fontSize: 30, fontWeight: "800" }, subtitle: { color: "#8888AA", marginTop: 5, marginBottom: 18, textTransform: "capitalize" },
  dayGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 7 }, dayMetric: { width: "48%", backgroundColor: "#161625", borderRadius: 13, padding: 12, marginBottom: 9 }, dayValue: { color: "white", fontWeight: "800", fontSize: 21 }, dayLabel: { color: "#9290A9", fontSize: 11, marginTop: 4 },
  classesCard: { backgroundColor: "#14231F", borderRadius: 16, padding: 15, marginBottom: 14 }, rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, cardTitle: { color: "white", fontSize: 17, fontWeight: "800" }, link: { color: "#A98BFF", fontWeight: "800", fontSize: 12 }, classItem: { flexDirection: "row", alignItems: "center", marginTop: 12 }, colorLine: { width: 7, height: 35, borderRadius: 4, marginRight: 10 }, className: { color: "white", fontWeight: "700" }, muted: { color: "#9290A9", marginTop: 5, lineHeight: 18 },
  primaryCard: { backgroundColor: "#342769", borderRadius: 18, padding: 18, marginBottom: 18 }, primaryEyebrow: { color: "#CFC2FF", fontWeight: "800", fontSize: 11, letterSpacing: 0.5 }, primaryTitle: { color: "white", fontWeight: "800", fontSize: 22, marginTop: 9 }, primaryDescription: { color: "#D6CFFF", marginTop: 7, lineHeight: 20 }, primaryButton: { alignSelf: "flex-start", backgroundColor: "#7C4DFF", paddingHorizontal: 14, paddingVertical: 11, borderRadius: 10, marginTop: 16 }, primaryButtonText: { color: "white", fontWeight: "800" },
  sectionTitle: { color: "white", fontSize: 20, fontWeight: "800" }, sectionHint: { color: "#9290A9", marginTop: 5, marginBottom: 11 }, quickGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 10, marginBottom: 14 }, quickAction: { width: "48%", backgroundColor: "#161625", borderRadius: 13, padding: 14, marginBottom: 9, flexDirection: "row", alignItems: "center" }, quickIcon: { fontSize: 19, marginRight: 9 }, quickLabel: { color: "white", fontWeight: "700" },
  goalCard: { backgroundColor: "#161625", borderRadius: 16, padding: 16, marginBottom: 16 }, goalPercent: { color: "#C5B5FF", fontWeight: "800" }, goalText: { color: "#B9A8FF", marginTop: 8, marginBottom: 11, fontWeight: "700" },
  reminderCard: { backgroundColor: "#33231A", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#B35C00", marginBottom: 18 }, reminderTitle: { color: "#FFD180", fontSize: 17, fontWeight: "700" }, reminderItem: { flexDirection: "row", alignItems: "center", backgroundColor: "#221810", padding: 12, borderRadius: 10, marginTop: 10 }, reminderItemTitle: { color: "white", fontWeight: "700" }, reminderItemSubject: { color: "#D9B99C", marginTop: 3, fontSize: 12 }, reminderDays: { color: "#FFD180", fontWeight: "800", marginLeft: 10 },
  modeRow: { flexDirection: "row", marginBottom: 10 }, modeButton: { flex: 1, backgroundColor: "#161625", borderRadius: 12, padding: 11, marginRight: 7, borderWidth: 1, borderColor: "#29283B" }, modeActive: { backgroundColor: "#2A2147", borderColor: "#7C4DFF" }, modeTitle: { color: "white", fontWeight: "800", fontSize: 12 }, modeDescription: { color: "#9995AA", fontSize: 10, marginTop: 3 },
  trainingCard: { backgroundColor: "#161625", borderRadius: 16, padding: 15, marginBottom: 16 }, recommendation: { padding: 11, borderRadius: 10, backgroundColor: "#111120", borderLeftWidth: 4, marginBottom: 9 }, recommendationTitle: { color: "white", fontWeight: "700", flex: 1 }, priority: { color: "#B9A8FF", fontWeight: "800" }, recommendationReason: { color: "#9995AA", marginTop: 5 }, startButton: { backgroundColor: "#7C4DFF", padding: 13, borderRadius: 11, marginTop: 5 }, startButtonText: { color: "white", textAlign: "center", fontWeight: "800" },
} as const;
