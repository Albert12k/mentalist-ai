import { useEffect, useMemo, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";

import QuickAddActivityModal from "../components/QuickAddActivityModal";
import { classModeLabels } from "../constants/subjectSchedule";
import { useSubjects } from "../contexts/SubjectsContext";
import { useProfile } from "../contexts/ProfileContext";
import { cancelActivityReminders, scheduleActivityReminders } from "../services/activityReminders";
import { ClassDay, Subject, SubjectEvent } from "../types/Subject";

type CalendarView = "month" | "week";
type AgendaItem = { subject: Subject; event: SubjectEvent; daysUntil: number };
type CalendarDay = { key: string; date: Date; currentMonth: boolean };

const DAY = 86_400_000;
const weekdayKeys: ClassDay[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function startOfDay(date: Date) { const value = new Date(date); value.setHours(0, 0, 0, 0); return value; }
function dateKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function parseDate(key: string) { return new Date(`${key}T12:00:00`); }
function getDaysUntil(date: string) { return Math.round((startOfDay(parseDate(date)).getTime() - startOfDay(new Date()).getTime()) / DAY); }
function formatDate(date: Date) { return date.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" }); }
function getEventLabel(type: SubjectEvent["type"]) { return type === "exam" ? "Prova" : type === "assignment" ? "Trabalho" : "Revisão"; }
function getTimeLabel(days: number) { return days < 0 ? `${Math.abs(days)} dia(s) em atraso` : days === 0 ? "Hoje" : days === 1 ? "Amanhã" : `Em ${days} dias`; }

function buildMonthDays(reference: Date): CalendarDay[] {
  const first = new Date(reference.getFullYear(), reference.getMonth(), 1);
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - ((first.getDay() + 6) % 7));
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return { key: dateKey(date), date, currentMonth: date.getMonth() === reference.getMonth() };
  });
}

function buildWeekDays(reference: Date): CalendarDay[] {
  const start = new Date(reference);
  start.setDate(reference.getDate() - ((reference.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, index) => { const date = new Date(start); date.setDate(start.getDate() + index); return { key: dateKey(date), date, currentMonth: true }; });
}

export default function AgendaScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { subjects, updateSubject } = useSubjects();
  const { profile } = useProfile();
  const [calendarView, setCalendarView] = useState<CalendarView>("month");
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [createVisible, setCreateVisible] = useState(false);

  useEffect(() => {
    if (!route.params?.openCreate) return;
    setCreateVisible(true);
    navigation.setParams({ openCreate: undefined });
  }, [navigation, route.params?.openCreate]);

  const events = useMemo<AgendaItem[]>(() => subjects.flatMap((subject) => subject.events.filter((event) => !event.completed).map((event) => ({ subject, event, daysUntil: getDaysUntil(event.date) }))).sort((a, b) => a.daysUntil - b.daysUntil), [subjects]);
  const selectedKey = dateKey(selectedDate);
  const selectedEvents = events.filter((item) => item.event.date === selectedKey);
  const selectedClasses = subjects.filter((subject) => (subject.classDays ?? []).includes(weekdayKeys[selectedDate.getDay()]));
  const todayClasses = subjects.filter((subject) => (subject.classDays ?? []).includes(weekdayKeys[new Date().getDay()]));
  const todayEvents = events.filter((item) => item.daysUntil === 0);
  const overdueCount = events.filter((item) => item.daysUntil < 0).length;
  const nextEvent = events.find((item) => item.daysUntil >= 0);
  const calendarDays = calendarView === "month" ? buildMonthDays(selectedDate) : buildWeekDays(selectedDate);
  const eventColors = new Map<string, string[]>();
  events.forEach(({ subject, event }) => eventColors.set(event.date, [...(eventColors.get(event.date) ?? []), subject.color]));

  async function handleCreateActivity(subjectId: string, event: SubjectEvent) {
    const subject = subjects.find((item) => item.id === subjectId);
    if (!subject) return;
    let notificationIds: string[] = [];
    try { if (profile.remindersEnabled !== false) notificationIds = await scheduleActivityReminders(event, subject.name); } catch { Alert.alert("Atividade salva", "Não foi possível programar os alertas do dispositivo agora."); }
    updateSubject({ ...subject, events: [...subject.events, { ...event, notificationIds }] });
    setSelectedDate(parseDate(event.date));
    setCreateVisible(false);
  }

  async function completeEvent(subject: Subject, event: SubjectEvent) {
    await cancelActivityReminders(event.notificationIds);
    updateSubject({ ...subject, events: subject.events.map((item) => item.id === event.id ? { ...item, completed: true, notificationIds: [] } : item) });
  }

  function openEvent(subject: Subject) {
    navigation.navigate("SubjectDetails", { subject, initialSection: "activities" });
  }

  function deleteEvent(subject: Subject, event: SubjectEvent) {
    const remove = async () => {
      await cancelActivityReminders(event.notificationIds);
      updateSubject({ ...subject, events: subject.events.filter((item) => item.id !== event.id) });
    };
    if (Platform.OS === "web") {
      if (window.confirm(`Excluir a atividade "${event.title}"?`)) void remove();
      return;
    }
    Alert.alert("Excluir atividade", `Deseja excluir "${event.title}"?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: () => void remove() },
    ]);
  }

  function moveCalendar(direction: number) {
    const next = new Date(selectedDate);
    if (calendarView === "month") next.setMonth(next.getMonth() + direction, 1);
    else next.setDate(next.getDate() + direction * 7);
    setSelectedDate(next);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}><View style={{ flex: 1 }}><Text style={styles.title}>Agenda</Text><Text style={styles.subtitle}>Aulas, provas, trabalhos e revisões em um só lugar.</Text></View><Pressable onPress={() => setCreateVisible(true)} style={styles.addButton}><Text style={styles.addButtonText}>+ Atividade</Text></Pressable></View>

        <View style={styles.metricsRow}>
          <Metric value={String(todayClasses.length)} label="aulas hoje" color="#8C64FF" />
          <Metric value={String(todayEvents.length)} label="tarefas hoje" color="#39B985" />
          <Metric value={String(overdueCount)} label="atrasadas" color="#E37A4C" />
        </View>

        <View style={styles.nextCard}><Text style={styles.nextEyebrow}>PRÓXIMO COMPROMISSO</Text>{nextEvent ? <><Text style={styles.nextTitle}>{nextEvent.event.title}</Text><Text style={styles.nextDetail}>{nextEvent.subject.name} • {getTimeLabel(nextEvent.daysUntil)}</Text></> : <><Text style={styles.nextTitle}>Tudo em dia</Text><Text style={styles.nextDetail}>Nenhuma atividade futura cadastrada.</Text></>}</View>

        <View style={styles.calendarCard}>
          <View style={styles.calendarTop}><Pressable onPress={() => moveCalendar(-1)} style={styles.arrowButton}><Text style={styles.arrowText}>‹</Text></Pressable><Text style={styles.calendarTitle}>{selectedDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</Text><Pressable onPress={() => moveCalendar(1)} style={styles.arrowButton}><Text style={styles.arrowText}>›</Text></Pressable></View>
          <View style={styles.viewToggle}><Toggle label="Mês" active={calendarView === "month"} onPress={() => setCalendarView("month")} /><Toggle label="Semana" active={calendarView === "week"} onPress={() => setCalendarView("week")} /><Pressable onPress={() => setSelectedDate(startOfDay(new Date()))} style={styles.todayButton}><Text style={styles.todayText}>Hoje</Text></Pressable></View>
          <View style={styles.calendarGrid}>{["S", "T", "Q", "Q", "S", "S", "D"].map((label, index) => <Text key={`${label}-${index}`} style={styles.weekLabel}>{label}</Text>)}{calendarDays.map((day) => { const selected = day.key === selectedKey; const today = day.key === dateKey(new Date()); const classColors = subjects.filter((subject) => (subject.classDays ?? []).includes(weekdayKeys[day.date.getDay()])).map((subject) => subject.color); const colors = [...new Set([...(eventColors.get(day.key) ?? []), ...classColors])]; return <Pressable key={day.key} onPress={() => setSelectedDate(day.date)} style={[styles.dayCell, selected && styles.daySelected, today && styles.dayToday]}><Text style={[styles.dayText, !day.currentMonth && styles.dayMuted, selected && styles.daySelectedText]}>{day.date.getDate()}</Text><View style={styles.dots}>{colors.slice(0, 3).map((color, index) => <View key={`${color}-${index}`} style={[styles.dot, { backgroundColor: color }]} />)}</View></Pressable>; })}</View>
        </View>

        <Text style={styles.sectionTitle}>{formatDate(selectedDate)}</Text>
        {selectedClasses.length > 0 ? <View style={styles.classesCard}><Text style={styles.classesTitle}>Aulas do dia</Text>{selectedClasses.map((subject) => <Pressable key={subject.id} onPress={() => navigation.navigate("SubjectDetails", { subject })} style={styles.classRow}><View style={[styles.classColor, { backgroundColor: subject.color }]} /><View style={{ flex: 1 }}><Text style={styles.className}>{subject.name}</Text><Text style={styles.classMode}>{classModeLabels[subject.classMode ?? "in_person"]}</Text></View><Text style={styles.openText}>Abrir →</Text></Pressable>)}</View> : null}

        {selectedEvents.length === 0 && selectedClasses.length === 0 ? <View style={styles.emptyCard}><Text style={styles.emptyIcon}>📅</Text><Text style={styles.emptyTitle}>Dia livre</Text><Text style={styles.emptyText}>Não há aulas ou atividades nesta data.</Text><Pressable onPress={() => setCreateVisible(true)} style={styles.emptyButton}><Text style={styles.emptyButtonText}>Adicionar atividade</Text></Pressable></View> : selectedEvents.map(({ subject, event, daysUntil }) => <View key={`${subject.id}-${event.id}`} style={[styles.eventCard, { borderLeftColor: subject.color }]}><Pressable onPress={() => openEvent(subject)} style={styles.eventMain}><View style={styles.eventHeader}><View style={{ flex: 1 }}><Text style={styles.eventTitle}>{event.title}</Text><Text style={styles.subjectName}>{subject.name} • {getEventLabel(event.type)}</Text></View><Text style={[styles.timeLabel, daysUntil < 0 && styles.overdueLabel]}>{getTimeLabel(daysUntil)}</Text></View></Pressable><View style={styles.eventActions}><Pressable onPress={() => openEvent(subject)} style={styles.editButton}><Text style={styles.editText}>Editar</Text></Pressable><Pressable onPress={() => deleteEvent(subject, event)} style={styles.deleteButton}><Text style={styles.deleteText}>Excluir</Text></Pressable><Pressable onPress={() => completeEvent(subject, event)} style={styles.completeButton}><Text style={styles.completeText}>✓ Concluir</Text></Pressable></View></View>)}
      </ScrollView>
      <QuickAddActivityModal visible={createVisible} subjects={subjects} initialDate={selectedKey} onClose={() => setCreateVisible(false)} onSave={handleCreateActivity} />
    </SafeAreaView>
  );
}

function Metric({ value, label, color }: { value: string; label: string; color: string }) { return <View style={styles.metricCard}><Text style={[styles.metricValue, { color }]}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>; }
function Toggle({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) { return <Pressable onPress={onPress} style={[styles.toggleButton, active && styles.toggleActive]}><Text style={[styles.toggleText, active && styles.toggleTextActive]}>{label}</Text></Pressable>; }

const styles = {
  safeArea: { flex: 1, backgroundColor: "#080810" }, content: { padding: 20, paddingBottom: 45 },
  titleRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 18 }, title: { color: "white", fontSize: 30, fontWeight: "700" }, subtitle: { color: "#8888AA", marginTop: 6 },
  addButton: { backgroundColor: "#7C4DFF", borderRadius: 10, paddingHorizontal: 11, paddingVertical: 9, marginLeft: 10 }, addButtonText: { color: "white", fontSize: 12, fontWeight: "800" },
  metricsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }, metricCard: { width: "32%", backgroundColor: "#161625", borderRadius: 14, padding: 13 }, metricValue: { fontSize: 23, fontWeight: "800" }, metricLabel: { color: "#8D8D9F", fontSize: 11, marginTop: 4 },
  nextCard: { backgroundColor: "#342769", padding: 16, borderRadius: 16, marginBottom: 12 }, nextEyebrow: { color: "#BBA9F9", fontSize: 10, fontWeight: "800", letterSpacing: 1 }, nextTitle: { color: "white", fontSize: 18, fontWeight: "800", marginTop: 7 }, nextDetail: { color: "#D6CFFF", marginTop: 5 },
  calendarCard: { backgroundColor: "#161625", borderRadius: 18, padding: 15 }, calendarTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, calendarTitle: { color: "white", fontSize: 17, fontWeight: "800", textTransform: "capitalize" }, arrowButton: { width: 35, height: 35, borderRadius: 10, backgroundColor: "#222237", alignItems: "center", justifyContent: "center" }, arrowText: { color: "white", fontSize: 24 },
  viewToggle: { flexDirection: "row", marginTop: 13, marginBottom: 12 }, toggleButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 9, marginRight: 7, backgroundColor: "#222237" }, toggleActive: { backgroundColor: "#7C4DFF" }, toggleText: { color: "#9999AE", fontWeight: "700", fontSize: 12 }, toggleTextActive: { color: "white" }, todayButton: { marginLeft: "auto", padding: 8 }, todayText: { color: "#A98BFF", fontWeight: "700" },
  calendarGrid: { flexDirection: "row", flexWrap: "wrap" }, weekLabel: { width: "14.285%", color: "#6F6F83", textAlign: "center", fontWeight: "700", marginBottom: 8 }, dayCell: { width: "14.285%", minHeight: 43, borderRadius: 10, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "transparent" }, daySelected: { backgroundColor: "#6845CE" }, dayToday: { borderColor: "#8F72E8" }, dayText: { color: "#D5D5E1", fontWeight: "700" }, dayMuted: { color: "#555568" }, daySelectedText: { color: "white" }, dots: { flexDirection: "row", height: 5, marginTop: 3 }, dot: { width: 4, height: 4, borderRadius: 2, marginHorizontal: 1 },
  sectionTitle: { color: "white", fontSize: 19, fontWeight: "800", marginTop: 20, marginBottom: 10, textTransform: "capitalize" }, classesCard: { backgroundColor: "#151E1C", borderRadius: 15, padding: 14, marginBottom: 10 }, classesTitle: { color: "#78D7B0", fontWeight: "800", marginBottom: 5 }, classRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10 }, classColor: { width: 9, height: 36, borderRadius: 5, marginRight: 10 }, className: { color: "white", fontWeight: "700" }, classMode: { color: "#8EAAA0", fontSize: 12, marginTop: 3 }, openText: { color: "#71D2AA", fontWeight: "700", fontSize: 12 },
  eventCard: { backgroundColor: "#161625", borderRadius: 14, borderLeftWidth: 5, marginBottom: 10, overflow: "hidden" }, eventMain: { padding: 15 }, eventHeader: { flexDirection: "row", alignItems: "flex-start" }, eventTitle: { color: "white", fontSize: 16, fontWeight: "700" }, subjectName: { color: "#AAA", marginTop: 5, fontSize: 13 }, timeLabel: { color: "#B9A8FF", fontWeight: "700", fontSize: 12 }, overdueLabel: { color: "#FFB74D" }, eventActions: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#29293C" }, editButton: { flex: 1, padding: 11, backgroundColor: "#242437" }, editText: { color: "#C6B7FF", fontWeight: "800", textAlign: "center" }, deleteButton: { flex: 1, padding: 11, backgroundColor: "#351923" }, deleteText: { color: "#FF8A9B", fontWeight: "800", textAlign: "center" }, completeButton: { flex: 1.3, backgroundColor: "#123A2C", padding: 11 }, completeText: { color: "#58D39B", fontWeight: "800", textAlign: "center" },
  emptyCard: { backgroundColor: "#161625", borderRadius: 16, padding: 24, alignItems: "center" }, emptyIcon: { fontSize: 34 }, emptyTitle: { color: "white", fontWeight: "800", fontSize: 18, marginTop: 9 }, emptyText: { color: "#8888AA", marginTop: 6 }, emptyButton: { backgroundColor: "#7C4DFF", paddingHorizontal: 15, paddingVertical: 11, borderRadius: 10, marginTop: 15 }, emptyButtonText: { color: "white", fontWeight: "700" },
} as const;
