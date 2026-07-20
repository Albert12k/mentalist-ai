import { ClassDay, ClassMode } from "../types/Subject";

export const classDayOptions: { value: ClassDay; shortLabel: string; label: string }[] = [
  { value: "monday", shortLabel: "Seg", label: "segunda" },
  { value: "tuesday", shortLabel: "Ter", label: "terça" },
  { value: "wednesday", shortLabel: "Qua", label: "quarta" },
  { value: "thursday", shortLabel: "Qui", label: "quinta" },
  { value: "friday", shortLabel: "Sex", label: "sexta" },
  { value: "saturday", shortLabel: "Sáb", label: "sábado" },
  { value: "sunday", shortLabel: "Dom", label: "domingo" },
];

export const classModeLabels: Record<ClassMode, string> = {
  in_person: "Presencial",
  remote: "Remota",
};

export function formatClassDays(days: ClassDay[]): string {
  if (!days.length) return "Dias não informados";
  return classDayOptions.filter((option) => days.includes(option.value)).map((option) => option.shortLabel).join(", ");
}
