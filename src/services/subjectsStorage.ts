import AsyncStorage from "@react-native-async-storage/async-storage";
import { Subject } from "../types/Subject";

const KEY = "@mentalis:subjects";

function getKey(userId: string) {
  return `${KEY}:${userId}`;
}

/**
 * Salvar lista de matérias
 */
export async function saveSubjects(userId: string, subjects: Subject[]) {
  try {
    await AsyncStorage.setItem(getKey(userId), JSON.stringify(subjects));
  } catch (error) {
    console.log("Erro ao salvar matérias:", error);
  }
}

/**
 * Carregar matérias salvas
 */
export async function getSubjects(userId: string): Promise<Subject[]> {
  try {
    const data = await AsyncStorage.getItem(getKey(userId));

    if (!data) return [];

    return JSON.parse(data);
  } catch (error) {
    console.log("Erro ao carregar matérias:", error);
    return [];
  }
}

export async function clearLocalSubjects(userId: string) {
  await AsyncStorage.removeItem(getKey(userId));
}
