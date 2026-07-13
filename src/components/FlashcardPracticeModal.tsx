import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  SafeAreaView,
  Text,
  View,
} from "react-native";

import { SubjectFlashcard } from "../types/Subject";
import { FlashcardReviewRating } from "../services/flashcardReview";

type Props = {
  visible: boolean;
  flashcards: SubjectFlashcard[];
  onClose: () => void;
  onReviewed: (flashcard: SubjectFlashcard, rating: FlashcardReviewRating) => void;
};

// A prática revela uma carta por vez. Ao avançar, avisamos a tela da matéria
// para atualizar quantas vezes aquela pergunta já foi revisada.
export default function FlashcardPracticeModal({ visible, flashcards, onClose, onReviewed }: Props) {
  const [position, setPosition] = useState(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setPosition(0);
    setRevealed(false);
  }, [visible]);

  const current = flashcards[position];
  const finished = position >= flashcards.length;

  function handleReview(rating: FlashcardReviewRating) {
    if (!current) return;

    onReviewed(current, rating);
    setPosition((currentPosition) => currentPosition + 1);
    setRevealed(false);
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Text style={styles.title}>Revisar flashcards</Text>

          {finished ? (
            <View style={styles.finishedArea}>
              <Text style={styles.finishedTitle}>Revisão concluída!</Text>
              <Text style={styles.subtitle}>Você revisou {flashcards.length} flashcard(s) desta matéria.</Text>
              <Pressable onPress={onClose} style={styles.primaryButton}>
                <Text style={styles.buttonText}>Voltar à matéria</Text>
              </Pressable>
            </View>
          ) : current ? (
            <>
              <Text style={styles.progress}>Carta {position + 1} de {flashcards.length}</Text>
              <Pressable onPress={() => setRevealed((isRevealed) => !isRevealed)} style={styles.card}>
                <Text style={styles.cardLabel}>{revealed ? "Resposta" : "Pergunta"}</Text>
                <Text style={styles.cardText}>{revealed ? current.answer : current.question}</Text>
                <Text style={styles.flipHint}>Toque para {revealed ? "ver a pergunta" : "revelar a resposta"}</Text>
              </Pressable>

              {revealed ? (
                <View style={styles.ratingRow}>
                  <RatingButton label="Não lembrei" color="#B00020" onPress={() => handleReview("again")} />
                  <RatingButton label="Difícil" color="#B35C00" onPress={() => handleReview("hard")} />
                  <RatingButton label="Lembrei" color="#007D4A" onPress={() => handleReview("easy")} />
                </View>
              ) : null}
            </>
          ) : null}

          {!finished ? (
            <Pressable onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Encerrar revisão</Text>
            </Pressable>
          ) : null}
        </View>
      </SafeAreaView>
    </Modal>
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
  title: { color: "white", fontSize: 25, fontWeight: "700" },
  progress: { color: "#C5B5FF", marginTop: 20, fontWeight: "700" },
  card: {
    flex: 1,
    maxHeight: 380,
    justifyContent: "center",
    alignItems: "center",
    padding: 28,
    marginTop: 20,
    borderRadius: 20,
    backgroundColor: "#1B1930",
    borderWidth: 1,
    borderColor: "#5846AA",
  },
  cardLabel: { color: "#C5B5FF", textTransform: "uppercase", fontSize: 12, fontWeight: "800" },
  cardText: { color: "white", fontSize: 22, fontWeight: "700", textAlign: "center", lineHeight: 30, marginTop: 18 },
  flipHint: { color: "#999", textAlign: "center", marginTop: 24 },
  primaryButton: { backgroundColor: "#7C4DFF", padding: 16, borderRadius: 12, marginTop: 22 },
  buttonText: { color: "white", fontWeight: "700", textAlign: "center" },
  ratingRow: { flexDirection: "row", marginTop: 22 },
  ratingButton: { flex: 1, paddingVertical: 13, paddingHorizontal: 7, borderRadius: 10, marginRight: 7 },
  ratingButtonText: { color: "white", textAlign: "center", fontWeight: "700", fontSize: 12 },
  cancelButton: { padding: 15, marginTop: 7 },
  cancelText: { color: "#888", textAlign: "center" },
  finishedArea: { flex: 1, justifyContent: "center" },
  finishedTitle: { color: "#00E676", fontSize: 27, fontWeight: "700" },
  subtitle: { color: "#AAA", marginTop: 10, lineHeight: 21 },
} as const;
