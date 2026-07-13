import { useState } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { useSubjects } from "../contexts/SubjectsContext";
import { buildTutorResponse, TutorMessage } from "../services/tutor";

const suggestedQuestions = [
  "O que devo estudar hoje?",
  "Quais são meus próximos prazos?",
  "Como está meu progresso?",
  "Como posso revisar melhor?",
];

export default function TutorScreen() {
  const navigation = useNavigation<any>();
  const { subjects } = useSubjects();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<TutorMessage[]>([
    {
      id: "welcome",
      author: "tutor",
      text: "Olá! Sou seu tutor de estudo. Posso usar suas matérias, sessões e prazos para orientar seu próximo passo.",
    },
  ]);

  function sendMessage(question: string) {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) return;

    const studentMessage: TutorMessage = {
      id: `student-${Date.now()}`,
      author: "student",
      text: trimmedQuestion,
    };
    const tutorMessage: TutorMessage = {
      id: `tutor-${Date.now()}`,
      author: "tutor",
      // A tela chama o serviço em vez de conter regras de estudo dentro do
      // componente. Isso deixa a interface independente da lógica do tutor.
      text: buildTutorResponse(trimmedQuestion, subjects),
    };

    setMessages((currentMessages) => [...currentMessages, studentMessage, tutorMessage]);
    setInput("");
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.back}>Voltar</Text>
        </Pressable>
        <Text style={styles.title}>Tutor de estudo</Text>
        <Text style={styles.subtitle}>Orientação offline baseada no seu progresso.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.messagesContent} showsVerticalScrollIndicator={false}>
        {messages.map((message) => (
          <View
            key={message.id}
            style={message.author === "student" ? styles.studentMessage : styles.tutorMessage}
          >
            <Text style={message.author === "student" ? styles.studentText : styles.tutorText}>
              {message.text}
            </Text>
          </View>
        ))}

        <Text style={styles.suggestionsTitle}>Perguntas sugeridas</Text>
        <View style={styles.suggestions}>
          {suggestedQuestions.map((question) => (
            <Pressable key={question} onPress={() => sendMessage(question)} style={styles.suggestionButton}>
              <Text style={styles.suggestionText}>{question}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View style={styles.composer}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Escreva sua pergunta"
          placeholderTextColor="#666"
          multiline
          style={styles.input}
        />
        <Pressable onPress={() => sendMessage(input)} style={styles.sendButton}>
          <Text style={styles.sendButtonText}>Enviar</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = {
  safeArea: { flex: 1, backgroundColor: "#080810" },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: "#1A1A2E" },
  back: { color: "#7C4DFF" },
  title: { color: "white", fontSize: 25, fontWeight: "700", marginTop: 14 },
  subtitle: { color: "#8888AA", marginTop: 5 },
  messagesContent: { padding: 16, paddingBottom: 24 },
  tutorMessage: { alignSelf: "flex-start", backgroundColor: "#161625", borderRadius: 14, padding: 12, maxWidth: "88%", marginBottom: 10 },
  studentMessage: { alignSelf: "flex-end", backgroundColor: "#563BB0", borderRadius: 14, padding: 12, maxWidth: "88%", marginBottom: 10 },
  tutorText: { color: "#E8E8F2", lineHeight: 20 },
  studentText: { color: "white", lineHeight: 20 },
  suggestionsTitle: { color: "#AAA", fontWeight: "700", marginTop: 14, marginBottom: 8 },
  suggestions: { flexDirection: "row", flexWrap: "wrap" },
  suggestionButton: { backgroundColor: "#263238", borderRadius: 10, paddingVertical: 9, paddingHorizontal: 11, marginRight: 8, marginBottom: 8 },
  suggestionText: { color: "#DDD", fontSize: 12 },
  composer: { flexDirection: "row", padding: 12, backgroundColor: "#0D0D16", borderTopWidth: 1, borderTopColor: "#1A1A2E", alignItems: "flex-end" },
  input: { flex: 1, backgroundColor: "#161625", color: "white", padding: 11, borderRadius: 12, maxHeight: 100, textAlignVertical: "top" },
  sendButton: { backgroundColor: "#7C4DFF", paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, marginLeft: 8 },
  sendButtonText: { color: "white", fontWeight: "700" },
} as const;
