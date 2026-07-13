import {
  SafeAreaView,
  Text,
  View,
  Pressable,
  ScrollView,
} from "react-native";

import { useState } from "react";

import { useNavigation } from "@react-navigation/native";


// =========================
// 🔥 COMPONENTES
// =========================

import MentalisCard from "../components/MentalisCard";
import XPBar from "../components/XPBar";
import ProgressBar from "../components/ProgressBar";


// =========================
// 🎨 TEMA
// =========================

import { colors } from "../theme/colors";



// =========================
// 🧠 CONTEXT
// =========================

import { useSubjects } from "../contexts/SubjectsContext";



// =========================
// 🧠 IA PLANNER
// =========================

import {
  generateStudyPlan,
  getStudyByMode,
} from "../services/studyPlanner";

import {
  getLevelProgress,
  getTotalXP,
} from "../services/xpSystem";






export default function HomeScreen(){

  const navigation = useNavigation<any>();



  // ==================================================
  // 🧠 MODO DE ESTUDO
  // ==================================================

  const [
    studyMode,
    setStudyMode
  ] = useState<
    "manual" |
    "guided" |
    "auto" |
    null
  >(null);






  // ==================================================
  // 📚 MATÉRIAS
  // ==================================================

  const {
    subjects
  } = useSubjects();






  // ==================================================
  // 🧠 PLANNER
  // ==================================================

  const studyPlan =
    generateStudyPlan(subjects);



  const todayTraining =
    getStudyByMode(
      studyPlan,
      studyMode
    );







  // ==================================================
  // 📊 RETENÇÃO GERAL
  // ==================================================

  const averageRetention =
    subjects.length === 0
      ? 0
      :
      Math.round(

        subjects.reduce(
          (total, subject)=>
            total + subject.retention,

          0
        )
        /
        subjects.length

      );

  const levelProgress =
    getLevelProgress(
      getTotalXP(subjects)
    );









  // ==================================================
  // 🎯 BOTÃO DE MODO
  // ==================================================

  function ModeButton({

    title,

    mode,

    description,

  }:{
    title:string;

    mode:
    "manual" |
    "guided" |
    "auto";

    description:string;

  }){


    return (

      <Pressable

        onPress={()=>
          setStudyMode(mode)
        }


        style={{

          marginTop:10,

          padding:12,

          borderRadius:12,

          backgroundColor:

            studyMode === mode

            ? "#7C4DFF"

            : "#161625",

        }}

      >


        <Text

          style={{

            color:"white",

            fontWeight:"700",

          }}

        >

          {title}

        </Text>




        <Text

          style={{

            color:"#bbb",

            marginTop:4,

            fontSize:12,

          }}

        >

          {description}

        </Text>



      </Pressable>


    );

  }












  return (


    <SafeAreaView

style={{

flex:1,

backgroundColor:colors.background,

}}

>



      <ScrollView

        showsVerticalScrollIndicator={false}

        contentContainerStyle={{

          padding:20,

          paddingBottom:40,

        }}

      >






      {/* HEADER */}


      <Text

        style={{

          color:colors.text,

          fontSize:30,

          fontWeight:"700",

        }}

      >

        🧠 Mentalis AI

      </Text>




      <Text

        style={{

          color:colors.subtitle,

          marginBottom:20,

        }}

      >

        Academia para o cérebro

      </Text>









      {/* =========================
          MODO DE ESTUDO
      ========================= */}


      <MentalisCard>


        <Text

          style={{

            color:colors.primary,

            fontWeight:"700",

            fontSize:16,

          }}

        >

          COMO VOCÊ QUER TREINAR?

        </Text>




        <ModeButton

          title="📝 Manual"

          mode="manual"

          description="Você escolhe suas matérias"

        />




        <ModeButton

          title="🧠 Guiado"

          mode="guided"

          description="A IA recomenda o melhor caminho"

        />




        <ModeButton

          title="🤖 Automático"

          mode="auto"

          description="A IA monta seu treino completo"

        />



      </MentalisCard>









      {/* =========================
          TREINO DE HOJE
      ========================= */}


      <MentalisCard>


        <Text

          style={{

            color:colors.primary,

            fontWeight:"700",

          }}

        >

          🎯 TREINO DE HOJE

        </Text>





        {
          studyMode === null ? (


            <Text

              style={{

                color:colors.subtitle,

                marginTop:15,

              }}

            >

              Escolha um modo de estudo
              para começar

            </Text>


          )

          :

          todayTraining.length === 0 ? (


            <Text

              style={{

                color:colors.subtitle,

                marginTop:15,

              }}

            >

              Nenhuma matéria disponível

            </Text>


          )

          :


          todayTraining

          .slice(0,3)

          .map((item)=>(


            <Pressable

              key={
                item.subject.id
              }

              onPress={() => navigation.navigate("SubjectDetails", { subject: item.subject })}


              style={{

                marginTop:12,

                padding:12,

                backgroundColor:"#141424",

                borderRadius:10,

                borderLeftWidth:4,

                borderLeftColor:
                  item.subject.color,

              }}

            >



              <Text

                style={{

                  color:"white",

                  fontSize:17,

                  fontWeight:"700",

                }}

              >

                📘 {item.subject.name}

              </Text>




              <Text

                style={{

                  color:"#aaa",

                  marginTop:5,

                }}

              >

                Prioridade:
                {" "}
                {item.priority}%

              </Text>




              <Text

                style={{

                  color:"#888",

                  marginTop:5,

                }}

              >

                🧠 {item.reason}

              </Text>



            </Pressable>


          ))

        }



      </MentalisCard>









      {/* XP */}


      <View

        style={{

          marginTop:20,

        }}

      >

        <XPBar

          level={levelProgress.level}

          xp={levelProgress.progressPercent}

        />


      </View>









      {/* EVOLUÇÃO */}


      <MentalisCard>


        <Text

          style={{

            color:colors.text,

            fontWeight:"700",

          }}

        >

          📊 Evolução Mental

        </Text>




        <ProgressBar

          value={averageRetention}

          color={colors.success}

        />




        <Text

          style={{

            color:colors.success,

            marginTop:8,

            fontWeight:"700",

          }}

        >

          Retenção geral:
          {" "}
          {averageRetention}%

        </Text>



      </MentalisCard>









      





      </ScrollView>


    </SafeAreaView>


  );


}
