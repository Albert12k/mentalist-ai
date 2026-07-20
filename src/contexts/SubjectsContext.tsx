import { createContext, useCallback, useContext, useEffect, useState } from "react";

import { useAuth } from "./AuthContext";
import { hydrateMaterialForPlatform } from "../services/materials";
import { getSubjects, saveSubjects } from "../services/subjectsStorage";
import { Subject } from "../types/Subject";

type SubjectsContextType = {
  subjects: Subject[];
  addSubject: (subject: Subject) => void;
  updateSubjects: (subjects: Subject[]) => void;
  removeSubject: (id: string) => void;
  updateSubject: (subject: Subject) => void;
};

const SubjectsContext = createContext<SubjectsContextType | null>(null);

function normalizeSubject(subject: Subject): Subject {
  return { ...subject, contents: subject.contents ?? [], materials: subject.materials ?? [], flashcards: subject.flashcards ?? [], quizzes: subject.quizzes ?? [], events: subject.events ?? [], notes: subject.notes ?? "", studyHistory: subject.studyHistory ?? [], absences: subject.absences ?? 0 };
}

// As matérias ficam separadas pela identificação da conta. Assim, quando uma
// pessoa entra com outra conta no mesmo navegador, começa com uma lista vazia.
export function SubjectsProvider({ children }: { children: React.ReactNode }) {
  const { userId } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!userId) { if (active) setSubjects([]); return; }
      const saved = await getSubjects(userId);
      const hydrated = await Promise.all(saved.map(async (subject) => {
        const normalized = normalizeSubject(subject);
        return { ...normalized, materials: await Promise.all(normalized.materials.map(hydrateMaterialForPlatform)) };
      }));
      if (active) setSubjects(hydrated);
    }
    void load();
    return () => { active = false; };
  }, [userId]);

  const persist = useCallback((updated: Subject[]) => { if (userId) void saveSubjects(userId, updated); }, [userId]);
  const addSubject = useCallback((subject: Subject) => setSubjects((current) => { const updated = [...current, subject]; persist(updated); return updated; }), [persist]);
  const updateSubjects = useCallback((updated: Subject[]) => { setSubjects(updated); persist(updated); }, [persist]);
  const removeSubject = useCallback((id: string) => setSubjects((current) => { const updated = current.filter((subject) => subject.id !== id); persist(updated); return updated; }), [persist]);
  const updateSubject = useCallback((updatedSubject: Subject) => setSubjects((current) => { const updated = current.map((subject) => subject.id === updatedSubject.id ? updatedSubject : subject); persist(updated); return updated; }), [persist]);

  return <SubjectsContext.Provider value={{ subjects, addSubject, updateSubjects, removeSubject, updateSubject }}>{children}</SubjectsContext.Provider>;
}

export function useSubjects() {
  const context = useContext(SubjectsContext);
  if (!context) throw new Error("useSubjects deve ser usado dentro de SubjectsProvider");
  return context;
}
