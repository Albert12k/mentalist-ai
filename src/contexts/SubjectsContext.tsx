import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";


// =========================
// 🎨 TIPOS
// =========================

import { Subject } from "../types/Subject";



// =========================
// 💾 STORAGE
// =========================

import {
  getSubjects,
  saveSubjects,
} from "../services/subjectsStorage";

function normalizeSubject(subject: Subject): Subject {
  return {
    ...subject,
    contents: subject.contents ?? [],
    materials: subject.materials ?? [],
    events: subject.events ?? [],
    notes: subject.notes ?? "",
    studyHistory: subject.studyHistory ?? [],
    absences: subject.absences ?? 0,
  };
}



// =========================
// 🧠 TIPO DO CONTEXT
// =========================

type SubjectsContextType = {


  // 📚 Lista atual de matérias

  subjects: Subject[];



  // ➕ Criar nova matéria

  addSubject: (
    subject: Subject
  ) => void;



  // ✏️ Atualizar lista completa

  updateSubjects: (
    subjects: Subject[]
  ) => void;



  // 🗑️ Remover matéria

  removeSubject: (
    id:string
  ) => void;

    // ✏️ Editar uma matéria específica

  updateSubject: (
    subject: Subject
  ) => void;

};






// =========================
// 🧠 CRIAÇÃO DO CONTEXT
// =========================

const SubjectsContext =
  createContext<SubjectsContextType | null>(null);







// =========================
// 🌎 PROVIDER GLOBAL
// =========================

export function SubjectsProvider(
  {
    children,
  }: {
    children: React.ReactNode;
  }
) {



  // =========================
  // 📦 ESTADO DAS MATÉRIAS
  // =========================

  const [
    subjects,
    setSubjects
  ] = useState<Subject[]>([]);








  // =========================
  // 📥 CARREGAR DADOS SALVOS
  // =========================

  useEffect(() => {


    async function loadSubjects() {


      const saved =
        await getSubjects();


      setSubjects(saved.map(normalizeSubject));


    }


    loadSubjects();


  }, []);









  // =========================
  // ➕ ADICIONAR MATÉRIA
  // =========================

  const addSubject = useCallback(
    (
      subject: Subject
    ) => {


      setSubjects(
        (currentSubjects) => {


          const updated = [

            ...currentSubjects,

            subject,

          ];



          saveSubjects(updated);



          return updated;


        }
      );


    },
    []
  );









  // =========================
  // ✏️ ATUALIZAR MATÉRIAS
  // =========================

  const updateSubjects = useCallback(
    (
      updatedSubjects: Subject[]
    ) => {


      setSubjects(
        updatedSubjects
      );



      saveSubjects(
        updatedSubjects
      );


    },
    []
  );


  // =========================
  // 🗑️ REMOVER MATÉRIA
  // =========================

  const removeSubject = useCallback((id: string) => {
    setSubjects((currentSubjects) => {
      const updated = currentSubjects.filter((subject) => subject.id !== id);
      
      // 💾 salva automaticamente
      saveSubjects(updated);
      
      return updated;
    });
  }, []);

  // =========================
  // ✨ NOVA FUNÇÃO: updateSubject
  // =========================
  const updateSubject = useCallback((updatedSubject: Subject) => {
    setSubjects((currentSubjects) => {
      const updated = currentSubjects.map((subject) => 
        subject.id === updatedSubject.id ? updatedSubject : subject
      );
      
      // 💾 salva automaticamente
      saveSubjects(updated);
      
      return updated;
    });
  }, []);

  // =========================
  // 🌎 PROVIDER
  // =========================
  return (
    <SubjectsContext.Provider
      value={{
        subjects,
        addSubject,
        updateSubjects, // Mantenha apenas se você realmente usa essa função em outro lugar
        updateSubject,  // Adicionado e agora possui uma função correspondente acima
        removeSubject,
      }}
    >
      {children}
    </SubjectsContext.Provider>
  );

     

}


// =========================
// 🧠 HOOK PERSONALIZADO
// =========================

export function useSubjects(){


  const context =

    useContext(
      SubjectsContext
    );



  if(!context){


    throw new Error(
      "useSubjects deve ser usado dentro de SubjectsProvider"
    );


  }



  return context;


}
