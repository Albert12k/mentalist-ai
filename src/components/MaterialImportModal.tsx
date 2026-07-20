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

import { materialCategoryLabels, materialTypeLabels, MaterialDraft } from "../services/materials";
import { SubjectMaterialCategory } from "../types/Subject";

type Props = {
  visible: boolean;
  draft: MaterialDraft | null;
  onClose: () => void;
  onSave: (material: MaterialDraft) => Promise<void>;
};

const categories = Object.keys(materialCategoryLabels) as SubjectMaterialCategory[];

// Esta etapa deixa a classificação automática transparente. O aplicativo
// propõe uma categoria, mas a decisão final continua sendo do estudante.
export default function MaterialImportModal({ visible, draft, onClose, onSave }: Props) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<SubjectMaterialCategory>("lesson");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible || !draft) return;

    setTitle(draft.title);
    setCategory(draft.category);
  }, [visible, draft]);

  async function handleSave() {
    if (!draft) return;

    if (!title.trim()) {
      Alert.alert("Título obrigatório", "Dê um nome para encontrar este material depois.");
      return;
    }

    setSaving(true);
    try {
      await onSave({ ...draft, title: title.trim(), category });
    } finally {
      setSaving(false);
    }
  }

  if (!draft) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Classificar material</Text>
          <Text style={styles.subtitle}>
            O Mentalis sugeriu uma classificação. Altere se quiser antes de guardar.
          </Text>

          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{materialTypeLabels[draft.type]}</Text>
          </View>

          <TextInput
            value={title}
            onChangeText={setTitle}
            editable={!saving}
            placeholder="Nome do material"
            placeholderTextColor="#666"
            style={styles.input}
          />

          <Text style={styles.label}>Classificação</Text>
          <View style={styles.categoryList}>
            {categories.map((item) => {
              const active = category === item;

              return (
                <Pressable
                  key={item}
                  disabled={saving}
                  onPress={() => setCategory(item)}
                  style={[styles.categoryButton, active && styles.activeCategoryButton]}
                >
                  <Text style={[styles.categoryText, active && styles.activeCategoryText]}>
                    {materialCategoryLabels[item]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable disabled={saving} onPress={handleSave} style={[styles.saveButton, saving && styles.disabledButton]}>
            <Text style={styles.saveButtonText}>{saving ? "Guardando material..." : "Salvar na matéria"}</Text>
          </Pressable>
          <Pressable disabled={saving} onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = {
  safeArea: { flex: 1, backgroundColor: "#080810" },
  content: { padding: 20, paddingBottom: 40 },
  title: { color: "white", fontSize: 25, fontWeight: "700" },
  subtitle: { color: "#AAA", marginTop: 9, lineHeight: 20 },
  typeBadge: {
    alignSelf: "flex-start",
    marginTop: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#24223D",
  },
  typeBadgeText: { color: "#C5B5FF", fontSize: 12, fontWeight: "700" },
  input: {
    backgroundColor: "#161625",
    color: "white",
    padding: 14,
    borderRadius: 12,
    marginTop: 20,
  },
  label: { color: "#DDD", marginTop: 24, marginBottom: 10, fontWeight: "700" },
  categoryList: { flexDirection: "row", flexWrap: "wrap" },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 10,
    backgroundColor: "#161625",
  },
  activeCategoryButton: { backgroundColor: "#7C4DFF" },
  categoryText: { color: "#BBB", fontWeight: "600" },
  activeCategoryText: { color: "white" },
  saveButton: { backgroundColor: "#00B86B", padding: 15, borderRadius: 12, marginTop: 28 },
  disabledButton: { opacity: 0.65 },
  saveButtonText: { color: "white", textAlign: "center", fontWeight: "700" },
  cancelButton: { padding: 15, marginTop: 8 },
  cancelText: { color: "#888", textAlign: "center" },
} as const;
