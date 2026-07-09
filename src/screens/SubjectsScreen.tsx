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

import { Subject } from "../types/Subject";



// 🧠 CONTEXT

import {
  useSubjects
} from "../contexts/SubjectsContext";



// 🧩 COMPONENTES

import CreateSubjectModal
from "../components/CreateSubjectModal";







export default function SubjectsScreen(){


  const navigation =
    useNavigation<any>();





  const {
    subjects,
    addSubject,
    updateSubjects,
    removeSubject,

  } = useSubjects();






  const [
    modalVisible,
    setModalVisible
  ] = useState(false);









  function handleCreate(
    subject:Subject
  ){

    addSubject(subject);

  }









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









  function handleDelete(
    id:string,
    name:string
  ){


    Alert.alert(

      "Excluir matéria",

      `Deseja realmente remover ${name}?`,

      [

        {
          text:"Cancelar",
          style:"cancel"
        },


        {

          text:"Excluir",

          style:"destructive",

          onPress:()=>{

            removeSubject(id);

          }

        }


      ]

    );


  }









  function handleEdit(
    subject:Subject
  ){

    Alert.alert(

      "Editar matéria",

      "Sistema de edição será conectado aqui."

    );

  }









  function renderSubject(
    item:Subject
  ){


    return (

      <Pressable


        key={item.id}


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

          padding:16,

          borderRadius:15,

          marginBottom:15,

          borderLeftWidth:6,

          borderLeftColor:item.color,


        }}



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
          {item.retention.toFixed(0)}%

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







        {/* AÇÕES */}


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

                fontWeight:"700",

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





      </Pressable>


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

          marginTop:20,

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


        onPress={()=>setModalVisible(true)}


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


        visible={modalVisible}


        onClose={()=>setModalVisible(false)}


        onCreate={handleCreate}


      />





    </SafeAreaView>

  );


}