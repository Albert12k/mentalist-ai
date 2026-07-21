import { useEffect, useState } from "react";
import { Alert, Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { useAuth } from "../contexts/AuthContext";
import { isAuthConfigured } from "../services/authConfig";

type ViewMode = "splash" | "login" | "signup" | "forgot" | "confirm";

function GoogleLogo() {
  return (
    <Svg width={22} height={22} viewBox="0 0 48 48">
      <Path fill="#FFC107" d="M43.6 20H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 3l5.7-5.7C34 6.1 29.2 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.7-.4-4z" />
      <Path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C34 6.1 29.2 4 24 4c-7.7 0-14.4 4.4-17.7 10.7z" />
      <Path fill="#4CAF50" d="M24 44c5.1 0 9.8-2 13.3-5.2l-6.2-5.2C29.1 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.4-7.9L6 33.2C9.3 39.6 16 44 24 44z" />
      <Path fill="#1976D2" d="M43.6 20H42V20H24v8h11.3c-1 2.7-2.8 4.7-4.9 5.6l.1-.1 6.2 5.2C36.3 39.1 44 34 44 24c0-1.3-.1-2.7-.4-4z" />
    </Svg>
  );
}

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { loading, signedIn, continueInPreview, signIn, signUp, resetPassword, resendConfirmation, signInWithGoogle } = useAuth();
  const [view, setView] = useState<ViewMode>("splash");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmationEmail, setConfirmationEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [splashTimeoutReached, setSplashTimeoutReached] = useState(false);

  // Proteção independente da camada de autenticação: a splash é somente uma
  // apresentação visual e nunca deve impedir a pessoa de chegar ao login.
  useEffect(() => {
    const timer = setTimeout(() => setSplashTimeoutReached(true), 4500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if ((loading && !splashTimeoutReached) || signedIn) return;
    const timer = setTimeout(() => setView("login"), 900);
    return () => clearTimeout(timer);
  }, [loading, signedIn, splashTimeoutReached]);

  if (signedIn) return <>{children}</>;
  if ((loading && !splashTimeoutReached) || view === "splash") return <Splash />;

  function validate(needsName = false) {
    if (needsName && !name.trim()) { setFeedback("Informe seu nome para criar a conta."); return false; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { setFeedback("Digite um endereço de e-mail válido."); return false; }
    if (view !== "forgot" && password.length < 8) { setFeedback("A senha precisa ter pelo menos 8 caracteres."); return false; }
    if (view === "signup" && password !== confirmPassword) { setFeedback("As senhas não são iguais."); return false; }
    return true;
  }

  async function handleSubmit() {
    setFeedback("");
    if (!validate(view === "signup")) return;
    setSubmitting(true);
    if (view === "forgot") {
      const error = await resetPassword(email.trim().toLowerCase());
      setSubmitting(false);
      if (error) setFeedback(error);
      else setFeedback("Link enviado. Confira seu e-mail e a pasta de spam.");
      return;
    }
    if (view === "signup") {
      const result = await signUp(email.trim().toLowerCase(), password, name.trim());
      setSubmitting(false);
      if (result.error) { setFeedback(result.error); return; }
      if (result.needsConfirmation) { setConfirmationEmail(email); setView("confirm"); }
      return;
    }
    const error = await signIn(email.trim().toLowerCase(), password);
    setSubmitting(false);
    if (error) setFeedback(error);
  }

  async function handleGoogle() {
    setFeedback("Abrindo o Google...");
    setSubmitting(true);
    const error = await signInWithGoogle();
    setSubmitting(false);
    if (error) setFeedback(`Google: ${error}`);
  }

  async function handleResend() {
    setSubmitting(true);
    const error = await resendConfirmation(confirmationEmail);
    setSubmitting(false);
    setFeedback(error ?? "E-mail reenviado. Confira também a pasta de spam.");
  }

  if (view === "confirm") {
    return <AuthLayout><Text style={styles.brand}>MENTALIS</Text><Text style={styles.title}>Confirme seu e-mail</Text><Text style={styles.subtitle}>Enviamos um link para:</Text><Text style={styles.confirmEmail}>{confirmationEmail}</Text><Feedback text={feedback || "Depois de confirmar, volte para entrar na sua conta."} success /><Pressable disabled={submitting} onPress={handleResend} style={styles.mainButton}><Text style={styles.mainButtonText}>{submitting ? "Enviando..." : "Reenviar e-mail"}</Text></Pressable><LinkButton label="Já confirmei, entrar" onPress={() => { setFeedback(""); setView("login"); }} /></AuthLayout>;
  }

  const isSignup = view === "signup";
  const isForgot = view === "forgot";
  const title = isSignup ? "Crie sua conta" : isForgot ? "Recuperar senha" : "Bem-vindo de volta";
  const subtitle = isSignup ? "Organize seus estudos e acompanhe sua evolução." : isForgot ? "Vamos enviar um link seguro para criar uma nova senha." : "Entre para continuar seu plano de estudos.";

  return (
    <AuthLayout>
      <Text style={styles.brand}>MENTALIS</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {!isAuthConfigured ? <Feedback text="Modo de teste: conecte o Supabase para ativar o acesso real." /> : null}

      {isSignup ? <Field value={name} onChangeText={setName} placeholder="Nome completo" /> : null}
      <Field value={email} onChangeText={setEmail} placeholder="E-mail" keyboardType="email-address" />
      {!isForgot ? <Field value={password} onChangeText={setPassword} placeholder="Senha" secureTextEntry /> : null}
      {isSignup ? <Field value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirmar senha" secureTextEntry /> : null}
      {isSignup ? <Text style={styles.passwordHint}>Use pelo menos 8 caracteres.</Text> : null}
      {!isSignup && !isForgot ? <Pressable onPress={() => { setFeedback(""); setView("forgot"); }}><Text style={styles.forgot}>Esqueci minha senha</Text></Pressable> : null}

      {feedback ? <Feedback text={feedback} success={feedback.startsWith("Link enviado") || feedback.startsWith("Abrindo")} /> : null}
      {!isForgot ? <Pressable disabled={submitting} onPress={handleGoogle} accessibilityLabel="Continuar com Google" style={styles.socialRow}><View style={styles.socialButton}><GoogleLogo /></View><Text style={styles.socialHint}>Continuar com Google</Text></Pressable> : null}
      {!isForgot ? <View style={styles.divider}><View style={styles.dividerLine} /><Text style={styles.dividerText}>ou com e-mail</Text><View style={styles.dividerLine} /></View> : null}
      <Pressable disabled={submitting} onPress={handleSubmit} style={[styles.mainButton, submitting && styles.disabled]}><Text style={styles.mainButtonText}>{submitting ? "Aguarde..." : isSignup ? "Criar conta" : isForgot ? "Enviar link" : "Entrar"}</Text></Pressable>
      <LinkButton label={isSignup ? "Já possui conta? Entrar" : isForgot ? "Voltar para o login" : "Ainda não tenho conta"} onPress={() => { setFeedback(""); setView(isSignup || isForgot ? "login" : "signup"); }} />
      {!isAuthConfigured ? <LinkButton label="Continuar sem conta" onPress={continueInPreview} subdued /> : null}
    </AuthLayout>
  );
}

function Splash() { return <SafeAreaView style={styles.splash}><View style={styles.splashLogo}><Text style={styles.splashM}>M</Text></View><Text style={styles.splashBrand}>Mentalis</Text><Text style={styles.splashText}>Seu estudo, com direção.</Text></SafeAreaView>; }
function AuthLayout({ children }: { children: React.ReactNode }) { return <SafeAreaView style={styles.safeArea}><ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled"><View style={styles.card}>{children}</View></ScrollView></SafeAreaView>; }
function Field(props: { value: string; onChangeText: (text: string) => void; placeholder: string; secureTextEntry?: boolean; keyboardType?: "email-address" }) {
  const [visible, setVisible] = useState(false);
  return <View style={styles.fieldWrap}><TextInput value={props.value} onChangeText={props.onChangeText} placeholder={props.placeholder} placeholderTextColor="#8A8799" autoCapitalize="none" autoCorrect={false} keyboardType={props.keyboardType} secureTextEntry={props.secureTextEntry && !visible} style={[styles.input, props.secureTextEntry && styles.passwordInput]} />{props.secureTextEntry ? <Pressable onPress={() => setVisible((current) => !current)} style={styles.visibilityButton}><Text style={styles.visibilityText}>{visible ? "Ocultar" : "Mostrar"}</Text></Pressable> : null}</View>;
}
function Feedback({ text, success = false }: { text: string; success?: boolean }) { return <View style={[styles.feedback, success && styles.feedbackSuccess]}><Text style={[styles.feedbackText, success && styles.feedbackTextSuccess]}>{text}</Text></View>; }
function LinkButton({ label, onPress, subdued = false }: { label: string; onPress: () => void; subdued?: boolean }) { return <Pressable onPress={onPress} style={styles.linkButton}><Text style={[styles.linkText, subdued && styles.subduedLink]}>{label}</Text></Pressable>; }

const styles = {
  splash: { flex: 1, backgroundColor: "#080810", alignItems: "center", justifyContent: "center" },
  splashLogo: { width: 68, height: 68, borderRadius: 22, backgroundColor: "#7C4DFF", justifyContent: "center", alignItems: "center" },
  splashM: { color: "white", fontSize: 35, fontWeight: "900" },
  splashBrand: { color: "white", fontSize: 30, fontWeight: "800", marginTop: 18 },
  splashText: { color: "#B9A8FF", marginTop: 6 },
  safeArea: { flex: 1, backgroundColor: "#DCE2EC" },
  page: { flexGrow: 1, justifyContent: "center", padding: 22 },
  card: { width: "100%", maxWidth: 410, alignSelf: "center", backgroundColor: "#FFFFFF", borderRadius: 26, padding: 24, shadowColor: "#29354C", shadowOpacity: 0.24, shadowRadius: 18, shadowOffset: { width: 0, height: 9 }, elevation: 8 },
  brand: { color: "#7C4DFF", letterSpacing: 1.6, fontSize: 11, fontWeight: "900", textAlign: "center" },
  title: { color: "#252236", fontSize: 26, fontWeight: "800", textAlign: "center", marginTop: 12 },
  subtitle: { color: "#777487", textAlign: "center", lineHeight: 19, marginTop: 8, marginBottom: 12 },
  fieldWrap: { position: "relative" },
  input: { borderWidth: 1, borderColor: "#DEDCE6", backgroundColor: "#FAFAFC", color: "#292638", borderRadius: 10, paddingVertical: 12, paddingHorizontal: 13, marginTop: 10, fontSize: 14 },
  passwordInput: { paddingRight: 78 },
  visibilityButton: { position: "absolute", right: 12, top: 10, bottom: 0, justifyContent: "center" },
  visibilityText: { color: "#6C45D8", fontSize: 11, fontWeight: "800" },
  passwordHint: { color: "#898596", fontSize: 11, marginTop: 7 },
  forgot: { color: "#6C45D8", fontWeight: "700", fontSize: 12, textAlign: "right", marginTop: 11 },
  feedback: { backgroundColor: "#FDEBEC", borderRadius: 9, padding: 10, marginTop: 14 },
  feedbackSuccess: { backgroundColor: "#E7F6EC" },
  feedbackText: { color: "#B13C48", fontSize: 12, lineHeight: 17 },
  feedbackTextSuccess: { color: "#207B4D" },
  socialRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 20, borderWidth: 1, borderColor: "#D7D4DF", borderRadius: 11, padding: 10 },
  socialButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#D7D4DF", alignItems: "center", justifyContent: "center" },
  socialHint: { color: "#4B4858", fontWeight: "700", marginLeft: 9, fontSize: 13 },
  divider: { flexDirection: "row", alignItems: "center", marginTop: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#E4E2E9" },
  dividerText: { color: "#9693A0", fontSize: 11, marginHorizontal: 9 },
  mainButton: { backgroundColor: "#7C4DFF", borderRadius: 10, padding: 14, marginTop: 20 },
  mainButtonText: { color: "white", fontWeight: "800", textAlign: "center" },
  disabled: { opacity: 0.65 },
  linkButton: { paddingTop: 16, paddingBottom: 3 },
  linkText: { color: "#6C45D8", fontWeight: "700", fontSize: 12, textAlign: "center" },
  subduedLink: { color: "#9895A3" },
  confirmEmail: { color: "#6240C6", fontWeight: "800", textAlign: "center", marginTop: 7 },
} as const;
