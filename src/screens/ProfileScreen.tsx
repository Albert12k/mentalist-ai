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
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

import ProgressBar from "../components/ProgressBar";
import { useProfile } from "../contexts/ProfileContext";
import { useSubjects } from "../contexts/SubjectsContext";
import { getLevelProgress, getTotalXP } from "../services/xpSystem";

function getDayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getCurrentWeekStart(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  today.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  return today;
}

function calculateStreak(studyDates: Date[]): number {
  const studiedDays = new Set(studyDates.map(getDayKey));
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!studiedDays.has(getDayKey(cursor))) cursor.setDate(cursor.getDate() - 1);

  let streak = 0;
  while (studiedDays.has(getDayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// O perfil reúne os dados que ajudam a pessoa a decidir o próximo estudo, sem
// obrigar que ela percorra todas as matérias para entender a própria evolução.
export default function ProfileScreen() {
  const { subjects } = useSubjects();
  const { profile, updateProfile } = useProfile();
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(profile.name);
  const [goalInput, setGoalInput] = useState(String(profile.weeklyGoalMinutes));

  const studySessions = subjects.flatMap((subject) => subject.studyHistory);
  const totalMinutes = studySessions.reduce((total, session) => total + session.duration, 0);
  const weekStart = getCurrentWeekStart();
  const weeklyMinutes = studySessions.reduce((total, session) => (
    new Date(session.date) >= weekStart ? total + session.duration : total
  ), 0);
  const weeklyProgress = Math.min(Math.round((weeklyMinutes / profile.weeklyGoalMinutes) * 100), 100);
  const streak = calculateStreak(studySessions.map((session) => new Date(session.date)));
  const totalXP = getTotalXP(subjects, profile.bonusXP);
  const levelProgress = getLevelProgress(totalXP);
  const focusSubject = subjects.slice().sort((first, second) => first.retention - second.retention)[0];
  const completedContents = subjects.reduce((total, subject) => (
    total + subject.contents.filter((content) => content.completed).length
  ), 0);
  const totalContents = subjects.reduce((total, subject) => total + subject.contents.length, 0);
  const initial = profile.name.trim().charAt(0).toUpperCase() || "E";

  async function pickAvatar() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (!result.canceled) updateProfile({ ...profile, avatar: result.assets[0].uri });
  }

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
    if (!Number.isInteger(weeklyGoalMinutes) || weeklyGoalMinutes < 30 || weeklyGoalMinutes > 2400) {
      Alert.alert("Meta inválida", "Informe uma meta entre 30 e 2400 minutos por semana.");
      return;
    }

    updateProfile({ ...profile, name: nameInput.trim(), weeklyGoalMinutes });
    setEditing(false);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <Pressable onPress={pickAvatar} style={styles.avatar}>{profile.avatar ? <Image source={{ uri: profile.avatar }} style={styles.avatarImage} /> : <Text style={styles.avatarText}>{initial}</Text>}</Pressable>
            <View><Pressable onPress={pickAvatar} style={styles.photoButton}><Text style={styles.editButtonText}>Foto</Text></Pressable><Pressable onPress={openEditor} style={styles.editButton}><Text style={styles.editButtonText}>Editar perfil</Text></Pressable></View>
          </View>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.heroSubtitle}>Nível {levelProgress.level} • {totalXP} XP acumulado</Text>
          <View style={styles.levelTrack}>
            <View style={[styles.levelFill, { width: `${levelProgress.progressPercent}%` }]} />
          </View>
          <Text style={styles.levelHint}>{levelProgress.progressPercent}% até o próximo nível</Text>
        </View>

        <View style={styles.goalCard}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardTitle}>Meta semanal</Text>
              <Text style={styles.goalValue}>{weeklyMinutes} de {profile.weeklyGoalMinutes} min</Text>
            </View>
            <View style={styles.percentBadge}><Text style={styles.percentText}>{weeklyProgress}%</Text></View>
          </View>
          <ProgressBar value={weeklyProgress} color="#7C4DFF" />
          <Text style={styles.cardDescription}>
            {weeklyProgress === 100 ? "Meta concluída. Excelente consistência!" : `Faltam ${Math.max(profile.weeklyGoalMinutes - weeklyMinutes, 0)} min para concluir sua meta.`}
          </Text>
        </View>

        <View style={styles.metricsGrid}>
          <Metric label="Sequência" value={`${streak} dia${streak === 1 ? "" : "s"}`} />
          <Metric label="Sessões" value={String(studySessions.length)} />
          <Metric label="Matérias" value={String(subjects.length)} />
          <Metric label="Conteúdos" value={`${completedContents}/${totalContents}`} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Seu foco agora</Text>
          {focusSubject ? (
            <>
              <Text style={styles.focusName}>{focusSubject.name}</Text>
              <Text style={styles.cardDescription}>Retenção atual: {focusSubject.retention}%. Uma boa escolha para a próxima revisão.</Text>
            </>
          ) : (
            <Text style={styles.cardDescription}>Crie sua primeira matéria para o Mentalis indicar uma prioridade de estudo.</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Resumo de estudo</Text>
          <Text style={styles.cardDescription}>
            {studySessions.length === 0 ? "Registre uma sessão para começar a acompanhar sua rotina." : `Você já registrou ${totalMinutes} minuto(s) de estudo. Continue alimentando suas sessões para tornar as recomendações mais precisas.`}
          </Text>
        </View>

        <View style={styles.achievementCard}>
          <Text style={styles.cardTitle}>Suas conquistas</Text>
          <Text style={styles.achievementValue}>{profile.claimedChallengeIds.length} desafios resgatados</Text>
          <Text style={styles.achievementDescription}>
            Você já acumulou {profile.bonusXP} XP em recompensas. Continue concluindo desafios para evoluir mais rápido.
          </Text>
        </View>
      </ScrollView>

      <Modal visible={editing} animationType="slide" onRequestClose={() => setEditing(false)}>
        <SafeAreaView style={styles.modalSafeArea}>
          <Text style={styles.modalTitle}>Editar perfil e meta</Text>
          <Text style={styles.inputLabel}>Seu nome</Text>
          <TextInput value={nameInput} onChangeText={setNameInput} placeholder="Como quer ser chamado?" placeholderTextColor="#666" style={styles.input} />
          <Text style={styles.inputLabel}>Meta semanal em minutos</Text>
          <TextInput value={goalInput} onChangeText={setGoalInput} keyboardType="number-pad" maxLength={4} style={styles.input} />
          <Pressable onPress={handleSaveProfile} style={styles.saveButton}><Text style={styles.saveButtonText}>Salvar perfil</Text></Pressable>
          <Pressable onPress={() => setEditing(false)} style={styles.cancelButton}><Text style={styles.cancelButtonText}>Cancelar</Text></Pressable>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <View style={styles.metricCard}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}

const styles = {
  safeArea: { flex: 1, backgroundColor: "#080810" },
  content: { padding: 20, paddingBottom: 40 },
  heroCard: { backgroundColor: "#241A47", borderRadius: 20, padding: 18, borderWidth: 1, borderColor: "#5E46A8", marginBottom: 16 },
  heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#B9A8FF", alignItems: "center", justifyContent: "center" },
  avatarImage: { width: "100%", height: "100%", borderRadius: 26 },
  photoButton: { backgroundColor: "rgba(255,255,255,0.12)", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, marginBottom: 6 },
  avatarText: { color: "#20163D", fontSize: 24, fontWeight: "800" },
  editButton: { backgroundColor: "rgba(255,255,255,0.12)", paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10 },
  editButtonText: { color: "white", fontWeight: "700", fontSize: 12 },
  name: { color: "white", fontSize: 29, fontWeight: "800", marginTop: 14 },
  heroSubtitle: { color: "#D2C8FF", marginTop: 5 },
  levelTrack: { height: 8, backgroundColor: "#17112F", borderRadius: 4, overflow: "hidden", marginTop: 18 },
  levelFill: { height: "100%", backgroundColor: "#B9A8FF", borderRadius: 4 },
  levelHint: { color: "#D2C8FF", marginTop: 7, fontSize: 12 },
  goalCard: { backgroundColor: "#161625", borderRadius: 16, padding: 16, marginBottom: 16 },
  card: { backgroundColor: "#161625", borderRadius: 16, padding: 16, marginTop: 6 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { color: "white", fontSize: 17, fontWeight: "700" },
  goalValue: { color: "#B9A8FF", fontSize: 22, fontWeight: "700", marginTop: 8, marginBottom: 12 },
  percentBadge: { backgroundColor: "#2A2445", paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999 },
  percentText: { color: "#CDBEFF", fontWeight: "800" },
  cardDescription: { color: "#AAA", marginTop: 10, lineHeight: 20 },
  focusName: { color: "#00E676", fontSize: 20, fontWeight: "700", marginTop: 10 },
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
  achievementCard: { backgroundColor: "#2A2410", borderWidth: 1, borderColor: "#685316", borderRadius: 16, padding: 16, marginTop: 12 },
  achievementValue: { color: "#FFD54F", fontSize: 20, fontWeight: "700", marginTop: 10 },
  achievementDescription: { color: "#D8C78E", marginTop: 8, lineHeight: 20 },
} as const;
