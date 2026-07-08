import {
  SafeAreaView,
  Text,
  View,
  Pressable,
} from "react-native";

import { useState } from "react";


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





export default function HomeScreen() {



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
  // 🧠 PLANEJAMENTO DA IA
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
          (total, subject) =>
            total + subject.retention,
          0
        )
        /
        subjects.length
      );







  // ==================================================
  // 🎯 SELETOR DE MODO
  // ==================================================

  function ModeButton(
    {
      title,
      mode,
      description
    }:
    {
      title:string;
      mode:
      "manual" |
      "guided" |
      "auto";
      description:string;
    }
  ){


    return (

      <Pressable

        onPress={() =>
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







  // ==================================================
  // 🧠 TELA
  // ==================================================

  return (

    <SafeAreaView

      style={{

        flex:1,

        backgroundColor:
          colors.background,

        padding:20,

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

          color:
            colors.subtitle,

          marginBottom:20,

        }}

      >

        Academia para o cérebro

      </Text>






      {/* =========================
          ESCOLHA DO PLANEJAMENTO
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

                color:
                  colors.subtitle,

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

                color:
                  colors.subtitle,

                marginTop:15,

              }}

            >

              Nenhuma matéria disponível

            </Text>


          )


          :


          todayTraining.map(
            (item)=>(


            <View

              key={
                item.subject.id
              }

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



            </View>


          ))

        }


      </MentalisCard>









      {/* =========================
          XP
      ========================= */}


      <XPBar

        level={1}

        xp={0}

      />









      {/* =========================
          EVOLUÇÃO
      ========================= */}


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

          value={
            averageRetention
          }

          color={
            colors.success
          }

        />



        <Text

          style={{

            color:
              colors.success,

            marginTop:8,

            fontWeight:"700",

          }}

        >

          Retenção geral:
          {" "}
          {averageRetention}%

        </Text>



      </MentalisCard>









      {/* =========================
          LISTA DAS MATÉRIAS
      ========================= */}



      <MentalisCard>


        <Text

          style={{

            color:colors.text,

            fontWeight:"700",

          }}

        >

          📚 Suas matérias

        </Text>



        {
          subjects.map(
            (subject)=>(


            <View

              key={subject.id}

              style={{

                marginTop:10,

                flexDirection:"row",

                justifyContent:"space-between",

              }}

            >


              <Text

                style={{

                  color:"white",

                }}

              >

                {subject.name}

              </Text>



              <Text

                style={{

                  color:
                    subject.color,

                  fontWeight:"700",

                }}

              >

                {subject.retention}%

              </Text>


            </View>


          ))

        }


      </MentalisCard>






    </SafeAreaView>

  );

}