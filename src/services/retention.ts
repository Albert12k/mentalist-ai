/**
 * Sistema de evolução cognitiva (Mentalis Core)
 *
 * Aqui vamos simular crescimento da retenção.
 */

import { Subject } from "../types/Subject";

/**
 * Calcula o ganho de retenção de forma previsível.
 *
 * O ganho diminui perto de 100%, evitando que poucas sessões coloquem uma
 * matéria no máximo. Não usamos aleatoriedade: o usuário deve conseguir
 * entender por que o progresso exibido mudou.
 */
export function calculateRetentionAfterStudy(
  currentRetention: number,
  durationMinutes: number,
): number {
  const safeRetention = Math.min(Math.max(currentRetention, 0), 100);
  const safeDuration = Math.min(Math.max(durationMinutes, 1), 180);
  const baseGain = Math.min(8, 1 + safeDuration / 15);
  const diminishingFactor = 1 - safeRetention / 140;
  const nextRetention = safeRetention + baseGain * diminishingFactor;

  return Number(Math.min(nextRetention, 100).toFixed(1));
}

export function updateRetention(
  subject: Subject,
  durationMinutes: number = 30,
): Subject {
  return {
    ...subject,
    retention: calculateRetentionAfterStudy(subject.retention, durationMinutes),
  };
}
