/**
 * Barra de progresso padrão do Mentalis
 *
 * Usos:
 * - Retenção
 * - XP
 * - Evolução
 * - Média
 */

import { View } from "react-native";
import { colors } from "../theme/colors";

type Props = {
  value: number;
  color?: string;
};

export default function ProgressBar({
  value,
  color = colors.primary,
}: Props) {
  return (
    <View
      style={{
        height: 8,
        backgroundColor: "rgba(255,255,255,0.08)",
        borderRadius: 999,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          height: "100%",
          width: `${value}%`,
          backgroundColor: color,
          borderRadius: 999,
        }}
      />
    </View>
  );
}