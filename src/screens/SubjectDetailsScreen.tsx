import { useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";

import AddContentModal from "../components/AddContentModal";
import AddEventModal from "../components/AddEventModal";
import AudioRecorderModal from "../components/AudioRecorderModal";
import EditNotesModal from "../components/EditNotesModal";
import MaterialCard from "../components/MaterialCard";
import MaterialImportModal from "../components/MaterialImportModal";
import StudySessionModal from "../components/StudySessionModal";
import { useSubjects } from "../contexts/SubjectsContext";
import {
  deleteLocalMaterial,
  formatMaterialDate,
  groupMaterialsByDate,
  MaterialDraft,
  persistImportedMaterial,
  suggestMaterialCategory,
} from "../services/materials";
import { recordStudySession } from "../services/studySession";
import { Subject, SubjectContent, SubjectEvent, SubjectMaterial } from "../types/Subject";

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
  const [materialVisible, setMaterialVisible] = useState(false);
  const [audioVisible, setAudioVisible] = useState(false);
  const [editingContent, setEditingContent] = useState<SubjectContent | null>(null);
  const [editingEvent, setEditingEvent] = useState<SubjectEvent | null>(null);
  const [materialDraft, setMaterialDraft] = useState<MaterialDraft | null>(null);
  const [previewMaterial, setPreviewMaterial] = useState<SubjectMaterial | null>(null);

  const subject = subjects.find((item) => item.id === routeSubject.id) ?? routeSubject;
  const materials = subject.materials ?? [];

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

  function removeExtension(fileName: string): string {
    return fileName.replace(/\.[^/.]+$/, "");
  }

  // PDF: usamos o seletor do sistema, limitado a arquivos PDF. Em celulares,
  // o arquivo é copiado para a pasta persistente do aplicativo antes de salvar.
  async function handlePickPdf() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        multiple: false,
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      const uri = await persistImportedMaterial(file.uri, file.name);

      setMaterialDraft({
        title: removeExtension(file.name),
        type: "pdf",
        category: suggestMaterialCategory("pdf", file.name),
        uri,
        mimeType: file.mimeType ?? "application/pdf",
        size: file.size,
      });
      setMaterialVisible(true);
    } catch {
      Alert.alert("Não foi possível importar", "Escolha outro PDF e tente novamente.");
    }
  }

  // Foto: a pessoa escolhe uma imagem já existente (como uma anotação de
  // caderno). A categoria sugerida é Anotação, mas pode ser alterada depois.
  async function handlePickImage() {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Fotos necessárias", "Permita o acesso às fotos para anexar uma anotação.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: false,
        quality: 0.9,
      });

      if (result.canceled) return;

      const image = result.assets[0];
      const fileName = image.fileName ?? `anotacao-${Date.now()}.jpg`;
      const uri = await persistImportedMaterial(image.uri, fileName);

      setMaterialDraft({
        title: removeExtension(fileName),
        type: "image",
        category: suggestMaterialCategory("image", fileName),
        uri,
        mimeType: image.mimeType ?? "image/jpeg",
        size: image.fileSize,
      });
      setMaterialVisible(true);
    } catch {
      Alert.alert("Não foi possível importar", "Escolha outra foto e tente novamente.");
    }
  }

  function handleAudioRecorded(draft: MaterialDraft) {
    setAudioVisible(false);
    setMaterialDraft(draft);
    setMaterialVisible(true);
  }

  function discardMaterialDraft() {
    if (materialDraft) deleteLocalMaterial(materialDraft.uri);
    setMaterialVisible(false);
    setMaterialDraft(null);
  }

  function handleSaveMaterial(draft: MaterialDraft) {
    updateSubject({
      ...subject,
      materials: [
        ...materials,
        {
          ...draft,
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          postedAt: new Date().toISOString(),
        },
      ],
    });
    setMaterialVisible(false);
    setMaterialDraft(null);
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

  function handleDeleteMaterial(material: SubjectMaterial) {
    confirmRemoval(`Excluir o material "${material.title}"?`, () => {
      updateSubject({
        ...subject,
        materials: materials.filter((item) => item.id !== material.id),
      });
      deleteLocalMaterial(material.uri);
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
          <Text style={styles.sectionTitle}>Materiais da matéria</Text>
          <Text style={styles.sectionHint}>
            PDFs, fotos de anotações e áudios ficam classificados e separados pela data de postagem.
          </Text>

          <View style={styles.materialActions}>
            <ActionButton label="+ PDF da aula" color="#263238" onPress={handlePickPdf} />
            <ActionButton label="+ Foto da anotação" color="#263238" onPress={handlePickImage} />
            <ActionButton label="Gravar áudio" color="#B00020" onPress={() => setAudioVisible(true)} />
          </View>

          {materials.length === 0 ? (
            <Text style={styles.empty}>Nenhum material adicionado ainda.</Text>
          ) : (
            groupMaterialsByDate(materials).map((group) => (
              <View key={group.date} style={styles.materialGroup}>
                <Text style={styles.materialDate}>{formatMaterialDate(group.date)}</Text>
                {group.materials.map((material) => (
                  <MaterialCard
                    key={material.id}
                    material={material}
                    onDelete={() => handleDeleteMaterial(material)}
                    onPreviewImage={setPreviewMaterial}
                  />
                ))}
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
      <MaterialImportModal
        visible={materialVisible}
        draft={materialDraft}
        onClose={discardMaterialDraft}
        onSave={handleSaveMaterial}
      />
      <AudioRecorderModal
        visible={audioVisible}
        onClose={() => setAudioVisible(false)}
        onRecorded={handleAudioRecorded}
      />
      <Modal
        visible={Boolean(previewMaterial)}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewMaterial(null)}
      >
        <SafeAreaView style={styles.previewOverlay}>
          <Pressable onPress={() => setPreviewMaterial(null)} style={styles.previewCloseButton}>
            <Text style={styles.previewCloseText}>Fechar</Text>
          </Pressable>
          {previewMaterial ? (
            <Image source={{ uri: previewMaterial.uri }} style={styles.fullImage} resizeMode="contain" />
          ) : null}
        </SafeAreaView>
      </Modal>
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
  sectionHint: { color: "#888", marginTop: 7, lineHeight: 19 },
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
  materialActions: { flexDirection: "row", flexWrap: "wrap", marginTop: 12 },
  materialGroup: { marginTop: 18 },
  materialDate: { color: "#C5B5FF", fontWeight: "700", textTransform: "capitalize" },
  actionButton: { paddingVertical: 9, paddingHorizontal: 11, borderRadius: 9, marginRight: 8, marginBottom: 6 },
  actionButtonText: { color: "white", fontWeight: "700", fontSize: 12 },
  previewOverlay: { flex: 1, backgroundColor: "#080810", padding: 20 },
  previewCloseButton: { alignSelf: "flex-end", padding: 12, marginBottom: 10 },
  previewCloseText: { color: "#C5B5FF", fontWeight: "700" },
  fullImage: { flex: 1, width: "100%" },
} as const;
