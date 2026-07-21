import { useEffect, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Subject, SubjectEvent } from "../types/Subject";

type EventType = SubjectEvent["type"];

type Props = {
  visible: boolean;
  subjects: Subject[];
  initialDate?: string;
  onClose: () => void;
  onSave: (subjectId: string, event: SubjectEvent) => void;
};

const typeLabels: Record<EventType, string> = {
  exam: "Prova",
  assignment: "Trabalho",
  review: "Revisão",
};

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

// Este formulário existe na Agenda para que uma atividade possa ser criada
// sem abrir uma matéria. A pessoa escolhe o destino antes de salvar.
export default function QuickAddActivityModal({ visible, subjects, initialDate, onClose, onSave }: Props) {
  const [subjectId, setSubjectId] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState<EventType>("assignment");

  useEffect(() => {
    if (!visible) return;
    setSubjectId(subjects[0]?.id ?? "");
    setTitle("");
    setDate(initialDate ?? "");
    setType("assignment");
  }, [visible, subjects, initialDate]);

  function handleSave() {
    if (!subjectId) {
      Alert.alert("Escolha uma matéria", "Crie ou selecione uma matéria para adicionar a atividade.");
      return;
    }
    if (!title.trim()) {
      Alert.alert("Nome obrigatório", "Dê um nome para a atividade.");
      return;
    }
    if (!isValidDate(date)) {
      Alert.alert("Data inválida", "Use o formato AAAA-MM-DD, por exemplo 2026-08-15.");
      return;
    }

    onSave(subjectId, { id: `${Date.now()}-${type}`, title: title.trim(), date, type });
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Nova atividade</Text>
          <Text style={styles.subtitle}>Escolha a matéria e acompanhe o prazo pela Agenda.</Text>

          <Text style={styles.label}>Matéria</Text>
          <View style={styles.subjectChoices}>
            {subjects.map((subject) => {
              const active = subject.id === subjectId;
              return (
                <Pressable key={subject.id} onPress={() => setSubjectId(subject.id)} style={[styles.subjectButton, active && { borderColor: subject.color, backgroundColor: "#242137" }]}>
                  <View style={[styles.colorDot, { backgroundColor: subject.color }]} />
                  <Text style={styles.subjectText}>{subject.name}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>Atividade</Text>
          <TextInput value={title} onChangeText={setTitle} placeholder="Ex.: Entregar trabalho" placeholderTextColor="#77778E" style={styles.input} />

          <Text style={styles.label}>Data</Text>
          <TextInput value={date} onChangeText={setDate} placeholder="AAAA-MM-DD" placeholderTextColor="#77778E" keyboardType="numbers-and-punctuation" maxLength={10} style={styles.input} />

          <Text style={styles.label}>Tipo</Text>
          <View style={styles.typeChoices}>
            {(Object.keys(typeLabels) as EventType[]).map((eventType) => (
              <Pressable key={eventType} onPress={() => setType(eventType)} style={[styles.typeButton, type === eventType && styles.typeButtonActive]}>
                <Text style={styles.typeText}>{typeLabels[eventType]}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable onPress={handleSave} style={styles.saveButton}><Text style={styles.saveText}>Salvar atividade</Text></Pressable>
          <Pressable onPress={onClose} style={styles.cancelButton}><Text style={styles.cancelText}>Cancelar</Text></Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = {
  safeArea: { flex: 1, backgroundColor: "#080810" },
  content: { padding: 20, paddingBottom: 40 },
  title: { color: "white", fontSize: 27, fontWeight: "700" },
  subtitle: { color: "#AAA", marginTop: 7, lineHeight: 20 },
  label: { color: "#CCC", fontWeight: "700", marginTop: 24, marginBottom: 9 },
  subjectChoices: { flexDirection: "row", flexWrap: "wrap" },
  subjectButton: { flexDirection: "row", alignItems: "center", backgroundColor: "#161625", borderWidth: 1, borderColor: "transparent", borderRadius: 10, paddingVertical: 10, paddingHorizontal: 11, marginRight: 8, marginBottom: 8 },
  colorDot: { width: 9, height: 9, borderRadius: 5, marginRight: 7 },
  subjectText: { color: "white", fontWeight: "700", fontSize: 13 },
  input: { backgroundColor: "#161625", color: "white", borderRadius: 12, padding: 14 },
  typeChoices: { flexDirection: "row", flexWrap: "wrap" },
  typeButton: { backgroundColor: "#161625", borderRadius: 10, paddingVertical: 10, paddingHorizontal: 13, marginRight: 8, marginBottom: 8 },
  typeButtonActive: { backgroundColor: "#7C4DFF" },
  typeText: { color: "white", fontWeight: "700" },
  saveButton: { backgroundColor: "#7C4DFF", borderRadius: 12, padding: 15, marginTop: 28 },
  saveText: { color: "white", textAlign: "center", fontWeight: "700" },
  cancelButton: { padding: 15, marginTop: 8 },
  cancelText: { color: "#888", textAlign: "center" },
} as const;
