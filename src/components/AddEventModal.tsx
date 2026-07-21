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

import { SubjectEvent } from "../types/Subject";

type EventType = SubjectEvent["type"];

type Props = {
  visible: boolean;
  event?: SubjectEvent | null;
  onClose: () => void;
  onSubmit: (event: SubjectEvent) => void;
};

const eventTypeLabels: Record<EventType, string> = {
  exam: "Prova",
  assignment: "Trabalho",
  review: "Revisão",
};

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export default function AddEventModal({ visible, event, onClose, onSubmit }: Props) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState<EventType>("exam");
  const isEditing = Boolean(event);

  useEffect(() => {
    if (!visible) return;

    setTitle(event?.title ?? "");
    setDate(event?.date ?? "");
    setType(event?.type ?? "exam");
  }, [visible, event]);

  function handleSubmit() {
    if (!title.trim()) {
      Alert.alert("Nome obrigatório", "Dê um nome para esta data importante.");
      return;
    }

    if (!isValidDate(date)) {
      Alert.alert("Data inválida", "Use o formato AAAA-MM-DD, por exemplo 2026-08-15.");
      return;
    }

    onSubmit({
      id: event?.id ?? `${Date.now()}-${type}`,
      title: title.trim(),
      date,
      type,
    });
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#080810" }}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          <Text style={{ color: "white", fontSize: 26, fontWeight: "700" }}>
            {isEditing ? "Editar data importante" : "Nova data importante"}
          </Text>

          <Text style={labelStyle}>Nome</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Ex.: Prova de Cálculo"
            placeholderTextColor="#666"
            style={inputStyle}
          />

          <Text style={labelStyle}>Data</Text>
          <TextInput
            value={date}
            onChangeText={setDate}
            placeholder="AAAA-MM-DD"
            placeholderTextColor="#666"
            keyboardType="numbers-and-punctuation"
            maxLength={10}
            style={inputStyle}
          />

          <Text style={labelStyle}>Tipo</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {(Object.keys(eventTypeLabels) as EventType[]).map((eventType) => {
              const selected = eventType === type;

              return (
                <Pressable
                  key={eventType}
                  onPress={() => setType(eventType)}
                  style={{
                    backgroundColor: selected ? "#7C4DFF" : "#161625",
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    borderRadius: 10,
                    marginRight: 8,
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ color: "white" }}>{eventTypeLabels[eventType]}</Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable onPress={handleSubmit} style={saveButtonStyle}>
            <Text style={saveButtonTextStyle}>{isEditing ? "Salvar alterações" : "Salvar data"}</Text>
          </Pressable>
          <Pressable onPress={onClose} style={{ padding: 15, marginTop: 8 }}>
            <Text style={{ color: "#888", textAlign: "center" }}>Cancelar</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const labelStyle = {
  color: "#BBB",
  marginTop: 20,
  marginBottom: 8,
} as const;

const inputStyle = {
  backgroundColor: "#161625",
  color: "white",
  padding: 14,
  borderRadius: 12,
} as const;

const saveButtonStyle = {
  backgroundColor: "#7C4DFF",
  padding: 15,
  borderRadius: 12,
  marginTop: 28,
} as const;

const saveButtonTextStyle = {
  color: "white",
  textAlign: "center",
  fontWeight: "700",
} as const;
