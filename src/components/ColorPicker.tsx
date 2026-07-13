import { useEffect, useMemo, useState } from "react";
import {
  GestureResponderEvent,
  Modal,
  Pressable,
  SafeAreaView,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

type Props = {
  selected: string;
  onSelect: (color: string) => void;
};

const primaryColors = [
  "#7C4DFF",
  "#00E676",
  "#FF9100",
  "#FF3D57",
  "#448AFF",
  "#FFD600",
  "#00E5FF",
  "#F50057",
];

const WHEEL_VIEWBOX = 240;
const WHEEL_CENTER = WHEEL_VIEWBOX / 2;
const WHEEL_RADIUS = 112;
const HUE_SEGMENTS = 48;
const RINGS = 12;

type Point = {
  x: number;
  y: number;
};

function hslToHex(hue: number, saturation: number, lightness: number): string {
  const normalizedHue = ((hue % 360) + 360) % 360;
  const chroma = (1 - Math.abs(2 * lightness / 100 - 1)) * saturation / 100;
  const huePart = normalizedHue / 60;
  const secondary = chroma * (1 - Math.abs(huePart % 2 - 1));
  const match = lightness / 100 - chroma / 2;
  const [red, green, blue] = huePart < 1
    ? [chroma, secondary, 0]
    : huePart < 2
      ? [secondary, chroma, 0]
      : huePart < 3
        ? [0, chroma, secondary]
        : huePart < 4
          ? [0, secondary, chroma]
          : huePart < 5
            ? [secondary, 0, chroma]
            : [chroma, 0, secondary];

  return `#${[red, green, blue]
    .map((value) => Math.round((value + match) * 255).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

function normalizeHex(value: string): string | null {
  const raw = value.trim().replace(/^#/, "");

  if (/^[0-9a-fA-F]{3}$/.test(raw)) {
    return `#${raw.split("").map((character) => character.repeat(2)).join("").toUpperCase()}`;
  }

  if (/^[0-9a-fA-F]{6}$/.test(raw)) return `#${raw.toUpperCase()}`;
  return null;
}

function pointToColor(point: Point): string | null {
  const horizontal = point.x - WHEEL_CENTER;
  const vertical = point.y - WHEEL_CENTER;
  const distance = Math.sqrt(horizontal ** 2 + vertical ** 2);

  if (distance > WHEEL_RADIUS) return null;

  const hue = (Math.atan2(vertical, horizontal) * 180 / Math.PI + 450) % 360;
  const radialPosition = Math.min(distance / WHEEL_RADIUS, 1);
  const lightness = 100 - radialPosition * 50;

  return hslToHex(hue, 100, lightness);
}

function describeWedge(innerRadius: number, outerRadius: number, startAngle: number, endAngle: number): string {
  const toPoint = (radius: number, angle: number) => ({
    x: WHEEL_CENTER + radius * Math.cos(angle),
    y: WHEEL_CENTER + radius * Math.sin(angle),
  });
  const outerStart = toPoint(outerRadius, startAngle);
  const outerEnd = toPoint(outerRadius, endAngle);
  const innerEnd = toPoint(innerRadius, endAngle);
  const innerStart = toPoint(innerRadius, startAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

  if (innerRadius === 0) {
    return `M ${WHEEL_CENTER} ${WHEEL_CENTER} L ${outerStart.x} ${outerStart.y} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y} Z`;
  }

  return `M ${innerStart.x} ${innerStart.y} L ${outerStart.x} ${outerStart.y} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y} L ${innerEnd.x} ${innerEnd.y} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y} Z`;
}

function ColorWheel({ size }: { size: number }) {
  const segments = useMemo(() => {
    const pieces: { d: string; fill: string; key: string }[] = [];

    for (let ring = 0; ring < RINGS; ring += 1) {
      const innerRadius = ring * WHEEL_RADIUS / RINGS;
      const outerRadius = (ring + 1) * WHEEL_RADIUS / RINGS + 0.5;
      const lightness = 100 - ((ring + 0.5) / RINGS) * 50;

      for (let segment = 0; segment < HUE_SEGMENTS; segment += 1) {
        const startAngle = (segment / HUE_SEGMENTS) * Math.PI * 2 - Math.PI / 2;
        const endAngle = ((segment + 1) / HUE_SEGMENTS) * Math.PI * 2 - Math.PI / 2;
        const hue = (segment / HUE_SEGMENTS) * 360;

        pieces.push({
          key: `${ring}-${segment}`,
          d: describeWedge(innerRadius, outerRadius, startAngle, endAngle),
          fill: hslToHex(hue, 100, lightness),
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

/**
 * Mantém cores rápidas visíveis e abre uma roda cromática grande para
 * seleções personalizadas. A roda não depende de componentes nativos,
 * portanto funciona também na versão web do app.
 */
export default function ColorPicker({ selected, onSelect }: Props) {
  const [visible, setVisible] = useState(false);
  const [hexValue, setHexValue] = useState(selected);
  const [selectedPoint, setSelectedPoint] = useState<Point>({ x: WHEEL_CENTER, y: WHEEL_CENTER });

  useEffect(() => {
    setHexValue(selected);
  }, [selected]);

  function handleWheelPress(event: GestureResponderEvent) {
    const { locationX, locationY } = event.nativeEvent;
    const scale = WHEEL_VIEWBOX / 300;
    const point = { x: locationX * scale, y: locationY * scale };
    const color = pointToColor(point);

    if (!color) return;

    setSelectedPoint(point);
    setHexValue(color);
    onSelect(color);
  }

  function handleHexChange(value: string) {
    setHexValue(value);
    const normalized = normalizeHex(value);
    if (normalized) onSelect(normalized);
  }

  const normalizedSelected = normalizeHex(selected) ?? "#7C4DFF";
  const indicatorScale = 300 / WHEEL_VIEWBOX;

  return (
    <View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", marginTop: 8 }}>
        {primaryColors.map((color) => {
          const active = normalizedSelected === color;

          return (
            <Pressable
              key={color}
              onPress={() => onSelect(color)}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: color,
                marginRight: 9,
                marginBottom: 9,
                borderWidth: active ? 3 : 1,
                borderColor: active ? "white" : "rgba(255,255,255,0.2)",
              }}
            />
          );
        })}

        <Pressable
          accessibilityLabel="Abrir roda de cores"
          onPress={() => setVisible(true)}
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            marginBottom: 9,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 2,
            borderColor: normalizedSelected === selected ? "white" : "#AAA",
            overflow: "hidden",
          }}
        >
          <ColorWheel size={34} />
        </Pressable>
      </View>

      <Modal visible={visible} animationType="fade" transparent onRequestClose={() => setVisible(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.72)", justifyContent: "center", padding: 20 }}>
          <View style={{ backgroundColor: "#161625", borderRadius: 24, padding: 20 }}>
            <Text style={{ color: "white", fontSize: 23, fontWeight: "700", textAlign: "center" }}>
              Escolha uma cor
            </Text>
            <Text style={{ color: "#AAA", textAlign: "center", marginTop: 7 }}>
              Toque em qualquer ponto da roda cromática.
            </Text>

            <View style={{ width: 300, height: 300, alignSelf: "center", marginTop: 20 }}>
              <ColorWheel size={300} />
              <Pressable
                onPress={handleWheelPress}
                style={{ position: "absolute", width: 300, height: 300, borderRadius: 150 }}
              >
                <View
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    width: 22,
                    height: 22,
                    left: selectedPoint.x * indicatorScale - 11,
                    top: selectedPoint.y * indicatorScale - 11,
                    borderRadius: 11,
                    borderWidth: 3,
                    borderColor: "white",
                    backgroundColor: "rgba(0,0,0,0.15)",
                  }}
                />
              </Pressable>
            </View>

            <Text style={{ color: "#BBB", marginTop: 18, marginBottom: 8 }}>Cor em HEX (opcional)</Text>
            <TextInput
              value={hexValue}
              onChangeText={handleHexChange}
              placeholder="#7C4DFF"
              placeholderTextColor="#666"
              autoCapitalize="characters"
              maxLength={7}
              style={{ backgroundColor: "#0D0D16", color: "white", padding: 12, borderRadius: 10 }}
            />
            <View style={{ height: 32, borderRadius: 8, backgroundColor: normalizedSelected, marginTop: 12 }} />

            <Pressable onPress={() => setVisible(false)} style={{ backgroundColor: "#7C4DFF", padding: 14, borderRadius: 12, marginTop: 20 }}>
              <Text style={{ color: "white", textAlign: "center", fontWeight: "700" }}>Confirmar cor</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}
