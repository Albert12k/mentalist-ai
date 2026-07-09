import {
  SafeAreaView,
  Text,
  View,
  Pressable,
  Modal,
  TextInput,
  ScrollView,
} from "react-native";

import { useState } from "react";


// =========================
// 🎨 TIPOS
// =========================

import {
  Subject,
  SubjectDifficulty,
  StudyGoal,
  StudyFrequency,
} from "../types/Subject";



// =========================
// 🎨 CORES
// =========================

import { colorPalette } from "../data/colors";



// =========================
// 🧠 PROPS
// =========================

type Props = {

  visible: boolean;

  onClose: () => void;

  onCreate: (
    subject: Subject
  ) => void;

};




// =========================
// 🧠 COMPONENTE
// =========================

export default function CreateSubjectModal({

  visible,

  onClose,

  onCreate,

}: Props) {



  // =========================
  // 📝 DADOS BÁSICOS
  // =========================


  const [name, setName] =
    useState("");



  const [description, setDescription] =
    useState("");



  const [selectedColor, setSelectedColor] =
    useState("#7C4DFF");



  // preparado para imagem futura

  const [image] =
    useState<string | undefined>(
      undefined
    );





  // =========================
  // 🧠 INTELIGÊNCIA
  // =========================


  const [difficulty, setDifficulty] =
    useState<SubjectDifficulty>(
      "medium"
    );



  const [goal, setGoal] =
    useState<StudyGoal>(
      "personal"
    );



  const [frequency, setFrequency] =
    useState<StudyFrequency>(
      "daily"
    );





  // =========================
  // ➕ CRIAR
  // =========================


  function handleCreate(){


    if(!name.trim()) return;



    const subject: Subject = {


      id:
        String(Date.now()),



      name:
        name.trim(),



      description:
        description.trim(),



      color:
        selectedColor,



      image,



      difficulty,


      goal,


      frequency,



      retention:
        0,



      contents:
        [],



      events:
        [],



      notes:
        "",



      studyHistory:
        [],



      createdAt:
        new Date().toISOString(),


    };



    onCreate(subject);




    // reset

    setName("");

    setDescription("");

    setSelectedColor("#7C4DFF");

    setDifficulty("medium");

    setGoal("personal");

    setFrequency("daily");



    onClose();

  }






  // =========================
  // 🔘 BOTÃO DE OPÇÃO
  // =========================


  function OptionButton({

    label,

    active,

    onPress,

  }:{

    label:string;

    active:boolean;

    onPress:()=>void;

  }){


    return (

      <Pressable

        onPress={onPress}

        style={{

          backgroundColor:
            active
            ? "#7C4DFF"
            : "#161625",

          padding:10,

          borderRadius:10,

          marginRight:8,

          marginBottom:8,

        }}

      >

        <Text

          style={{

            color:"white",

          }}

        >

          {label}

        </Text>


      </Pressable>

    );


  }






  // =========================
  // 🎨 INTERFACE
  // =========================


  return (

    <Modal

      visible={visible}

      animationType="slide"

      onRequestClose={onClose}

    >


      <SafeAreaView

        style={{

          flex:1,

          backgroundColor:"#080810",

        }}

      >


        <ScrollView

          contentContainerStyle={{

            padding:20,

          }}

        >



          <Text

            style={{

              color:"white",

              fontSize:26,

              fontWeight:"700",

            }}

          >

            🧠 Criar Matéria

          </Text>





          <TextInput

            placeholder="Nome da matéria"

            placeholderTextColor="#666"

            value={name}

            onChangeText={setName}

            style={{

              backgroundColor:"#161625",

              color:"white",

              padding:12,

              borderRadius:10,

              marginTop:20,

            }}

          />





          <TextInput

            placeholder="Descrição da matéria"

            placeholderTextColor="#666"

            value={description}

            onChangeText={setDescription}

            multiline

            style={{

              backgroundColor:"#161625",

              color:"white",

              padding:12,

              borderRadius:10,

              marginTop:12,

              height:80,

              textAlignVertical:"top",

            }}

          />






          <Text

            style={{

              color:"#888",

              marginTop:20,

            }}

          >

            Cor da matéria

          </Text>



          <View

            style={{

              flexDirection:"row",

              flexWrap:"wrap",

              marginTop:10,

            }}

          >


            {
              colorPalette.map((color)=>(

                <Pressable

                  key={color}

                  onPress={()=>
                    setSelectedColor(color)
                  }

                  style={{

                    width:32,

                    height:32,

                    borderRadius:20,

                    backgroundColor:color,

                    margin:5,

                    borderWidth:

                      selectedColor === color
                      ? 3
                      : 0,

                    borderColor:"white",

                  }}

                />


              ))
            }


          </View>






          <Text style={{color:"#888", marginTop:20}}>
            Dificuldade
          </Text>


          <View style={{flexDirection:"row"}}>


            <OptionButton
              label="Fácil"
              active={difficulty==="easy"}
              onPress={()=>setDifficulty("easy")}
            />


            <OptionButton
              label="Médio"
              active={difficulty==="medium"}
              onPress={()=>setDifficulty("medium")}
            />


            <OptionButton
              label="Difícil"
              active={difficulty==="hard"}
              onPress={()=>setDifficulty("hard")}
            />


          </View>





          <Text style={{color:"#888", marginTop:20}}>
            Objetivo
          </Text>


          <View style={{flexDirection:"row", flexWrap:"wrap"}}>


            <OptionButton
              label="Prova"
              active={goal==="exam"}
              onPress={()=>setGoal("exam")}
            />

            <OptionButton
              label="Faculdade"
              active={goal==="college"}
              onPress={()=>setGoal("college")}
            />

            <OptionButton
              label="Concurso"
              active={goal==="contest"}
              onPress={()=>setGoal("contest")}
            />

            <OptionButton
              label="Carreira"
              active={goal==="career"}
              onPress={()=>setGoal("career")}
            />

            <OptionButton
              label="Pessoal"
              active={goal==="personal"}
              onPress={()=>setGoal("personal")}
            />


          </View>






          <Text style={{color:"#888", marginTop:20}}>
            Frequência
          </Text>



          <View style={{flexDirection:"row"}}>


            <OptionButton
              label="Diário"
              active={frequency==="daily"}
              onPress={()=>setFrequency("daily")}
            />


            <OptionButton
              label="3x semana"
              active={frequency==="three_times"}
              onPress={()=>setFrequency("three_times")}
            />


            <OptionButton
              label="Fim de semana"
              active={frequency==="weekend"}
              onPress={()=>setFrequency("weekend")}
            />


          </View>







          <Pressable

            onPress={handleCreate}

            style={{

              backgroundColor:"#00E676",

              padding:15,

              borderRadius:12,

              marginTop:30,

            }}

          >

            <Text

              style={{

                textAlign:"center",

                fontWeight:"700",

              }}

            >

              Criar Matéria

            </Text>


          </Pressable>





          <Pressable

            onPress={onClose}

            style={{

              marginTop:10,

              padding:15,

            }}

          >

            <Text

              style={{

                color:"#888",

                textAlign:"center",

              }}

            >

              Cancelar

            </Text>


          </Pressable>





        </ScrollView>


      </SafeAreaView>


    </Modal>

  );


}