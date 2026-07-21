import { useEffect, useState } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSave: (date: string, note: string) => void;
};

function today(): string {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export default function AddAbsenceModal({ visible, onClose, onSave }: Props) {
  const [date, setDate] = useState(today());
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!visible) return;
    setDate(today());
    setNote("");
    setError("");
  }, [visible]);

  function submit() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(new Date(`${date}T12:00:00`).getTime())) {
      setError("Informe uma data válida no formato AAAA-MM-DD.");
      return;
    }
    onSave(date, note.trim());
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <SafeAreaView style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Registrar falta</Text>
          <Text style={styles.label}>Data da aula</Text>
          <TextInput value={date} onChangeText={setDate} placeholder="AAAA-MM-DD" placeholderTextColor="#77778E" style={styles.input} />
          <Text style={styles.label}>Observação (opcional)</Text>
          <TextInput value={note} onChangeText={setNote} placeholder="Ex.: consulta médica" placeholderTextColor="#77778E" style={[styles.input, styles.note]} multiline />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.actions}>
            <Pressable onPress={onClose} style={[styles.button, styles.cancel]}><Text style={styles.buttonText}>Cancelar</Text></Pressable>
            <Pressable onPress={submit} style={[styles.button, styles.save]}><Text style={styles.buttonText}>Salvar falta</Text></Pressable>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = {
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.72)", alignItems: "center", justifyContent: "center", padding: 20 },
  card: { width: "100%", maxWidth: 480, backgroundColor: "#161625", borderRadius: 18, padding: 20 },
  title: { color: "white", fontSize: 22, fontWeight: "700", marginBottom: 16 },
  label: { color: "#C7C7D6", fontWeight: "600", marginBottom: 7, marginTop: 8 },
  input: { backgroundColor: "#0F0F1B", borderWidth: 1, borderColor: "#343449", color: "white", borderRadius: 11, padding: 13 },
  note: { minHeight: 82, textAlignVertical: "top" },
  error: { color: "#FF8A80", marginTop: 10 },
  actions: { flexDirection: "row", justifyContent: "flex-end", flexWrap: "wrap", marginTop: 18 },
  button: { paddingVertical: 11, paddingHorizontal: 16, borderRadius: 10, marginLeft: 8, marginTop: 6 },
  cancel: { backgroundColor: "#30303F" },
  save: { backgroundColor: "#B35C00" },
  buttonText: { color: "white", fontWeight: "700" },
} as const;
