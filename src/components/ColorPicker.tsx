import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

type Props = {
  selected: string;
  onSelect: (color: string) => void;
};

const wheelColors = [
  "#FF1744", "#FF3D00", "#FF6D00", "#FFAB00", "#FFD600", "#AEEA00",
  "#00C853", "#00E5FF", "#00B0FF", "#2979FF", "#3D5AFE", "#651FFF",
  "#AA00FF", "#D500F9", "#F500B9", "#FF4081", "#795548", "#607D8B",
];

const WHEEL_SIZE = 250;
const SWATCH_SIZE = 32;
const WHEEL_RADIUS = 93;

function normalizeHex(value: string): string | null {
  const raw = value.trim().replace(/^#/, "");

  if (/^[0-9a-fA-F]{3}$/.test(raw)) {
    return `#${raw.split("").map((character) => character.repeat(2)).join("").toUpperCase()}`;
  }

  if (/^[0-9a-fA-F]{6}$/.test(raw)) {
    return `#${raw.toUpperCase()}`;
  }

  return null;
}

/**
 * Roda cromática com entrada hexadecimal. A roda facilita a escolha visual e
 * o campo HEX permite usar qualquer cor, inclusive fora das opções mostradas.
 */
export default function ColorPicker({ selected, onSelect }: Props) {
  const [hexValue, setHexValue] = useState(selected);

  useEffect(() => {
    setHexValue(selected);
  }, [selected]);

  function handleHexChange(value: string) {
    setHexValue(value);

    const normalized = normalizeHex(value);
    if (normalized) onSelect(normalized);
  }

  const selectedColor = normalizeHex(selected) ?? "#7C4DFF";
  const isCustomColorValid = Boolean(normalizeHex(hexValue));

  return (
    <View>
      <View
        style={{
          width: WHEEL_SIZE,
          height: WHEEL_SIZE,
          alignSelf: "center",
          position: "relative",
          marginTop: 12,
        }}
      >
        {wheelColors.map((color, index) => {
          const angle = (index / wheelColors.length) * Math.PI * 2 - Math.PI / 2;
          const left = WHEEL_SIZE / 2 + Math.cos(angle) * WHEEL_RADIUS - SWATCH_SIZE / 2;
          const top = WHEEL_SIZE / 2 + Math.sin(angle) * WHEEL_RADIUS - SWATCH_SIZE / 2;
          const isSelected = selectedColor === color;

          return (
            <Pressable
              key={color}
              accessibilityLabel={`Selecionar cor ${color}`}
              onPress={() => onSelect(color)}
              style={{
                position: "absolute",
                width: SWATCH_SIZE,
                height: SWATCH_SIZE,
                left,
                top,
                borderRadius: SWATCH_SIZE / 2,
                backgroundColor: color,
                borderWidth: isSelected ? 3 : 1,
                borderColor: isSelected ? "white" : "rgba(255,255,255,0.22)",
              }}
            />
          );
        })}

        <View
          style={{
            position: "absolute",
            width: 104,
            height: 104,
            left: (WHEEL_SIZE - 104) / 2,
            top: (WHEEL_SIZE - 104) / 2,
            borderRadius: 52,
            backgroundColor: "#161625",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.12)",
          }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: selectedColor,
              borderWidth: 2,
              borderColor: "white",
            }}
          />
        </View>
      </View>

      <Text style={{ color: "#BBB", marginTop: 12, marginBottom: 8 }}>
        Ou informe uma cor personalizada (HEX)
      </Text>
      <TextInput
        value={hexValue}
        onChangeText={handleHexChange}
        placeholder="#7C4DFF"
        placeholderTextColor="#666"
        autoCapitalize="characters"
        maxLength={7}
        style={{
          backgroundColor: "#161625",
          color: "white",
          padding: 12,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: isCustomColorValid ? "rgba(255,255,255,0.08)" : "#FF3D57",
        }}
      />
      {!isCustomColorValid && (
        <Text style={{ color: "#FF8A80", fontSize: 12, marginTop: 6 }}>
          Use três ou seis caracteres hexadecimais, por exemplo #3F51B5.
        </Text>
      )}
    </View>
  );
}
