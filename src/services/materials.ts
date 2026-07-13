import { Platform } from "react-native";
import { Directory, File, Paths } from "expo-file-system";

import {
  SubjectMaterial,
  SubjectMaterialCategory,
  SubjectMaterialType,
} from "../types/Subject";

// Dados que existem antes de o usuário confirmar a importação. A tela de
// confirmação adiciona o título e a classificação final do material.
export type MaterialDraft = Omit<SubjectMaterial, "id" | "postedAt" | "category"> & {
  category: SubjectMaterialCategory;
};

export const materialCategoryLabels: Record<SubjectMaterialCategory, string> = {
  lesson: "Aula",
  notes: "Anotação",
  review: "Revisão",
  exercise: "Exercício",
  other: "Outro",
};

export const materialTypeLabels: Record<SubjectMaterialType, string> = {
  pdf: "PDF",
  image: "Foto",
  audio: "Áudio",
};

const materialKeywords: Record<Exclude<SubjectMaterialCategory, "other">, string[]> = {
  lesson: ["aula", "slide", "teoria", "capitulo", "capítulo"],
  notes: ["anot", "caderno", "resumo", "nota"],
  review: ["revis", "flashcard", "mapa mental"],
  exercise: ["exerc", "quest", "lista", "atividade", "simulado"],
};

// A primeira classificação é automática e usa o tipo de arquivo e o nome.
// Ela é apenas uma sugestão: o estudante sempre pode corrigir antes de salvar.
export function suggestMaterialCategory(
  type: SubjectMaterialType,
  title: string,
): SubjectMaterialCategory {
  if (type === "image") return "notes";
  if (type === "audio") return "lesson";

  const normalizedTitle = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  for (const [category, keywords] of Object.entries(materialKeywords) as [
    Exclude<SubjectMaterialCategory, "other">,
    string[],
  ][]) {
    if (keywords.some((keyword) => normalizedTitle.includes(keyword))) {
      return category;
    }
  }

  return "lesson";
}

export type MaterialDayGroup = {
  date: string;
  materials: SubjectMaterial[];
};

// Agrupa pelo dia de postagem, já deixando o grupo e os arquivos mais novos
// no topo da biblioteca da matéria.
export function groupMaterialsByDate(materials: SubjectMaterial[]): MaterialDayGroup[] {
  const groups = new Map<string, SubjectMaterial[]>();

  materials.forEach((material) => {
    const date = material.postedAt.slice(0, 10);
    groups.set(date, [...(groups.get(date) ?? []), material]);
  });

  return [...groups.entries()]
    .sort(([firstDate], [secondDate]) => secondDate.localeCompare(firstDate))
    .map(([date, groupMaterials]) => ({
      date,
      materials: groupMaterials.slice().sort((first, second) => second.postedAt.localeCompare(first.postedAt)),
    }));
}

export function formatMaterialDate(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function formatMaterialSize(size?: number): string | null {
  if (!size || size < 1) return null;
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

function safeFileName(fileName: string): string {
  const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
  return sanitized || "material";
}

// No Android e iOS, copiamos PDFs e fotos para a pasta de documentos do app.
// Assim o material não depende do cache temporário do seletor de arquivos.
// No navegador, o próprio navegador controla o arquivo selecionado durante a sessão.
export async function persistImportedMaterial(sourceUri: string, fileName: string): Promise<string> {
  if (Platform.OS === "web") return sourceUri;

  const materialsDirectory = new Directory(Paths.document, "mentalis-materials");
  materialsDirectory.create({ idempotent: true, intermediates: true });

  const source = new File(sourceUri);
  const destination = new File(materialsDirectory, `${Date.now()}-${safeFileName(fileName)}`);

  await source.copy(destination);
  return destination.uri;
}

// Quando o estudante cancela a importação ou exclui um material, removemos a
// cópia que estava na pasta de documentos. Na web o navegador administra o
// arquivo selecionado, então não há arquivo local do app para apagar.
export function deleteLocalMaterial(uri: string): void {
  if (Platform.OS === "web") return;

  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // O registro da matéria ainda pode ser removido mesmo se o sistema já
    // tiver apagado o arquivo físico.
  }
}
