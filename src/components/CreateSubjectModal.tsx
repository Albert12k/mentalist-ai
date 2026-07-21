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
import * as ImagePicker from "expo-image-picker";

import ColorPicker from "./ColorPicker";
import { classDayOptions } from "../constants/subjectSchedule";
import { useAuth } from "../contexts/AuthContext";
import { uploadUserAsset } from "../services/cloudStorage";
import { ClassDay, ClassMode, Subject } from "../types/Subject";

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
  const [classDays, setClassDays] = useState<ClassDay[]>([]);
  const [classMode, setClassMode] = useState<ClassMode>("in_person");
  const [image, setImage] = useState<string | undefined>();
  const { userId } = useAuth();

  function resetForm() {
    setName("");
    setDescription("");
    setSelectedColor("#7C4DFF");
    setClassDays([]);
    setClassMode("in_person");
    setImage(undefined);
  }

  useEffect(() => {
    if (!visible) resetForm();
  }, [visible]);

  async function handleCreate() {
    if (!name.trim()) {
      Alert.alert("Nome obrigatório", "Informe o nome da matéria.");
      return;
    }
    if (!classDays.length) {
      Alert.alert("Selecione os dias", "Informe pelo menos um dia em que você tem aula desta matéria.");
      return;
    }

    let imagePath: string | undefined;
    let imageUrl = image;
    try {
      if (image && userId) {
        const uploaded = await uploadUserAsset(userId, image, "subjects", "materia.jpg");
        imagePath = uploaded.path;
        imageUrl = uploaded.url;
      }
    } catch {
      Alert.alert("Foto não enviada", "A matéria será criada, mas tente enviar a foto novamente depois.");
    }

    const subject: Subject = {
      id: String(Date.now()),
      name: name.trim(),
      description: description.trim(),
      color: selectedColor,
      image: imageUrl,
      imagePath,
      // Valores legados mantêm o planejador compatível enquanto ele passa a
      // usar diretamente os dias de aula escolhidos abaixo.
      difficulty: "medium",
      goal: "personal",
      frequency: classDays.length === 7 ? "daily" : classDays.every((day) => day === "saturday" || day === "sunday") ? "weekend" : "three_times",
      classDays,
      classMode,
      retention: 0,
      absences: 0,
      absenceRecords: [],
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

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (!result.canceled) setImage(result.assets[0].uri);
  }

  function toggleClassDay(day: ClassDay) {
    setClassDays((current) => current.includes(day) ? current.filter((item) => item !== day) : [...current, day]);
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
          <Pressable onPress={pickImage} style={{ backgroundColor: "#263238", padding: 12, borderRadius: 10, marginTop: 10 }}>
            <Text style={{ color: "white", textAlign: "center", fontWeight: "700" }}>{image ? "Foto da matéria selecionada" : "+ Adicionar foto da matéria"}</Text>
          </Pressable>

          <Text style={labelStyle}>Dias de aula</Text>
          <Text style={helperStyle}>Selecione todos os dias em que essa matéria acontece.</Text>
          <View style={[optionRowStyle, { flexWrap: "wrap" }]}>
            {classDayOptions.map((day) => <OptionButton key={day.value} label={day.shortLabel} active={classDays.includes(day.value)} onPress={() => toggleClassDay(day.value)} />)}
          </View>

          <Text style={labelStyle}>Tipo de aula</Text>
          <View style={optionRowStyle}>
            <OptionButton label="Presencial" active={classMode === "in_person"} onPress={() => setClassMode("in_person")} />
            <OptionButton label="Remota" active={classMode === "remote"} onPress={() => setClassMode("remote")} />
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

const helperStyle = {
  color: "#77778F",
  marginBottom: 10,
  marginTop: -2,
  fontSize: 12,
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
