import { useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
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
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"recent" | "name" | "retention">("recent");

  // A busca e a ordem acontecem somente na tela: nenhuma informação da matéria
  // é alterada enquanto o estudante procura ou muda a visualização.
  const visibleSubjects = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");
    const filtered = subjects.filter((subject) => (
      subject.name.toLocaleLowerCase("pt-BR").includes(normalizedSearch)
      || (subject.description ?? "").toLocaleLowerCase("pt-BR").includes(normalizedSearch)
    ));

    return filtered.sort((first, second) => {
      if (sort === "name") return first.name.localeCompare(second.name, "pt-BR");
      if (sort === "retention") return first.retention - second.retention;
      return new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime();
    });
  }, [search, sort, subjects]);

  function openDetails(subject: Subject) {
    navigation.navigate("SubjectDetails", { subject });
  }

  function handleRegisterAbsence(subject: Subject) {
    updateSubject({
      ...subject,
      absences: subject.absences + 1,
    });
  }

  function handleRemoveAbsence(subject: Subject) {
    if (subject.absences === 0) return;

    updateSubject({
      ...subject,
      absences: subject.absences - 1,
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

      {subjects.length > 0 ? (
        <>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar matéria ou descrição"
            placeholderTextColor="#77778E"
            style={styles.searchInput}
          />
          <View style={styles.sortRow}>
            <SortButton label="Recentes" active={sort === "recent"} onPress={() => setSort("recent")} />
            <SortButton label="A-Z" active={sort === "name"} onPress={() => setSort("name")} />
            <SortButton label="Menor retenção" active={sort === "retention"} onPress={() => setSort("retention")} />
          </View>
          <Text style={styles.resultCount}>{visibleSubjects.length} matéria{visibleSubjects.length === 1 ? "" : "s"} encontrada{visibleSubjects.length === 1 ? "" : "s"}</Text>
        </>
      ) : null}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {subjects.length === 0 ? (
          <Text style={styles.empty}>Nenhuma matéria criada ainda.</Text>
        ) : visibleSubjects.length === 0 ? (
          <Text style={styles.empty}>Nenhuma matéria corresponde à sua busca.</Text>
        ) : (
          visibleSubjects.map((subject) => (
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
                <ActionButton label="Falta -1" color="#6D4C41" onPress={() => handleRemoveAbsence(subject)} />
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

function SortButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.sortButton, active && styles.sortButtonActive]}>
      <Text style={[styles.sortButtonText, active && styles.sortButtonTextActive]}>{label}</Text>
    </Pressable>
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
  searchInput: {
    backgroundColor: "#161625",
    borderWidth: 1,
    borderColor: "#2A2A3E",
    borderRadius: 12,
    color: "white",
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  sortRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
  },
  sortButton: {
    borderWidth: 1,
    borderColor: "#3A3A52",
    borderRadius: 18,
    paddingHorizontal: 11,
    paddingVertical: 7,
    marginRight: 8,
    marginBottom: 6,
  },
  sortButtonActive: { backgroundColor: "#7C4DFF", borderColor: "#7C4DFF" },
  sortButtonText: { color: "#B8B8CC", fontSize: 12, fontWeight: "700" },
  sortButtonTextActive: { color: "white" },
  resultCount: { color: "#8888AA", fontSize: 12, marginTop: 5, marginBottom: 8 },
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
