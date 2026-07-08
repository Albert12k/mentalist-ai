// ============================================================
// src/navigation/TabNavigator.js
// Navegação principal do app — barra de abas na parte inferior.
//
// O que é navegação no React Native?
// É o sistema que controla qual tela aparece na hora certa.
// Usamos a biblioteca "React Navigation" com o add-on
// "Bottom Tabs" para criar a barra de 5 abas.
//
// Fluxo de dados:
//   App.js → TabNavigator → cada Screen (tela)
// ============================================================

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

// createBottomTabNavigator cria a barra de abas inferior
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Importa cada tela que vai aparecer nas abas
import HojeScreen     from '../screens/HojeScreen';
import MateriasScreen from '../screens/MateriasScreen';
import PraticarScreen from '../screens/PraticarScreen';
import TutorScreen    from '../screens/TutorScreen';
import PerfilScreen   from '../screens/PerfilScreen';

// Importa o tema para usar as mesmas cores em todo lugar
import { colors, typography, spacing } from '../theme';

// ------------------------------------------------------------
// Cria a instância do navegador de abas.
// "Tab" é o objeto que usamos para definir cada aba abaixo.
// ------------------------------------------------------------
const Tab = createBottomTabNavigator();

// ------------------------------------------------------------
// Componente do ícone de cada aba.
// Recebe: label (texto), emoji, focused (se está selecionada)
//
// Por que um componente separado?
// Para deixar o código do TabNavigator mais limpo —
// em vez de repetir a mesma estrutura 5 vezes.
// ------------------------------------------------------------
function TabIcon({ emoji, label, focused }) {
  return (
    <View style={styles.tabIconWrapper}>
      {/* Emoji do ícone */}
      <Text style={styles.tabEmoji}>{emoji}</Text>

      {/* Nome da aba — muda de cor quando está selecionada */}
      <Text style={[
        styles.tabLabel,
        focused ? styles.tabLabelActive : null, // aplica cor ativa se focused = true
      ]}>
        {label}
      </Text>

      {/* Ponto indicador embaixo da aba ativa */}
      {focused && <View style={styles.tabDot} />}
    </View>
  );
}

// ------------------------------------------------------------
// Componente principal — define todas as abas
// ------------------------------------------------------------
export default function TabNavigator() {
  return (
    <Tab.Navigator
      // screenOptions define configurações que valem para TODAS as abas
      screenOptions={{
        // Esconde o cabeçalho padrão (título no topo da tela)
        // porque cada tela vai ter seu próprio cabeçalho personalizado
        headerShown: false,

        // Remove o label padrão do React Navigation
        // porque criamos o nosso próprio dentro de TabIcon
        tabBarShowLabel: false,

        // Estilo da barra inferior
        tabBarStyle: styles.tabBar,
      }}
    >
      {/*
        Cada Tab.Screen define uma aba.
        - name: identificador interno (usado para navegação programática)
        - component: qual tela renderizar quando esta aba for tocada
        - options: configurações específicas desta aba
      */}

      <Tab.Screen
        name="Hoje"
        component={HojeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🏠" label="Hoje" focused={focused} />
          ),
        }}
      />

      <Tab.Screen
        name="Materias"
        component={MateriasScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📚" label="Matérias" focused={focused} />
          ),
        }}
      />

      <Tab.Screen
        name="Praticar"
        component={PraticarScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="⚡" label="Praticar" focused={focused} />
          ),
        }}
      />

      <Tab.Screen
        name="TutorIA"
        component={TutorScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🤖" label="Tutor IA" focused={focused} />
          ),
        }}
      />

      <Tab.Screen
        name="Perfil"
        component={PerfilScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="👤" label="Perfil" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// ------------------------------------------------------------
// ESTILOS DA NAVEGAÇÃO
// ------------------------------------------------------------
const styles = StyleSheet.create({
  // A barra inferior em si
  tabBar: {
    backgroundColor: 'rgba(13, 13, 22, 0.97)', // fundo escuro semitransparente
    borderTopColor: colors.border,              // linha divisória no topo
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 80 : 64,   // iOS precisa de mais espaço (notch inferior)
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
  },

  // Container de cada ícone de aba
  tabIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },

  // Emoji de cada aba
  tabEmoji: {
    fontSize: 20,
    lineHeight: 24,
  },

  // Label de texto embaixo do emoji
  tabLabel: {
    fontSize: typography.xs,
    color: colors.textSub,   // cinza quando inativa
    fontWeight: typography.medium,
  },

  // Label quando a aba está selecionada
  tabLabelActive: {
    color: colors.primary,   // roxo quando ativa
  },

  // Ponto indicador embaixo da aba ativa
  tabDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginTop: 2,
  },
});
