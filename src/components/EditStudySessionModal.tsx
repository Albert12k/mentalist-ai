import { useEffect, useState } from "react";
import { Alert, Modal, Pressable, Text, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { StudyHistory } from "../types/Subject";

type Props = { visible: boolean; session: StudyHistory | null; onClose: () => void; onSave: (date: string, duration: number) => void };

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export default function EditStudySessionModal({ visible, session, onClose, onSave }: Props) {
  const [date, setDate] = useState("");
  const [duration, setDuration] = useState("");

  useEffect(() => {
    if (!visible || !session) return;
    setDate(session.date.slice(0, 10));
    setDuration(String(session.duration));
  }, [visible, session]);

  function submit() {
    const minutes = Number(duration);
    if (!isValidDate(date)) { Alert.alert("Data inválida", "Use o formato AAAA-MM-DD."); return; }
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 180) { Alert.alert("Duração inválida", "Informe entre 1 e 180 minutos."); return; }
    onSave(date, minutes);
  }

  return <Modal visible={visible} animationType="slide" onRequestClose={onClose}><SafeAreaView style={styles.safeArea}><Text style={styles.title}>Editar estudo</Text><Text style={styles.label}>Data</Text><TextInput value={date} onChangeText={setDate} placeholder="AAAA-MM-DD" placeholderTextColor="#666" style={styles.input} /><Text style={styles.label}>Duração em minutos</Text><TextInput value={duration} onChangeText={setDuration} keyboardType="number-pad" maxLength={3} style={styles.input} /><Pressable onPress={submit} style={styles.saveButton}><Text style={styles.saveText}>Salvar alterações</Text></Pressable><Pressable onPress={onClose} style={styles.cancelButton}><Text style={styles.cancelText}>Cancelar</Text></Pressable></SafeAreaView></Modal>;
}

const styles = {
  safeArea: { flex: 1, backgroundColor: "#080810", padding: 20 }, title: { color: "white", fontSize: 26, fontWeight: "800" },
  label: { color: "#BBB", marginTop: 23, marginBottom: 8 }, input: { color: "white", backgroundColor: "#161625", borderRadius: 12, padding: 14 },
  saveButton: { backgroundColor: "#7C4DFF", padding: 15, borderRadius: 12, marginTop: 28 }, saveText: { color: "white", textAlign: "center", fontWeight: "800" },
  cancelButton: { padding: 15, marginTop: 8 }, cancelText: { color: "#888", textAlign: "center" },
} as const;
