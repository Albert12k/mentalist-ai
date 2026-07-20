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
import { useNavigation } from "@react-navigation/native";

import { useProfile } from "../contexts/ProfileContext";
import { useAuth } from "../contexts/AuthContext";
import { uploadUserAsset } from "../services/cloudStorage";
import { useSubjects } from "../contexts/SubjectsContext";
import { getLevelProgress, getTotalXP } from "../services/xpSystem";
import { getPlanDefinition } from "../services/plans";
import { buildAchievementBadges, themeRewards } from "../services/rewards";
import { buildStudyActivity } from "../services/studyActivity";
import { cancelActivityReminders } from "../services/activityReminders";
import { clearLocalProfile } from "../services/profileStorage";
import { clearLocalSubjects } from "../services/subjectsStorage";
import { deleteCurrentAccount, exportAccountData } from "../services/accountData";

// O perfil reúne os dados que ajudam a pessoa a decidir o próximo estudo, sem
// obrigar que ela percorra todas as matérias para entender a própria evolução.
export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { subjects, updateSubjects } = useSubjects();
  const { profile, updateProfile } = useProfile();
  const { signOutPreview, userId, userEmail, isAdmin, updatePassword } = useAuth();
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(profile.name);
  const [goalInput, setGoalInput] = useState(String(profile.weeklyGoalMinutes));
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const studySessions = subjects.flatMap((subject) => subject.studyHistory);
  const totalXP = getTotalXP(subjects, profile.bonusXP);
  const levelProgress = getLevelProgress(totalXP);
  const completedContents = subjects.reduce((total, subject) => (
    total + subject.contents.filter((content) => content.completed).length
  ), 0);
  const initial = profile.name.trim().charAt(0).toUpperCase() || "E";
  const currentPlan = getPlanDefinition(profile);
  const activity = buildStudyActivity(subjects, profile.streakFreezeDates);
  const unlockedBadges = buildAchievementBadges({ subjects: subjects.length, sessions: studySessions.length, completedContents, currentStreak: activity.currentStreak }).filter((badge) => badge.unlocked);
  const selectedTheme = themeRewards.find((theme) => theme.id === (profile.selectedTheme ?? "purple")) ?? themeRewards[0];
  const earnedFreezes = totalXP >= 700 ? 2 : totalXP >= 300 ? 1 : 0;
  const availableFreezes = Math.max(earnedFreezes - (profile.streakFreezeDates?.length ?? 0), 0);
  const cloudConnected = Boolean(userId && userId !== "preview-user");

  async function pickAvatar() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (result.canceled) return;
    const asset = result.assets[0];
    try {
      if (!userId) throw new Error("Entre na sua conta antes de enviar uma foto.");
      const uploaded = await uploadUserAsset(userId, asset.uri, "avatars", asset.fileName ?? "perfil.jpg", asset.mimeType ?? "image/jpeg");
      updateProfile({ ...profile, avatar: uploaded.url, avatarPath: uploaded.path });
    } catch {
      Alert.alert("Não foi possível enviar", "Tente escolher outra foto ou confira se o Storage foi configurado no Supabase.");
    }
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

  async function toggleReminders() {
    const enabled = profile.remindersEnabled !== false;
    if (enabled) {
      await Promise.all(subjects.flatMap((subject) => subject.events.flatMap((event) => [cancelActivityReminders(event.notificationIds)])));
      updateSubjects(subjects.map((subject) => ({ ...subject, events: subject.events.map((event) => ({ ...event, notificationIds: [] })) })));
    }
    updateProfile({ ...profile, remindersEnabled: !enabled });
  }

  async function handlePasswordChange() {
    if (newPassword.length < 8) { Alert.alert("Senha curta", "Use pelo menos 8 caracteres."); return; }
    const error = await updatePassword(newPassword);
    if (error) { Alert.alert("Não foi possível alterar", error); return; }
    setNewPassword(""); setPasswordVisible(false); Alert.alert("Senha alterada", "Sua nova senha já está ativa.");
  }

  async function handleExport() {
    try { Alert.alert("Exportação concluída", await exportAccountData(profile, subjects)); } catch { Alert.alert("Não foi possível exportar", "Tente novamente em alguns instantes."); }
  }

  function handleClearLocal() {
    if (!userId) return;
    Alert.alert("Limpar dados deste dispositivo?", "Os dados na nuvem serão mantidos e voltarão quando você entrar novamente.", [{ text: "Cancelar", style: "cancel" }, { text: "Limpar e sair", style: "destructive", onPress: async () => { await clearLocalProfile(userId); await clearLocalSubjects(userId); await signOutPreview(); } }]);
  }

  async function handleDeleteAccount() {
    if (deleteConfirmation !== "EXCLUIR") return;
    try { await deleteCurrentAccount(subjects, profile.avatarPath); if (userId) { await clearLocalProfile(userId); await clearLocalSubjects(userId); } setDeleteVisible(false); await signOutPreview(); } catch { Alert.alert("Não foi possível excluir", "Confira sua conexão e tente novamente."); }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.heroCard, { borderColor: selectedTheme.color }]}>
          <View style={styles.heroTop}>
            <Pressable onPress={pickAvatar} style={styles.avatar}>{profile.avatar ? <Image source={{ uri: profile.avatar }} style={styles.avatarImage} /> : <Text style={styles.avatarText}>{initial}</Text>}</Pressable>
            <View><Pressable onPress={pickAvatar} style={styles.photoButton}><Text style={styles.editButtonText}>Foto</Text></Pressable><Pressable onPress={openEditor} style={styles.editButton}><Text style={styles.editButtonText}>Editar perfil</Text></Pressable></View>
          </View>
          <Text style={styles.name}>{profile.name}</Text>
          {profile.selectedTitle ? <Text style={styles.profileTitle}>✦ {profile.selectedTitle}</Text> : null}
          <Text style={styles.heroSubtitle}>Nível {levelProgress.level} • {totalXP} XP acumulado</Text>
          <View style={styles.levelTrack}>
            <View style={[styles.levelFill, { width: `${levelProgress.progressPercent}%` }]} />
          </View>
          <Text style={styles.levelHint}>{levelProgress.progressPercent}% até o próximo nível</Text>
        </View>

        <View style={styles.showcaseCard}>
          <View style={styles.cardHeader}><Text style={styles.cardTitle}>Vitrine de conquistas</Text><Text style={styles.showcaseCount}>{unlockedBadges.length} medalhas</Text></View>
          {unlockedBadges.length ? <View style={styles.showcaseRow}>{unlockedBadges.slice(0, 4).map((badge) => <View key={badge.id} style={styles.showcaseBadge}><Text style={styles.showcaseIcon}>{badge.icon}</Text><Text style={styles.showcaseName}>{badge.title}</Text></View>)}</View> : <Text style={styles.cardDescription}>Use o app e registre seus estudos para conquistar suas primeiras medalhas.</Text>}
        </View>

        <Text style={styles.sectionTitle}>Preferências de estudo</Text>
        <View style={styles.card}>
          <SettingRow title="Meta semanal" description={`${profile.weeklyGoalMinutes} minutos por semana`} action="Editar" onPress={openEditor} />
          <Text style={styles.settingLabel}>Pomodoro padrão</Text>
          <View style={styles.choiceRow}>{([15, 25, 45, 60] as const).map((minutes) => <Pressable key={minutes} onPress={() => updateProfile({ ...profile, defaultPomodoroMinutes: minutes })} style={[styles.choiceButton, (profile.defaultPomodoroMinutes ?? 25) === minutes && styles.choiceActive]}><Text style={styles.choiceText}>{minutes} min</Text></Pressable>)}</View>
          <SettingRow title="Lembretes de atividades" description={profile.remindersEnabled !== false ? "Ativados para novos prazos" : "Desativados"} action={profile.remindersEnabled !== false ? "Desativar" : "Ativar"} onPress={toggleReminders} />
          <SettingRow title="Tema do perfil" description={selectedTheme.name} action="Escolher" onPress={() => navigation.navigate("Desafios")} />
          <SettingRow title="Proteções de sequência" description={`${availableFreezes} disponível(is)`} />
        </View>

        <Text style={styles.sectionTitle}>Plano e conta</Text>
        <View style={styles.planCard}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.planEyebrow}>SEU PLANO</Text>
              <Text style={styles.cardTitle}>{isAdmin ? "Administrador" : currentPlan.name}</Text>
            </View>
            <Text style={styles.planBadge}>{isAdmin ? "ADMIN" : profile.plan === "pro" ? "PRO" : "FREE"}</Text>
          </View>
          <Text style={styles.cardDescription}>{isAdmin ? "Acesso completo aos recursos do Mentalis." : currentPlan.description}</Text>
          <Text style={styles.planLimit}>
            {isAdmin
              ? "Recursos do app liberados sem limite de plano"
              : `${currentPlan.storageMb >= 1000 ? `${currentPlan.storageMb / 1000} GB` : `${currentPlan.storageMb} MB`} de armazenamento`}
          </Text>
          <Pressable onPress={() => navigation.navigate("Plans")} style={styles.planButton}><Text style={styles.saveButtonText}>Planos e pagamento</Text></Pressable>
        </View>
        <View style={styles.card}>
          <SettingRow title="E-mail" description={userEmail ?? "Modo de demonstração"} />
          <SettingRow title="Sincronização" description={cloudConnected ? "Supabase conectado e dados sincronizados" : "Dados somente neste dispositivo"} status={cloudConnected ? "ATIVA" : "LOCAL"} />
          {cloudConnected ? <SettingRow title="Senha" description="Altere a senha da sua conta" action="Alterar" onPress={() => setPasswordVisible(true)} /> : null}
        </View>

        <Text style={styles.sectionTitle}>Dados e privacidade</Text>
        <View style={styles.card}>
          <SettingRow title="Exportar meus dados" description="Baixe perfil, matérias e histórico em JSON" action="Exportar" onPress={handleExport} />
          <SettingRow title="Limpar dados locais" description="Mantém a cópia sincronizada no Supabase" action="Limpar" danger onPress={handleClearLocal} />
          {cloudConnected ? <SettingRow title="Excluir minha conta" description="Remove permanentemente conta e dados" action="Excluir" danger onPress={() => { setDeleteConfirmation(""); setDeleteVisible(true); }} /> : null}
        </View>

        <Pressable onPress={signOutPreview} style={styles.signOutButton}><Text style={styles.signOutText}>Sair da conta</Text></Pressable>
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
      <Modal visible={passwordVisible} animationType="slide" onRequestClose={() => setPasswordVisible(false)}><SafeAreaView style={styles.modalSafeArea}><Text style={styles.modalTitle}>Alterar senha</Text><Text style={styles.inputLabel}>Nova senha</Text><TextInput value={newPassword} onChangeText={setNewPassword} secureTextEntry placeholder="Pelo menos 8 caracteres" placeholderTextColor="#666" style={styles.input} /><Pressable onPress={handlePasswordChange} style={styles.saveButton}><Text style={styles.saveButtonText}>Salvar nova senha</Text></Pressable><Pressable onPress={() => setPasswordVisible(false)} style={styles.cancelButton}><Text style={styles.cancelButtonText}>Cancelar</Text></Pressable></SafeAreaView></Modal>
      <Modal visible={deleteVisible} animationType="slide" onRequestClose={() => setDeleteVisible(false)}><SafeAreaView style={styles.modalSafeArea}><Text style={styles.modalTitle}>Excluir conta</Text><Text style={styles.dangerDescription}>Esta ação remove permanentemente sua conta, matérias, histórico e arquivos. Digite EXCLUIR para confirmar.</Text><TextInput value={deleteConfirmation} onChangeText={setDeleteConfirmation} autoCapitalize="characters" placeholder="EXCLUIR" placeholderTextColor="#666" style={styles.input} /><Pressable disabled={deleteConfirmation !== "EXCLUIR"} onPress={handleDeleteAccount} style={[styles.deleteButton, deleteConfirmation !== "EXCLUIR" && styles.disabledButton]}><Text style={styles.saveButtonText}>Excluir permanentemente</Text></Pressable><Pressable onPress={() => setDeleteVisible(false)} style={styles.cancelButton}><Text style={styles.cancelButtonText}>Cancelar</Text></Pressable></SafeAreaView></Modal>
    </SafeAreaView>
  );
}

function SettingRow({ title, description, action, status, danger, onPress }: { title: string; description: string; action?: string; status?: string; danger?: boolean; onPress?: () => void }) {
  return <View style={styles.settingRow}><View style={{ flex: 1 }}><Text style={styles.settingTitle}>{title}</Text><Text style={styles.settingDescription}>{description}</Text></View>{status ? <Text style={styles.statusBadge}>{status}</Text> : null}{action ? <Pressable onPress={onPress} style={styles.settingAction}><Text style={[styles.settingActionText, danger && styles.dangerText]}>{action}</Text></Pressable> : null}</View>;
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
  profileTitle: { color: "#FFD76A", fontWeight: "700", marginTop: 5 },
  heroSubtitle: { color: "#D2C8FF", marginTop: 5 },
  levelTrack: { height: 8, backgroundColor: "#17112F", borderRadius: 4, overflow: "hidden", marginTop: 18 },
  levelFill: { height: "100%", backgroundColor: "#B9A8FF", borderRadius: 4 },
  levelHint: { color: "#D2C8FF", marginTop: 7, fontSize: 12 },
  goalCard: { backgroundColor: "#161625", borderRadius: 16, padding: 16, marginBottom: 16 },
  showcaseCard: { backgroundColor: "#161625", borderRadius: 16, padding: 16, marginBottom: 16 },
  showcaseCount: { color: "#B9A8FF", fontWeight: "700", fontSize: 12 },
  showcaseRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 13 },
  showcaseBadge: { width: "48%", backgroundColor: "#222236", borderRadius: 12, padding: 11, marginRight: "2%", marginBottom: 8, flexDirection: "row", alignItems: "center" },
  showcaseIcon: { fontSize: 21, marginRight: 8 },
  showcaseName: { color: "white", fontWeight: "700", fontSize: 12, flex: 1 },
  planCard: { backgroundColor: "#211943", borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#5E46A8" },
  planEyebrow: { color: "#B9A8FF", fontSize: 11, fontWeight: "800", letterSpacing: 1, marginBottom: 5 },
  planBadge: { color: "#FFF", backgroundColor: "#6741D9", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, fontWeight: "800" },
  planLimit: { color: "#D2C8FF", marginTop: 12, fontWeight: "700" },
  planButton: { backgroundColor: "#7C4DFF", padding: 13, borderRadius: 12, marginTop: 16 },
  card: { backgroundColor: "#161625", borderRadius: 16, padding: 16, marginTop: 6 },
  sectionTitle: { color: "white", fontSize: 20, fontWeight: "800", marginTop: 12, marginBottom: 9 },
  settingRow: { flexDirection: "row", alignItems: "center", paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: "#28283A" },
  settingTitle: { color: "white", fontWeight: "700" },
  settingDescription: { color: "#85859A", fontSize: 12, marginTop: 4, lineHeight: 17 },
  settingAction: { paddingHorizontal: 10, paddingVertical: 8, marginLeft: 8 },
  settingActionText: { color: "#A98BFF", fontWeight: "800", fontSize: 12 },
  settingLabel: { color: "white", fontWeight: "700", marginTop: 15, marginBottom: 9 },
  choiceRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 3 },
  choiceButton: { backgroundColor: "#252537", borderRadius: 9, paddingHorizontal: 11, paddingVertical: 9, marginRight: 7, marginBottom: 7 },
  choiceActive: { backgroundColor: "#7C4DFF" },
  choiceText: { color: "white", fontWeight: "700", fontSize: 12 },
  statusBadge: { color: "#60D5A0", backgroundColor: "#153629", paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, fontWeight: "800", fontSize: 10 },
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
  dangerDescription: { color: "#E3A4A4", marginTop: 15, marginBottom: 20, lineHeight: 21 },
  deleteButton: { backgroundColor: "#B00020", padding: 15, borderRadius: 12, marginTop: 18 },
  disabledButton: { opacity: 0.4 },
  dangerText: { color: "#FF7D89" },
  achievementCard: { backgroundColor: "#2A2410", borderWidth: 1, borderColor: "#685316", borderRadius: 16, padding: 16, marginTop: 12 },
  achievementValue: { color: "#FFD54F", fontSize: 20, fontWeight: "700", marginTop: 10 },
  achievementDescription: { color: "#D8C78E", marginTop: 8, lineHeight: 20 },
  signOutButton: { padding: 15, marginTop: 12 },
  signOutText: { color: "#FF9A9A", textAlign: "center", fontWeight: "700" },
} as const;
