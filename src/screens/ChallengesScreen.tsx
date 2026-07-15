import { useMemo } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";

import ProgressBar from "../components/ProgressBar";
import { useProfile } from "../contexts/ProfileContext";
import { useSubjects } from "../contexts/SubjectsContext";
import { buildChallenges } from "../services/challenges";

export default function ChallengesScreen() {
  const { subjects } = useSubjects();
  const { profile, claimChallenge } = useProfile();

  // useMemo evita refazer os mesmos cálculos quando somente o estado visual
  // da tela muda. Ele recalcula quando as matérias ou a meta são alteradas.
  const challenges = useMemo(
    () => buildChallenges(subjects, profile.weeklyGoalMinutes),
    [subjects, profile.weeklyGoalMinutes],
  );
  const claimedChallenges = new Set(profile.claimedChallengeIds);
  const completedChallenges = challenges.filter((challenge) => challenge.current >= challenge.target).length;
  const nextChallenge = challenges
    .filter((challenge) => challenge.current < challenge.target)
    .sort((first, second) => (second.current / second.target) - (first.current / first.target))[0];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Desafios</Text>
        <Text style={styles.subtitle}>Pequenas metas para manter o ritmo de estudo.</Text>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{completedChallenges}/{challenges.length} desafios concluídos</Text>
          <Text style={styles.summaryDescription}>Bônus resgatados: {profile.bonusXP} XP</Text>
        </View>

        {nextChallenge ? (
          <View style={styles.highlightCard}>
            <Text style={styles.highlightLabel}>MAIS PRÓXIMO DE CONCLUIR</Text>
            <Text style={styles.highlightTitle}>{nextChallenge.title}</Text>
            <Text style={styles.highlightDescription}>
              Faltam {Math.max(nextChallenge.target - nextChallenge.current, 0)} para desbloquear +{nextChallenge.rewardXP} XP.
            </Text>
          </View>
        ) : null}

        {challenges.map((challenge) => {
          const complete = challenge.current >= challenge.target;
          const claimed = claimedChallenges.has(challenge.id);
          const progress = Math.min(Math.round((challenge.current / challenge.target) * 100), 100);

          return (
            <View key={challenge.id} style={styles.challengeCard}>
              <View style={styles.headerRow}>
                <Text style={styles.challengeTitle}>{challenge.title}</Text>
                <Text style={styles.reward}>+{challenge.rewardXP} XP</Text>
              </View>
              <Text style={styles.description}>{challenge.description}</Text>
              <View style={styles.progressWrapper}>
                <ProgressBar value={progress} color={complete ? "#00E676" : "#7C4DFF"} />
              </View>
              <Text style={styles.progressText}>
                {Math.min(challenge.current, challenge.target)}/{challenge.target}
              </Text>

              {claimed ? (
                <View style={styles.claimedBadge}>
                  <Text style={styles.claimedText}>Recompensa resgatada</Text>
                </View>
              ) : complete ? (
                <Pressable
                  // A tela apenas pede o resgate; o contexto confere novamente
                  // se o id já foi salvo antes de adicionar o XP.
                  onPress={() => claimChallenge(challenge.id, challenge.rewardXP)}
                  style={styles.claimButton}
                >
                  <Text style={styles.claimButtonText}>Resgatar +{challenge.rewardXP} XP</Text>
                </Pressable>
              ) : (
                <Text style={styles.pendingText}>Continue estudando para desbloquear.</Text>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = {
  safeArea: { flex: 1, backgroundColor: "#080810" },
  content: { padding: 20, paddingBottom: 40 },
  title: { color: "white", fontSize: 30, fontWeight: "700" },
  subtitle: { color: "#8888AA", marginTop: 6, marginBottom: 20 },
  summaryCard: { backgroundColor: "#342769", padding: 16, borderRadius: 16, marginBottom: 16 },
  summaryTitle: { color: "white", fontSize: 18, fontWeight: "700" },
  summaryDescription: { color: "#D6CFFF", marginTop: 7 },
  highlightCard: { backgroundColor: "#172A25", borderWidth: 1, borderColor: "#285F4B", padding: 16, borderRadius: 16, marginBottom: 16 },
  highlightLabel: { color: "#77D9AC", fontWeight: "800", fontSize: 11, letterSpacing: 0.5 },
  highlightTitle: { color: "white", fontSize: 18, fontWeight: "700", marginTop: 8 },
  highlightDescription: { color: "#B8D9C9", marginTop: 6, lineHeight: 20 },
  challengeCard: {
    backgroundColor: "#161625",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  challengeTitle: { color: "white", fontSize: 17, fontWeight: "700", flex: 1, marginRight: 10 },
  reward: { color: "#FFD600", fontWeight: "700" },
  description: { color: "#AAA", marginTop: 8 },
  progressWrapper: { marginTop: 14 },
  progressText: { color: "#CCC", marginTop: 7, fontWeight: "700" },
  claimButton: { backgroundColor: "#00A864", padding: 12, borderRadius: 10, marginTop: 14 },
  claimButtonText: { color: "white", fontWeight: "700", textAlign: "center" },
  claimedBadge: { backgroundColor: "#123A2C", padding: 12, borderRadius: 10, marginTop: 14 },
  claimedText: { color: "#00E676", fontWeight: "700", textAlign: "center" },
  pendingText: { color: "#8888AA", marginTop: 14 },
} as const;
