import { useEffect, useState } from "react";
import { Alert, Pressable, SafeAreaView, Text, TextInput, View } from "react-native";

import { useAuth } from "../contexts/AuthContext";
import { isAuthConfigured } from "../services/authConfig";

type ViewMode = "splash" | "login" | "signup" | "forgot";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { loading, signedIn, continueInPreview, signIn, signUp, resetPassword } = useAuth();
  const [view, setView] = useState<ViewMode>("splash");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (loading || signedIn) return;
    const timer = setTimeout(() => setView("login"), 1100);
    return () => clearTimeout(timer);
  }, [loading, signedIn]);

  // Uma sessão já existente deve abrir o app imediatamente. Antes desta ordem,
  // a splash continuava visível quando havia uma sessão de teste salva.
  if (loading) {
    return <SafeAreaView style={styles.splash}><Text style={styles.logo}>M</Text><Text style={styles.brand}>Mentalis</Text><Text style={styles.tagline}>Seu estudo, com direção.</Text></SafeAreaView>;
  }
  if (signedIn) return <>{children}</>;
  if (view === "splash") {
    return <SafeAreaView style={styles.splash}><Text style={styles.logo}>M</Text><Text style={styles.brand}>Mentalis</Text><Text style={styles.tagline}>Seu estudo, com direção.</Text></SafeAreaView>;
  }

  function validateFields(needsName = false) {
    if (needsName && !name.trim()) { Alert.alert("Nome obrigatório", "Informe seu nome para criar a conta."); return false; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { Alert.alert("E-mail inválido", "Informe um e-mail válido."); return false; }
    if (view !== "forgot" && password.length < 6) { Alert.alert("Senha curta", "Use pelo menos 6 caracteres."); return false; }
    return true;
  }

  async function handleSubmit() {
    if (!validateFields(view === "signup")) return;
    if (view === "forgot") {
      const error = await resetPassword(email);
      if (error) Alert.alert("Não foi possível enviar", error);
      else {
        Alert.alert("Verifique seu e-mail", "Enviamos um link para você criar uma nova senha.");
        setView("login");
      }
      return;
    }
    if (view === "signup") {
      const result = await signUp(email, password, name.trim());
      if (result.error) Alert.alert("Não foi possível criar", result.error);
      else if (result.needsConfirmation) {
        Alert.alert("Confirme seu e-mail", "Enviamos um link de confirmação. Depois, volte e entre na sua conta.");
        setView("login");
      }
      return;
    }
    const error = await signIn(email, password);
    if (error) Alert.alert("Não foi possível entrar", error);
  }

  const content = view === "signup"
    ? { title: "Crie sua conta", subtitle: "Salve seu progresso e continue de onde parou.", button: "Criar conta", alternate: "Já tenho uma conta", alternateView: "login" as ViewMode }
    : view === "forgot"
      ? { title: "Recuperar senha", subtitle: "Informe seu e-mail para receber o link de recuperação.", button: "Enviar link", alternate: "Voltar para o login", alternateView: "login" as ViewMode }
      : { title: "Boas-vindas", subtitle: "Entre para organizar seu estudo com o Mentalis.", button: "Entrar", alternate: "Criar uma conta", alternateView: "signup" as ViewMode };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Text style={styles.brandSmall}>MENTALIS</Text>
        <Text style={styles.title}>{content.title}</Text>
        <Text style={styles.subtitle}>{content.subtitle}</Text>
        {!isAuthConfigured ? <Text style={styles.previewBadge}>MODO DE TESTE · conexão em preparação</Text> : null}
        {view === "signup" ? <TextInput value={name} onChangeText={setName} placeholder="Seu nome" placeholderTextColor="#77778E" style={styles.input} /> : null}
        <TextInput value={email} onChangeText={setEmail} placeholder="E-mail" placeholderTextColor="#77778E" keyboardType="email-address" autoCapitalize="none" style={styles.input} />
        {view !== "forgot" ? <TextInput value={password} onChangeText={setPassword} placeholder="Senha" placeholderTextColor="#77778E" secureTextEntry style={styles.input} /> : null}
        {view === "login" ? <Pressable onPress={() => setView("forgot")}><Text style={styles.forgot}>Esqueci minha senha</Text></Pressable> : null}
        <Pressable onPress={handleSubmit} style={styles.mainButton}><Text style={styles.mainButtonText}>{content.button}</Text></Pressable>
        <Pressable onPress={() => setView(content.alternateView)} style={styles.alternateButton}><Text style={styles.alternateText}>{content.alternate}</Text></Pressable>
        {!isAuthConfigured ? <Pressable onPress={continueInPreview} style={styles.previewButton}><Text style={styles.previewText}>Continuar sem conta por enquanto</Text></Pressable> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = {
  splash: { flex: 1, backgroundColor: "#080810", alignItems: "center", justifyContent: "center" },
  logo: { width: 68, height: 68, borderRadius: 22, textAlign: "center", textAlignVertical: "center", backgroundColor: "#7C4DFF", color: "white", fontSize: 35, fontWeight: "800" },
  brand: { color: "white", fontSize: 30, fontWeight: "800", marginTop: 18 },
  tagline: { color: "#B9A8FF", marginTop: 6 },
  safeArea: { flex: 1, backgroundColor: "#080810" },
  content: { flex: 1, padding: 24, justifyContent: "center" },
  brandSmall: { color: "#B9A8FF", fontWeight: "800", letterSpacing: 1.4, fontSize: 12 },
  title: { color: "white", fontSize: 30, fontWeight: "800", marginTop: 12 },
  subtitle: { color: "#AAA", marginTop: 8, lineHeight: 21 },
  previewBadge: { color: "#FFD180", backgroundColor: "#33231A", padding: 10, borderRadius: 9, marginTop: 20, fontSize: 11, fontWeight: "700" },
  input: { backgroundColor: "#161625", color: "white", borderRadius: 12, padding: 14, marginTop: 14 },
  forgot: { color: "#B9A8FF", fontWeight: "700", marginTop: 13, alignSelf: "flex-end" },
  mainButton: { backgroundColor: "#7C4DFF", borderRadius: 12, padding: 15, marginTop: 26 },
  mainButtonText: { color: "white", fontWeight: "800", textAlign: "center" },
  alternateButton: { padding: 15, marginTop: 6 },
  alternateText: { color: "#CFC8EE", fontWeight: "700", textAlign: "center" },
  previewButton: { padding: 13, marginTop: 3 },
  previewText: { color: "#8888AA", textAlign: "center", fontSize: 12 },
} as const;
