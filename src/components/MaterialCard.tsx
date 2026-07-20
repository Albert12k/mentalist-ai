import {
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";

import {
  formatMaterialSize,
  materialCategoryLabels,
  materialTypeLabels,
} from "../services/materials";
import { SubjectMaterial } from "../types/Subject";

type Props = {
  material: SubjectMaterial;
  onDelete: () => void;
  onPreviewImage: (material: SubjectMaterial) => void;
  onViewExtractedText: (material: SubjectMaterial) => void;
};

function formatDuration(durationMillis?: number): string | null {
  if (!durationMillis) return null;

  const totalSeconds = Math.floor(durationMillis / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

// Cada cartão sabe apresentar o tipo de arquivo que representa. Para áudio,
// usamos o player oficial do Expo, permitindo ouvir a gravação no mesmo lugar.
export default function MaterialCard({ material, onDelete, onPreviewImage, onViewExtractedText }: Props) {
  const player = useAudioPlayer(material.type === "audio" ? material.uri : null);
  const playerStatus = useAudioPlayerStatus(player);
  const details = [formatDuration(material.durationMillis), formatMaterialSize(material.size)]
    .filter(Boolean)
    .join(" • ");

  async function handleOpenPdf() {
    try {
      if (Platform.OS === "web") {
        window.open(material.uri, "_blank", "noopener,noreferrer");
        return;
      }

      await Linking.openURL(material.uri);
    } catch {
      Alert.alert("Não foi possível abrir", "Este PDF não pôde ser aberto agora.");
    }
  }

  function handleAudioPress() {
    if (playerStatus.playing) {
      player.pause();
      return;
    }

    player.play();
  }

  return (
    <View style={styles.card}>
      {material.type === "image" ? (
        <Pressable onPress={() => onPreviewImage(material)}>
          <Image source={{ uri: material.uri }} style={styles.preview} resizeMode="cover" />
        </Pressable>
      ) : null}

      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>{material.type === "pdf" ? "PDF" : material.type === "audio" ? "ÁU" : "FT"}</Text>
        </View>
        <View style={styles.titleArea}>
          <Text style={styles.title}>{material.title}</Text>
          <Text style={styles.meta}>
            {materialTypeLabels[material.type]} • {materialCategoryLabels[material.category]}
            {details ? ` • ${details}` : ""}
          </Text>
          <Text style={[styles.syncStatus, material.storagePath ? styles.syncedStatus : styles.localStatus]}>
            {material.storagePath ? "☁ Sincronizado" : "⌂ Salvo neste aparelho"}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        {material.type === "pdf" ? (
          <Action label="Abrir PDF" color="#263238" onPress={handleOpenPdf} />
        ) : null}
        {material.type === "image" ? (
          <Action label="Ver foto" color="#263238" onPress={() => onPreviewImage(material)} />
        ) : null}
        {material.type === "audio" ? (
          <Action
            label={playerStatus.playing ? "Pausar" : "Ouvir áudio"}
            color="#5E35B1"
            onPress={handleAudioPress}
          />
        ) : null}
        {material.extractedText ? <Action label="Ver texto" color="#263238" onPress={() => onViewExtractedText(material)} /> : null}
        <Action label="Excluir" color="#B00020" onPress={onDelete} />
      </View>
    </View>
  );
}

function Action({ label, color, onPress }: { label: string; color: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.actionButton, { backgroundColor: color }]}>
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

const styles = {
  card: { backgroundColor: "#141424", padding: 12, borderRadius: 12, marginTop: 10 },
  preview: { width: "100%", height: 170, borderRadius: 9, backgroundColor: "#222" },
  header: { flexDirection: "row", alignItems: "center" },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#28263E",
    justifyContent: "center",
    alignItems: "center",
  },
  icon: { color: "#C5B5FF", fontSize: 11, fontWeight: "800" },
  titleArea: { flex: 1, marginLeft: 10 },
  title: { color: "white", fontWeight: "700", fontSize: 15 },
  meta: { color: "#9693A4", marginTop: 4, fontSize: 12 },
  syncStatus: { marginTop: 5, fontSize: 11, fontWeight: "700" },
  syncedStatus: { color: "#5FD49B" },
  localStatus: { color: "#E5B65A" },
  actions: { flexDirection: "row", flexWrap: "wrap", marginTop: 12 },
  actionButton: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, marginRight: 8, marginBottom: 4 },
  actionText: { color: "white", fontWeight: "700", fontSize: 12 },
} as const;
