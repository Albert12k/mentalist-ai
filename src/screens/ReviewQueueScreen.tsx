import { useState } from "react";
import { Pressable, SafeAreaView, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { useSubjects } from "../contexts/SubjectsContext";
import { FlashcardReviewRating, getDueFlashcards, reviewFlashcard } from "../services/flashcardReview";
import { Subject, SubjectFlashcard } from "../types/Subject";

type ReviewItem = { subject: Subject; flashcard: SubjectFlashcard };

export default function ReviewQueueScreen() {
  const navigation = useNavigation<any>();
  const { subjects, updateSubject } = useSubjects();
  const [revealed, setRevealed] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);

  // A fila é calculada a partir dos dados atuais. Depois da resposta, a carta
  // recebe uma nova data de revisão e sai automaticamente da lista pendente.
  const dueCards: ReviewItem[] = subjects.flatMap((subject) => (
    getDueFlashcards(subject.flashcards).map((flashcard) => ({ subject, flashcard }))
  ));
  const current = dueCards[0];

  function handleReview(rating: FlashcardReviewRating) {
    if (!current) return;

    updateSubject({
      ...current.subject,
      flashcards: current.subject.flashcards.map((flashcard) => (
        flashcard.id === current.flashcard.id ? reviewFlashcard(flashcard, rating) : flashcard
      )),
    });
    setReviewedCount((count) => count + 1);
    setRevealed(false);
  }

  const hasFinished = reviewedCount > 0 && !current;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.back}>Voltar</Text>
        </Pressable>

        <Text style={styles.title}>Revisões de hoje</Text>
        <Text style={styles.subtitle}>
          {current ? `${dueCards.length} flashcard(s) aguardando revisão.` : "Nenhum flashcard pendente agora."}
        </Text>

        {current ? (
          <>
            <View style={[styles.subjectBadge, { borderColor: current.subject.color }]}>
              <Text style={styles.subjectBadgeText}>{current.subject.name}</Text>
            </View>
            <Pressable onPress={() => setRevealed((value) => !value)} style={styles.card}>
              <Text style={styles.cardLabel}>{revealed ? "Resposta" : "Pergunta"}</Text>
              <Text style={styles.cardText}>{revealed ? current.flashcard.answer : current.flashcard.question}</Text>
              <Text style={styles.flipHint}>Toque no cartão para {revealed ? "ver a pergunta" : "revelar a resposta"}</Text>
            </Pressable>

            {revealed ? (
              <View style={styles.ratingRow}>
                <RatingButton label="Não lembrei" color="#B00020" onPress={() => handleReview("again")} />
                <RatingButton label="Difícil" color="#B35C00" onPress={() => handleReview("hard")} />
                <RatingButton label="Lembrei" color="#007D4A" onPress={() => handleReview("easy")} />
              </View>
            ) : null}
          </>
        ) : (
          <View style={styles.finishedCard}>
            <Text style={styles.finishedTitle}>{hasFinished ? "Revisão concluída!" : "Tudo em dia"}</Text>
            <Text style={styles.finishedText}>
              {hasFinished
                ? `Você revisou ${reviewedCount} flashcard(s). As próximas datas já foram organizadas.`
                : "Crie flashcards dentro de uma matéria para começar a usar revisões espaçadas."}
            </Text>
            <Pressable onPress={() => navigation.goBack()} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Voltar ao início</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

function RatingButton({ label, color, onPress }: { label: string; color: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.ratingButton, { backgroundColor: color }]}>
      <Text style={styles.ratingButtonText}>{label}</Text>
    </Pressable>
  );
}

const styles = {
  safeArea: { flex: 1, backgroundColor: "#080810" },
  content: { flex: 1, padding: 20 },
  back: { color: "#7C4DFF", fontSize: 16, fontWeight: "700" },
  title: { color: "white", fontSize: 28, fontWeight: "700", marginTop: 20 },
  subtitle: { color: "#AAA", marginTop: 7, lineHeight: 20 },
  subjectBadge: { alignSelf: "flex-start", borderWidth: 1, borderRadius: 16, paddingHorizontal: 11, paddingVertical: 6, marginTop: 22 },
  subjectBadgeText: { color: "#DDD", fontWeight: "700", fontSize: 12 },
  card: { flex: 1, maxHeight: 390, justifyContent: "center", alignItems: "center", padding: 28, marginTop: 14, borderRadius: 20, backgroundColor: "#1B1930", borderWidth: 1, borderColor: "#5846AA" },
  cardLabel: { color: "#C5B5FF", textTransform: "uppercase", fontSize: 12, fontWeight: "800" },
  cardText: { color: "white", fontSize: 22, fontWeight: "700", textAlign: "center", lineHeight: 30, marginTop: 18 },
  flipHint: { color: "#999", textAlign: "center", marginTop: 24 },
  ratingRow: { flexDirection: "row", marginTop: 22 },
  ratingButton: { flex: 1, paddingVertical: 13, paddingHorizontal: 7, borderRadius: 10, marginRight: 7 },
  ratingButtonText: { color: "white", textAlign: "center", fontWeight: "700", fontSize: 12 },
  finishedCard: { backgroundColor: "#161625", borderRadius: 18, padding: 22, marginTop: 28 },
  finishedTitle: { color: "#00E676", fontSize: 23, fontWeight: "700" },
  finishedText: { color: "#AAA", lineHeight: 21, marginTop: 10 },
  primaryButton: { backgroundColor: "#7C4DFF", padding: 14, borderRadius: 12, marginTop: 20 },
  primaryButtonText: { color: "white", fontWeight: "700", textAlign: "center" },
} as const;
