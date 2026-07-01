/**
 * Modelo oficial de uma matéria no Mentalis
 */

export type Subject = {
  id: string;
  name: string;
  color: string;
  retention: number; // 0 a 100
};