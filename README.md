# Trilume

Aplicativo de organização de estudos feito com Expo, React Native e Supabase.

## Recursos atuais

- Login por e-mail e Google
- Matérias, conteúdos, materiais e faltas por data
- Agenda mensal e semanal com lembretes
- Pomodoro, flashcards e quizzes locais
- Progresso, desafios, medalhas e recompensas
- Sincronização protegida por conta

## Executar na web

```bash
npm install
npm run web
```

Crie um arquivo `.env` na raiz usando `.env.example` como referência. As chaves privadas nunca devem ser colocadas no aplicativo.

## Verificações

```bash
npx tsc --noEmit
npx expo export --platform web
```
