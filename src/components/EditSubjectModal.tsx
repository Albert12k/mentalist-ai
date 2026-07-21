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
  const [classDays, setClassDays] = useState<ClassDay[]>(subject.classDays ?? []);
  const [classMode, setClassMode] = useState<ClassMode>(subject.classMode ?? "in_person");
  const [image, setImage] = useState(subject.image);
  const { userId } = useAuth();

  useEffect(() => {
    setName(subject.name);
    setDescription(subject.description ?? "");
    setSelectedColor(subject.color);
    setClassDays(subject.classDays ?? []);
    setClassMode(subject.classMode ?? "in_person");
    setImage(subject.image);
  }, [subject]);

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert("Nome obrigatório", "Informe o nome da matéria.");
      return;
    }
    if (!classDays.length) {
      Alert.alert("Selecione os dias", "Informe pelo menos um dia em que você tem aula desta matéria.");
      return;
    }

    let imagePath = subject.imagePath;
    let imageUrl = image;
    if (image && image !== subject.image && userId) {
      try {
        const uploaded = await uploadUserAsset(userId, image, "subjects", "materia.jpg");
        imagePath = uploaded.path;
        imageUrl = uploaded.url;
      } catch {
        Alert.alert("Foto não enviada", "As outras alterações serão salvas. Tente enviar a foto novamente depois.");
      }
    }

    onSave({
      ...subject,
      name: name.trim(),
      description: description.trim(),
      color: selectedColor,
      image: imageUrl,
      imagePath,
      classDays,
      classMode,
    });
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
          <Pressable onPress={pickImage} style={{ backgroundColor: "#263238", padding: 12, borderRadius: 10, marginTop: 10 }}>
            <Text style={{ color: "white", textAlign: "center", fontWeight: "700" }}>{image ? "Trocar foto da matéria" : "+ Adicionar foto da matéria"}</Text>
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
