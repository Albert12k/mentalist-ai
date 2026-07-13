import { useState } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

import ProgressBar from "../components/ProgressBar";
import XPBar from "../components/XPBar";
import { useSubjects } from "../contexts/SubjectsContext";
import { getStudyByMode, generateStudyPlan, StudyRecommendation } from "../services/studyPlanner";
import { getLevelProgress, getTotalXP } from "../services/xpSystem";
import { colors } from "../theme/colors";

type StudyMode = "manual" | "guided" | "auto";

const modeInformation: Record<StudyMode, { title: string; description: string }> = {
  manual: {
    title: "Manual",
    description: "Você escolhe qual matéria quer estudar.",
  },
  guided: {
    title: "Guiado",
    description: "O Mentalis recomenda as duas melhores prioridades.",
  },
  auto: {
    title: "Automático",
    description: "O Mentalis monta uma fila de estudo para você seguir.",
  },
};

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { subjects } = useSubjects();
  const [studyMode, setStudyMode] = useState<StudyMode | null>(null);
  const plan = generateStudyPlan(subjects);
  const recommendations = getStudyByMode(plan, studyMode);
  const totalXP = getTotalXP(subjects);
  const levelProgress = getLevelProgress(totalXP);
  const averageRetention = subjects.length === 0
    ? 0
    : Math.round(subjects.reduce((total, subject) => total + subject.retention, 0) / subjects.length);

  function startTraining(items: StudyRecommendation[], mode: StudyMode) {
    if (items.length === 0) return;

    navigation.navigate("Training", {
      mode,
      subjectIds: items.map((item) => item.subject.id),
    });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Mentalis AI</Text>
        <Text style={styles.subtitle}>Academia para o cérebro</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Como você quer treinar?</Text>
          {(Object.keys(modeInformation) as StudyMode[]).map((mode) => {
            const active = mode === studyMode;

            return (
              <Pressable
                key={mode}
                onPress={() => setStudyMode(mode)}
                style={[styles.modeButton, active && styles.modeButtonActive]}
              >
                <Text style={styles.modeTitle}>{modeInformation[mode].title}</Text>
                <Text style={styles.modeDescription}>{modeInformation[mode].description}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Treino de hoje</Text>
          {!studyMode ? (
            <Text style={styles.muted}>Escolha um modo de estudo para começar.</Text>
          ) : recommendations.length === 0 ? (
            <Text style={styles.muted}>Crie uma matéria para montar seu primeiro treino.</Text>
          ) : (
            <>
              <Text style={styles.muted}>{modeInformation[studyMode].description}</Text>
              {recommendations.map((item, index) => (
                <Pressable
                  key={item.subject.id}
                  onPress={() => startTraining([item], "manual")}
                  style={[styles.recommendation, { borderLeftColor: item.subject.color }]}
                >
                  <View style={styles.recommendationHeader}>
                    <Text style={styles.recommendationTitle}>{index + 1}. {item.subject.name}</Text>
                    <Text style={styles.priority}>{item.priority}%</Text>
                  </View>
                  <Text style={styles.recommendationReason}>{item.reason}</Text>
                </Pressable>
              ))}

              {studyMode !== "manual" && (
                <Pressable onPress={() => startTraining(recommendations, studyMode)} style={styles.startButton}>
                  <Text style={styles.startButtonText}>
                    Iniciar treino {studyMode === "guided" ? "guiado" : "automático"}
                  </Text>
                </Pressable>
              )}
            </>
          )}
        </View>

        <View style={styles.card}>
          <XPBar level={levelProgress.level} xp={levelProgress.progressPercent} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Evolução mental</Text>
          <ProgressBar value={averageRetention} color={colors.success} />
          <Text style={styles.retentionText}>Retenção geral: {averageRetention}%</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = {
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  title: { color: colors.text, fontSize: 30, fontWeight: "700" },
  subtitle: { color: colors.subtitle, marginTop: 4, marginBottom: 20 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  cardTitle: { color: "white", fontSize: 17, fontWeight: "700" },
  modeButton: {
    backgroundColor: "#141424",
    padding: 13,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "transparent",
  },
  modeButtonActive: { backgroundColor: "#342769", borderColor: colors.primary },
  modeTitle: { color: "white", fontWeight: "700" },
  modeDescription: { color: "#BBB", marginTop: 4, fontSize: 12 },
  muted: { color: colors.subtitle, marginTop: 12 },
  recommendation: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#141424",
    borderLeftWidth: 4,
  },
  recommendationHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  recommendationTitle: { color: "white", fontSize: 16, fontWeight: "700", flex: 1, marginRight: 10 },
  priority: { color: "#B9A8FF", fontWeight: "700" },
  recommendationReason: { color: "#AAA", marginTop: 6 },
  startButton: { backgroundColor: colors.primary, padding: 14, borderRadius: 12, marginTop: 16 },
  startButtonText: { color: "white", textAlign: "center", fontWeight: "700" },
  retentionText: { color: colors.success, marginTop: 8, fontWeight: "700" },
} as const;
