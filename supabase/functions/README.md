# Função do Tutor IA

Esta função conecta o Tutor do Mentalis à OpenAI sem expor a chave no aplicativo.

1. Instale a [Supabase CLI](https://supabase.com/docs/guides/functions/deploy) e entre na sua conta.
2. Dentro da pasta do projeto, execute `npx supabase functions deploy mentalis-ai --project-ref keelbmtpxubsvoybdxec`.
3. No painel do Supabase, abra **Project Settings > Edge Functions > Secrets** e adicione:
   - `OPENAI_API_KEY`: sua chave criada no painel da OpenAI.
   - `OPENAI_MODEL` (opcional): `gpt-5-mini`, para usar o modelo econômico definido pelo projeto.

Não coloque `OPENAI_API_KEY` no arquivo `.env` do Expo: tudo que começa com `EXPO_PUBLIC_` pode ficar visível no aplicativo.
