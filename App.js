// ============================================================
// App.js
// Ponto de entrada do aplicativo — é o primeiro arquivo
// que o Expo executa quando o app abre.
//
// Responsabilidade deste arquivo:
// 1. Configurar o NavigationContainer (contexto de navegação)
// 2. Definir o visual da status bar (relógio, bateria, etc.)
// 3. Renderizar o TabNavigator (as 5 abas)
//
// Pense nisso como a "casca" do app. Todo o conteúdo real
// fica dentro do TabNavigator e das telas.
// ============================================================

import React from 'react';
import { StatusBar } from 'expo-status-bar';

// NavigationContainer é obrigatório — ele cria o contexto
// que permite que toda a navegação funcione.
// É como o "provider" que envolve todo o app.
import { NavigationContainer } from '@react-navigation/native';

// Nosso navegador de abas personalizado
import TabNavigator from './src/navigation/TabNavigator';

// Cores do tema para configurar a StatusBar
import { colors } from './src/theme';

export default function App() {
  return (
    // NavigationContainer deve envolver TUDO que usa navegação
    <NavigationContainer>

      {/*
        StatusBar controla a barra do sistema no topo do celular
        (onde fica o relógio, bateria e sinal).
        - style="light" = ícones brancos (ideal para fundo escuro)
        - backgroundColor = cor de fundo da barra no Android
      */}
      <StatusBar style="light" backgroundColor={colors.background} />

      {/* Renderiza as 5 abas do app */}
      <TabNavigator />

    </NavigationContainer>
  );
}
