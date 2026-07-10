import {
  useState
} from "react";


import {
  SafeAreaView,
  Text,
  View,
  Pressable,
  ScrollView,
  Alert,
} from "react-native";



// 🧭 NAVEGAÇÃO

import {
  useNavigation
} from "@react-navigation/native";



// 🎨 TIPOS

import {
  Subject
} from "../types/Subject";



// 🧠 CONTEXT

import {
  useSubjects
} from "../contexts/SubjectsContext";



// 🧩 COMPONENTES

import CreateSubjectModal
from "../components/CreateSubjectModal";


import EditSubjectModal
from "../components/EditSubjectModal";








export default function SubjectsScreen(){


  const navigation =
    useNavigation<any>();



  
const {

  subjects,

  addSubject,

  updateSubjects,

  updateSubject,

  removeSubject,

} = useSubjects();


  // =========================
  // MODAIS
  // =========================


  const [
    createVisible,
    setCreateVisible
  ] = useState(false);



  const [
    editVisible,
    setEditVisible
  ] = useState(false);




  const [
    selectedSubject,
    setSelectedSubject
  ] = useState<Subject | null>(null);











  // =========================
  // CRIAR MATÉRIA
  // =========================


  function handleCreate(
    subject:Subject
  ){

    addSubject(subject);

  }









  // =========================
  // ESTUDAR + XP
  // =========================
  // 🔧 CORRIGIDO: antes essa função montava um array
  // inteiro (updated) com .map(), mas tentava salvar
  // chamando updateSubject(updatedSubject) — variável
  // que não existia (typo).
  //
  // Agora: acha a matéria pelo id, monta só o objeto
  // atualizado, e chama updateSubject passando UMA
  // matéria (igual já é feito em handleSaveEdit).


  function handleStudy(
    id:string
  ){


    const subject = subjects.find(
      (s)=> s.id === id
    );


    if(!subject) return;


    const subjectAtualizada:Subject = {

      ...subject,

      retention:
        Math.min(
          subject.retention + 5,
          100
        )

    };


    updateSubject(subjectAtualizada);


  }









  // =========================
  // ABRIR EDIÇÃO
  // =========================


  function handleEdit(
    subject:Subject
  ){


    setSelectedSubject(subject);

    setEditVisible(true);


  }









  // =========================
  // SALVAR EDIÇÃO
  // =========================


 function handleSaveEdit(
  subjectUpdated: Subject
){

  updateSubject(subjectUpdated);


  setEditVisible(false);

  setSelectedSubject(null);

}
  // =========================
  // EXCLUIR
  // =========================


 function handleDelete(
  id:string,
  name:string
){

  Alert.alert(

    "Excluir matéria",

    `Deseja remover ${name}?`,

    [

      {
        text:"Cancelar",
        style:"cancel"
      },


      {

        text:"Excluir",

        style:"destructive",

        onPress:()=>{


          console.log(
            "Removendo:",
            id
          );


          removeSubject(id);


        }

      }

    ]

  );

}
  // =========================
  // CARD DA MATÉRIA
  // =========================


  function renderSubject(
    item:Subject
  ){


    return (


      <View


        key={item.id}


        style={{


          backgroundColor:"#161625",

          padding:16,

          borderRadius:15,

          marginBottom:15,

          borderLeftWidth:6,

          borderLeftColor:item.color,


        }}


      >




        <Pressable


          onPress={()=>


            navigation.navigate(

              "SubjectDetails",

              {
                subject:item
              }

            )

          }


        >


          <Text

            style={{

              color:"white",

              fontSize:19,

              fontWeight:"700",

            }}

          >

            📘 {item.name}

          </Text>




          <Text

            style={{

              color:"#aaa",

              marginTop:8,

            }}

          >

            🧠 Retenção:
            {" "}
            {item.retention}%

          </Text>




          <Text

            style={{

              color:"#777",

              marginTop:5,

            }}

          >

            🎯 Dificuldade:
            {" "}
            {item.difficulty}

          </Text>


        </Pressable>







        <View

          style={{

            flexDirection:"row",

            marginTop:15,

            gap:10,

          }}

        >





          <Pressable


            onPress={()=>handleStudy(item.id)}


            style={{


              backgroundColor:"#7C4DFF",

              padding:10,

              borderRadius:10,


            }}


          >


            <Text

              style={{

                color:"white",

                fontWeight:"700"

              }}

            >

              ⚡ XP

            </Text>


          </Pressable>







          <Pressable


            onPress={()=>handleEdit(item)}


            style={{


              backgroundColor:"#263238",

              padding:10,

              borderRadius:10,


            }}


          >


            <Text

              style={{

                color:"white"

              }}

            >

              ✏️ Editar

            </Text>


          </Pressable>








          <Pressable


            onPress={()=>


              handleDelete(

                item.id,

                item.name

              )

            }


            style={{


              backgroundColor:"#B00020",

              padding:10,

              borderRadius:10,


            }}


          >


            <Text

              style={{

                color:"white"

              }}

            >

              🗑️

            </Text>


          </Pressable>





        </View>





      </View>


    );


  }













  return (


    <SafeAreaView


      style={{


        flex:1,

        backgroundColor:"#080810",

        padding:20


      }}


    >




      <Text


        style={{


          color:"white",

          fontSize:28,

          fontWeight:"700",


        }}


      >

        📚 Matérias

      </Text>








      <ScrollView


        showsVerticalScrollIndicator={false}


        style={{

          marginTop:20

        }}


        contentContainerStyle={{

          paddingBottom:120

        }}


      >



        {

          subjects.length === 0 ? (


            <Text

              style={{

                color:"#888"

              }}

            >

              Nenhuma matéria criada ainda


            </Text>


          )


          :


          subjects.map(renderSubject)


        }



      </ScrollView>









      <Pressable


        onPress={()=>setCreateVisible(true)}


        style={{


          backgroundColor:"#7C4DFF",

          padding:15,

          borderRadius:12,


        }}


      >


        <Text

          style={{


            color:"white",

            textAlign:"center",

            fontWeight:"700"


          }}


        >

          + Nova Matéria


        </Text>


      </Pressable>









      <CreateSubjectModal


        visible={createVisible}


        onClose={()=>setCreateVisible(false)}


        onCreate={handleCreate}


      />









      {
        selectedSubject && (


          <EditSubjectModal


            visible={editVisible}


            subject={selectedSubject}


            onClose={()=>{


              setEditVisible(false);

              setSelectedSubject(null);


            }}


            onSave={handleSaveEdit}


          />


        )

      }





    </SafeAreaView>


  );


}
