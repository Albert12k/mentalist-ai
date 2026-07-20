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
import AddFlashcardModal from "../components/AddFlashcardModal";
import AudioRecorderModal from "../components/AudioRecorderModal";
import CreateQuizModal from "../components/CreateQuizModal";
import EditNotesModal from "../components/EditNotesModal";
import FlashcardPracticeModal from "../components/FlashcardPracticeModal";
import MaterialCard from "../components/MaterialCard";
import MaterialImportModal from "../components/MaterialImportModal";
import QuizPlayerModal from "../components/QuizPlayerModal";
import StudySessionModal from "../components/StudySessionModal";
import { useSubjects } from "../contexts/SubjectsContext";
import { useAuth } from "../contexts/AuthContext";
import {
  deleteLocalMaterial,
  formatMaterialDate,
  groupMaterialsByDate,
  MaterialDraft,
  persistImportedMaterial,
  suggestMaterialCategory,
} from "../services/materials";
import { deleteUserAsset, uploadUserAsset } from "../services/cloudStorage";
import { generateFlashcardsFromSubject, generateQuizFromSubject } from "../services/assessmentGenerator";
import { generateAiFlashcards, generateAiQuiz } from "../services/aiTutor";
import { extractMaterialText } from "../services/aiTutor";
import {
  FlashcardReviewRating,
  formatNextReview,
  getDueFlashcards,
  reviewFlashcard,
} from "../services/flashcardReview";
import {
  cancelActivityReminders,
  scheduleActivityReminders,
} from "../services/activityReminders";
import { recordStudySession } from "../services/studySession";
import {
  Subject,
  SubjectContent,
  SubjectEvent,
  SubjectFlashcard,
  SubjectMaterial,
  SubjectQuiz,
} from "../types/Subject";

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
  const { userId } = useAuth();
  const [contentVisible, setContentVisible] = useState(false);
  const [eventVisible, setEventVisible] = useState(false);
  const [notesVisible, setNotesVisible] = useState(false);
  const [studySessionVisible, setStudySessionVisible] = useState(false);
  const [materialVisible, setMaterialVisible] = useState(false);
  const [audioVisible, setAudioVisible] = useState(false);
  const [flashcardCreateVisible, setFlashcardCreateVisible] = useState(false);
  const [flashcardPracticeVisible, setFlashcardPracticeVisible] = useState(false);
  const [quizCreateVisible, setQuizCreateVisible] = useState(false);
  const [quizPlayerVisible, setQuizPlayerVisible] = useState(false);
  const [editingContent, setEditingContent] = useState<SubjectContent | null>(null);
  const [editingEvent, setEditingEvent] = useState<SubjectEvent | null>(null);
  const [materialDraft, setMaterialDraft] = useState<MaterialDraft | null>(null);
  const [previewMaterial, setPreviewMaterial] = useState<SubjectMaterial | null>(null);
  const [playingQuiz, setPlayingQuiz] = useState<SubjectQuiz | null>(null);
  const [generatingAssessment, setGeneratingAssessment] = useState<"flashcards" | "quiz" | null>(null);

  const subject = subjects.find((item) => item.id === routeSubject.id) ?? routeSubject;
  const materials = subject.materials ?? [];
  const flashcards = subject.flashcards ?? [];
  const quizzes = subject.quizzes ?? [];
  const dueFlashcards = getDueFlashcards(flashcards);

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

  async function handleEventSubmit(event: SubjectEvent) {
    const existingEvent = subject.events.find((item) => item.id === event.id);
    let notificationIds: string[] = [];
    const savedEvent = { ...event, completed: existingEvent?.completed ?? false };

    try {
      notificationIds = await scheduleActivityReminders(
        savedEvent,
        subject.name,
        existingEvent?.notificationIds,
      );
    } catch {
      // A data ainda é salva; a Home continua mostrando o lembrete.
      Alert.alert("Atividade salva", "Não foi possível programar o alerta do dispositivo agora.");
    }

    updateSubject({
      ...subject,
      events: existingEvent
        ? subject.events.map((item) => item.id === event.id ? { ...savedEvent, notificationIds } : item)
        : [...subject.events, { ...savedEvent, notificationIds }],
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
      const storedFile = await persistImportedMaterial(file.uri, file.name);

      setMaterialDraft({
        title: removeExtension(file.name),
        type: "pdf",
        category: suggestMaterialCategory("pdf", file.name),
        uri: storedFile.uri,
        webStorageKey: storedFile.webStorageKey,
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
      const storedFile = await persistImportedMaterial(image.uri, fileName);

      setMaterialDraft({
        title: removeExtension(fileName),
        type: "image",
        category: suggestMaterialCategory("image", fileName),
        uri: storedFile.uri,
        webStorageKey: storedFile.webStorageKey,
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
    if (materialDraft) void deleteLocalMaterial(materialDraft.uri, materialDraft.webStorageKey);
    setMaterialVisible(false);
    setMaterialDraft(null);
  }

  async function handleSaveMaterial(draft: MaterialDraft) {
    let storagePath: string | undefined;
    let extractedText: string | undefined;

    // O arquivo local é mantido como reserva caso a internet falhe durante o envio.
    if (userId) {
      try {
        const extension = draft.type === "pdf" ? "pdf" : draft.type === "audio" ? "m4a" : "jpg";
        const uploaded = await uploadUserAsset(
          userId,
          draft.uri,
          "materials",
          `${draft.title}.${extension}`,
          draft.mimeType ?? (draft.type === "pdf" ? "application/pdf" : draft.type === "audio" ? "audio/mp4" : "image/jpeg"),
        );
        storagePath = uploaded.path;
        if (draft.type !== "audio") extractedText = await extractMaterialText(uploaded.url, draft.mimeType ?? (draft.type === "pdf" ? "application/pdf" : "image/jpeg"));
      } catch {
        Alert.alert("Salvo neste aparelho", "Não foi possível enviar este material agora. Ele continua salvo localmente.");
      }
    }

    updateSubject({
      ...subject,
      materials: [
        ...materials,
        {
          ...draft,
          ...(storagePath ? { storagePath } : {}),
          ...(extractedText ? { extractedText, extractedAt: new Date().toISOString() } : {}),
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          postedAt: new Date().toISOString(),
        },
      ],
    });
    setMaterialVisible(false);
    setMaterialDraft(null);
  }

  function handleSaveFlashcard(flashcard: SubjectFlashcard) {
    updateSubject({ ...subject, flashcards: [...flashcards, flashcard] });
    setFlashcardCreateVisible(false);
  }

  async function handleGenerateFlashcards() {
    if (generatingAssessment) return;
    setGeneratingAssessment("flashcards");
    const generatedByAi = await generateAiFlashcards(subject);
    setGeneratingAssessment(null);
    const generatedFlashcards = generatedByAi.length ? generatedByAi : generateFlashcardsFromSubject(subject, flashcards);

    if (generatedFlashcards.length === 0) {
      Alert.alert(
        "Nada novo para gerar",
        "Adicione conteúdos à matéria ou crie flashcards manuais para complementar a revisão.",
      );
      return;
    }

    updateSubject({ ...subject, flashcards: [...flashcards, ...generatedFlashcards] });
    Alert.alert("Flashcards criados", `${generatedFlashcards.length} flashcard(s) foram gerados a partir dos conteúdos.`);
  }

  function handleReviewedFlashcard(flashcard: SubjectFlashcard, rating: FlashcardReviewRating) {
    updateSubject({
      ...subject,
      flashcards: flashcards.map((item) => item.id === flashcard.id
        ? reviewFlashcard(item, rating)
        : item),
    });
  }

  function handleSaveQuiz(quiz: SubjectQuiz) {
    updateSubject({ ...subject, quizzes: [...quizzes, quiz] });
    setQuizCreateVisible(false);
  }

  async function handleGenerateQuiz() {
    if (generatingAssessment) return;
    setGeneratingAssessment("quiz");
    const quiz = await generateAiQuiz(subject) ?? generateQuizFromSubject(subject);
    setGeneratingAssessment(null);

    if (!quiz) {
      Alert.alert(
        "Descrição necessária",
        "Adicione uma descrição aos conteúdos da matéria para o Mentalis criar perguntas confiáveis.",
      );
      return;
    }

    const sourceContentIds = quiz.sourceContentIds ?? [];
    const alreadyGenerated = quizzes.some((item) => {
      const existingSourceContentIds = item.sourceContentIds ?? [];

      return existingSourceContentIds.length === sourceContentIds.length
        && existingSourceContentIds.every((contentId) => sourceContentIds.includes(contentId));
    });

    if (alreadyGenerated) {
      Alert.alert("Quiz já criado", "Exclua o quiz anterior antes de gerar outro com os mesmos conteúdos.");
      return;
    }

    updateSubject({ ...subject, quizzes: [...quizzes, quiz] });
    Alert.alert("Quiz criado", `${quiz.questions.length} pergunta(s) foram geradas a partir das descrições dos conteúdos.`);
  }

  function handleFinishQuiz(quiz: SubjectQuiz, correctAnswers: number) {
    const lastScore = quiz.questions.length
      ? Math.round((correctAnswers / quiz.questions.length) * 100)
      : 0;

    updateSubject({
      ...subject,
      quizzes: quizzes.map((item) => item.id === quiz.id
        ? { ...item, lastScore, lastAttemptedAt: new Date().toISOString() }
        : item),
    });
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
      void cancelActivityReminders(event.notificationIds);
    });
  }

  async function handleToggleEventCompleted(event: SubjectEvent) {
    const completed = !event.completed;

    if (completed) {
      updateSubject({
        ...subject,
        events: subject.events.map((item) => (
          item.id === event.id ? { ...item, completed } : item
        )),
      });
      void cancelActivityReminders(event.notificationIds);
      return;
    }

    let notificationIds = event.notificationIds;
    try {
      notificationIds = await scheduleActivityReminders({ ...event, completed: false }, subject.name, event.notificationIds);
    } catch {
      Alert.alert("Atividade reaberta", "A atividade voltou para a agenda, mas não foi possível programar alertas agora.");
    }

    updateSubject({
      ...subject,
      events: subject.events.map((item) => (
        item.id === event.id ? { ...item, completed: false, notificationIds } : item
      )),
    });
  }

  function handleDeleteMaterial(material: SubjectMaterial) {
    confirmRemoval(`Excluir o material "${material.title}"?`, () => {
      updateSubject({
        ...subject,
        materials: materials.filter((item) => item.id !== material.id),
      });
      void deleteLocalMaterial(material.uri, material.webStorageKey);
      void deleteUserAsset(material.storagePath);
    });
  }

  function handleDeleteFlashcard(flashcard: SubjectFlashcard) {
    confirmRemoval("Excluir este flashcard?", () => {
      updateSubject({ ...subject, flashcards: flashcards.filter((item) => item.id !== flashcard.id) });
    });
  }

  function handleDeleteQuiz(quiz: SubjectQuiz) {
    confirmRemoval(`Excluir o quiz "${quiz.title}"?`, () => {
      updateSubject({ ...subject, quizzes: quizzes.filter((item) => item.id !== quiz.id) });
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
            title="Flashcards"
            actionLabel="+ Manual"
            onAction={() => setFlashcardCreateVisible(true)}
          />
          <Text style={styles.sectionHint}>O Mentalis pode criar perguntas de revisão e programar o próximo encontro com cada carta.</Text>
          <View style={styles.materialActions}>
            <ActionButton label={generatingAssessment === "flashcards" ? "IA criando..." : "Gerar com IA"} color="#5E35B1" onPress={() => void handleGenerateFlashcards()} />
          </View>

          {flashcards.length === 0 ? (
            <Text style={styles.empty}>Nenhum flashcard criado ainda.</Text>
          ) : (
            <>
              <Pressable onPress={() => setFlashcardPracticeVisible(true)} style={styles.flashcardPracticeButton}>
                <Text style={styles.flashcardPracticeText}>
                  {dueFlashcards.length > 0
                    ? `Revisar agora (${dueFlashcards.length})`
                    : `Revisar todos (${flashcards.length})`}
                </Text>
              </Pressable>
              {flashcards.map((flashcard) => (
                <View key={flashcard.id} style={styles.item}>
                  <Text style={styles.itemText}>{flashcard.question}</Text>
                  <Text style={styles.itemDate}>
                    Revisado {flashcard.reviewCount} vez(es) • {formatNextReview(flashcard.nextReviewAt)}
                  </Text>
                  <View style={styles.actionsRow}>
                    <ActionButton label="Excluir" color="#B00020" onPress={() => handleDeleteFlashcard(flashcard)} />
                  </View>
                </View>
              ))}
            </>
          )}
        </View>

        <View style={styles.section}>
          <SectionHeader
            title="Quizzes"
            actionLabel="+ Manual"
            onAction={() => setQuizCreateVisible(true)}
          />
          <Text style={styles.sectionHint}>Gere perguntas a partir das descrições dos conteúdos ou crie manualmente.</Text>
          <View style={styles.materialActions}>
            <ActionButton label={generatingAssessment === "quiz" ? "IA criando..." : "Gerar quiz com IA"} color="#5E35B1" onPress={() => void handleGenerateQuiz()} />
          </View>

          {quizzes.length === 0 ? (
            <Text style={styles.empty}>Nenhum quiz criado ainda.</Text>
          ) : (
            quizzes.map((quiz) => (
              <View key={quiz.id} style={styles.item}>
                <Text style={styles.itemText}>{quiz.title}</Text>
                <Text style={styles.itemDate}>{quiz.questions.length} pergunta(s)</Text>
                {quiz.lastScore !== undefined ? (
                  <Text style={styles.quizScore}>Último resultado: {quiz.lastScore}%</Text>
                ) : null}
                <View style={styles.actionsRow}>
                  <ActionButton
                    label="Fazer quiz"
                    color="#5E35B1"
                    onPress={() => {
                      setPlayingQuiz(quiz);
                      setQuizPlayerVisible(true);
                    }}
                  />
                  <ActionButton label="Excluir" color="#B00020" onPress={() => handleDeleteQuiz(quiz)} />
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
                <View key={event.id} style={[styles.item, event.completed && styles.completedEvent]}>
                  <Text style={[styles.itemText, event.completed && styles.completedText]}>{event.title}</Text>
                  <Text style={styles.itemDate}>
                    {eventTypeLabels[event.type]} • {formatEventDate(event.date)}
                  </Text>
                  {event.completed ? (
                    <Text style={styles.eventDone}>Concluída</Text>
                  ) : event.type !== "review" ? (
                    <Text style={styles.reminderDetail}>Alertas: 5, 3, 2 e 1 dia antes</Text>
                  ) : null}
                  <View style={styles.actionsRow}>
                    <ActionButton
                      label={event.completed ? "Reabrir" : "Concluir"}
                      color={event.completed ? "#5E35B1" : "#007D4A"}
                      onPress={() => handleToggleEventCompleted(event)}
                    />
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
      <AddFlashcardModal
        visible={flashcardCreateVisible}
        onClose={() => setFlashcardCreateVisible(false)}
        onSave={handleSaveFlashcard}
      />
      <FlashcardPracticeModal
        visible={flashcardPracticeVisible}
        flashcards={dueFlashcards.length > 0 ? dueFlashcards : flashcards}
        onClose={() => setFlashcardPracticeVisible(false)}
        onReviewed={handleReviewedFlashcard}
      />
      <CreateQuizModal
        visible={quizCreateVisible}
        onClose={() => setQuizCreateVisible(false)}
        onSave={handleSaveQuiz}
      />
      <QuizPlayerModal
        visible={quizPlayerVisible}
        quiz={playingQuiz}
        onClose={() => {
          setQuizPlayerVisible(false);
          setPlayingQuiz(null);
        }}
        onFinish={handleFinishQuiz}
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
  completedEvent: { opacity: 0.72 },
  eventDone: { color: "#00E676", marginTop: 7, fontSize: 12, fontWeight: "700" },
  itemDate: { color: "#888", marginTop: 4 },
  reminderDetail: { color: "#B9A8FF", marginTop: 6, fontSize: 12, fontWeight: "700" },
  actionsRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 12 },
  materialActions: { flexDirection: "row", flexWrap: "wrap", marginTop: 12 },
  materialGroup: { marginTop: 18 },
  materialDate: { color: "#C5B5FF", fontWeight: "700", textTransform: "capitalize" },
  flashcardPracticeButton: { backgroundColor: "#5E35B1", padding: 13, borderRadius: 10, marginTop: 13 },
  flashcardPracticeText: { color: "white", textAlign: "center", fontWeight: "700" },
  quizScore: { color: "#00E676", marginTop: 7, fontWeight: "700", fontSize: 12 },
  actionButton: { paddingVertical: 9, paddingHorizontal: 11, borderRadius: 9, marginRight: 8, marginBottom: 6 },
  actionButtonText: { color: "white", fontWeight: "700", fontSize: 12 },
  previewOverlay: { flex: 1, backgroundColor: "#080810", padding: 20 },
  previewCloseButton: { alignSelf: "flex-end", padding: 12, marginBottom: 10 },
  previewCloseText: { color: "#C5B5FF", fontWeight: "700" },
  fullImage: { flex: 1, width: "100%" },
} as const;
