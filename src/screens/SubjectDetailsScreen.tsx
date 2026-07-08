import {
  SafeAreaView,
  Text,
  View,
  Pressable,
} from "react-native";


// 🧭 NAVEGAÇÃO

import {
  useRoute,
  useNavigation,
} from "@react-navigation/native";


// 🎨 TIPOS

import {
  Subject
} from "../types/Subject";





export default function SubjectDetailsScreen(){



  // =========================
  // 🧭 NAVEGAÇÃO
  // =========================


  const navigation = useNavigation();


  const route =
    useRoute<any>();



  // =========================
  // 📚 MATÉRIA RECEBIDA
  // =========================


  const subject:
    Subject =
      route.params.subject;





  return (


    <SafeAreaView


      style={{


        flex:1,


        backgroundColor:"#080810",


        padding:20


      }}


    >




      {/* =========================
          HEADER
         ========================= */}



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







      {/* =========================
          IDENTIDADE DA MATÉRIA
         ========================= */}



      <View


        style={{


          marginTop:20,


          backgroundColor:"#161625",


          padding:20,


          borderRadius:15,


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


            color:"#888",


            marginTop:10


          }}


        >


          Retenção:
          {" "}
          {subject.retention.toFixed(1)}%


        </Text>




      </View>








      {/* =========================
          INFORMAÇÕES INTELIGENTES
         ========================= */}



      <View


        style={{


          marginTop:20,


          backgroundColor:"#161625",


          padding:15,


          borderRadius:15


        }}


      >




        <Text


          style={{


            color:"white",


            fontSize:18,


            fontWeight:"700"


          }}


        >


          🧠 Informações


        </Text>






        <Text


          style={{


            color:"#aaa",


            marginTop:10


          }}


        >


          Dificuldade:
          {" "}
          {subject.difficulty}


        </Text>





        <Text


          style={{


            color:"#aaa",


            marginTop:8


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








      {/* =========================
          CONTEÚDOS
         ========================= */}



      <View


        style={{


          marginTop:20


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




        <Text


          style={{


            color:"#777",


            marginTop:8


          }}


        >


          Nenhum conteúdo cadastrado ainda.


        </Text>



      </View>








      {/* =========================
          EVENTOS
         ========================= */}



      <View


        style={{


          marginTop:20


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


            marginTop:8


          }}


        >


          Nenhuma data cadastrada.


        </Text>



      </View>







    </SafeAreaView>


  );


}