import { createContext, useContext, useState, useEffect } from "react";
import { Subject } from "../types/Subject";
import { getSubjects, saveSubjects } from "../services/subjectsStorage";

type SubjectsContextType = {
  subjects: Subject[];
  setSubjects: (data: Subject[]) => void;
  addSubject: (subject: Subject) => void;
  updateSubjects: (subjects: Subject[]) => void;
};

const SubjectsContext = createContext({} as SubjectsContextType);

export function SubjectsProvider({ children }: any) {
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const data = await getSubjects();
    setSubjects(data);
  }

  function addSubject(subject: Subject) {
    const updated = [...subjects, subject];
    setSubjects(updated);
    saveSubjects(updated);
  }

  function updateSubjects(updated: Subject[]) {
    setSubjects(updated);
    saveSubjects(updated);
  }

  return (
    <SubjectsContext.Provider
      value={{
        subjects,
        setSubjects,
        addSubject,
        updateSubjects,
      }}
    >
      {children}
    </SubjectsContext.Provider>
  );
}

export function useSubjects() {
  return useContext(SubjectsContext);
}