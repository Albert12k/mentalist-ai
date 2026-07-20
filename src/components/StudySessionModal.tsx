import { useEffect, useState } from "react";
import { Alert, Modal, Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from "react-native";

import { SubjectContent } from "../types/Subject";
import { useProfile } from "../contexts/ProfileContext";

type Props = {
  visible: boolean;
  contents: SubjectContent[];
  onClose: () => void;
  onSave: (input: { durationMinutes: number; contentId?: string; completeContent: boolean }) => void;
};

type SessionMode = "timer" | "manual";
type PomodoroPhase = "focus" | "break";

export default function StudySessionModal({ visible, contents, onClose, onSave }: Props) {
  const { profile } = useProfile();
  const [mode, setMode] = useState<SessionMode>("timer");
  const [duration, setDuration] = useState("25");
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [remainingSeconds, setRemainingSeconds] = useState(25 * 60);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [phase, setPhase] = useState<PomodoroPhase>("focus");
  const [completedCycles, setCompletedCycles] = useState(0);
  const [accumulatedFocusSeconds, setAccumulatedFocusSeconds] = useState(0);
  const [contentId, setContentId] = useState<string | undefined>();
  const [completeContent, setCompleteContent] = useState(false);

  const running = deadline !== null;
  const focusSeconds = timerMinutes * 60;
  const breakSeconds = 5 * 60;
  const phaseSeconds = phase === "focus" ? focusSeconds : breakSeconds;
  const elapsedSeconds = phaseSeconds - remainingSeconds;

  useEffect(() => {
    if (!visible) {
      setDeadline(null);
      return;
    }
    setMode("timer");
    setDuration("25");
    const defaultMinutes = profile.defaultPomodoroMinutes ?? 25;
    setTimerMinutes(defaultMinutes);
    setRemainingSeconds(defaultMinutes * 60);
    setDeadline(null);
    setPhase("focus");
    setCompletedCycles(0);
    setAccumulatedFocusSeconds(0);
    setContentId(undefined);
    setCompleteContent(false);
  }, [visible, profile.defaultPomodoroMinutes]);

  // O horário final evita que o cronômetro perca tempo quando a aba do
  // navegador fica em segundo plano e reduz a frequência dos intervalos.
  useEffect(() => {
    if (!deadline) return;
    const updateTimer = () => {
      const next = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemainingSeconds(next);
      if (next === 0) {
        setDeadline(null);
        if (phase === "focus") {
          setAccumulatedFocusSeconds((current) => current + focusSeconds);
          setCompletedCycles((current) => current + 1);
          setPhase("break");
          setRemainingSeconds(breakSeconds);
          Alert.alert("Foco concluído", "Hora de uma pausa de 5 minutos. Depois, continue para o próximo ciclo.");
        } else {
          setPhase("focus");
          setRemainingSeconds(focusSeconds);
          Alert.alert("Pausa concluída", "Você está pronto para começar outro ciclo de foco.");
        }
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 250);
    return () => clearInterval(interval);
  }, [deadline, phase, focusSeconds]);

  function selectTimer(minutes: number) {
    setTimerMinutes(minutes);
    setRemainingSeconds(minutes * 60);
    setDeadline(null);
    setPhase("focus");
    setCompletedCycles(0);
    setAccumulatedFocusSeconds(0);
  }

  function toggleTimer() {
    if (deadline !== null) {
      setRemainingSeconds(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
      setDeadline(null);
      return;
    }
    if (remainingSeconds === 0) setRemainingSeconds(phaseSeconds);
    setDeadline(Date.now() + (remainingSeconds === 0 ? phaseSeconds : remainingSeconds) * 1000);
  }

  function resetTimer() {
    setDeadline(null);
    setPhase("focus");
    setRemainingSeconds(focusSeconds);
    setCompletedCycles(0);
    setAccumulatedFocusSeconds(0);
  }

  function saveManualSession() {
    const durationMinutes = Number(duration.replace(",", "."));
    if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 180) {
      Alert.alert("Duração inválida", "Informe um tempo entre 1 e 180 minutos.");
      return;
    }
    save(durationMinutes);
  }

  function saveTimerSession() {
    const currentFocusSeconds = phase === "focus" ? Math.max(0, elapsedSeconds) : 0;
    const studiedSeconds = accumulatedFocusSeconds + currentFocusSeconds;
    if (studiedSeconds < 1) {
      Alert.alert("Inicie o cronômetro", "Estude por algum tempo antes de salvar a sessão.");
      return;
    }
    setDeadline(null);
    save(Math.max(1, Math.ceil(studiedSeconds / 60)));
  }

  function skipBreak() {
    setDeadline(null);
    setPhase("focus");
    setRemainingSeconds(focusSeconds);
  }

  function save(durationMinutes: number) {
    onSave({ durationMinutes, contentId, completeContent: Boolean(contentId) && completeContent });
  }

  function selectContent(id: string) {
    if (contentId === id) {
      setContentId(undefined);
      setCompleteContent(false);
    } else {
      setContentId(id);
    }
  }

  const timeText = `${String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:${String(remainingSeconds % 60).padStart(2, "0")}`;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Registrar estudo</Text>
          <Text style={styles.subtitle}>Use o foco Pomodoro ou informe manualmente quanto tempo estudou.</Text>

          <View style={styles.modeRow}>
            <ModeButton label="Cronômetro" active={mode === "timer"} onPress={() => setMode("timer")} />
            <ModeButton label="Registro manual" active={mode === "manual"} onPress={() => setMode("manual")} />
          </View>

          {mode === "timer" ? (
            <View style={styles.timerCard}>
              <Text style={styles.timerEyebrow}>{phase === "focus" ? "TEMPO DE FOCO" : "PAUSA"}</Text>
              <Text style={styles.timer}>{timeText}</Text>
              <Text style={styles.cycleText}>{completedCycles} ciclo{completedCycles === 1 ? "" : "s"} concluído{completedCycles === 1 ? "" : "s"}</Text>
              {phase === "focus" ? <View style={styles.presetRow}>
                {[15, 25, 45, 60].map((minutes) => <ModeButton key={minutes} label={`${minutes} min`} active={timerMinutes === minutes} onPress={() => selectTimer(minutes)} />)}
              </View> : null}
              <Pressable onPress={toggleTimer} style={[styles.primaryButton, phase === "break" && styles.breakButton]}><Text style={styles.primaryButtonText}>{running ? "Pausar" : elapsedSeconds > 0 ? "Continuar" : phase === "focus" ? "Iniciar foco" : "Iniciar pausa"}</Text></Pressable>
              {phase === "break" ? <Pressable onPress={skipBreak} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Pular pausa</Text></Pressable> : null}
              <Pressable onPress={resetTimer} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Reiniciar cronômetro</Text></Pressable>
            </View>
          ) : (
            <View>
              <Text style={styles.label}>Duração em minutos</Text>
              <TextInput value={duration} onChangeText={setDuration} keyboardType="number-pad" maxLength={3} style={styles.input} />
            </View>
          )}

          <Text style={styles.label}>Conteúdo estudado (opcional)</Text>
          {contents.length === 0 ? <Text style={styles.empty}>Adicione conteúdos à matéria para acompanhá-los aqui.</Text> : contents.map((item) => {
            const selected = contentId === item.id;
            return <Pressable key={item.id} onPress={() => selectContent(item.id)} style={[styles.contentOption, selected && styles.contentOptionSelected]}><Text style={styles.contentText}>{item.completed ? "✓ " : ""}{item.title}</Text></Pressable>;
          })}

          {contentId ? <Pressable onPress={() => setCompleteContent((current) => !current)} style={[styles.completeOption, completeContent && styles.completeOptionSelected]}><Text style={{ color: completeContent ? "#00E676" : "#BBB", fontWeight: "700" }}>{completeContent ? "✓ Conteúdo concluído" : "Marcar conteúdo como concluído"}</Text></Pressable> : null}

          <Pressable onPress={mode === "timer" ? saveTimerSession : saveManualSession} style={styles.saveButton}><Text style={styles.primaryButtonText}>{mode === "timer" ? "Finalizar e salvar sessão" : "Salvar sessão"}</Text></Pressable>
          <Pressable onPress={onClose} style={styles.cancelButton}><Text style={styles.cancelText}>Cancelar</Text></Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function ModeButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.modeButton, active && styles.modeButtonActive]}><Text style={[styles.modeText, active && styles.modeTextActive]}>{label}</Text></Pressable>;
}

const styles = {
  safeArea: { flex: 1, backgroundColor: "#080810" },
  content: { padding: 20, paddingBottom: 40 },
  title: { color: "white", fontSize: 26, fontWeight: "700" },
  subtitle: { color: "#888", marginTop: 8, lineHeight: 20 },
  modeRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 22, marginBottom: 14 },
  modeButton: { backgroundColor: "#161625", paddingHorizontal: 13, paddingVertical: 10, borderRadius: 10, marginRight: 8, marginBottom: 8 },
  modeButtonActive: { backgroundColor: "#7C4DFF" },
  modeText: { color: "#AAA", fontWeight: "700" },
  modeTextActive: { color: "white" },
  timerCard: { backgroundColor: "#161625", borderRadius: 20, padding: 20, alignItems: "center", borderWidth: 1, borderColor: "#342765" },
  timerEyebrow: { color: "#A991FF", fontSize: 11, fontWeight: "800", letterSpacing: 1.2 },
  timer: { color: "white", fontSize: 58, fontWeight: "800", marginVertical: 15 },
  cycleText: { color: "#BBB", fontWeight: "700", marginBottom: 14 },
  presetRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center" },
  primaryButton: { alignSelf: "stretch", backgroundColor: "#7C4DFF", padding: 15, borderRadius: 12, marginTop: 10 },
  breakButton: { backgroundColor: "#007D4A" },
  primaryButtonText: { color: "white", textAlign: "center", fontWeight: "700" },
  secondaryButton: { padding: 12, marginTop: 4 },
  secondaryButtonText: { color: "#9C8DCB", fontWeight: "700" },
  label: { color: "#BBB", marginTop: 24, marginBottom: 8 },
  input: { backgroundColor: "#161625", color: "white", padding: 14, borderRadius: 12 },
  empty: { color: "#777", marginTop: 8 },
  contentOption: { marginTop: 10, padding: 13, borderRadius: 12, backgroundColor: "#161625" },
  contentOptionSelected: { backgroundColor: "#392C73", borderWidth: 1, borderColor: "#7C4DFF" },
  contentText: { color: "white", fontWeight: "600" },
  completeOption: { marginTop: 18, padding: 13, borderRadius: 12, backgroundColor: "#161625" },
  completeOptionSelected: { backgroundColor: "#123A2C" },
  saveButton: { backgroundColor: "#00B86B", padding: 15, borderRadius: 12, marginTop: 30 },
  cancelButton: { padding: 15, marginTop: 8 },
  cancelText: { color: "#888", textAlign: "center" },
} as const;
