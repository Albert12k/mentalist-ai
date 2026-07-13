import { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import ProgressBar from "../components/ProgressBar";
import { useProfile } from "../contexts/ProfileContext";
import { useSubjects } from "../contexts/SubjectsContext";
import { getTotalXP } from "../services/xpSystem";

function getDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCurrentWeekStart(): Date {
  const today = new Date();
  const daysSinceMonday = (today.getDay() + 6) % 7;

  today.setHours(0, 0, 0, 0);
  today.setDate(today.getDate() - daysSinceMonday);
  return today;
}

function calculateStreak(studyDates: Date[]): number {
  const studiedDays = new Set(studyDates.map(getDayKey));
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  // A sequência continua se o último estudo foi ontem, mesmo que a pessoa
  // ainda não tenha estudado hoje.
  if (!studiedDays.has(getDayKey(cursor))) cursor.setDate(cursor.getDate() - 1);

  let streak = 0;
  while (studiedDays.has(getDayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export default function ProfileScreen() {
  const { subjects } = useSubjects();
  const { profile, updateProfile } = useProfile();
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(profile.name);
  const [goalInput, setGoalInput] = useState(String(profile.weeklyGoalMinutes));
  const studySessions = subjects.flatMap((subject) => subject.studyHistory);
  const totalMinutes = studySessions.reduce((total, session) => total + session.duration, 0);
  const weekStart = getCurrentWeekStart();
  const weeklyMinutes = studySessions.reduce((total, session) => {
    return new Date(session.date) >= weekStart ? total + session.duration : total;
  }, 0);
  const weeklyProgress = Math.min(Math.round((weeklyMinutes / profile.weeklyGoalMinutes) * 100), 100);
  const streak = calculateStreak(studySessions.map((session) => new Date(session.date)));
  const totalXP = getTotalXP(subjects, profile.bonusXP);

  function openEditor() {
    setNameInput(profile.name);
    setGoalInput(String(profile.weeklyGoalMinutes));
    setEditing(true);
  }

  function handleSaveProfile() {
    const weeklyGoalMinutes = Number(goalInput);

    if (!nameInput.trim()) {
      Alert.alert("Nome obrigatório", "Informe como você quer aparecer no Mentalis.");
      return;
    }

    if (!Number.isInteger(weeklyGoalMinutes) || weeklyGoalMinutes < 30 || weeklyGoalMinutes > 2_400) {
      Alert.alert("Meta inválida", "Informe uma meta entre 30 e 2400 minutos por semana.");
      return;
    }

    // Mantemos os bônus e desafios já salvos ao editar somente nome/meta.
    updateProfile({ ...profile, name: nameInput.trim(), weeklyGoalMinutes });
    setEditing(false);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{profile.name}</Text>
            <Text style={styles.subtitle}>Seu espaço de estudo</Text>
          </View>
          <Pressable onPress={openEditor} style={styles.editButton}>
            <Text style={styles.editButtonText}>Editar</Text>
          </Pressable>
        </View>

        <View style={styles.goalCard}>
          <Text style={styles.cardTitle}>Meta semanal</Text>
          <Text style={styles.goalValue}>{weeklyMinutes} de {profile.weeklyGoalMinutes} min</Text>
          <ProgressBar value={weeklyProgress} color="#7C4DFF" />
          <Text style={styles.cardDescription}>
            {weeklyProgress === 100
              ? "Meta concluída. Excelente consistência!"
              : `Faltam ${Math.max(profile.weeklyGoalMinutes - weeklyMinutes, 0)} min para sua meta.`}
          </Text>
        </View>

        <View style={styles.metricsGrid}>
          <Metric label="Sequência" value={`${streak} dia${streak === 1 ? "" : "s"}`} />
          <Metric label="Sessões" value={String(studySessions.length)} />
          <Metric label="Minutos" value={String(totalMinutes)} />
          <Metric label="XP total" value={String(totalXP)} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Rotina de estudo</Text>
          <Text style={styles.cardDescription}>
            {studySessions.length === 0
              ? "Registre uma sessão para começar a acompanhar sua rotina."
              : "A sequência considera dias consecutivos com pelo menos uma sessão registrada."}
          </Text>
        </View>
      </ScrollView>

      <Modal visible={editing} animationType="slide" onRequestClose={() => setEditing(false)}>
        <SafeAreaView style={styles.modalSafeArea}>
          <Text style={styles.modalTitle}>Editar perfil e meta</Text>
          <Text style={styles.inputLabel}>Seu nome</Text>
          <TextInput
            value={nameInput}
            onChangeText={setNameInput}
            placeholder="Como quer ser chamado?"
            placeholderTextColor="#666"
            style={styles.input}
          />
          <Text style={styles.inputLabel}>Meta semanal em minutos</Text>
          <TextInput
            value={goalInput}
            onChangeText={setGoalInput}
            keyboardType="number-pad"
            maxLength={4}
            style={styles.input}
          />
          <Pressable onPress={handleSaveProfile} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Salvar perfil</Text>
          </Pressable>
          <Pressable onPress={() => setEditing(false)} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </Pressable>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = {
  safeArea: { flex: 1, backgroundColor: "#080810" },
  content: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 22 },
  title: { color: "white", fontSize: 30, fontWeight: "700" },
  subtitle: { color: "#8888AA", marginTop: 5 },
  editButton: { backgroundColor: "#263238", paddingVertical: 10, paddingHorizontal: 13, borderRadius: 10 },
  editButtonText: { color: "white", fontWeight: "700" },
  goalCard: { backgroundColor: "#161625", borderRadius: 16, padding: 16, marginBottom: 16 },
  card: { backgroundColor: "#161625", borderRadius: 16, padding: 16, marginTop: 6 },
  cardTitle: { color: "white", fontSize: 17, fontWeight: "700" },
  goalValue: { color: "#B9A8FF", fontSize: 23, fontWeight: "700", marginTop: 10, marginBottom: 12 },
  cardDescription: { color: "#AAA", marginTop: 10, lineHeight: 20 },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 10 },
  metricCard: { backgroundColor: "#161625", borderRadius: 14, padding: 14, width: "48%", marginBottom: 10 },
  metricValue: { color: "white", fontSize: 22, fontWeight: "700" },
  metricLabel: { color: "#8888AA", marginTop: 5 },
  modalSafeArea: { flex: 1, backgroundColor: "#080810", padding: 20 },
  modalTitle: { color: "white", fontSize: 26, fontWeight: "700" },
  inputLabel: { color: "#BBB", marginTop: 24, marginBottom: 8 },
  input: { backgroundColor: "#161625", color: "white", padding: 14, borderRadius: 12 },
  saveButton: { backgroundColor: "#7C4DFF", padding: 15, borderRadius: 12, marginTop: 30 },
  saveButtonText: { color: "white", textAlign: "center", fontWeight: "700" },
  cancelButton: { padding: 15, marginTop: 8 },
  cancelButtonText: { color: "#888", textAlign: "center" },
} as const;
