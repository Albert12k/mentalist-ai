import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";

import ProgressBar from "../components/ProgressBar";
import StudySessionModal from "../components/StudySessionModal";
import { useSubjects } from "../contexts/SubjectsContext";
import { generateStudyPlan } from "../services/studyPlanner";
import { recordStudySession } from "../services/studySession";
import { Subject } from "../types/Subject";

type StudyMode = "manual" | "guided" | "auto";

type StudySessionInput = {
  durationMinutes: number;
  contentId?: string;
  completeContent: boolean;
};

const modeLabels: Record<StudyMode, string> = {
  manual: "Treino manual",
  guided: "Treino guiado",
  auto: "Treino automático",
};

export default function TrainingScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { subjectIds, mode, openTimer }: { subjectIds: string[]; mode: StudyMode; openTimer?: boolean } = route.params;
  const { subjects, updateSubject } = useSubjects();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionVisible, setSessionVisible] = useState(Boolean(openTimer));
  const [finished, setFinished] = useState(false);
  const trainingSubjects = subjectIds
    .map((id) => subjects.find((subject) => subject.id === id))
    .filter((subject): subject is Subject => Boolean(subject));
  const currentSubject = trainingSubjects[currentIndex];
  const recommendation = currentSubject
    ? generateStudyPlan(subjects).find((item) => item.subject.id === currentSubject.id)
    : null;

  function advanceTraining() {
    if (currentIndex >= trainingSubjects.length - 1) {
      setFinished(true);
      return;
    }

    setCurrentIndex((index) => index + 1);
  }

  function handleSaveSession(input: StudySessionInput) {
    if (!currentSubject) return;

    const { subject } = recordStudySession(currentSubject, input);
    updateSubject(subject);
    setSessionVisible(false);
    advanceTraining();
  }

  if (!currentSubject && !finished) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.title}>Treino indisponível</Text>
          <Text style={styles.subtitle}>As matérias deste treino não estão mais disponíveis.</Text>
          <Pressable onPress={() => navigation.goBack()} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Voltar</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (finished) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.title}>Treino concluído</Text>
          <Text style={styles.subtitle}>
            Suas sessões foram salvas e o Progresso já foi atualizado.
          </Text>
          <Pressable onPress={() => navigation.goBack()} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Voltar ao início</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const progress = Math.round((currentIndex / trainingSubjects.length) * 100);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.back}>Encerrar treino</Text>
        </Pressable>

        <Text style={styles.title}>{modeLabels[mode]}</Text>
        <Text style={styles.subtitle}>
          Matéria {currentIndex + 1} de {trainingSubjects.length}
        </Text>
        <View style={styles.progressWrapper}>
          <ProgressBar value={progress} color="#7C4DFF" />
        </View>

        <View style={[styles.subjectCard, { borderLeftColor: currentSubject.color }]}>
          <Text style={styles.subjectName}>{currentSubject.name}</Text>
          <Text style={styles.detail}>Retenção atual: {currentSubject.retention}%</Text>
          <Text style={styles.reason}>{recommendation?.reason ?? "Continue fortalecendo esta matéria."}</Text>
        </View>

        <View style={styles.contentsCard}>
          <Text style={styles.contentsTitle}>Conteúdos disponíveis</Text>
          {currentSubject.contents.length === 0 ? (
            <Text style={styles.detail}>Registre a sessão mesmo sem vincular um conteúdo.</Text>
          ) : (
            currentSubject.contents.map((content) => (
              <Text key={content.id} style={styles.contentItem}>
                {content.completed ? "Concluído: " : "Pendente: "}{content.title}
              </Text>
            ))
          )}
        </View>

        <Pressable onPress={() => setSessionVisible(true)} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Registrar sessão de estudo</Text>
        </Pressable>
        {trainingSubjects.length > 1 && (
          <Pressable onPress={advanceTraining} style={styles.skipButton}>
            <Text style={styles.skipButtonText}>Pular esta matéria por enquanto</Text>
          </Pressable>
        )}
      </ScrollView>

      <StudySessionModal
        visible={sessionVisible}
        contents={currentSubject.contents}
        onClose={() => setSessionVisible(false)}
        onSave={handleSaveSession}
      />
    </SafeAreaView>
  );
}

const styles = {
  safeArea: { flex: 1, backgroundColor: "#080810" },
  content: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 30 },
  back: { color: "#7C4DFF", fontSize: 16 },
  title: { color: "white", fontSize: 28, fontWeight: "700", marginTop: 20 },
  subtitle: { color: "#AAA", marginTop: 7, textAlign: "center" },
  progressWrapper: { marginTop: 18 },
  subjectCard: {
    backgroundColor: "#161625",
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 6,
    marginTop: 22,
  },
  subjectName: { color: "white", fontSize: 24, fontWeight: "700" },
  detail: { color: "#AAA", marginTop: 9 },
  reason: { color: "#B9A8FF", marginTop: 12 },
  contentsCard: { backgroundColor: "#161625", borderRadius: 16, padding: 16, marginTop: 16 },
  contentsTitle: { color: "white", fontSize: 17, fontWeight: "700" },
  contentItem: { color: "#CCC", marginTop: 9 },
  primaryButton: { backgroundColor: "#7C4DFF", padding: 15, borderRadius: 12, marginTop: 24 },
  primaryButtonText: { color: "white", textAlign: "center", fontWeight: "700" },
  skipButton: { padding: 15, marginTop: 8 },
  skipButtonText: { color: "#AAA", textAlign: "center" },
} as const;
