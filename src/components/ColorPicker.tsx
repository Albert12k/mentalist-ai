import { View, Pressable } from "react-native";
import { colorPalette } from "../data/colors";

type Props = {
  selected: string;
  onSelect: (color: string) => void;
};

export default function ColorPicker({
  selected,
  onSelect,
}: Props) {
  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
      }}
    >
      {colorPalette.map((color) => {
        const isSelected = selected === color;

        return (
          <Pressable
            key={color}
            onPress={() => onSelect(color)}
            style={{
              width: 32,
              height: 32,
              borderRadius: 999,
              backgroundColor: color,
              borderWidth: isSelected ? 3 : 1,
              borderColor: isSelected
                ? "#7C4DFF"
                : "rgba(255,255,255,0.2)",
            }}
          />
        );
      })}
    </View>
  );
}