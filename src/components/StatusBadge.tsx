/**
 * Badge de status
 *
 * Ex:
 * Excelente
 * Em Risco
 * Revisar
 */

import { Text, View } from "react-native";

type Props = {
  label: string;
  background: string;
  color: string;
};

export default function StatusBadge({
  label,
  background,
  color,
}: Props) {
  return (
    <View
      style={{
        backgroundColor: background,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
        alignSelf: "flex-start",
      }}
    >
      <Text
        style={{
          color,
          fontWeight: "600",
          fontSize: 12,
        }}
      >
        {label}
      </Text>
    </View>
  );
}