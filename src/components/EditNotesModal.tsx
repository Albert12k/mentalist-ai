import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  SafeAreaView,
  Text,
  TextInput,
} from "react-native";

type Props = {
  visible: boolean;
  notes: string;
  onClose: () => void;
  onSave: (notes: string) => void;
};

export default function EditNotesModal({ visible, notes, onClose, onSave }: Props) {
  const [value, setValue] = useState(notes);

  useEffect(() => {
    if (visible) setValue(notes);
  }, [visible, notes]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#080810", padding: 20 }}>
        <Text style={{ color: "white", fontSize: 24, fontWeight: "700" }}>
          Anotações da matéria
        </Text>
        <TextInput
          value={value}
          onChangeText={setValue}
          placeholder="Escreva lembretes, links ou pontos importantes"
          placeholderTextColor="#666"
          multiline
          textAlignVertical="top"
          style={{
            backgroundColor: "#161625",
            color: "white",
            padding: 14,
            borderRadius: 12,
            height: 240,
            marginTop: 20,
          }}
        />
        <Pressable
          onPress={() => onSave(value.trim())}
          style={{ backgroundColor: "#7C4DFF", padding: 15, borderRadius: 12, marginTop: 24 }}
        >
          <Text style={{ color: "white", textAlign: "center", fontWeight: "700" }}>
            Salvar anotações
          </Text>
        </Pressable>
        <Pressable onPress={onClose} style={{ padding: 15, marginTop: 8 }}>
          <Text style={{ color: "#888", textAlign: "center" }}>Cancelar</Text>
        </Pressable>
      </SafeAreaView>
    </Modal>
  );
}
