# Mentalis — Parte 1: Estrutura Base

## O que foi construído

A fundação do app: tema, navegação e telas em branco.  
Cada tela mostra um placeholder "Em construção" até ser implementada nas próximas partes.

---

## Estrutura de pastas

```
mentalis/
├── App.js                        → Ponto de entrada do app
├── package.json                  → Dependências do projeto
│
└── src/
    ├── theme/
    │   └── index.js              → Cores, fontes e espaçamentos globais
    │
    ├── navigation/
    │   └── TabNavigator.js       → Barra de abas inferior (5 abas)
    │
    ├── screens/                  → Uma pasta por tela
    │   ├── HojeScreen.js
    │   ├── MateriasScreen.js
    │   ├── PraticarScreen.js
    │   ├── TutorScreen.js
    │   └── PerfilScreen.js
    │
    └── components/
        └── PlaceholderScreen.js  → Tela temporária reutilizável
```

---

## Como rodar

```bash
# 1. Entre na pasta do projeto
cd mentalis

# 2. Instale as dependências
npm install

# 3. Inicie o Expo
npx expo start
```

Depois escaneie o QR code com o app **Expo Go** no celular.

---

## Dependências instaladas

| Pacote | Para que serve |
|--------|---------------|
| `expo` | Plataforma que facilita o React Native |
| `react-navigation/native` | Sistema de navegação entre telas |
| `react-navigation/bottom-tabs` | Barra de abas inferior |
| `react-native-screens` | Otimização de telas (obrigatório com React Navigation) |
| `react-native-safe-area-context` | Respeita o notch e a barra inferior do celular |

---

## Próxima parte

**Tela de Hoje** — o coração do app:
- Saudação com nome e sequência de dias
- Card "Estudo de hoje" com botão de iniciar
- Lista de revisões do dia
- Alerta de ilusão de competência
- Prazos chegando
