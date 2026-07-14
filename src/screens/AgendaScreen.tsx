import { useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { useSubjects } from "../contexts/SubjectsContext";
import { Subject, SubjectEvent } from "../types/Subject";

type AgendaFilter = "next" | "month" | "all";
type AgendaItem = { subject: Subject; event: SubjectEvent; daysUntil: number };

const DAY = 86_400_000;

// A data vem no formato AAAA-MM-DD. Usar meio-dia evita que o fuso horário
// transforme uma atividade do dia em uma atividade do dia anterior.
function getDaysUntil(date: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDate = new Date(`${date}T12:00:00`);

  return Math.round((eventDate.getTime() - today.getTime()) / DAY);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(new Date(`${date}T12:00:00`));
}

function getEventLabel(type: SubjectEvent["type"]) {
  if (type === "exam") return "Prova";
  if (type === "assignment") return "Trabalho";
  return "Revisão";
}

function getTimeLabel(daysUntil: number) {
  if (daysUntil < 0) return `${Math.abs(daysUntil)} dia(s) em atraso`;
  if (daysUntil === 0) return "Hoje";
  if (daysUntil === 1) return "Amanhã";
  return `Em ${daysUntil} dias`;
}

export default function AgendaScreen() {
  const navigation = useNavigation<any>();
  const { subjects } = useSubjects();
  const [filter, setFilter] = useState<AgendaFilter>("next");

  const events = useMemo<AgendaItem[]>(() => (
    subjects
      .flatMap((subject) => subject.events.filter((event) => !event.completed).map((event) => ({
        subject,
        event,
        daysUntil: getDaysUntil(event.date),
      })))
      .sort((first, second) => first.daysUntil - second.daysUntil)
  ), [subjects]);

  const visibleEvents = events.filter((item) => {
    if (filter === "all") return true;
    if (filter === "month") return item.daysUntil >= 0 && item.daysUntil <= 30;
    return item.daysUntil >= 0 && item.daysUntil <= 7;
  });
  const overdueCount = events.filter((item) => item.daysUntil < 0).length;
  const nextEvent = events.find((item) => item.daysUntil >= 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Agenda</Text>
        <Text style={styles.subtitle}>Veja provas, trabalhos e revisões em um só lugar.</Text>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{nextEvent ? "Próximo compromisso" : "Sua agenda está livre"}</Text>
          {nextEvent ? (
            <>
              <Text style={styles.summaryEvent}>{nextEvent.event.title}</Text>
              <Text style={styles.summaryDetail}>{nextEvent.subject.name} · {getTimeLabel(nextEvent.daysUntil)}</Text>
            </>
          ) : (
            <Text style={styles.summaryDetail}>Cadastre uma atividade dentro de uma matéria para vê-la aqui.</Text>
          )}
        </View>

        {overdueCount > 0 ? (
          <View style={styles.warningCard}>
            <Text style={styles.warningText}>{overdueCount} atividade(s) com prazo passado. Use “Todos” para conferir.</Text>
          </View>
        ) : null}

        <View style={styles.filters}>
          <FilterButton label="Próximos 7 dias" active={filter === "next"} onPress={() => setFilter("next")} />
          <FilterButton label="30 dias" active={filter === "month"} onPress={() => setFilter("month")} />
          <FilterButton label="Todos" active={filter === "all"} onPress={() => setFilter("all")} />
        </View>

        {visibleEvents.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Nada por aqui</Text>
            <Text style={styles.emptyText}>Não há atividades neste período.</Text>
          </View>
        ) : visibleEvents.map(({ subject, event, daysUntil }) => (
          <Pressable
            key={`${subject.id}-${event.id}`}
            onPress={() => navigation.navigate("SubjectDetails", { subject })}
            style={[styles.eventCard, { borderLeftColor: subject.color }]}
          >
            <View style={styles.eventHeader}>
              <View style={styles.eventMain}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.subjectName}>{subject.name} · {getEventLabel(event.type)}</Text>
              </View>
              <Text style={[styles.timeLabel, daysUntil < 0 && styles.overdueLabel]}>{getTimeLabel(daysUntil)}</Text>
            </View>
            <Text style={styles.dateLabel}>{formatDate(event.date)}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function FilterButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.filterButton, active && styles.filterButtonActive]}>
      <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = {
  safeArea: { flex: 1, backgroundColor: "#080810" },
  content: { padding: 20, paddingBottom: 40 },
  title: { color: "white", fontSize: 30, fontWeight: "700" },
  subtitle: { color: "#8888AA", marginTop: 6, marginBottom: 20 },
  summaryCard: { backgroundColor: "#342769", padding: 17, borderRadius: 16 },
  summaryTitle: { color: "#D6CFFF", fontSize: 13, fontWeight: "700" },
  summaryEvent: { color: "white", fontSize: 19, fontWeight: "700", marginTop: 8 },
  summaryDetail: { color: "#D6CFFF", marginTop: 5, lineHeight: 20 },
  warningCard: { backgroundColor: "#382518", borderWidth: 1, borderColor: "#9A5B1D", borderRadius: 12, padding: 12, marginTop: 12 },
  warningText: { color: "#FFD180", lineHeight: 19 },
  filters: { flexDirection: "row", flexWrap: "wrap", marginTop: 20, marginBottom: 8 },
  filterButton: { borderWidth: 1, borderColor: "#35354C", borderRadius: 20, paddingVertical: 8, paddingHorizontal: 11, marginRight: 8, marginBottom: 8 },
  filterButtonActive: { backgroundColor: "#7C4DFF", borderColor: "#7C4DFF" },
  filterText: { color: "#B9B9CD", fontSize: 12, fontWeight: "700" },
  filterTextActive: { color: "white" },
  eventCard: { backgroundColor: "#161625", padding: 15, borderRadius: 14, borderLeftWidth: 5, marginTop: 10 },
  eventHeader: { flexDirection: "row", alignItems: "flex-start" },
  eventMain: { flex: 1, marginRight: 10 },
  eventTitle: { color: "white", fontSize: 16, fontWeight: "700" },
  subjectName: { color: "#AAA", marginTop: 5, fontSize: 13 },
  timeLabel: { color: "#B9A8FF", fontWeight: "700", fontSize: 12 },
  overdueLabel: { color: "#FFB74D" },
  dateLabel: { color: "#77778E", marginTop: 11, textTransform: "capitalize", fontSize: 12 },
  emptyCard: { backgroundColor: "#161625", borderRadius: 16, padding: 18, marginTop: 8 },
  emptyTitle: { color: "white", fontWeight: "700", fontSize: 17 },
  emptyText: { color: "#8888AA", marginTop: 7 },
} as const;
