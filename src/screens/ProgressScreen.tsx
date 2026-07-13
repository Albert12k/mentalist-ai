import { SafeAreaView, ScrollView, Text, View } from "react-native";

import ProgressBar from "../components/ProgressBar";
import { useSubjects } from "../contexts/SubjectsContext";
import { useProfile } from "../contexts/ProfileContext";
import { Subject } from "../types/Subject";
import { getLevelProgress, getTotalXP } from "../services/xpSystem";

type SubjectStats = {
  sessions: number;
  minutes: number;
  completedContents: number;
};

function getSubjectStats(subject: Subject): SubjectStats {
  return {
    sessions: subject.studyHistory.length,
    minutes: subject.studyHistory.reduce((total, session) => total + session.duration, 0),
    completedContents: subject.contents.filter((content) => content.completed).length,
  };
}

export default function ProgressScreen() {
  const { subjects } = useSubjects();
  const { profile } = useProfile();
  const totalXP = getTotalXP(subjects, profile.bonusXP);
  const levelProgress = getLevelProgress(totalXP);
  const totalSessions = subjects.reduce((total, subject) => total + subject.studyHistory.length, 0);
  const totalMinutes = subjects.reduce(
    (total, subject) => total + getSubjectStats(subject).minutes,
    0,
  );
  const totalContents = subjects.reduce((total, subject) => total + subject.contents.length, 0);
  const completedContents = subjects.reduce(
    (total, subject) => total + getSubjectStats(subject).completedContents,
    0,
  );
  const totalAbsences = subjects.reduce((total, subject) => total + subject.absences, 0);
  const averageRetention = subjects.length === 0
    ? 0
    : Math.round(subjects.reduce((total, subject) => total + subject.retention, 0) / subjects.length);
  const contentProgress = totalContents === 0
    ? 0
    : Math.round((completedContents / totalContents) * 100);
  const sortedSubjects = subjects
    .slice()
    .sort((first, second) => getSubjectStats(second).minutes - getSubjectStats(first).minutes);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Progresso</Text>
        <Text style={styles.subtitle}>Acompanhe a evolução dos seus estudos.</Text>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Nível {levelProgress.level}</Text>
            <Text style={styles.highlight}>{totalXP} XP total</Text>
          </View>
          <ProgressBar value={levelProgress.progressPercent} color="#7C4DFF" />
          <Text style={styles.cardDescription}>
            {levelProgress.currentXP} XP de 100 para o próximo nível
          </Text>
        </View>

        <View style={styles.metricsGrid}>
          <MetricCard label="Sessões" value={String(totalSessions)} />
          <MetricCard label="Minutos" value={String(totalMinutes)} />
          <MetricCard label="Conteúdos" value={`${completedContents}/${totalContents}`} />
          <MetricCard label="Faltas" value={String(totalAbsences)} warning={totalAbsences > 0} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Retenção geral</Text>
          <ProgressBar value={averageRetention} color="#00E676" />
          <Text style={[styles.cardDescription, { color: "#00E676" }]}>
            {averageRetention}% de retenção média
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Conteúdos concluídos</Text>
          <ProgressBar value={contentProgress} color="#00B0FF" />
          <Text style={styles.cardDescription}>{contentProgress}% do conteúdo cadastrado</Text>
        </View>

        <Text style={styles.sectionTitle}>Por matéria</Text>
        {sortedSubjects.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.cardDescription}>
              Crie uma matéria e registre uma sessão de estudo para acompanhar sua evolução aqui.
            </Text>
          </View>
        ) : (
          sortedSubjects.map((subject) => {
            const stats = getSubjectStats(subject);
            const subjectContentProgress = subject.contents.length === 0
              ? 0
              : Math.round((stats.completedContents / subject.contents.length) * 100);

            return (
              <View key={subject.id} style={[styles.subjectCard, { borderLeftColor: subject.color }]}>
                <View style={styles.cardHeader}>
                  <Text style={styles.subjectName}>{subject.name}</Text>
                  <Text style={styles.highlight}>{stats.minutes} min</Text>
                </View>
                <Text style={styles.subjectDetail}>
                  {stats.sessions} sessões • {subject.retention}% de retenção • {subject.absences} falta{subject.absences === 1 ? "" : "s"}
                </Text>
                <View style={styles.subjectProgress}>
                  <ProgressBar value={subjectContentProgress} color={subject.color} />
                </View>
                <Text style={styles.cardDescription}>
                  {stats.completedContents}/{subject.contents.length} conteúdos concluídos
                </Text>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricCard({ label, value, warning = false }: { label: string; value: string; warning?: boolean }) {
  return (
    <View style={styles.metricCard}>
      <Text style={[styles.metricValue, warning && { color: "#FFB74D" }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = {
  safeArea: {
    flex: 1,
    backgroundColor: "#080810",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    color: "white",
    fontSize: 30,
    fontWeight: "700",
  },
  subtitle: {
    color: "#8888AA",
    marginTop: 6,
    marginBottom: 22,
  },
  card: {
    backgroundColor: "#161625",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    color: "white",
    fontSize: 17,
    fontWeight: "700",
  },
  highlight: {
    color: "#B9A8FF",
    fontWeight: "700",
  },
  cardDescription: {
    color: "#8888AA",
    marginTop: 9,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  metricCard: {
    backgroundColor: "#161625",
    borderRadius: 14,
    padding: 14,
    width: "48%",
    marginBottom: 10,
  },
  metricValue: {
    color: "white",
    fontSize: 24,
    fontWeight: "700",
  },
  metricLabel: {
    color: "#8888AA",
    marginTop: 4,
  },
  sectionTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
    marginTop: 8,
  },
  subjectCard: {
    backgroundColor: "#161625",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 5,
  },
  subjectName: {
    color: "white",
    fontSize: 17,
    fontWeight: "700",
    flex: 1,
    marginRight: 10,
  },
  subjectDetail: {
    color: "#AAA",
  },
  subjectProgress: {
    marginTop: 12,
  },
} as const;
