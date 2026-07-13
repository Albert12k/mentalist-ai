import { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";

import AddContentModal from "../components/AddContentModal";
import AddEventModal from "../components/AddEventModal";
import EditNotesModal from "../components/EditNotesModal";
import StudySessionModal from "../components/StudySessionModal";
import { useSubjects } from "../contexts/SubjectsContext";
import { recordStudySession } from "../services/studySession";
import { Subject, SubjectContent, SubjectEvent } from "../types/Subject";

type StudySessionInput = {
  durationMinutes: number;
  contentId?: string;
  completeContent: boolean;
};

const eventTypeLabels: Record<SubjectEvent["type"], string> = {
  exam: "Prova",
  assignment: "Trabalho",
  review: "Revisão",
};

function formatEventDate(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR");
}

export default function SubjectDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const routeSubject: Subject = route.params.subject;
  const { subjects, updateSubject } = useSubjects();
  const [contentVisible, setContentVisible] = useState(false);
  const [eventVisible, setEventVisible] = useState(false);
  const [notesVisible, setNotesVisible] = useState(false);
  const [studySessionVisible, setStudySessionVisible] = useState(false);
  const [editingContent, setEditingContent] = useState<SubjectContent | null>(null);
  const [editingEvent, setEditingEvent] = useState<SubjectEvent | null>(null);

  const subject = subjects.find((item) => item.id === routeSubject.id) ?? routeSubject;

  function closeContentModal() {
    setContentVisible(false);
    setEditingContent(null);
  }

  function closeEventModal() {
    setEventVisible(false);
    setEditingEvent(null);
  }

  function handleContentSubmit(content: SubjectContent) {
    const contentExists = subject.contents.some((item) => item.id === content.id);

    updateSubject({
      ...subject,
      contents: contentExists
        ? subject.contents.map((item) => item.id === content.id ? content : item)
        : [...subject.contents, content],
    });
    closeContentModal();
  }

  function handleToggleContent(content: SubjectContent) {
    updateSubject({
      ...subject,
      contents: subject.contents.map((item) => item.id === content.id
        ? { ...item, completed: !item.completed }
        : item),
    });
  }

  function handleEventSubmit(event: SubjectEvent) {
    const eventExists = subject.events.some((item) => item.id === event.id);

    updateSubject({
      ...subject,
      events: eventExists
        ? subject.events.map((item) => item.id === event.id ? event : item)
        : [...subject.events, event],
    });
    closeEventModal();
  }

  function handleSaveStudy(input: StudySessionInput) {
    const { subject: updatedSubject } = recordStudySession(subject, input);

    updateSubject(updatedSubject);
    setStudySessionVisible(false);
  }

  function handleRegisterAbsence() {
    updateSubject({ ...subject, absences: subject.absences + 1 });
  }

  function handleUndoAbsence() {
    if (subject.absences === 0) return;
    updateSubject({ ...subject, absences: subject.absences - 1 });
  }

  function handleSaveNotes(notes: string) {
    updateSubject({ ...subject, notes });
    setNotesVisible(false);
  }

  function confirmRemoval(message: string, onConfirm: () => void) {
    if (Platform.OS === "web") {
      if (window.confirm(message)) onConfirm();
      return;
    }

    Alert.alert("Excluir item", message, [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: onConfirm },
    ]);
  }

  function handleDeleteContent(content: SubjectContent) {
    confirmRemoval(`Excluir o conteúdo "${content.title}"?`, () => {
      updateSubject({
        ...subject,
        contents: subject.contents.filter((item) => item.id !== content.id),
      });
    });
  }

  function handleDeleteEvent(event: SubjectEvent) {
    confirmRemoval(`Excluir a data "${event.title}"?`, () => {
      updateSubject({
        ...subject,
        events: subject.events.filter((item) => item.id !== event.id),
      });
    });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.back}>Voltar</Text>
        </Pressable>

        <View style={[styles.identityCard, { borderLeftColor: subject.color }]}>
          <Text style={styles.subjectName}>{subject.name}</Text>
          {subject.description ? <Text style={styles.description}>{subject.description}</Text> : null}
          <Text style={styles.detail}>Retenção: {subject.retention}%</Text>
          <Text style={styles.detail}>Dificuldade: {subject.difficulty}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Configuração</Text>
          <Text style={styles.detail}>Objetivo: {subject.goal}</Text>
          <Text style={styles.detail}>Frequência: {subject.frequency}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Faltas em aulas</Text>
          <Text style={styles.absenceCount}>
            {subject.absences} falta{subject.absences === 1 ? "" : "s"} registrada{subject.absences === 1 ? "" : "s"}
          </Text>
          <View style={styles.actionsRow}>
            <ActionButton label="Registrar falta" color="#B35C00" onPress={handleRegisterAbsence} />
            {subject.absences > 0 && (
              <ActionButton label="Desfazer última" color="#263238" onPress={handleUndoAbsence} />
            )}
          </View>
        </View>

        <Pressable onPress={() => setStudySessionVisible(true)} style={styles.studyButton}>
          <Text style={styles.studyButtonText}>Registrar estudo</Text>
        </Pressable>

        <View style={styles.section}>
          <SectionHeader
            title="Conteúdos"
            actionLabel="+ Adicionar"
            onAction={() => {
              setEditingContent(null);
              setContentVisible(true);
            }}
          />

          {subject.contents.length === 0 ? (
            <Text style={styles.empty}>Nenhum conteúdo cadastrado.</Text>
          ) : (
            subject.contents.map((content) => (
              <View key={content.id} style={styles.item}>
                <Text style={styles.itemText}>{content.title}</Text>
                {content.description ? <Text style={styles.itemDescription}>{content.description}</Text> : null}
                <Text style={[styles.itemStatus, content.completed && styles.completedText]}>
                  {content.completed ? "Concluído" : "Pendente"}
                </Text>
                <View style={styles.actionsRow}>
                  <ActionButton
                    label={content.completed ? "Marcar pendente" : "Concluir"}
                    color={content.completed ? "#263238" : "#007D4A"}
                    onPress={() => handleToggleContent(content)}
                  />
                  <ActionButton
                    label="Editar"
                    color="#263238"
                    onPress={() => {
                      setEditingContent(content);
                      setContentVisible(true);
                    }}
                  />
                  <ActionButton label="Excluir" color="#B00020" onPress={() => handleDeleteContent(content)} />
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader
            title="Datas importantes"
            actionLabel="+ Adicionar"
            onAction={() => {
              setEditingEvent(null);
              setEventVisible(true);
            }}
          />

          {subject.events.length === 0 ? (
            <Text style={styles.empty}>Nenhuma data cadastrada.</Text>
          ) : (
            subject.events
              .slice()
              .sort((first, second) => first.date.localeCompare(second.date))
              .map((event) => (
                <View key={event.id} style={styles.item}>
                  <Text style={styles.itemText}>{event.title}</Text>
                  <Text style={styles.itemDate}>
                    {eventTypeLabels[event.type]} • {formatEventDate(event.date)}
                  </Text>
                  <View style={styles.actionsRow}>
                    <ActionButton
                      label="Editar"
                      color="#263238"
                      onPress={() => {
                        setEditingEvent(event);
                        setEventVisible(true);
                      }}
                    />
                    <ActionButton label="Excluir" color="#B00020" onPress={() => handleDeleteEvent(event)} />
                  </View>
                </View>
              ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Histórico de estudo</Text>
          {subject.studyHistory.length === 0 ? (
            <Text style={styles.empty}>Nenhuma sessão registrada ainda.</Text>
          ) : (
            subject.studyHistory
              .slice()
              .reverse()
              .slice(0, 5)
              .map((session) => (
                <View key={session.id} style={styles.item}>
                  <Text style={styles.itemText}>{session.duration} min • +{session.xpEarned} XP</Text>
                  <Text style={styles.itemDate}>{new Date(session.date).toLocaleDateString("pt-BR")}</Text>
                </View>
              ))
          )}
        </View>

        <View style={styles.card}>
          <SectionHeader title="Anotações" actionLabel="Editar" onAction={() => setNotesVisible(true)} />
          <Text style={styles.detail}>{subject.notes || "Nenhuma anotação ainda."}</Text>
        </View>
      </ScrollView>

      <AddContentModal
        visible={contentVisible}
        content={editingContent}
        onClose={closeContentModal}
        onSubmit={handleContentSubmit}
      />
      <AddEventModal
        visible={eventVisible}
        event={editingEvent}
        onClose={closeEventModal}
        onSubmit={handleEventSubmit}
      />
      <EditNotesModal
        visible={notesVisible}
        notes={subject.notes}
        onClose={() => setNotesVisible(false)}
        onSave={handleSaveNotes}
      />
      <StudySessionModal
        visible={studySessionVisible}
        contents={subject.contents}
        onClose={() => setStudySessionVisible(false)}
        onSave={handleSaveStudy}
      />
    </SafeAreaView>
  );
}

function SectionHeader({ title, actionLabel, onAction }: { title: string; actionLabel: string; onAction: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Pressable onPress={onAction}>
        <Text style={styles.link}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

function ActionButton({ label, color, onPress }: { label: string; color: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.actionButton, { backgroundColor: color }]}>
      <Text style={styles.actionButtonText}>{label}</Text>
    </Pressable>
  );
}

const styles = {
  safeArea: { flex: 1, backgroundColor: "#080810" },
  content: { padding: 20, paddingBottom: 50 },
  back: { color: "#7C4DFF", fontSize: 16 },
  identityCard: { marginTop: 20, backgroundColor: "#161625", padding: 20, borderRadius: 16, borderLeftWidth: 6 },
  card: { marginTop: 20, backgroundColor: "#161625", padding: 16, borderRadius: 16 },
  subjectName: { color: "white", fontSize: 28, fontWeight: "700" },
  description: { color: "#BBB", marginTop: 8 },
  sectionTitle: { color: "white", fontSize: 20, fontWeight: "700" },
  detail: { color: "#AAA", marginTop: 10 },
  absenceCount: { color: "#FFB74D", marginTop: 10, fontWeight: "700" },
  studyButton: { backgroundColor: "#7C4DFF", padding: 15, borderRadius: 12, marginTop: 20 },
  studyButtonText: { color: "white", textAlign: "center", fontWeight: "700" },
  section: { marginTop: 25 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  link: { color: "#7C4DFF", fontWeight: "700" },
  empty: { color: "#777", marginTop: 10 },
  item: { backgroundColor: "#141424", padding: 12, borderRadius: 10, marginTop: 10 },
  itemText: { color: "white", fontWeight: "600" },
  itemDescription: { color: "#AAA", marginTop: 5 },
  itemStatus: { color: "#FFB74D", marginTop: 7, fontSize: 12, fontWeight: "700" },
  completedText: { color: "#00E676" },
  itemDate: { color: "#888", marginTop: 4 },
  actionsRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 12 },
  actionButton: { paddingVertical: 9, paddingHorizontal: 11, borderRadius: 9, marginRight: 8, marginBottom: 6 },
  actionButtonText: { color: "white", fontWeight: "700", fontSize: 12 },
} as const;
