import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SubjectContent } from "../types/Subject";

type Props = {
  visible: boolean;
  content?: SubjectContent | null;
  onClose: () => void;
  onSubmit: (content: SubjectContent) => void;
};

export default function AddContentModal({ visible, content, onClose, onSubmit }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const isEditing = Boolean(content);

  useEffect(() => {
    if (!visible) return;

    setTitle(content?.title ?? "");
    setDescription(content?.description ?? "");
  }, [visible, content]);

  function handleSubmit() {
    if (!title.trim()) {
      Alert.alert("Nome obrigatório", "Informe o nome do conteúdo.");
      return;
    }

    onSubmit({
      id: content?.id ?? String(Date.now()),
      title: title.trim(),
      ...(description.trim() ? { description: description.trim() } : {}),
      completed: content?.completed ?? false,
      createdAt: content?.createdAt ?? new Date().toISOString(),
    });
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#080810", padding: 20 }}>
        <Text style={{ color: "white", fontSize: 24, fontWeight: "700" }}>
          {isEditing ? "Editar conteúdo" : "Novo conteúdo"}
        </Text>

        <TextInput
          placeholder="Nome do conteúdo"
          placeholderTextColor="#666"
          value={title}
          onChangeText={setTitle}
          style={inputStyle}
        />
        <TextInput
          placeholder="Descrição (opcional)"
          placeholderTextColor="#666"
          value={description}
          onChangeText={setDescription}
          multiline
          style={[inputStyle, { height: 100, textAlignVertical: "top" }]}
        />

        <Pressable onPress={handleSubmit} style={saveButtonStyle}>
          <Text style={saveButtonTextStyle}>{isEditing ? "Salvar alterações" : "Adicionar conteúdo"}</Text>
        </Pressable>
        <Pressable onPress={onClose} style={{ padding: 15, marginTop: 8 }}>
          <Text style={{ color: "#888", textAlign: "center" }}>Cancelar</Text>
        </Pressable>
      </SafeAreaView>
    </Modal>
  );
}

const inputStyle = {
  backgroundColor: "#161625",
  color: "white",
  padding: 14,
  borderRadius: 12,
  marginTop: 20,
} as const;

const saveButtonStyle = {
  backgroundColor: "#7C4DFF",
  padding: 15,
  borderRadius: 12,
  marginTop: 25,
} as const;

const saveButtonTextStyle = {
  color: "white",
  textAlign: "center",
  fontWeight: "700",
} as const;
