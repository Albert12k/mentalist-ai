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


      setSubjects(saved);

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



          // 💾 salva automaticamente

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



      // 💾 salva alterações

      saveSubjects(
        updatedSubjects
      );


    },
    []
  );








  // =========================
  // 🌎 PROVIDER
  // =========================

  return (


    <SubjectsContext.Provider

      value={{

        subjects,

        addSubject,

        updateSubjects,

      }}

    >


      {children}


    </SubjectsContext.Provider>


  );

}








// =========================
// 🧠 HOOK PERSONALIZADO
// =========================

export function useSubjects() {


  const context =
    useContext(
      SubjectsContext
    );



  if (!context) {

    throw new Error(
      "useSubjects deve ser usado dentro de SubjectsProvider"
    );

  }



  return context;

}