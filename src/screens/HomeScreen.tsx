import { SafeAreaView, Text, View } from "react-native";
import { useState } from "react";

// 🔥 COMPONENTES DO DESIGN
import MentalisCard from "../components/MentalisCard";
import XPBar from "../components/XPBar";
import ProgressBar from "../components/ProgressBar";

// 🎨 TEMA
import { colors } from "../theme/colors";

// 🧠 CONTEXT
import { useSubjects } from "../contexts/SubjectsContext";

export default function HomeScreen() {
  // =========================
  // 🧠 STATE: MODO DE ESTUDO
  // =========================
  const [studyMode, setStudyMode] =
    useState<"manual" | "guided" | "auto">("guided");

  // =========================
  // 📦 CONTEXT (MATÉRIAS)
  // =========================
  const { subjects } = useSubjects();

  // =========================
  // 🧠 IA DO TREINO DO DIA
  // =========================
  function getTodaySubjects() {
    if (subjects.length === 0) return [];

    // 🔥 ordena por menor retenção (mais fraco primeiro)
    const sorted = [...subjects].sort(
      (a, b) => a.retention - b.retention
    );

    // 🎯 modo manual = usuário decide depois (lista vazia aqui)
    if (studyMode === "manual") return [];

    // 🎯 modo guiado = foco no mais fraco
    if (studyMode === "guided") return sorted.slice(0, 1);

    // 🎯 modo auto = treino mais agressivo (top 3)
    if (studyMode === "auto") return sorted.slice(0, 3);

    return [];
  }

  const todaySubjects = getTodaySubjects();

  // =========================
  // 🎨 UI: SELETOR DE MODO
  // =========================
  const ModeSelector = () => (
    <MentalisCard>
      <Text
        style={{
          color: colors.primary,
          fontWeight: "700",
          marginBottom: 10,
        }}
      >
        MODO DE ESTUDO
      </Text>

      <View style={{ flexDirection: "row", gap: 10 }}>
        {["manual", "guided", "auto"].map((mode) => (
          <Text
            key={mode}
            onPress={() => setStudyMode(mode as any)}
            style={{
              color: "white",
              padding: 8,
              borderRadius: 8,
              backgroundColor:
                studyMode === mode ? "#7C4DFF" : "#222",
              textTransform: "capitalize",
            }}
          >
            {mode}
          </Text>
        ))}
      </View>
    </MentalisCard>
  );

  // =========================
  // 🎯 TREINO DO DIA
  // =========================
  const TodayTraining = () => (
    <MentalisCard>
      <Text
        style={{
          color: colors.primary,
          fontWeight: "700",
        }}
      >
        TREINO DE HOJE
      </Text>

      {todaySubjects.length === 0 ? (
        <>
          <Text
            style={{
              color: colors.text,
              fontSize: 20,
              marginTop: 10,
            }}
          >
            Nenhuma atividade disponível
          </Text>

          <Text
            style={{
              color: colors.subtitle,
              marginTop: 8,
            }}
          >
            Crie uma matéria ou mude para modo guiado.
          </Text>
        </>
      ) : (
        todaySubjects.map((subject) => (
          <View
            key={subject.id}
            style={{
              marginTop: 12,
              padding: 10,
              borderRadius: 10,
              backgroundColor: "#141424",
              borderLeftWidth: 4,
              borderLeftColor: subject.color,
            }}
          >
            <Text
              style={{
                color: colors.text,
                fontSize: 18,
                fontWeight: "600",
              }}
            >
              📘 {subject.name}
            </Text>

            <Text
              style={{
                color: colors.subtitle,
                marginTop: 4,
              }}
            >
              Retenção: {subject.retention}%
            </Text>
          </View>
        ))
      )}
    </MentalisCard>
  );

  // =========================
  // 🧠 RETORNO PRINCIPAL
  // =========================
  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.background,
        padding: 20,
      }}
    >
      {/* ================= HEADER ================= */}
      <Text
        style={{
          color: colors.text,
          fontSize: 30,
          fontWeight: "700",
        }}
      >
        🧠 Mentalis AI
      </Text>

      <Text
        style={{
          color: colors.subtitle,
          marginBottom: 20,
        }}
      >
        Academia para o cérebro
      </Text>

      {/* ================= COMPONENTES ================= */}
      <ModeSelector />
      <TodayTraining />

      {/* ================= XP ================= */}
      <View style={{ marginTop: 20 }}>
        <XPBar level={1} xp={0} />
      </View>

      {/* ================= RETENÇÃO ================= */}
      <MentalisCard>
        <Text
          style={{
            color: colors.text,
            marginBottom: 12,
            fontWeight: "600",
          }}
        >
          Retenção Geral
        </Text>

        <ProgressBar value={82} color={colors.success} />

        <Text
          style={{
            color: colors.success,
            marginTop: 10,
            fontWeight: "700",
          }}
        >
          82%
        </Text>
      </MentalisCard>
    </SafeAreaView>
  );
}