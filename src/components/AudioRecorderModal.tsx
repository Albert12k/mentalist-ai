import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";

import { MaterialDraft } from "../services/materials";

type Props = {
  visible: boolean;
  onClose: () => void;
  onRecorded: (draft: MaterialDraft) => void;
};

function formatDuration(durationMillis: number): string {
  const totalSeconds = Math.floor(durationMillis / 1000);
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

// O gravador é criado pelo hook oficial do Expo. A opção "document" faz com
// que a gravação fique em uma pasta persistente do app no Android e no iOS.
export default function AudioRecorderModal({ visible, onClose, onRecorded }: Props) {
  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, directory: "document" });
  const recorderState = useAudioRecorderState(recorder);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) setLoading(false);
  }, [visible]);

  async function handleStart() {
    try {
      setLoading(true);
      const permission = await requestRecordingPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Microfone necessário", "Permita o acesso ao microfone para gravar o áudio da aula.");
        return;
      }

      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch {
      Alert.alert("Não foi possível gravar", "Tente permitir o microfone e iniciar a gravação novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleStop() {
    try {
      setLoading(true);
      const durationMillis = Math.max(
        recorderState.durationMillis,
        Math.round(recorder.currentTime * 1000),
      );

      await recorder.stop();

      if (!recorder.uri) {
        Alert.alert("Áudio não encontrado", "A gravação terminou, mas o arquivo não pôde ser localizado.");
        return;
      }

      onRecorded({
        title: "Áudio da aula",
        type: "audio",
        category: "lesson",
        uri: recorder.uri,
        mimeType: "audio/*",
        durationMillis,
      });
    } catch {
      Alert.alert("Não foi possível finalizar", "Tente parar a gravação novamente.");
    } finally {
      // Depois de gravar, voltamos ao modo de reprodução normal do aplicativo.
      try {
        await setAudioModeAsync({ allowsRecording: false });
      } catch {
        // Se a plataforma não aceitar a troca agora, o estado visual ainda
        // deve ser liberado para o estudante tentar novamente.
      }
      setLoading(false);
    }
  }

  function handleClose() {
    if (recorderState.isRecording) {
      Alert.alert("Gravação em andamento", "Pare a gravação antes de sair.");
      return;
    }

    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Text style={styles.title}>Gravar áudio da aula</Text>
          <Text style={styles.subtitle}>
            Use para registrar explicações, resumos falados ou trechos importantes.
          </Text>

          <View style={[styles.timer, recorderState.isRecording && styles.timerRecording]}>
            <Text style={styles.timerLabel}>{recorderState.isRecording ? "Gravando" : "Pronto para gravar"}</Text>
            <Text style={styles.timerValue}>{formatDuration(recorderState.durationMillis)}</Text>
          </View>

          {recorderState.isRecording ? (
            <Pressable disabled={loading} onPress={handleStop} style={[styles.stopButton, loading && styles.disabledButton]}>
              <Text style={styles.buttonText}>Parar e classificar áudio</Text>
            </Pressable>
          ) : (
            <Pressable disabled={loading} onPress={handleStart} style={[styles.recordButton, loading && styles.disabledButton]}>
              <Text style={styles.buttonText}>{loading ? "Preparando..." : "Iniciar gravação"}</Text>
            </Pressable>
          )}

          <Pressable onPress={handleClose} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = {
  safeArea: { flex: 1, backgroundColor: "#080810" },
  content: { flex: 1, padding: 20 },
  title: { color: "white", fontSize: 25, fontWeight: "700" },
  subtitle: { color: "#AAA", marginTop: 9, lineHeight: 20 },
  timer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 36,
    paddingVertical: 35,
    backgroundColor: "#161625",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2C2A3F",
  },
  timerRecording: { borderColor: "#FF5252", backgroundColor: "#2A1823" },
  timerLabel: { color: "#BBB", fontWeight: "700" },
  timerValue: { color: "white", fontSize: 42, marginTop: 8 },
  recordButton: { backgroundColor: "#B00020", padding: 16, borderRadius: 12, marginTop: 24 },
  stopButton: { backgroundColor: "#00B86B", padding: 16, borderRadius: 12, marginTop: 24 },
  disabledButton: { opacity: 0.6 },
  buttonText: { color: "white", textAlign: "center", fontWeight: "700" },
  cancelButton: { padding: 15, marginTop: 8 },
  cancelText: { color: "#888", textAlign: "center" },
} as const;
