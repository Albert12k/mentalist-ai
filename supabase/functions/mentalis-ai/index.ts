// Função segura executada dentro do Supabase. A chave da OpenAI fica somente
// nos Secrets do projeto e nunca chega ao navegador ou ao aplicativo mobile.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type RequestBody = { question?: string; studyContext?: string; mode?: "tutor" | "quiz" | "flashcards" };

function getOutputText(response: { output?: Array<{ content?: Array<{ type?: string; text?: string }> }> }): string {
  return response.output?.flatMap((item) => item.content ?? [])
    .filter((content) => content.type === "output_text")
    .map((content) => content.text ?? "").join("").trim() ?? "";
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return new Response("Método não permitido", { status: 405, headers: corsHeaders });

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) return Response.json({ error: "A chave da IA ainda não foi configurada no Supabase." }, { status: 503, headers: corsHeaders });

  try {
    const { question, studyContext, mode = "tutor" } = await request.json() as RequestBody;
    const safeQuestion = question?.trim().slice(0, 2_000);
    if (!safeQuestion) return Response.json({ error: "Escreva uma pergunta para o tutor." }, { status: 400, headers: corsHeaders });

    // Limitamos o contexto para manter custo e tempo de resposta previsíveis.
    const safeContext = studyContext?.slice(0, 12_000) || "Nenhuma matéria foi cadastrada ainda.";
    const openAiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: Deno.env.get("OPENAI_MODEL") || "gpt-5-mini",
        reasoning: { effort: "low" },
        instructions: mode === "tutor"
          ? "Você é o Tutor do Mentalis, um app de estudos em português do Brasil. Responda de forma acolhedora, objetiva e prática. Use somente o contexto fornecido para afirmações sobre matérias, prazos e progresso. Se faltar informação, diga claramente e proponha um próximo passo. Não invente fontes, conteúdo de arquivos ou datas."
          : mode === "quiz"
            ? "Crie um quiz somente com base no conteúdo fornecido. Responda APENAS JSON válido no formato {\"questions\":[{\"question\":string,\"options\":[string,string,string,string],\"correctOptionIndex\":0}]} com 3 a 8 perguntas. Não invente fatos."
            : "Crie flashcards somente com base no conteúdo fornecido. Responda APENAS JSON válido no formato {\"flashcards\":[{\"question\":string,\"answer\":string}]} com 3 a 10 cartões. Não invente fatos.",
        input: `Contexto de estudo do aluno:\n${safeContext}\n\nPergunta do aluno:\n${safeQuestion}`,
      }),
    });
    const payload = await openAiResponse.json();
    if (!openAiResponse.ok) {
      console.error("OpenAI error", payload);
      return Response.json({ error: "A IA não conseguiu responder agora. Tente novamente em instantes." }, { status: 502, headers: corsHeaders });
    }
    const answer = getOutputText(payload);
    if (!answer) return Response.json({ error: "A IA retornou uma resposta vazia. Tente novamente." }, { status: 502, headers: corsHeaders });
    return Response.json({ answer }, { headers: corsHeaders });
  } catch (error) {
    console.error("mentalis-ai error", error);
    return Response.json({ error: "Não foi possível conversar com a IA agora." }, { status: 500, headers: corsHeaders });
  }
});
