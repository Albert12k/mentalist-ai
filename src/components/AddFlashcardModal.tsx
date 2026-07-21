import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  Text,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SubjectFlashcard } from "../types/Subject";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (flashcard: SubjectFlashcard) => void;
};

// Um flashcard mantém apenas a pergunta e a resposta para deixar a criação
// rápida e incentivar revisões curtas durante os estudos.
export default function AddFlashcardModal({ visible, onClose, onSave }: Props) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  useEffect(() => {
    if (!visible) return;
    setQuestion("");
    setAnswer("");
  }, [visible]);

  function handleSave() {
    if (!question.trim() || !answer.trim()) {
      Alert.alert("Preencha os dois lados", "Informe a pergunta e a resposta do flashcard.");
      return;
    }

    onSave({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      question: question.trim(),
      answer: answer.trim(),
      createdAt: new Date().toISOString(),
      reviewCount: 0,
      nextReviewAt: new Date().toISOString(),
    });
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.title}>Novo flashcard</Text>
        <Text style={styles.subtitle}>Crie uma pergunta curta para revisar depois.</Text>

        <TextInput
          value={question}
          onChangeText={setQuestion}
          placeholder="Frente: pergunta ou conceito"
          placeholderTextColor="#666"
          multiline
          textAlignVertical="top"
          style={[styles.input, styles.largeInput]}
        />
        <TextInput
          value={answer}
          onChangeText={setAnswer}
          placeholder="Verso: resposta ou explicação"
          placeholderTextColor="#666"
          multiline
          textAlignVertical="top"
          style={[styles.input, styles.largeInput]}
        />

        <Pressable onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Salvar flashcard</Text>
        </Pressable>
        <Pressable onPress={onClose} style={styles.cancelButton}>
          <Text style={styles.cancelText}>Cancelar</Text>
        </Pressable>
      </SafeAreaView>
    </Modal>
  );
}

const styles = {
  safeArea: { flex: 1, backgroundColor: "#080810", padding: 20 },
  title: { color: "white", fontSize: 25, fontWeight: "700" },
  subtitle: { color: "#AAA", marginTop: 8 },
  input: { backgroundColor: "#161625", color: "white", padding: 14, borderRadius: 12, marginTop: 18 },
  largeInput: { height: 135 },
  saveButton: { backgroundColor: "#7C4DFF", padding: 15, borderRadius: 12, marginTop: 25 },
  saveButtonText: { color: "white", textAlign: "center", fontWeight: "700" },
  cancelButton: { padding: 15, marginTop: 8 },
  cancelText: { color: "#888", textAlign: "center" },
} as const;
