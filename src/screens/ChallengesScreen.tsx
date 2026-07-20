import { useMemo, useRef, useState } from "react";
import { Animated, Modal, Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

import ProgressBar from "../components/ProgressBar";
import { useProfile } from "../contexts/ProfileContext";
import { useSubjects } from "../contexts/SubjectsContext";
import { buildChallenges } from "../services/challenges";
import { buildAchievementBadges, profileRewards, themeRewards } from "../services/rewards";
import { buildStudyActivity } from "../services/studyActivity";
import { getTotalXP } from "../services/xpSystem";

export default function ChallengesScreen() {
  const navigation = useNavigation<any>();
  const { subjects } = useSubjects();
  const { profile, updateProfile, claimChallenge } = useProfile();
  const [celebration, setCelebration] = useState<{ icon: string; title: string } | null>(null);
  const celebrationScale = useRef(new Animated.Value(0.7)).current;
  const challenges = useMemo(() => buildChallenges(subjects, profile.weeklyGoalMinutes), [subjects, profile.weeklyGoalMinutes]);
  const claimedChallenges = new Set(profile.claimedChallengeIds);
  const totalXP = getTotalXP(subjects, profile.bonusXP);
  const activity = useMemo(() => buildStudyActivity(subjects, profile.streakFreezeDates), [subjects, profile.streakFreezeDates]);
  const nextReward = profileRewards.find((reward) => reward.requiredXP > totalXP);
  const completedChallenges = challenges.filter((challenge) => challenge.current >= challenge.target).length;

  const hasSubject = subjects.length > 0;
  const hasMaterial = subjects.some((subject) => subject.contents.length > 0 || subject.materials.length > 0);
  const hasActivity = subjects.some((subject) => subject.events.length > 0);
  const hasStudy = subjects.some((subject) => subject.studyHistory.length > 0);
  const tutorialSteps = [
    { id: "subject", title: "Crie sua primeira matéria", description: "Escolha os dias de aula, modalidade e uma cor.", complete: hasSubject, action: "Ir para Matérias", screen: "Matérias" },
    { id: "material", title: "Organize o conteúdo", description: "Adicione um conteúdo, PDF, foto ou áudio à matéria.", complete: hasMaterial, action: "Adicionar conteúdo", screen: "Matérias" },
    { id: "activity", title: "Planeje uma atividade", description: "Cadastre uma prova, trabalho ou revisão na agenda.", complete: hasActivity, action: "Abrir Agenda", screen: "Agenda" },
    { id: "study", title: "Registre seu primeiro estudo", description: "Use o Pomodoro ou registre o tempo manualmente.", complete: hasStudy, action: "Começar estudo", screen: "Matérias" },
  ];
  const tutorialCompleted = tutorialSteps.filter((step) => step.complete).length;
  const sessionCount = subjects.reduce((total, subject) => total + subject.studyHistory.length, 0);
  const completedContents = subjects.reduce((total, subject) => total + subject.contents.filter((content) => content.completed).length, 0);
  const badges = buildAchievementBadges({ subjects: subjects.length, sessions: sessionCount, completedContents, currentStreak: activity.currentStreak });
  const earnedFreezes = totalXP >= 700 ? 2 : totalXP >= 300 ? 1 : 0;
  const availableFreezes = Math.max(earnedFreezes - (profile.streakFreezeDates?.length ?? 0), 0);

  function celebrate(icon: string, title: string) {
    celebrationScale.setValue(0.7);
    setCelebration({ icon, title });
    Animated.spring(celebrationScale, { toValue: 1, useNativeDriver: true }).start();
  }

  function equipTitle(title: string, icon: string) {
    updateProfile({ ...profile, selectedTitle: title });
    celebrate(icon, title);
  }

  function useStreakProtection() {
    if (!activity.protectableDate || availableFreezes < 1) return;
    updateProfile({ ...profile, streakFreezeDates: [...(profile.streakFreezeDates ?? []), activity.protectableDate] });
    celebrate("🛡️", "Sequência protegida");
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Desafios e recompensas</Text>
        <Text style={styles.subtitle}>Aprenda o Mentalis, mantenha o ritmo e desbloqueie conquistas.</Text>

        <Text style={styles.sectionTitle}>Primeiros passos</Text>
        <View style={styles.tutorialCard}>
          <View style={styles.row}><Text style={styles.tutorialTitle}>Guia rápido</Text><Text style={styles.counter}>{tutorialCompleted}/{tutorialSteps.length}</Text></View>
          <Text style={styles.description}>Conclua essas etapas no seu ritmo. O progresso é identificado automaticamente.</Text>
          <View style={styles.progressWrapper}><ProgressBar value={(tutorialCompleted / tutorialSteps.length) * 100} color="#8C64FF" /></View>
          {tutorialSteps.map((step, index) => (
            <View key={step.id} style={styles.tutorialStep}>
              <View style={[styles.stepNumber, step.complete && styles.stepComplete]}><Text style={styles.stepNumberText}>{step.complete ? "✓" : index + 1}</Text></View>
              <View style={styles.stepBody}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDescription}>{step.description}</Text>
                {!step.complete ? <Pressable onPress={() => navigation.navigate(step.screen)}><Text style={styles.stepAction}>{step.action} →</Text></Pressable> : <Text style={styles.doneText}>Concluído</Text>}
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Sua constância</Text>
        <View style={styles.streakCard}>
          <View style={styles.streakHeader}>
            <View><Text style={styles.streakValue}>🔥 {activity.currentStreak}</Text><Text style={styles.streakLabel}>dias em sequência</Text></View>
            <View style={styles.streakMetric}><Text style={styles.metricValue}>{activity.bestStreak}</Text><Text style={styles.metricLabel}>melhor sequência</Text></View>
            <View style={styles.streakMetric}><Text style={styles.metricValue}>{activity.totalActiveDays}</Text><Text style={styles.metricLabel}>dias ativos</Text></View>
          </View>
          <Text style={styles.weekTitle}>Esta semana</Text>
          <View style={styles.weekRow}>
            {activity.week.map((day) => <View key={day.key} style={styles.dayColumn}><View style={[styles.dayCircle, day.active && styles.dayActive, day.today && styles.dayToday]}><Text style={[styles.dayText, day.active && styles.dayTextActive]}>{day.active ? "✓" : day.label}</Text></View></View>)}
          </View>
          <Text style={styles.streakHint}>{activity.currentStreak > 0 ? "Continue estudando para manter sua sequência viva." : "Registre um estudo hoje para iniciar sua sequência."}</Text>
          <View style={styles.freezeRow}><Text style={styles.freezeText}>🛡️ Proteções disponíveis: {availableFreezes}</Text>{activity.protectableDate && availableFreezes > 0 ? <Pressable onPress={useStreakProtection} style={styles.freezeButton}><Text style={styles.freezeButtonText}>Proteger ontem</Text></Pressable> : null}</View>
        </View>

        <View style={styles.calendarCard}>
          <Text style={styles.calendarTitle}>{activity.monthLabel}</Text>
          <View style={styles.calendarGrid}>{["S", "T", "Q", "Q", "S", "S", "D"].map((label, index) => <Text key={`${label}-${index}`} style={styles.calendarWeekLabel}>{label}</Text>)}{activity.monthDays.map((day, index) => day ? <View key={day.key} style={[styles.calendarDay, day.active && styles.calendarDayActive, day.protected && styles.calendarDayProtected]}><Text style={[styles.calendarDayText, (day.active || day.protected) && styles.calendarDayTextActive]}>{day.day}</Text></View> : <View key={`empty-${index}`} style={styles.calendarDay} />)}</View>
          <Text style={styles.calendarLegend}>● Estudo registrado   🛡 Dia protegido</Text>
        </View>

        <Text style={styles.sectionTitle}>Suas recompensas</Text>
        <Text style={styles.sectionDescription}>Ganhe XP estudando e equipe o título que mais combina com você.</Text>
        {nextReward ? <View style={styles.nextRewardCard}><View style={styles.row}><Text style={styles.nextRewardTitle}>Próxima: {nextReward.title}</Text><Text style={styles.nextRewardXP}>{totalXP}/{nextReward.requiredXP} XP</Text></View><View style={styles.progressWrapper}><ProgressBar value={(totalXP / nextReward.requiredXP) * 100} color="#FFD76A" /></View><Text style={styles.nextRewardHint}>Faltam {nextReward.requiredXP - totalXP} XP para desbloquear.</Text></View> : <View style={styles.nextRewardCard}><Text style={styles.nextRewardTitle}>Todas as recompensas desbloqueadas 🏆</Text></View>}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rewardsRow}>
          {profileRewards.map((reward) => {
            const unlocked = totalXP >= reward.requiredXP;
            const selected = profile.selectedTitle === reward.title;
            return <View key={reward.id} style={[styles.rewardCard, !unlocked && styles.rewardLocked, selected && styles.rewardSelected]}>
              <Text style={styles.rewardIcon}>{reward.icon}</Text>
              <Text style={styles.rewardTitle}>{reward.title}</Text>
              <Text style={styles.rewardDescription}>{reward.description}</Text>
              {unlocked ? <Pressable disabled={selected} onPress={() => equipTitle(reward.title, reward.icon)} style={[styles.equipButton, selected && styles.equippedButton]}><Text style={styles.equipText}>{selected ? "Equipado" : "Usar título"}</Text></Pressable> : <Text style={styles.lockedText}>🔒 Faltam {reward.requiredXP - totalXP} XP</Text>}
            </View>;
          })}
        </ScrollView>

        <Text style={styles.subsectionTitle}>Medalhas</Text>
        <View style={styles.badgesGrid}>{badges.map((badge) => <View key={badge.id} style={[styles.badgeCard, !badge.unlocked && styles.badgeLocked]}><Text style={styles.badgeIcon}>{badge.unlocked ? badge.icon : "🔒"}</Text><Text style={styles.badgeTitle}>{badge.title}</Text><Text style={styles.badgeDescription}>{badge.description}</Text></View>)}</View>

        <Text style={styles.subsectionTitle}>Temas do perfil</Text>
        <View style={styles.themesRow}>{themeRewards.map((theme) => {
          const unlocked = totalXP >= theme.requiredXP;
          const selected = (profile.selectedTheme ?? "purple") === theme.id;
          return <Pressable key={theme.id} disabled={!unlocked} onPress={() => { updateProfile({ ...profile, selectedTheme: theme.id }); celebrate("🎨", theme.name); }} style={[styles.themeButton, { borderColor: theme.color }, selected && { backgroundColor: theme.color }, !unlocked && styles.themeLocked]}><Text style={styles.themeName}>{unlocked ? theme.name : `🔒 ${theme.requiredXP} XP`}</Text></Pressable>;
        })}</View>

        <Text style={styles.sectionTitle}>Desafios atuais</Text>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{completedChallenges}/{challenges.length} concluídos</Text>
          <Text style={styles.summaryDescription}>Bônus resgatados: {profile.bonusXP} XP • Total: {totalXP} XP</Text>
        </View>

        {challenges.map((challenge) => {
          const complete = challenge.current >= challenge.target;
          const claimed = claimedChallenges.has(challenge.id);
          const progress = Math.min(Math.round((challenge.current / challenge.target) * 100), 100);
          return <View key={challenge.id} style={styles.challengeCard}>
            <View style={styles.row}><Text style={styles.challengeTitle}>{challenge.title}</Text><Text style={styles.xpReward}>+{challenge.rewardXP} XP</Text></View>
            <Text style={styles.description}>{challenge.description}</Text>
            <View style={styles.progressWrapper}><ProgressBar value={progress} color={complete ? "#00E676" : "#7C4DFF"} /></View>
            <Text style={styles.progressText}>{Math.min(challenge.current, challenge.target)}/{challenge.target}</Text>
            {claimed ? <View style={styles.claimedBadge}><Text style={styles.claimedText}>Recompensa resgatada</Text></View> : complete ? <Pressable onPress={() => claimChallenge(challenge.id, challenge.rewardXP)} style={styles.claimButton}><Text style={styles.claimButtonText}>Resgatar +{challenge.rewardXP} XP</Text></Pressable> : <Text style={styles.pendingText}>Continue estudando para desbloquear.</Text>}
          </View>;
        })}
      </ScrollView>
      <Modal visible={Boolean(celebration)} transparent animationType="fade" onRequestClose={() => setCelebration(null)}>
        <Pressable onPress={() => setCelebration(null)} style={styles.celebrationOverlay}><Animated.View style={[styles.celebrationCard, { transform: [{ scale: celebrationScale }] }]}><Text style={styles.celebrationIcon}>{celebration?.icon}</Text><Text style={styles.celebrationLabel}>RECOMPENSA ATIVADA</Text><Text style={styles.celebrationTitle}>{celebration?.title}</Text><Text style={styles.celebrationHint}>Toque para continuar</Text></Animated.View></Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = {
  safeArea: { flex: 1, backgroundColor: "#080810" },
  content: { padding: 20, paddingBottom: 45 },
  title: { color: "white", fontSize: 30, fontWeight: "700" },
  subtitle: { color: "#8888AA", marginTop: 6, marginBottom: 8, lineHeight: 20 },
  sectionTitle: { color: "white", fontSize: 20, fontWeight: "800", marginTop: 24, marginBottom: 8 },
  sectionDescription: { color: "#8888AA", marginBottom: 12 },
  tutorialCard: { backgroundColor: "#18152A", padding: 17, borderRadius: 18, borderWidth: 1, borderColor: "#3B3066" },
  tutorialTitle: { color: "white", fontSize: 18, fontWeight: "800" },
  counter: { color: "#C6B7FF", fontWeight: "800", backgroundColor: "#302653", paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  description: { color: "#AAA", marginTop: 7, lineHeight: 19 },
  progressWrapper: { marginTop: 14 },
  tutorialStep: { flexDirection: "row", marginTop: 18 },
  stepNumber: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#34285F" },
  stepComplete: { backgroundColor: "#176044" },
  stepNumberText: { color: "white", fontWeight: "800" },
  stepBody: { flex: 1, marginLeft: 11 },
  stepTitle: { color: "white", fontWeight: "700" },
  stepDescription: { color: "#9292A8", marginTop: 4, lineHeight: 18 },
  stepAction: { color: "#A98DFF", fontWeight: "700", marginTop: 7 },
  doneText: { color: "#5DD39E", fontWeight: "700", marginTop: 7 },
  streakCard: { backgroundColor: "#211A12", borderWidth: 1, borderColor: "#5D4723", borderRadius: 18, padding: 17 },
  streakHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  streakValue: { color: "#FFD76A", fontSize: 27, fontWeight: "800" },
  streakLabel: { color: "#C9B98B", marginTop: 3 },
  streakMetric: { alignItems: "center", marginLeft: 12 },
  metricValue: { color: "white", fontSize: 21, fontWeight: "800" },
  metricLabel: { color: "#A99D80", fontSize: 10, marginTop: 4, textAlign: "center" },
  weekTitle: { color: "#D8CCAA", fontWeight: "700", marginTop: 20, marginBottom: 10 },
  weekRow: { flexDirection: "row", justifyContent: "space-between" },
  dayColumn: { alignItems: "center" },
  dayCircle: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: "#302A22", borderWidth: 1, borderColor: "transparent" },
  dayActive: { backgroundColor: "#C97816" },
  dayToday: { borderColor: "#FFD76A" },
  dayText: { color: "#8F8777", fontWeight: "800" },
  dayTextActive: { color: "white" },
  streakHint: { color: "#A99D80", marginTop: 13, lineHeight: 18 },
  freezeRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#443723" },
  freezeText: { color: "#D6C796", fontWeight: "700", flex: 1 },
  freezeButton: { backgroundColor: "#745D25", paddingHorizontal: 10, paddingVertical: 8, borderRadius: 9 },
  freezeButtonText: { color: "white", fontWeight: "700", fontSize: 12 },
  calendarCard: { backgroundColor: "#161625", borderRadius: 18, padding: 17, marginTop: 12 },
  calendarTitle: { color: "white", fontSize: 17, fontWeight: "800", textTransform: "capitalize", marginBottom: 13 },
  calendarGrid: { flexDirection: "row", flexWrap: "wrap" },
  calendarWeekLabel: { width: "14.285%", color: "#77778D", textAlign: "center", fontWeight: "700", marginBottom: 8 },
  calendarDay: { width: "14.285%", height: 34, alignItems: "center", justifyContent: "center", borderRadius: 9 },
  calendarDayActive: { backgroundColor: "#6845CE" },
  calendarDayProtected: { backgroundColor: "#745D25" },
  calendarDayText: { color: "#77778D", fontWeight: "600" },
  calendarDayTextActive: { color: "white", fontWeight: "800" },
  calendarLegend: { color: "#77778D", fontSize: 11, marginTop: 12 },
  nextRewardCard: { backgroundColor: "#201B2D", borderRadius: 14, padding: 14, marginBottom: 13 },
  nextRewardTitle: { color: "white", fontWeight: "800", flex: 1 },
  nextRewardXP: { color: "#FFD76A", fontWeight: "700", marginLeft: 10 },
  nextRewardHint: { color: "#A9A1B7", marginTop: 8 },
  rewardsRow: { paddingRight: 8 },
  rewardCard: { backgroundColor: "#1E1935", width: 210, padding: 16, borderRadius: 17, marginRight: 12, borderWidth: 1, borderColor: "#4B3A80" },
  rewardLocked: { opacity: 0.55, borderColor: "#292940" },
  rewardSelected: { borderColor: "#FFD76A", backgroundColor: "#30253B" },
  rewardIcon: { fontSize: 31 },
  rewardTitle: { color: "white", fontSize: 16, fontWeight: "800", marginTop: 10 },
  rewardDescription: { color: "#A5A1B5", marginTop: 6, lineHeight: 18, minHeight: 54 },
  equipButton: { backgroundColor: "#7C4DFF", padding: 10, borderRadius: 10, marginTop: 12 },
  equippedButton: { backgroundColor: "#9A7A22" },
  equipText: { color: "white", fontWeight: "700", textAlign: "center" },
  lockedText: { color: "#B7ADC8", fontWeight: "700", marginTop: 15 },
  subsectionTitle: { color: "white", fontSize: 16, fontWeight: "800", marginTop: 17, marginBottom: 10 },
  badgesGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  badgeCard: { width: "48%", backgroundColor: "#1B1B2D", borderRadius: 14, padding: 13, marginBottom: 10, borderWidth: 1, borderColor: "#41415E" },
  badgeLocked: { opacity: 0.45 },
  badgeIcon: { fontSize: 25 },
  badgeTitle: { color: "white", fontWeight: "800", marginTop: 7 },
  badgeDescription: { color: "#8F8FA5", fontSize: 11, marginTop: 4, lineHeight: 15 },
  themesRow: { flexDirection: "row", flexWrap: "wrap" },
  themeButton: { borderWidth: 2, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginRight: 9, marginBottom: 9, backgroundColor: "#181824" },
  themeLocked: { opacity: 0.4 },
  themeName: { color: "white", fontWeight: "700", fontSize: 12 },
  summaryCard: { backgroundColor: "#342769", padding: 16, borderRadius: 16, marginBottom: 16 },
  summaryTitle: { color: "white", fontSize: 18, fontWeight: "700" },
  summaryDescription: { color: "#D6CFFF", marginTop: 7 },
  challengeCard: { backgroundColor: "#161625", padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)" },
  challengeTitle: { color: "white", fontSize: 17, fontWeight: "700", flex: 1, marginRight: 10 },
  xpReward: { color: "#FFD600", fontWeight: "700" },
  progressText: { color: "#CCC", marginTop: 7, fontWeight: "700" },
  claimButton: { backgroundColor: "#00A864", padding: 12, borderRadius: 10, marginTop: 14 },
  claimButtonText: { color: "white", fontWeight: "700", textAlign: "center" },
  claimedBadge: { backgroundColor: "#123A2C", padding: 12, borderRadius: 10, marginTop: 14 },
  claimedText: { color: "#00E676", fontWeight: "700", textAlign: "center" },
  pendingText: { color: "#8888AA", marginTop: 14 },
  celebrationOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.78)", alignItems: "center", justifyContent: "center", padding: 25 },
  celebrationCard: { width: "100%", maxWidth: 360, backgroundColor: "#241A47", borderRadius: 24, padding: 28, alignItems: "center", borderWidth: 1, borderColor: "#8867ED" },
  celebrationIcon: { fontSize: 58 },
  celebrationLabel: { color: "#B9A8FF", fontSize: 11, fontWeight: "800", letterSpacing: 1.2, marginTop: 15 },
  celebrationTitle: { color: "white", fontSize: 24, fontWeight: "800", textAlign: "center", marginTop: 8 },
  celebrationHint: { color: "#8F86A7", marginTop: 18 },
} as const;
