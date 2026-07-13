import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  Text,
  View,
} from "react-native";

import { SubjectQuiz } from "../types/Subject";

type Props = {
  visible: boolean;
  quiz: SubjectQuiz | null;
  onClose: () => void;
  onFinish: (quiz: SubjectQuiz, correctAnswers: number) => void;
};

// O resolvedor guarda apenas o índice escolhido para cada pergunta. Quando a
// última resposta é enviada, ele calcula o resultado e devolve à matéria.
export default function QuizPlayerModal({ visible, quiz, onClose, onFinish }: Props) {
  const [position, setPosition] = useState(0);
  const [answers, setAnswers] = useState<Array<number | undefined>>([]);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!visible || !quiz) return;
    setPosition(0);
    setAnswers(Array(quiz.questions.length).fill(undefined));
    setFinished(false);
  }, [visible, quiz?.id]);

  if (!quiz) return null;

  // Esta referência não nula também pode ser usada com segurança nos callbacks.
  const activeQuiz = quiz;
  const currentQuestion = activeQuiz.questions[position];
  const correctAnswers = activeQuiz.questions.reduce((total, question, index) => (
    answers[index] === question.correctOptionIndex ? total + 1 : total
  ), 0);
  const percentage = activeQuiz.questions.length
    ? Math.round((correctAnswers / activeQuiz.questions.length) * 100)
    : 0;

  function goForward() {
    if (answers[position] === undefined) {
      Alert.alert("Escolha uma alternativa", "Selecione a resposta que considera correta para continuar.");
      return;
    }

    if (position + 1 < activeQuiz.questions.length) {
      setPosition((currentPosition) => currentPosition + 1);
      return;
    }

    onFinish(activeQuiz, correctAnswers);
    setFinished(true);
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {finished ? (
            <View style={styles.resultArea}>
              <Text style={styles.resultTitle}>Quiz concluído!</Text>
              <Text style={styles.score}>{percentage}%</Text>
              <Text style={styles.subtitle}>
                Você acertou {correctAnswers} de {quiz.questions.length} pergunta(s).
              </Text>
              <Pressable onPress={onClose} style={styles.primaryButton}>
                <Text style={styles.buttonText}>Voltar à matéria</Text>
              </Pressable>
            </View>
          ) : currentQuestion ? (
            <>
              <Text style={styles.title}>{quiz.title}</Text>
              <Text style={styles.progress}>Pergunta {position + 1} de {quiz.questions.length}</Text>
              <Text style={styles.question}>{currentQuestion.question}</Text>

              <View style={styles.options}>
                {currentQuestion.options.map((option, optionIndex) => {
                  const selected = answers[position] === optionIndex;

                  return (
                    <Pressable
                      key={`${currentQuestion.id}-${optionIndex}`}
                      onPress={() => setAnswers((currentAnswers) => currentAnswers.map((answer, index) => (
                        index === position ? optionIndex : answer
                      )))}
                      style={[styles.option, selected && styles.selectedOption]}
                    >
                      <Text style={[styles.optionLetter, selected && styles.selectedOptionText]}>
                        {String.fromCharCode(65 + optionIndex)}
                      </Text>
                      <Text style={[styles.optionText, selected && styles.selectedOptionText]}>{option}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable onPress={goForward} style={styles.primaryButton}>
                <Text style={styles.buttonText}>
                  {position + 1 === quiz.questions.length ? "Finalizar quiz" : "Próxima pergunta"}
                </Text>
              </Pressable>
              <Pressable onPress={onClose} style={styles.cancelButton}>
                <Text style={styles.cancelText}>Encerrar quiz</Text>
              </Pressable>
            </>
          ) : null}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = {
  safeArea: { flex: 1, backgroundColor: "#080810" },
  content: { flex: 1, padding: 20 },
  title: { color: "white", fontSize: 24, fontWeight: "700" },
  progress: { color: "#C5B5FF", marginTop: 18, fontWeight: "700" },
  question: { color: "white", fontSize: 21, fontWeight: "600", lineHeight: 29, marginTop: 18 },
  options: { marginTop: 25 },
  option: { flexDirection: "row", alignItems: "center", padding: 15, borderRadius: 12, backgroundColor: "#161625", marginBottom: 10 },
  selectedOption: { backgroundColor: "#4D3592", borderWidth: 1, borderColor: "#A990FF" },
  optionLetter: { color: "#BBB", fontWeight: "800", marginRight: 12 },
  optionText: { flex: 1, color: "white", lineHeight: 21 },
  selectedOptionText: { color: "white" },
  primaryButton: { backgroundColor: "#7C4DFF", padding: 16, borderRadius: 12, marginTop: 16 },
  buttonText: { color: "white", textAlign: "center", fontWeight: "700" },
  cancelButton: { padding: 15, marginTop: 7 },
  cancelText: { color: "#888", textAlign: "center" },
  resultArea: { flex: 1, justifyContent: "center", alignItems: "center" },
  resultTitle: { color: "#00E676", fontSize: 27, fontWeight: "700" },
  score: { color: "white", fontSize: 56, fontWeight: "800", marginTop: 14 },
  subtitle: { color: "#AAA", textAlign: "center", marginTop: 8, lineHeight: 21 },
} as const;
