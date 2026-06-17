/**
 * Card padrão do Mentalis.
 *
 * Todo conteúdo importante
 * ficará dentro desse componente.
 */

import { View } from "react-native";
import { colors } from "../theme/colors";

type Props = {
  children: React.ReactNode;
};

export default function MentalisCard({
  children,
}: Props) {
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      {children}
    </View>
  );
}