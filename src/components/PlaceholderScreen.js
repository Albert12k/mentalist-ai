// ============================================================
// src/components/PlaceholderScreen.js
// Tela temporária usada enquanto uma tela real não foi criada.
//
// Por que ter isso?
// Quando você monta a navegação, todas as abas precisam
// apontar para algum componente. O placeholder garante que
// o app não quebre antes das telas reais ficarem prontas.
// ============================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../theme';

// ------------------------------------------------------------
// O componente recebe "title" como prop (propriedade).
// Props são como parâmetros de função — você passa um valor
// de fora para personalizar o componente.
// Exemplo de uso: <PlaceholderScreen title="Matérias" />
// ------------------------------------------------------------
export default function PlaceholderScreen({ title }) {
  return (
    <View style={styles.container}>
      {/* Ícone decorativo */}
      <Text style={styles.icon}>🧠</Text>

      {/* Título da tela */}
      <Text style={styles.title}>{title}</Text>

      {/* Mensagem de status */}
      <Text style={styles.sub}>Em construção</Text>
    </View>
  );
}

// ------------------------------------------------------------
// ESTILOS
// StyleSheet.create() é a forma correta de estilizar no
// React Native. É parecido com CSS, mas em JavaScript.
// Diferença principal: não tem unidades (px, em) — os números
// são "pontos de densidade independente" (dp).
// ------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,                          // ocupa todo o espaço disponível
    backgroundColor: colors.background,
    alignItems: 'center',             // centraliza horizontalmente
    justifyContent: 'center',         // centraliza verticalmente
  },
  icon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  sub: {
    fontSize: typography.md,
    color: colors.textSub,
  },
});
