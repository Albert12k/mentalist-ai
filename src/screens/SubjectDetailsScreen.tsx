import {
  SafeAreaView,
  Text,
  View,
  Pressable,
  ScrollView,
} from "react-native";


import {
  useState
} from "react";


import {
  useRoute,
  useNavigation,
} from "@react-navigation/native";


// 🎨 TIPOS

import {
  Subject
} from "../types/Subject";


// 🧠 CONTEXT

import {
  useSubjects
} from "../contexts/SubjectsContext";


// 🧩 MODAL

import AddContentModal
from "../components/AddContentModal";








export default function SubjectDetailsScreen(){



  const navigation =
    useNavigation<any>();



  const route =
    useRoute<any>();






  // =========================
  // 📚 MATÉRIA
  // =========================


  const routeSubject:Subject =
    route.params.subject;





  const {

    subjects,

    updateSubjects,

  } = useSubjects();







  const subject =
  subjects.find(
    item =>
      item.id === routeSubject.id
  )
  ||
  routeSubject;


subject.contents ??= [];

subject.events ??= [];

subject.notes ??= "";

subject.studyHistory ??= [];

// =========================
  // 📚 MODAL CONTEÚDO
  // =========================


  const [

    contentVisible,

    setContentVisible

  ] = useState(false);









  // =========================
  // ➕ ADICIONAR CONTEÚDO
  // =========================


  function handleAddContent(
    content:any
  ){



    const updated =

      subjects.map((item)=>{



        if(item.id === subject.id){


          return {


            ...item,


            contents:[

              ...item.contents,

              content

            ]


          };


        }





        return item;



      });






    updateSubjects(updated);



  }












  return (


    <SafeAreaView


      style={{


        flex:1,


        backgroundColor:"#080810",


      }}


    >





      <ScrollView


        showsVerticalScrollIndicator={false}


        contentContainerStyle={{


          padding:20,


          paddingBottom:50


        }}


      >







        {/* VOLTAR */}


        <Pressable


          onPress={()=>navigation.goBack()}


        >


          <Text


            style={{


              color:"#7C4DFF",


              fontSize:16


            }}


          >


            ← Voltar


          </Text>


        </Pressable>









        {/* IDENTIDADE */}



        <View


          style={{



            marginTop:20,


            backgroundColor:"#161625",


            padding:20,


            borderRadius:16,


            borderLeftWidth:6,


            borderLeftColor:subject.color



          }}


        >





          <Text


            style={{



              color:"white",


              fontSize:28,


              fontWeight:"700"



            }}


          >


            📘 {subject.name}


          </Text>






          <Text


            style={{


              color:"#aaa",


              marginTop:10


            }}


          >


            🧠 Retenção:

            {" "}

            {subject.retention}%


          </Text>






          <Text


            style={{


              color:"#aaa",


              marginTop:8


            }}


          >


            🎯 {subject.difficulty}


          </Text>





        </View>












        {/* CONFIGURAÇÃO */}



        <View


          style={{


            marginTop:20,


            backgroundColor:"#161625",


            padding:16,


            borderRadius:16


          }}



        >





          <Text


            style={{


              color:"white",


              fontSize:18,


              fontWeight:"700"


            }}


          >


            🧠 Configuração


          </Text>






          <Text


            style={{


              color:"#aaa",


              marginTop:10


            }}


          >


            Objetivo:

            {" "}

            {subject.goal}


          </Text>






          <Text


            style={{


              color:"#aaa",


              marginTop:8


            }}


          >


            Frequência:

            {" "}

            {subject.frequency}


          </Text>





        </View>














        {/* CONTEÚDOS */}



        <View


          style={{


            marginTop:25


          }}


        >






          <View


            style={{


              flexDirection:"row",


              justifyContent:"space-between",


              alignItems:"center"



            }}



          >




            <Text


              style={{


                color:"white",


                fontSize:20,


                fontWeight:"700"


              }}


            >


              📚 Conteúdos


            </Text>







            <Pressable


              onPress={()=>setContentVisible(true)}


            >


              <Text


                style={{


                  color:"#7C4DFF",


                  fontWeight:"700"


                }}



              >


                + Adicionar


              </Text>



            </Pressable>





          </View>









         {
  (subject.contents ?? []).length === 0 ? (



              <Text


                style={{


                  color:"#777",


                  marginTop:10


                }}



              >


                Nenhum conteúdo cadastrado.


              </Text>



            )



            :





            (subject.contents ?? []).map((content)=>(



              <View


                key={content.id}


                style={{


                  backgroundColor:"#141424",


                  padding:12,


                  borderRadius:10,


                  marginTop:10



                }}



              >





                <Text


                  style={{


                    color:"white"


                  }}



                >


                  {content.completed ? "✅" : "⬜"}

                  {" "}

                  {content.title}



                </Text>





              </View>



            ))


          }





        </View>













        {/* EVENTOS */}




        <View


          style={{


            marginTop:25


          }}


        >





          <Text


            style={{


              color:"white",


              fontSize:20,


              fontWeight:"700"


            }}


          >


            📅 Datas importantes


          </Text>






          <Text


            style={{


              color:"#777",


              marginTop:10


            }}



          >


            Nenhuma data cadastrada.


          </Text>





        </View>













        {/* NOTAS */}





        <View


          style={{


            marginTop:25,


            backgroundColor:"#161625",


            padding:16,


            borderRadius:16


          }}



        >




          <Text


            style={{


              color:"white",


              fontSize:20,


              fontWeight:"700"


            }}



          >


            📝 Anotações


          </Text>






          <Text


            style={{


              color:"#888",


              marginTop:10


            }}



          >


            {


              subject.notes ||

              "Nenhuma anotação ainda."


            }



          </Text>






        </View>









      </ScrollView>









      <AddContentModal


        visible={contentVisible}


        onClose={()=>setContentVisible(false)}


        onAdd={handleAddContent}


      />







    </SafeAreaView>


  );


}