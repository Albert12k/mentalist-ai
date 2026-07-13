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
import { useNavigation } from "@react-navigation/native";

import CreateSubjectModal from "../components/CreateSubjectModal";
import EditSubjectModal from "../components/EditSubjectModal";
import { useSubjects } from "../contexts/SubjectsContext";
import { Subject } from "../types/Subject";

export default function SubjectsScreen() {
  const navigation = useNavigation<any>();
  const { subjects, addSubject, updateSubject, removeSubject } = useSubjects();
  const [createVisible, setCreateVisible] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  function openDetails(subject: Subject) {
    navigation.navigate("SubjectDetails", { subject });
  }

  function handleRegisterAbsence(subject: Subject) {
    updateSubject({
      ...subject,
      absences: subject.absences + 1,
    });
  }

  function handleSaveEdit(subject: Subject) {
    updateSubject(subject);
    setSelectedSubject(null);
  }

  function handleDelete(subject: Subject) {
    const remove = () => removeSubject(subject.id);

    if (Platform.OS === "web") {
      if (window.confirm(`Deseja remover ${subject.name}?`)) remove();
      return;
    }

    Alert.alert("Excluir matéria", `Deseja remover ${subject.name}?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: remove },
    ]);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Matérias</Text>
        <Text style={styles.subtitle}>Organize seus estudos e acompanhe suas faltas.</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {subjects.length === 0 ? (
          <Text style={styles.empty}>Nenhuma matéria criada ainda.</Text>
        ) : (
          subjects.map((subject) => (
            <View
              key={subject.id}
              style={[styles.subjectCard, { borderLeftColor: subject.color }]}
            >
              <Pressable onPress={() => openDetails(subject)}>
                <Text style={styles.subjectName}>{subject.name}</Text>
                <Text style={styles.detail}>Retenção: {subject.retention}%</Text>
                <Text style={styles.detail}>Dificuldade: {subject.difficulty}</Text>
                <Text style={styles.absenceCount}>Faltas registradas: {subject.absences}</Text>
              </Pressable>

              <View style={styles.actions}>
                <ActionButton label="Estudar" color="#7C4DFF" onPress={() => openDetails(subject)} />
                <ActionButton label="Falta +1" color="#B35C00" onPress={() => handleRegisterAbsence(subject)} />
                <ActionButton label="Editar" color="#263238" onPress={() => setSelectedSubject(subject)} />
                <ActionButton label="Excluir" color="#B00020" onPress={() => handleDelete(subject)} />
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Pressable onPress={() => setCreateVisible(true)} style={styles.createButton}>
        <Text style={styles.createButtonText}>+ Nova matéria</Text>
      </Pressable>

      <CreateSubjectModal
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
        onCreate={addSubject}
      />

      {selectedSubject && (
        <EditSubjectModal
          visible={true}
          subject={selectedSubject}
          onClose={() => setSelectedSubject(null)}
          onSave={handleSaveEdit}
        />
      )}
    </SafeAreaView>
  );
}

function ActionButton({
  label,
  color,
  onPress,
}: {
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.actionButton, { backgroundColor: color }]}>
      <Text style={styles.actionButtonText}>{label}</Text>
    </Pressable>
  );
}

const styles = {
  safeArea: {
    flex: 1,
    backgroundColor: "#080810",
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    color: "white",
    fontSize: 28,
    fontWeight: "700",
  },
  subtitle: {
    color: "#888",
    marginTop: 6,
  },
  listContent: {
    paddingBottom: 120,
  },
  empty: {
    color: "#888",
  },
  subjectCard: {
    backgroundColor: "#161625",
    padding: 16,
    borderRadius: 15,
    marginBottom: 15,
    borderLeftWidth: 6,
  },
  subjectName: {
    color: "white",
    fontSize: 19,
    fontWeight: "700",
  },
  detail: {
    color: "#AAA",
    marginTop: 7,
  },
  absenceCount: {
    color: "#FFB74D",
    marginTop: 7,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 15,
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  actionButtonText: {
    color: "white",
    fontWeight: "700",
  },
  createButton: {
    backgroundColor: "#7C4DFF",
    padding: 15,
    borderRadius: 12,
  },
  createButtonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "700",
  },
} as const;
