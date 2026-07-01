import AsyncStorage from "@react-native-async-storage/async-storage";
import { Subject } from "../types/Subject";

const KEY = "@mentalis:subjects";

/**
 * Salvar lista de matérias
 */
export async function saveSubjects(subjects: Subject[]) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(subjects));
  } catch (error) {
    console.log("Erro ao salvar matérias:", error);
  }
}

/**
 * Carregar matérias salvas
 */
export async function getSubjects(): Promise<Subject[]> {
  try {
    const data = await AsyncStorage.getItem(KEY);

    if (!data) return [];

    return JSON.parse(data);
  } catch (error) {
    console.log("Erro ao carregar matérias:", error);
    return [];
  }
}