import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import EditStudySessionModal from "../components/EditStudySessionModal";
import ProgressBar from "../components/ProgressBar";
import { useProfile } from "../contexts/ProfileContext";
import { useSubjects } from "../contexts/SubjectsContext";
import { buildTrend, countScheduledClasses, getAttentionReasons, getSessions, ProgressPeriod, SessionWithSubject } from "../services/progressStats";
import { recalculateSubjectStudy } from "../services/studySession";
import { calculateStudyXP, getLevelProgress, getTotalXP } from "../services/xpSystem";

const periodLabels: Record<ProgressPeriod, string> = { week: "7 dias", month: "30 dias", all: "Todo período" };

export default function ProgressScreen() {
  const { subjects, updateSubject } = useSubjects();
  const { profile } = useProfile();
  const [period, setPeriod] = useState<ProgressPeriod>("week");
  const [editing, setEditing] = useState<SessionWithSubject | null>(null);

  const sessions = useMemo(() => getSessions(subjects, period), [subjects, period]);
  const previousSessions = useMemo(() => getSessions(subjects, period, true), [subjects, period]);
  const trend = useMemo(() => buildTrend(subjects, period), [subjects, period]);
  const totalMinutes = sessions.reduce((total, item) => total + item.session.duration, 0);
  const previousMinutes = previousSessions.reduce((total, item) => total + item.session.duration, 0);
  const activeDays = new Set(sessions.map((item) => item.session.date.slice(0, 10))).size;
  const averagePerActiveDay = activeDays ? Math.round(totalMinutes / activeDays) : 0;
  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const weekMinutes = subjects.reduce((total, subject) => total + subject.studyHistory.filter((session) => new Date(session.date) >= weekStart).reduce((sum, session) => sum + session.duration, 0), 0);
  const weeklyProgress = Math.min(Math.round((weekMinutes / profile.weeklyGoalMinutes) * 100), 100);
  const totalXP = getTotalXP(subjects, profile.bonusXP);
  const level = getLevelProgress(totalXP);
  const totalContents = subjects.reduce((total, subject) => total + subject.contents.length, 0);
  const completedContents = subjects.reduce((total, subject) => total + subject.contents.filter((content) => content.completed).length, 0);
  const contentProgress = totalContents ? Math.round((completedContents / totalContents) * 100) : 0;
  const peakTrend = Math.max(...trend.map((item) => item.minutes), 1);
  const comparison = period === "all" ? undefined : previousMinutes === 0 ? (totalMinutes > 0 ? 100 : 0) : Math.round(((totalMinutes - previousMinutes) / previousMinutes) * 100);

  const subjectStats = subjects.map((subject) => {
    const subjectSessions = sessions.filter((item) => item.subject.id === subject.id);
    const minutes = subjectSessions.reduce((total, item) => total + item.session.duration, 0);
    const scheduledClasses = countScheduledClasses(subject);
    const attendance = scheduledClasses ? Math.max(0, Math.round(((scheduledClasses - subject.absences) / scheduledClasses) * 100)) : undefined;
    return { subject, minutes, sessions: subjectSessions.length, scheduledClasses, attendance, reasons: getAttentionReasons(subject, minutes) };
  }).sort((a, b) => b.minutes - a.minutes);
  const peakSubjectMinutes = Math.max(...subjectStats.map((item) => item.minutes), 1);
  const attentionSubjects = subjectStats.filter((item) => item.reasons.length).sort((a, b) => b.reasons.length - a.reasons.length);

  const weekdayTotals = new Map<string, number>();
  sessions.forEach(({ session }) => { const label = new Date(session.date).toLocaleDateString("pt-BR", { weekday: "long" }); weekdayTotals.set(label, (weekdayTotals.get(label) ?? 0) + session.duration); });
  const bestDay = [...weekdayTotals.entries()].sort((a, b) => b[1] - a[1])[0];
  const hourTotals = new Map<number, number>();
  sessions.forEach(({ session }) => { const hour = new Date(session.date).getHours(); hourTotals.set(hour, (hourTotals.get(hour) ?? 0) + session.duration); });
  const bestHour = [...hourTotals.entries()].sort((a, b) => b[1] - a[1])[0];

  function saveEditedSession(date: string, duration: number) {
    if (!editing) return;
    const updatedHistory = editing.subject.studyHistory.map((session) => session.id === editing.session.id ? { ...session, date: new Date(`${date}T12:00:00`).toISOString(), duration, xpEarned: calculateStudyXP(duration, session.completedContent ?? false) } : session);
    updateSubject(recalculateSubjectStudy({ ...editing.subject, studyHistory: updatedHistory }));
    setEditing(null);
  }

  function deleteSession(item: SessionWithSubject) {
    Alert.alert("Excluir registro?", `Remover o estudo de ${item.session.duration} minutos em ${item.subject.name}?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: () => updateSubject(recalculateSubjectStudy({ ...item.subject, studyHistory: item.subject.studyHistory.filter((session) => session.id !== item.session.id) })) },
    ]);
  }

  return <SafeAreaView style={styles.safeArea}>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Progresso</Text><Text style={styles.subtitle}>Entenda sua rotina e descubra onde precisa de atenção.</Text>
      <View style={styles.filters}>{(Object.keys(periodLabels) as ProgressPeriod[]).map((value) => <Pressable key={value} onPress={() => setPeriod(value)} style={[styles.filterButton, period === value && styles.filterActive]}><Text style={[styles.filterText, period === value && styles.filterTextActive]}>{periodLabels[value]}</Text></Pressable>)}</View>

      <View style={styles.weekCard}><View style={styles.row}><View><Text style={styles.eyebrow}>META DA SEMANA</Text><Text style={styles.weekValue}>{weekMinutes} de {profile.weeklyGoalMinutes} min</Text></View><Text style={styles.weekPercent}>{weeklyProgress}%</Text></View><ProgressBar value={weeklyProgress} color="#9D7BFF" /><Text style={styles.muted}>{weeklyProgress >= 100 ? "Meta concluída. Excelente trabalho!" : `Faltam ${profile.weeklyGoalMinutes - weekMinutes} minutos nesta semana.`}</Text></View>

      <View style={styles.metrics}><Metric value={`${totalMinutes}`} label="minutos" /><Metric value={`${sessions.length}`} label="sessões" /><Metric value={`${activeDays}`} label="dias ativos" /><Metric value={`${averagePerActiveDay}`} label="média/dia ativo" /></View>

      <View style={styles.card}><View style={styles.row}><Text style={styles.cardTitle}>Ritmo do período</Text>{comparison !== undefined ? <Text style={[styles.comparison, comparison < 0 && styles.negative]}>{comparison >= 0 ? "+" : ""}{comparison}%</Text> : null}</View><Text style={styles.muted}>{comparison === undefined ? "Histórico completo" : "Comparação com o período anterior"}</Text><View style={styles.chart}>{trend.map((item) => <View key={item.key} style={styles.chartColumn}><Text style={styles.chartValue}>{item.minutes || ""}</Text><View style={styles.chartTrack}><View style={[styles.chartBar, { height: `${item.minutes ? Math.max((item.minutes / peakTrend) * 100, 8) : 0}%` }]} /></View><Text style={styles.chartLabel}>{item.label}</Text></View>)}</View>{bestDay ? <Text style={styles.insight}>Seu dia mais produtivo foi {bestDay[0]}, com {bestDay[1]} minutos{bestHour ? `. O horário com mais registros começa às ${String(bestHour[0]).padStart(2, "0")}:00` : ""}.</Text> : null}</View>

      <Text style={styles.sectionTitle}>Precisa de atenção</Text>
      {attentionSubjects.length ? attentionSubjects.slice(0, 4).map(({ subject, reasons }) => <View key={subject.id} style={[styles.attentionCard, { borderLeftColor: subject.color }]}><Text style={styles.subjectTitle}>{subject.name}</Text>{reasons.map((reason) => <Text key={reason} style={styles.reason}>• {reason}</Text>)}</View>) : <View style={styles.successCard}><Text style={styles.successText}>✓ Nenhum alerta importante neste período.</Text></View>}

      <Text style={styles.sectionTitle}>Distribuição por matéria</Text>
      <View style={styles.card}>{subjectStats.length ? subjectStats.map(({ subject, minutes }) => <View key={subject.id} style={styles.distributionItem}><View style={styles.row}><Text style={styles.distributionName}>{subject.name}</Text><Text style={styles.distributionMinutes}>{minutes} min</Text></View><View style={styles.distributionTrack}><View style={{ height: "100%", width: `${(minutes / peakSubjectMinutes) * 100}%`, borderRadius: 4, backgroundColor: subject.color }} /></View></View>) : <Text style={styles.muted}>Crie uma matéria para começar.</Text>}</View>

      <Text style={styles.sectionTitle}>Conteúdos e presença</Text>
      <View style={styles.card}><Text style={styles.cardTitle}>Conteúdos concluídos</Text><View style={styles.progressSpace}><ProgressBar value={contentProgress} color="#00B0FF" /></View><Text style={styles.muted}>{completedContents}/{totalContents} conteúdos • {contentProgress}% concluído</Text></View>
      {subjectStats.map(({ subject, scheduledClasses, attendance }) => <View key={`attendance-${subject.id}`} style={[styles.attendanceCard, { borderLeftColor: subject.color }]}><View style={styles.row}><Text style={styles.subjectTitle}>{subject.name}</Text><Text style={[styles.attendanceValue, attendance !== undefined && attendance < 75 && styles.negative]}>{attendance === undefined ? "—" : `${attendance}%`}</Text></View><Text style={styles.muted}>{scheduledClasses ? `${scheduledClasses} aulas previstas desde o cadastro • ${subject.absences} faltas` : "Cadastre os dias de aula para estimar a presença."}</Text></View>)}

      <Text style={styles.sectionTitle}>Histórico de estudos</Text>
      {sessions.length ? sessions.slice(0, 30).map((item) => { const content = item.subject.contents.find((entry) => entry.id === item.session.contentId); return <View key={item.session.id} style={styles.historyCard}><View style={[styles.historyColor, { backgroundColor: item.subject.color }]} /><View style={styles.historyBody}><Text style={styles.historyTitle}>{item.subject.name} • {item.session.duration} min</Text><Text style={styles.muted}>{new Date(item.session.date).toLocaleDateString("pt-BR")} • +{item.session.xpEarned} XP{content ? ` • ${content.title}` : ""}</Text><View style={styles.historyActions}><Pressable onPress={() => setEditing(item)}><Text style={styles.editText}>Editar</Text></Pressable><Pressable onPress={() => deleteSession(item)}><Text style={styles.deleteText}>Excluir</Text></Pressable></View></View></View>; }) : <View style={styles.card}><Text style={styles.muted}>Nenhuma sessão registrada neste período.</Text></View>}

      <View style={styles.levelCard}><View style={styles.row}><Text style={styles.cardTitle}>Nível {level.level}</Text><Text style={styles.levelXP}>{totalXP} XP total</Text></View><View style={styles.progressSpace}><ProgressBar value={level.progressPercent} color="#7C4DFF" /></View></View>
    </ScrollView>
    <EditStudySessionModal visible={Boolean(editing)} session={editing?.session ?? null} onClose={() => setEditing(null)} onSave={saveEditedSession} />
  </SafeAreaView>;
}

function Metric({ value, label }: { value: string; label: string }) { return <View style={styles.metricCard}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>; }

const styles = {
  safeArea: { flex: 1, backgroundColor: "#080810" }, content: { padding: 20, paddingBottom: 45 }, title: { color: "white", fontSize: 30, fontWeight: "800" }, subtitle: { color: "#8888AA", marginTop: 6, lineHeight: 20 },
  filters: { flexDirection: "row", flexWrap: "wrap", marginTop: 18, marginBottom: 10 }, filterButton: { backgroundColor: "#161625", borderRadius: 18, paddingHorizontal: 12, paddingVertical: 9, marginRight: 8, marginBottom: 8 }, filterActive: { backgroundColor: "#7C4DFF" }, filterText: { color: "#9B9BAE", fontWeight: "700", fontSize: 12 }, filterTextActive: { color: "white" },
  weekCard: { backgroundColor: "#292052", borderRadius: 18, padding: 17, marginBottom: 13 }, row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, eyebrow: { color: "#B9A8FF", fontSize: 10, fontWeight: "800", letterSpacing: 1 }, weekValue: { color: "white", fontSize: 21, fontWeight: "800", marginTop: 6, marginBottom: 13 }, weekPercent: { color: "#D3C7FF", fontSize: 19, fontWeight: "800" }, muted: { color: "#8E8EA4", marginTop: 7, lineHeight: 18 },
  metrics: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }, metricCard: { width: "48%", backgroundColor: "#161625", borderRadius: 14, padding: 14, marginBottom: 10 }, metricValue: { color: "white", fontSize: 23, fontWeight: "800" }, metricLabel: { color: "#8888A0", marginTop: 4, fontSize: 12 },
  card: { backgroundColor: "#161625", borderRadius: 16, padding: 16, marginTop: 4, marginBottom: 12 }, cardTitle: { color: "white", fontSize: 17, fontWeight: "800" }, comparison: { color: "#54D49B", fontWeight: "800" }, negative: { color: "#FF9A76" },
  chart: { height: 145, flexDirection: "row", alignItems: "flex-end", marginTop: 17 }, chartColumn: { flex: 1, alignItems: "center", height: "100%", justifyContent: "flex-end" }, chartValue: { color: "#C9BFFF", fontSize: 10, marginBottom: 4 }, chartTrack: { height: 92, width: 14, borderRadius: 7, backgroundColor: "#29273A", justifyContent: "flex-end", overflow: "hidden" }, chartBar: { width: "100%", backgroundColor: "#7C4DFF", borderRadius: 7 }, chartLabel: { color: "#77778D", fontSize: 10, marginTop: 7, textTransform: "capitalize" }, insight: { color: "#B9A8FF", marginTop: 14, lineHeight: 19 },
  sectionTitle: { color: "white", fontSize: 20, fontWeight: "800", marginTop: 17, marginBottom: 9 }, attentionCard: { backgroundColor: "#241B1A", borderRadius: 14, padding: 14, borderLeftWidth: 5, marginBottom: 9 }, subjectTitle: { color: "white", fontWeight: "800", fontSize: 15 }, reason: { color: "#D6A98D", marginTop: 6 }, successCard: { backgroundColor: "#133326", borderRadius: 14, padding: 14 }, successText: { color: "#61D7A1", fontWeight: "700" },
  distributionItem: { marginBottom: 15 }, distributionName: { color: "#DCDCE8", fontWeight: "700" }, distributionMinutes: { color: "#AFA3D7", fontWeight: "700" }, distributionTrack: { height: 8, borderRadius: 4, backgroundColor: "#29293A", overflow: "hidden", marginTop: 8 }, progressSpace: { marginTop: 13 },
  attendanceCard: { backgroundColor: "#161625", borderRadius: 14, borderLeftWidth: 5, padding: 14, marginBottom: 9 }, attendanceValue: { color: "#58D39B", fontSize: 18, fontWeight: "800" },
  historyCard: { backgroundColor: "#161625", borderRadius: 14, marginBottom: 9, flexDirection: "row", overflow: "hidden" }, historyColor: { width: 6 }, historyBody: { flex: 1, padding: 13 }, historyTitle: { color: "white", fontWeight: "800" }, historyActions: { flexDirection: "row", marginTop: 10 }, editText: { color: "#A98BFF", fontWeight: "700", marginRight: 20 }, deleteText: { color: "#FF808D", fontWeight: "700" },
  levelCard: { backgroundColor: "#211943", borderRadius: 16, padding: 16, marginTop: 15 }, levelXP: { color: "#C9BFFF", fontWeight: "700" },
} as const;
