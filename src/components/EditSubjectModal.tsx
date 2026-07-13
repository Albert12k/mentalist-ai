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
import { Subject, SubjectDifficulty, StudyFrequency, StudyGoal } from "../types/Subject";

type Props = {
  visible: boolean;
  onClose: () => void;
  subject: Subject;
  onSave: (subject: Subject) => void;
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

export default function EditSubjectModal({ visible, onClose, subject, onSave }: Props) {
  const [name, setName] = useState(subject.name);
  const [description, setDescription] = useState(subject.description ?? "");
  const [selectedColor, setSelectedColor] = useState(subject.color);
  const [difficulty, setDifficulty] = useState<SubjectDifficulty>(subject.difficulty);
  const [goal, setGoal] = useState<StudyGoal>(subject.goal);
  const [frequency, setFrequency] = useState<StudyFrequency>(subject.frequency);

  useEffect(() => {
    setName(subject.name);
    setDescription(subject.description ?? "");
    setSelectedColor(subject.color);
    setDifficulty(subject.difficulty);
    setGoal(subject.goal);
    setFrequency(subject.frequency);
  }, [subject]);

  function handleSave() {
    if (!name.trim()) {
      Alert.alert("Nome obrigatório", "Informe o nome da matéria.");
      return;
    }

    onSave({
      ...subject,
      name: name.trim(),
      description: description.trim(),
      color: selectedColor,
      difficulty,
      goal,
      frequency,
    });
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#080810" }}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          <Text style={{ color: "white", fontSize: 26, fontWeight: "700" }}>
            Editar matéria
          </Text>

          <TextInput value={name} onChangeText={setName} placeholder="Nome da matéria" placeholderTextColor="#666" style={inputStyle} />
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Descrição da matéria"
            placeholderTextColor="#666"
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

          <Pressable onPress={handleSave} style={saveButtonStyle}>
            <Text style={saveButtonTextStyle}>Salvar alterações</Text>
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
