import { SafeAreaView, Text, View } from "react-native";

import MentalisCard from "../components/MentalisCard";
import XPBar from "../components/XPBar";
import ProgressBar from "../components/ProgressBar";

import { colors } from "../theme/colors";

export default function HomeScreen() {
  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.background,
        padding: 20,
      }}
    >
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
          marginBottom: 25,
        }}
      >
        Academia para o cérebro
      </Text>

      <MentalisCard>
        <Text
          style={{
            color: colors.primary,
            fontWeight: "700",
          }}
        >
          TREINO DE HOJE
        </Text>

        <Text
          style={{
            color: colors.text,
            fontSize: 22,
            marginTop: 10,
            fontWeight: "600",
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
         Cadastre sua primeira matéria para iniciar.
        </Text>
      </MentalisCard>

      <View style={{ marginTop: 20 }}>
        <XPBar
          level={1}
          xp={0}
        />
      </View>

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

        <ProgressBar
          value={0}
          color={colors.success}
        />

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