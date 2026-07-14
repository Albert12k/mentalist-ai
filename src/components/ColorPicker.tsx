import { useEffect, useMemo, useState } from "react";
import {
  GestureResponderEvent,
  Modal,
  Pressable,
  SafeAreaView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

type Props = {
  selected: string;
  onSelect: (color: string) => void;
};

type Point = { x: number; y: number };

const primaryColors = ["#7C4DFF", "#00E676", "#FF9100", "#FF3D57", "#448AFF", "#FFD600", "#00E5FF", "#F50057"];
const WHEEL_VIEWBOX = 240;
const WHEEL_CENTER = WHEEL_VIEWBOX / 2;
const WHEEL_RADIUS = 112;
const HUE_SEGMENTS = 48;
const RINGS = 12;

function normalizeHex(value: string): string | null {
  const raw = value.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{3}$/.test(raw)) return `#${raw.split("").map((character) => character.repeat(2)).join("").toUpperCase()}`;
  return /^[0-9a-fA-F]{6}$/.test(raw) ? `#${raw.toUpperCase()}` : null;
}

function hslToHex(hue: number, saturation: number, lightness: number): string {
  const normalizedHue = ((hue % 360) + 360) % 360;
  const chroma = (1 - Math.abs(2 * lightness / 100 - 1)) * saturation / 100;
  const huePart = normalizedHue / 60;
  const secondary = chroma * (1 - Math.abs(huePart % 2 - 1));
  const match = lightness / 100 - chroma / 2;
  const [red, green, blue] = huePart < 1 ? [chroma, secondary, 0]
    : huePart < 2 ? [secondary, chroma, 0]
      : huePart < 3 ? [0, chroma, secondary]
        : huePart < 4 ? [0, secondary, chroma]
          : huePart < 5 ? [secondary, 0, chroma]
            : [chroma, 0, secondary];

  return `#${[red, green, blue]
    .map((value) => Math.round((value + match) * 255).toString(16).padStart(2, "0"))
    .join("").toUpperCase()}`;
}

function pointToColor(point: Point): string | null {
  const horizontal = point.x - WHEEL_CENTER;
  const vertical = point.y - WHEEL_CENTER;
  const distance = Math.sqrt(horizontal ** 2 + vertical ** 2);

  if (!Number.isFinite(distance) || distance > WHEEL_RADIUS) return null;

  const hue = (Math.atan2(vertical, horizontal) * 180 / Math.PI + 450) % 360;
  const lightness = 100 - Math.min(distance / WHEEL_RADIUS, 1) * 50;
  return hslToHex(hue, 100, lightness);
}

function describeWedge(innerRadius: number, outerRadius: number, startAngle: number, endAngle: number): string {
  const pointAt = (radius: number, angle: number) => ({
    x: WHEEL_CENTER + radius * Math.cos(angle),
    y: WHEEL_CENTER + radius * Math.sin(angle),
  });
  const outerStart = pointAt(outerRadius, startAngle);
  const outerEnd = pointAt(outerRadius, endAngle);
  const innerEnd = pointAt(innerRadius, endAngle);
  const innerStart = pointAt(innerRadius, startAngle);

  if (innerRadius === 0) {
    return `M ${WHEEL_CENTER} ${WHEEL_CENTER} L ${outerStart.x} ${outerStart.y} A ${outerRadius} ${outerRadius} 0 0 1 ${outerEnd.x} ${outerEnd.y} Z`;
  }

  return `M ${innerStart.x} ${innerStart.y} L ${outerStart.x} ${outerStart.y} A ${outerRadius} ${outerRadius} 0 0 1 ${outerEnd.x} ${outerEnd.y} L ${innerEnd.x} ${innerEnd.y} A ${innerRadius} ${innerRadius} 0 0 0 ${innerStart.x} ${innerStart.y} Z`;
}

function ColorWheel({ size }: { size: number }) {
  const segments = useMemo(() => {
    const pieces: { key: string; d: string; fill: string }[] = [];

    for (let ring = 0; ring < RINGS; ring += 1) {
      const innerRadius = ring * WHEEL_RADIUS / RINGS;
      const outerRadius = (ring + 1) * WHEEL_RADIUS / RINGS + 0.5;
      const lightness = 100 - ((ring + 0.5) / RINGS) * 50;

      for (let segment = 0; segment < HUE_SEGMENTS; segment += 1) {
        const startAngle = segment / HUE_SEGMENTS * Math.PI * 2 - Math.PI / 2;
        const endAngle = (segment + 1) / HUE_SEGMENTS * Math.PI * 2 - Math.PI / 2;
        pieces.push({
          key: `${ring}-${segment}`,
          d: describeWedge(innerRadius, outerRadius, startAngle, endAngle),
          fill: hslToHex(segment / HUE_SEGMENTS * 360, 100, lightness),
        });
      }
    }

    return pieces;
  }, []);

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${WHEEL_VIEWBOX} ${WHEEL_VIEWBOX}`}>
      <Circle cx={WHEEL_CENTER} cy={WHEEL_CENTER} r={WHEEL_RADIUS + 1} fill="#FFFFFF" />
      {segments.map((segment) => <Path key={segment.key} d={segment.d} fill={segment.fill} />)}
    </Svg>
  );
}

// O toque é calculado usando o tamanho exibido da roda, em vez de assumir
// 300px. Isso corrige a diferença de coordenadas entre navegador e celular.
export default function ColorPicker({ selected, onSelect }: Props) {
  const { width } = useWindowDimensions();
  const wheelSize = Math.min(300, Math.max(220, width - 80));
  const [visible, setVisible] = useState(false);
  const [hexValue, setHexValue] = useState(selected);
  const [selectedPoint, setSelectedPoint] = useState<Point>({ x: WHEEL_CENTER, y: WHEEL_CENTER });

  useEffect(() => {
    setHexValue(selected);
  }, [selected]);

  function selectColor(color: string) {
    setHexValue(color);
    onSelect(color);
  }

  function handleWheelTouch(event: GestureResponderEvent) {
    const nativeEvent = event.nativeEvent as typeof event.nativeEvent & { offsetX?: number; offsetY?: number };
    const rawX = typeof nativeEvent.locationX === "number" ? nativeEvent.locationX : nativeEvent.offsetX;
    const rawY = typeof nativeEvent.locationY === "number" ? nativeEvent.locationY : nativeEvent.offsetY;

    if (typeof rawX !== "number" || typeof rawY !== "number") return;

    const point = {
      x: rawX * WHEEL_VIEWBOX / wheelSize,
      y: rawY * WHEEL_VIEWBOX / wheelSize,
    };
    const color = pointToColor(point);

    if (!color) return;
    setSelectedPoint(point);
    selectColor(color);
  }

  function handleHexChange(value: string) {
    setHexValue(value);
    const normalized = normalizeHex(value);
    if (normalized) onSelect(normalized);
  }

  const normalizedSelected = normalizeHex(selected) ?? "#7C4DFF";
  const indicatorScale = wheelSize / WHEEL_VIEWBOX;

  return (
    <View>
      <View style={styles.quickColors}>
        {primaryColors.map((color) => (
          <Pressable
            key={color}
            onPress={() => selectColor(color)}
            style={[styles.swatch, { backgroundColor: color }, normalizedSelected === color && styles.activeSwatch]}
          />
        ))}
        <Pressable accessibilityLabel="Abrir roda de cores" onPress={() => setVisible(true)} style={styles.wheelButton}>
          <ColorWheel size={34} />
        </Pressable>
      </View>

      <Modal visible={visible} animationType="fade" transparent onRequestClose={() => setVisible(false)}>
        <SafeAreaView style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Escolha uma cor</Text>
            <Text style={styles.modalSubtitle}>Toque ou arraste dentro da roda para selecionar.</Text>

            <View
              onStartShouldSetResponder={() => true}
              onResponderGrant={handleWheelTouch}
              onResponderMove={handleWheelTouch}
              style={{ width: wheelSize, height: wheelSize, alignSelf: "center", marginTop: 20 }}
            >
              <ColorWheel size={wheelSize} />
              <View pointerEvents="none" style={[
                styles.indicator,
                {
                  left: selectedPoint.x * indicatorScale - 11,
                  top: selectedPoint.y * indicatorScale - 11,
                },
              ]} />
            </View>

            <Text style={styles.hexLabel}>Cor em HEX (opcional)</Text>
            <TextInput
              value={hexValue}
              onChangeText={handleHexChange}
              placeholder="#7C4DFF"
              placeholderTextColor="#666"
              autoCapitalize="characters"
              maxLength={7}
              style={styles.hexInput}
            />
            <View style={[styles.preview, { backgroundColor: normalizedSelected }]} />
            <Pressable onPress={() => setVisible(false)} style={styles.confirmButton}>
              <Text style={styles.confirmText}>Confirmar cor</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = {
  quickColors: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", marginTop: 8 },
  swatch: { width: 32, height: 32, borderRadius: 16, marginRight: 9, marginBottom: 9, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  activeSwatch: { borderWidth: 3, borderColor: "white" },
  wheelButton: { width: 34, height: 34, borderRadius: 17, marginBottom: 9, overflow: "hidden", borderWidth: 2, borderColor: "#AAA" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.72)", justifyContent: "center", padding: 20 },
  modalCard: { backgroundColor: "#161625", borderRadius: 24, padding: 20 },
  modalTitle: { color: "white", fontSize: 23, fontWeight: "700", textAlign: "center" },
  modalSubtitle: { color: "#AAA", textAlign: "center", marginTop: 7 },
  indicator: { position: "absolute", width: 22, height: 22, borderRadius: 11, borderWidth: 3, borderColor: "white", backgroundColor: "rgba(0,0,0,0.15)" },
  hexLabel: { color: "#BBB", marginTop: 18, marginBottom: 8 },
  hexInput: { backgroundColor: "#0D0D16", color: "white", padding: 12, borderRadius: 10 },
  preview: { height: 32, borderRadius: 8, marginTop: 12 },
  confirmButton: { backgroundColor: "#7C4DFF", padding: 14, borderRadius: 12, marginTop: 20 },
  confirmText: { color: "white", textAlign: "center", fontWeight: "700" },
} as const;
