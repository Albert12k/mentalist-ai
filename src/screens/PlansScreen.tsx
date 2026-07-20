import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { useAuth } from "../contexts/AuthContext";
import { useProfile } from "../contexts/ProfileContext";
import { planDefinitions } from "../services/plans";

const freeFeatures = ["Matérias, agenda e faltas", "Progresso, desafios e recompensas", "Flashcards e quizzes locais", "3 ações de IA para experimentar"];
const proFeatures = ["Tutor e plano diário com IA", "Leitura de PDFs e fotos", "Transcrição de áudios", "Resumos, quizzes e flashcards com IA", "100 ações de IA por mês", "5 GB de armazenamento"];

export default function PlansScreen() {
  const navigation = useNavigation<any>();
  const { profile } = useProfile();
  const { isAdmin } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => navigation.goBack()}><Text style={styles.back}>Voltar</Text></Pressable>
        <Text style={styles.title}>Planos e pagamento</Text>
        <Text style={styles.subtitle}>Use o Mentalis gratuitamente e evolua para o Pro quando precisar de mais inteligência e armazenamento.</Text>

        {isAdmin ? <View style={styles.adminCard}><Text style={styles.adminTitle}>Conta administradora</Text><Text style={styles.adminText}>Todos os recursos estão liberados e não consomem a cota dos planos.</Text></View> : null}

        <PlanCard name={planDefinitions.free.name} price="Grátis" features={freeFeatures} current={!isAdmin && profile.plan === "free"} />
        <PlanCard name={planDefinitions.pro.name} price="Preço a definir" features={proFeatures} current={!isAdmin && profile.plan === "pro"} highlight />

        <View style={styles.paymentCard}>
          <Text style={styles.cardTitle}>Pagamento</Text>
          <Text style={styles.cardText}>A cobrança ainda não está ativa. Na próxima etapa, este espaço receberá assinatura, renovação e histórico de pagamentos.</Text>
          <Pressable disabled style={styles.disabledButton}><Text style={styles.disabledText}>Assinaturas em breve</Text></Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PlanCard({ name, price, features, current, highlight }: { name: string; price: string; features: string[]; current: boolean; highlight?: boolean }) {
  return <View style={[styles.planCard, highlight && styles.proCard]}><View style={styles.row}><Text style={styles.planName}>{name}</Text>{current ? <Text style={styles.currentBadge}>ATUAL</Text> : null}</View><Text style={styles.price}>{price}</Text>{features.map((feature) => <Text key={feature} style={styles.feature}>✓ {feature}</Text>)}</View>;
}

const styles = {
  safeArea: { flex: 1, backgroundColor: "#080810" },
  content: { padding: 20, paddingBottom: 50 },
  back: { color: "#9D7BFF", fontWeight: "700" },
  title: { color: "white", fontSize: 29, fontWeight: "800", marginTop: 20 },
  subtitle: { color: "#AAA", lineHeight: 21, marginTop: 8, marginBottom: 18 },
  adminCard: { backgroundColor: "#163427", borderWidth: 1, borderColor: "#2D8A63", borderRadius: 16, padding: 16, marginBottom: 14 },
  adminTitle: { color: "#75E1AE", fontSize: 18, fontWeight: "800" },
  adminText: { color: "#B8DBC9", marginTop: 7, lineHeight: 19 },
  planCard: { backgroundColor: "#161625", borderRadius: 18, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: "#292940" },
  proCard: { backgroundColor: "#211943", borderColor: "#7048DF" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  planName: { color: "white", fontSize: 21, fontWeight: "800" },
  currentBadge: { color: "#72DDA9", fontSize: 11, fontWeight: "800", backgroundColor: "#163427", paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999 },
  price: { color: "#CABBFF", fontSize: 17, fontWeight: "700", marginTop: 7, marginBottom: 12 },
  feature: { color: "#D8D6E4", marginTop: 8, lineHeight: 19 },
  paymentCard: { backgroundColor: "#161625", borderRadius: 18, padding: 18, marginTop: 4 },
  cardTitle: { color: "white", fontSize: 18, fontWeight: "800" },
  cardText: { color: "#AAA", lineHeight: 20, marginTop: 8 },
  disabledButton: { backgroundColor: "#343447", borderRadius: 12, padding: 13, marginTop: 16 },
  disabledText: { color: "#8D8D9B", fontWeight: "700", textAlign: "center" },
} as const;
