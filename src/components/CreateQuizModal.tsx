import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SubjectQuiz, SubjectQuizQuestion } from "../types/Subject";

type QuestionDraft = Omit<SubjectQuizQuestion, "id"> & { id: string };

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (quiz: SubjectQuiz) => void;
};

function createQuestion(): QuestionDraft {
  return {
    id: `question-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    question: "",
    options: ["", "", "", ""],
    correctOptionIndex: 0,
  };
}

// O criador mantém quatro alternativas por pergunta. Isso torna o quiz fácil
// de responder no celular e evita respostas abertas difíceis de corrigir.
export default function CreateQuizModal({ visible, onClose, onSave }: Props) {
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<QuestionDraft[]>([createQuestion()]);

  useEffect(() => {
    if (!visible) return;
    setTitle("");
    setQuestions([createQuestion()]);
  }, [visible]);

  function updateQuestion(questionId: string, update: Partial<QuestionDraft>) {
    setQuestions((currentQuestions) => currentQuestions.map((item) => (
      item.id === questionId ? { ...item, ...update } : item
    )));
  }

  function updateOption(questionId: string, optionIndex: number, value: string) {
    setQuestions((currentQuestions) => currentQuestions.map((item) => {
      if (item.id !== questionId) return item;

      const options = item.options.map((option, index) => index === optionIndex ? value : option);
      return { ...item, options };
    }));
  }

  function handleSave() {
    if (!title.trim()) {
      Alert.alert("Nome obrigatório", "Dê um título para identificar o quiz.");
      return;
    }

    const invalidQuestion = questions.find((item) => (
      !item.question.trim() || item.options.some((option) => !option.trim())
    ));

    if (invalidQuestion) {
      Alert.alert("Pergunta incompleta", "Preencha o enunciado e as quatro alternativas de cada pergunta.");
      return;
    }

    onSave({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: title.trim(),
      questions: questions.map((item) => ({
        ...item,
        question: item.question.trim(),
        options: item.options.map((option) => option.trim()),
      })),
      createdAt: new Date().toISOString(),
    });
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Criar quiz</Text>
          <Text style={styles.subtitle}>Cada pergunta tem quatro alternativas. Toque na correta para marcá-la.</Text>

          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Título do quiz"
            placeholderTextColor="#666"
            style={styles.input}
          />

          {questions.map((item, questionIndex) => (
            <View key={item.id} style={styles.questionCard}>
              <View style={styles.questionHeader}>
                <Text style={styles.questionTitle}>Pergunta {questionIndex + 1}</Text>
                {questions.length > 1 ? (
                  <Pressable onPress={() => setQuestions((current) => current.filter((question) => question.id !== item.id))}>
                    <Text style={styles.removeText}>Remover</Text>
                  </Pressable>
                ) : null}
              </View>

              <TextInput
                value={item.question}
                onChangeText={(value) => updateQuestion(item.id, { question: value })}
                placeholder="Enunciado da pergunta"
                placeholderTextColor="#666"
                multiline
                textAlignVertical="top"
                style={[styles.input, styles.questionInput]}
              />

              {item.options.map((option, optionIndex) => {
                const isCorrect = item.correctOptionIndex === optionIndex;

                return (
                  <Pressable
                    key={`${item.id}-${optionIndex}`}
                    onPress={() => updateQuestion(item.id, { correctOptionIndex: optionIndex })}
                    style={[styles.option, isCorrect && styles.correctOption]}
                  >
                    <Text style={[styles.optionLetter, isCorrect && styles.correctOptionText]}>
                      {String.fromCharCode(65 + optionIndex)}
                    </Text>
                    <TextInput
                      value={option}
                      onChangeText={(value) => updateOption(item.id, optionIndex, value)}
                      placeholder={`Alternativa ${String.fromCharCode(65 + optionIndex)}`}
                      placeholderTextColor="#777"
                      style={[styles.optionInput, isCorrect && styles.correctOptionText]}
                    />
                  </Pressable>
                );
              })}
            </View>
          ))}

          <Pressable onPress={() => setQuestions((current) => [...current, createQuestion()])} style={styles.addQuestionButton}>
            <Text style={styles.addQuestionText}>+ Adicionar pergunta</Text>
          </Pressable>
          <Pressable onPress={handleSave} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Salvar quiz</Text>
          </Pressable>
          <Pressable onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = {
  safeArea: { flex: 1, backgroundColor: "#080810" },
  content: { padding: 20, paddingBottom: 40 },
  title: { color: "white", fontSize: 25, fontWeight: "700" },
  subtitle: { color: "#AAA", marginTop: 8, lineHeight: 20 },
  input: { backgroundColor: "#161625", color: "white", padding: 14, borderRadius: 12, marginTop: 20 },
  questionCard: { backgroundColor: "#12121F", padding: 14, borderRadius: 14, marginTop: 22 },
  questionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  questionTitle: { color: "white", fontWeight: "700", fontSize: 17 },
  removeText: { color: "#FF808F", fontWeight: "700" },
  questionInput: { height: 95, marginTop: 14 },
  option: { flexDirection: "row", alignItems: "center", borderRadius: 10, backgroundColor: "#20202F", marginTop: 10, paddingLeft: 12 },
  correctOption: { backgroundColor: "#1A513B", borderWidth: 1, borderColor: "#00B86B" },
  optionLetter: { color: "#AAA", fontWeight: "800", width: 23 },
  optionInput: { flex: 1, color: "white", paddingVertical: 12, paddingRight: 10 },
  correctOptionText: { color: "#D7FFE8" },
  addQuestionButton: { borderWidth: 1, borderColor: "#7C4DFF", padding: 14, borderRadius: 12, marginTop: 22 },
  addQuestionText: { color: "#C5B5FF", textAlign: "center", fontWeight: "700" },
  saveButton: { backgroundColor: "#00B86B", padding: 15, borderRadius: 12, marginTop: 16 },
  saveButtonText: { color: "white", textAlign: "center", fontWeight: "700" },
  cancelButton: { padding: 15, marginTop: 8 },
  cancelText: { color: "#888", textAlign: "center" },
} as const;
