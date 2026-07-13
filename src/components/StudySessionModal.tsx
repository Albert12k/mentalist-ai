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

import { SubjectContent } from "../types/Subject";

type Props = {
  visible: boolean;
  contents: SubjectContent[];
  onClose: () => void;
  onSave: (input: {
    durationMinutes: number;
    contentId?: string;
    completeContent: boolean;
  }) => void;
};

export default function StudySessionModal({
  visible,
  contents,
  onClose,
  onSave,
}: Props) {
  const [duration, setDuration] = useState("25");
  const [contentId, setContentId] = useState<string | undefined>();
  const [completeContent, setCompleteContent] = useState(false);

  useEffect(() => {
    if (visible) {
      setDuration("25");
      setContentId(undefined);
      setCompleteContent(false);
    }
  }, [visible]);

  function handleSave() {
    const durationMinutes = Number(duration.replace(",", "."));

    if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 180) {
      Alert.alert("Duração inválida", "Informe um tempo entre 1 e 180 minutos.");
      return;
    }

    onSave({
      durationMinutes,
      contentId,
      completeContent: Boolean(contentId) && completeContent,
    });
  }

  function selectContent(id: string) {
    if (contentId === id) {
      setContentId(undefined);
      setCompleteContent(false);
      return;
    }

    setContentId(id);
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#080810" }}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          <Text style={{ color: "white", fontSize: 26, fontWeight: "700" }}>
            Registrar estudo
          </Text>

          <Text style={{ color: "#888", marginTop: 8 }}>
            Salve o que você estudou para atualizar seu treino e sua evolução.
          </Text>

          <Text style={{ color: "#BBB", marginTop: 24, marginBottom: 8 }}>
            Duração em minutos
          </Text>
          <TextInput
            value={duration}
            onChangeText={setDuration}
            keyboardType="number-pad"
            maxLength={3}
            style={{
              backgroundColor: "#161625",
              color: "white",
              padding: 14,
              borderRadius: 12,
            }}
          />

          <Text style={{ color: "#BBB", marginTop: 24, marginBottom: 4 }}>
            Conteúdo estudado (opcional)
          </Text>
          {contents.length === 0 ? (
            <Text style={{ color: "#777", marginTop: 8 }}>
              Adicione conteúdos a esta matéria para acompanhá-los aqui.
            </Text>
          ) : (
            contents.map((content) => {
              const selected = contentId === content.id;

              return (
                <Pressable
                  key={content.id}
                  onPress={() => selectContent(content.id)}
                  style={{
                    marginTop: 10,
                    padding: 13,
                    borderRadius: 12,
                    backgroundColor: selected ? "#392C73" : "#161625",
                    borderWidth: selected ? 1 : 0,
                    borderColor: "#7C4DFF",
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "600" }}>
                    {content.completed ? "✓ " : ""}
                    {content.title}
                  </Text>
                </Pressable>
              );
            })
          )}

          {contentId && (
            <Pressable
              onPress={() => setCompleteContent((current) => !current)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 18,
                padding: 13,
                borderRadius: 12,
                backgroundColor: completeContent ? "#123A2C" : "#161625",
              }}
            >
              <Text style={{ color: completeContent ? "#00E676" : "#BBB", fontWeight: "700" }}>
                {completeContent ? "✓ Conteúdo concluído" : "Marcar conteúdo como concluído"}
              </Text>
            </Pressable>
          )}

          <Pressable
            onPress={handleSave}
            style={{
              backgroundColor: "#7C4DFF",
              padding: 15,
              borderRadius: 12,
              marginTop: 30,
            }}
          >
            <Text style={{ color: "white", textAlign: "center", fontWeight: "700" }}>
              Salvar sessão
            </Text>
          </Pressable>

          <Pressable onPress={onClose} style={{ padding: 15, marginTop: 8 }}>
            <Text style={{ color: "#888", textAlign: "center" }}>Cancelar</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
