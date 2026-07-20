import { createContext, useCallback, useContext, useEffect, useState } from "react";

import { useAuth } from "./AuthContext";
import { hydrateMaterialForPlatform } from "../services/materials";
import { getSubjects, saveSubjects } from "../services/subjectsStorage";
import { Subject } from "../types/Subject";
import { loadCloudSubjects, saveCloudSubjects } from "../services/cloudSync";
import { getUserAssetUrl } from "../services/cloudStorage";

type SubjectsContextType = {
  subjects: Subject[];
  addSubject: (subject: Subject) => void;
  updateSubjects: (subjects: Subject[]) => void;
  removeSubject: (id: string) => void;
  updateSubject: (subject: Subject) => void;
};

const SubjectsContext = createContext<SubjectsContextType | null>(null);

function normalizeSubject(subject: Subject): Subject {
  return { ...subject, classDays: subject.classDays ?? [], classMode: subject.classMode ?? "in_person", contents: subject.contents ?? [], materials: subject.materials ?? [], flashcards: subject.flashcards ?? [], quizzes: subject.quizzes ?? [], events: subject.events ?? [], notes: subject.notes ?? "", studyHistory: subject.studyHistory ?? [], absences: subject.absences ?? 0, absenceRecords: subject.absenceRecords ?? [] };
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
      const localSubjects = await getSubjects(userId);
      const cloudSubjects = await loadCloudSubjects(userId);
      const saved = cloudSubjects ?? localSubjects;
      const hydrated = await Promise.all(saved.map(async (subject) => {
        const normalized = normalizeSubject(subject);
        const cloudImageUrl = await getUserAssetUrl(normalized.imagePath);
        const hydratedMaterials = await Promise.all(normalized.materials.map(async (material) => {
          // O link do Storage expira por segurança; ele é recriado a cada abertura.
          const cloudMaterialUrl = await getUserAssetUrl(material.storagePath);
          return cloudMaterialUrl ? { ...material, uri: cloudMaterialUrl } : hydrateMaterialForPlatform(material);
        }));
        return { ...normalized, ...(cloudImageUrl ? { image: cloudImageUrl } : {}), materials: hydratedMaterials };
      }));
      if (active) setSubjects(hydrated);
      if (!cloudSubjects) void saveCloudSubjects(userId, saved);
    }
    void load();
    return () => { active = false; };
  }, [userId]);

  const persist = useCallback((updated: Subject[]) => {
    if (!userId) return;
    void saveSubjects(userId, updated);
    void saveCloudSubjects(userId, updated);
  }, [userId]);
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
