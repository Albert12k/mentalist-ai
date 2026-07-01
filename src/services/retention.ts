/**
 * Sistema de evolução cognitiva (Mentalis Core)
 *
 * Aqui vamos simular crescimento da retenção.
 */

import { Subject } from "../types/Subject";

export function updateRetention(subject: Subject): Subject {
  const increase = Math.random() * 5; // ganho aleatório

  let newRetention = subject.retention + increase;

  if (newRetention > 100) newRetention = 100;

  return {
    ...subject,
    retention: Number(newRetention.toFixed(1)),
  };
}