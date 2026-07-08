import {
  useState
} from "react";


import {
  SafeAreaView,
  Text,
  View,
  Pressable,
} from "react-native";


// 🧭 NAVEGAÇÃO

import {
  useNavigation
} from "@react-navigation/native";



// 🎨 TIPOS

import { Subject } from "../types/Subject";



// 🧠 CONTEXT

import {
  useSubjects
} from "../contexts/SubjectsContext";



// 🧩 COMPONENTES

import CreateSubjectModal
from "../components/CreateSubjectModal";





export default function SubjectsScreen(){



  // =========================
  // 🧭 NAVEGAÇÃO
  // =========================

  const navigation = useNavigation<any>();






  // =========================
  // 📦 CONTEXT
  // =========================

  const {
    subjects,
    addSubject,
    updateSubjects
  } = useSubjects();







  // =========================
  // 🧠 CONTROLE DO MODAL
  // =========================

  const [
    modalVisible,
    setModalVisible
  ] = useState(false);







  // =========================
  // ➕ CRIAR MATÉRIA
  // =========================

  function handleCreate(
    subject: Subject
  ){

    addSubject(subject);

  }









  // =========================
  // ⚡ GANHAR XP / RETENÇÃO
  // =========================

  function handleStudy(
    id:string
  ){


    const updated =
      subjects.map((subject)=>{


        if(subject.id === id){

          return {

            ...subject,

            retention:
              Math.min(
                subject.retention + 5,
                100
              )

          };

        }


        return subject;


      });



    updateSubjects(updated);


  }









  // =========================
  // 🎨 CARD DA MATÉRIA
  // =========================

  function renderSubject(
    item:Subject
  ){


    return (

      <Pressable


        key={item.id}


        // =========================
        // 📘 ABRIR DETALHES
        // =========================

        onPress={()=>


          navigation.navigate(

            "SubjectDetails",

            {

              subject:item

            }

          )


        }



        style={{


          backgroundColor:"#161625",


          padding:15,


          borderRadius:12,


          marginBottom:12,


          borderLeftWidth:6,


          borderLeftColor:item.color


        }}


      >






        {/* NOME */}


        <Text

          style={{

            color:"white",

            fontSize:18,

            fontWeight:"700"

          }}

        >

          📘 {item.name}

        </Text>






        {/* RETENÇÃO */}


        <Text

          style={{

            color:"#888",

            marginTop:5

          }}

        >

          Retenção:
          {" "}
          {item.retention.toFixed(1)}%

        </Text>






        {/* DIFICULDADE */}


        <Text

          style={{

            color:"#777",

            marginTop:5

          }}

        >

          Dificuldade:
          {" "}
          {item.difficulty}

        </Text>






        {/* INDICAÇÃO */}


        <Text

          style={{

            color:"#555",

            marginTop:8,

            fontSize:12

          }}

        >

          Toque para abrir detalhes →

        </Text>







        {/* BOTÃO XP */}


        <View>


          <Pressable


            onPress={()=>handleStudy(item.id)}



            style={{


              backgroundColor:"#7C4DFF",


              padding:10,


              borderRadius:8,


              marginTop:12,


              alignSelf:"flex-start"


            }}



          >



            <Text

              style={{

                color:"white",

                fontWeight:"700"

              }}

            >

              ⚡ Estudar +XP

            </Text>



          </Pressable>


        </View>







      </Pressable>


    );


  }












  // =========================
  // 🧠 TELA
  // =========================

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


          fontSize:26,


          fontWeight:"700"


        }}


      >


        📚 Matérias


      </Text>









      <View


        style={{


          marginTop:20


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


          ) : (


            subjects.map(renderSubject)


          )


        }



      </View>









      <Pressable


        onPress={()=>setModalVisible(true)}


        style={{


          backgroundColor:"#7C4DFF",


          padding:15,


          borderRadius:12,


          marginTop:20


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









      {/* MODAL */}


      <CreateSubjectModal



        visible={modalVisible}



        onClose={()=>


          setModalVisible(false)


        }



        onCreate={handleCreate}



      />







    </SafeAreaView>


  );


}