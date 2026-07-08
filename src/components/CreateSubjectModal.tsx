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

import { Subject } from "../types/Subject";


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

  const [
    name,
    setName
  ] = useState("");



  const [
    selectedColor,
    setSelectedColor
  ] = useState("#7C4DFF");





  // =========================
  // 🧠 INTELIGÊNCIA DA MATÉRIA
  // =========================


  const [
    difficulty,
    setDifficulty
  ] = useState<
    "easy" | "medium" | "hard"
  >("medium");




  const [
    goal,
    setGoal
  ] = useState<
    "exam" |
    "college" |
    "contest" |
    "career" |
    "personal"
  >("personal");




  const [
    frequency,
    setFrequency
  ] = useState<
    "daily" |
    "three_times" |
    "weekend"
  >("daily");






  // =========================
  // ➕ CRIAR MATÉRIA
  // =========================

  function handleCreate(){


    if(!name.trim()) return;



    const newSubject: Subject = {


      // 🆔 IDENTIFICAÇÃO

      id:
        String(Date.now()),



      // 📚 INFORMAÇÕES BÁSICAS

      name:
        name.trim(),


      color:
        selectedColor,



      // 🧠 INFORMAÇÕES INTELIGENTES

      difficulty,

      goal,

      frequency,



      // 📊 DESEMPENHO

      retention:0,



      // 📅 CONTROLE

      createdAt:
        new Date().toISOString(),

        contents: [],
events: [],
notes: "",
studyHistory: [],


    };



    onCreate(
      newSubject
    );



    // limpar formulário

    setName("");

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








  return (


    <Modal

      visible={visible}

      animationType="slide"

      transparent={false}

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

              fontSize:24,

              fontWeight:"700",

            }}

          >

            🧠 Criar Matéria

          </Text>





          {/* NOME */}

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






          {/* CORES */}

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
                      selectedColor===color
                      ?3
                      :0,

                    borderColor:"white",

                  }}

                />


              ))
            }


          </View>







          {/* DIFICULDADE */}

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






          {/* OBJETIVO */}

          <Text style={{color:"#888", marginTop:20}}>

            Objetivo

          </Text>


          <View style={{flexWrap:"wrap", flexDirection:"row"}}>


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








          {/* FREQUÊNCIA */}

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








          {/* CRIAR */}

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






          {/* CANCELAR */}

          <Pressable

            onPress={onClose}

            style={{

              padding:15,

              marginTop:10,

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