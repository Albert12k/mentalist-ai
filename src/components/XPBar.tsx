import { View, Text } from "react-native";
import ProgressBar from "./ProgressBar";
import { colors } from "../theme/colors";

type Props = {
  level: number;
  xp: number;
};

export default function XPBar({
  level,
  xp,
}: Props) {
  return (
    <View>
      <Text
        style={{
          color: colors.text,
          marginBottom: 8,
          fontWeight: "600",
        }}
      >
        Nível {level}
      </Text>

      <ProgressBar
        value={xp}
        color={colors.primary}
      />

      <Text
        style={{
          color: colors.subtitle,
          marginTop: 5,
          fontSize: 12,
        }}
      >
        {xp}% para o próximo nível
      </Text>
    </View>
  );
}