import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import ColorPicker from "./ColorPicker";
import {
  Subject,
  SubjectDifficulty,
  StudyFrequency,
  StudyGoal,
} from "../types/Subject";

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreate: (subject: Subject) => void;
};

type OptionButtonProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

function OptionButton({ label, active, onPress }: OptionButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: active ? "#7C4DFF" : "#161625",
        padding: 10,
        borderRadius: 10,
        marginRight: 8,
        marginBottom: 8,
      }}
    >
      <Text style={{ color: "white" }}>{label}</Text>
    </Pressable>
  );
}

export default function CreateSubjectModal({ visible, onClose, onCreate }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState("#7C4DFF");
  const [difficulty, setDifficulty] = useState<SubjectDifficulty>("medium");
  const [goal, setGoal] = useState<StudyGoal>("personal");
  const [frequency, setFrequency] = useState<StudyFrequency>("daily");

  function resetForm() {
    setName("");
    setDescription("");
    setSelectedColor("#7C4DFF");
    setDifficulty("medium");
    setGoal("personal");
    setFrequency("daily");
  }

  useEffect(() => {
    if (!visible) resetForm();
  }, [visible]);

  function handleCreate() {
    if (!name.trim()) {
      Alert.alert("Nome obrigatório", "Informe o nome da matéria.");
      return;
    }

    const subject: Subject = {
      id: String(Date.now()),
      name: name.trim(),
      description: description.trim(),
      color: selectedColor,
      difficulty,
      goal,
      frequency,
      retention: 0,
      absences: 0,
      contents: [],
      materials: [],
      flashcards: [],
      quizzes: [],
      events: [],
      notes: "",
      studyHistory: [],
      createdAt: new Date().toISOString(),
    };

    onCreate(subject);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#080810" }}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          <Text style={{ color: "white", fontSize: 26, fontWeight: "700" }}>
            Criar matéria
          </Text>

          <TextInput
            placeholder="Nome da matéria"
            placeholderTextColor="#666"
            value={name}
            onChangeText={setName}
            style={inputStyle}
          />
          <TextInput
            placeholder="Descrição da matéria"
            placeholderTextColor="#666"
            value={description}
            onChangeText={setDescription}
            multiline
            style={[inputStyle, { height: 84, textAlignVertical: "top" }]}
          />

          <Text style={labelStyle}>Cor da matéria</Text>
          <ColorPicker selected={selectedColor} onSelect={setSelectedColor} />

          <Text style={labelStyle}>Dificuldade</Text>
          <View style={optionRowStyle}>
            <OptionButton label="Fácil" active={difficulty === "easy"} onPress={() => setDifficulty("easy")} />
            <OptionButton label="Médio" active={difficulty === "medium"} onPress={() => setDifficulty("medium")} />
            <OptionButton label="Difícil" active={difficulty === "hard"} onPress={() => setDifficulty("hard")} />
          </View>

          <Text style={labelStyle}>Objetivo</Text>
          <View style={[optionRowStyle, { flexWrap: "wrap" }]}>
            <OptionButton label="Prova" active={goal === "exam"} onPress={() => setGoal("exam")} />
            <OptionButton label="Faculdade" active={goal === "college"} onPress={() => setGoal("college")} />
            <OptionButton label="Concurso" active={goal === "contest"} onPress={() => setGoal("contest")} />
            <OptionButton label="Carreira" active={goal === "career"} onPress={() => setGoal("career")} />
            <OptionButton label="Pessoal" active={goal === "personal"} onPress={() => setGoal("personal")} />
          </View>

          <Text style={labelStyle}>Frequência</Text>
          <View style={optionRowStyle}>
            <OptionButton label="Diário" active={frequency === "daily"} onPress={() => setFrequency("daily")} />
            <OptionButton label="3x semana" active={frequency === "three_times"} onPress={() => setFrequency("three_times")} />
            <OptionButton label="Fim de semana" active={frequency === "weekend"} onPress={() => setFrequency("weekend")} />
          </View>

          <Pressable onPress={handleCreate} style={saveButtonStyle}>
            <Text style={saveButtonTextStyle}>Criar matéria</Text>
          </Pressable>
          <Pressable onPress={onClose} style={{ padding: 15, marginTop: 8 }}>
            <Text style={{ color: "#888", textAlign: "center" }}>Cancelar</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const inputStyle = {
  backgroundColor: "#161625",
  color: "white",
  padding: 12,
  borderRadius: 10,
  marginTop: 14,
} as const;

const labelStyle = {
  color: "#BBB",
  marginTop: 24,
  marginBottom: 8,
} as const;

const optionRowStyle = {
  flexDirection: "row",
} as const;

const saveButtonStyle = {
  backgroundColor: "#00B86B",
  padding: 15,
  borderRadius: 12,
  marginTop: 30,
} as const;

const saveButtonTextStyle = {
  color: "white",
  textAlign: "center",
  fontWeight: "700",
} as const;
