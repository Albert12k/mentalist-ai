import {
  SafeAreaView,
  Text,
  View,
  Pressable,
  Modal,
  TextInput,
  ScrollView,
} from "react-native";

import {
  useState,
  useEffect,
} from "react";


// 🎨 TIPOS

import {
  Subject
} from "../types/Subject";


// 🎨 CORES

import {
  colorPalette
} from "../data/colors";





// =========================
// PROPS
// =========================

type Props = {

  visible:boolean;

  onClose:()=>void;


  subject:Subject;


  onSave:(
    subject:Subject
  )=>void;

};








export default function EditSubjectModal({

  visible,

  onClose,

  subject,

  onSave,

}:Props){





  // =========================
  // ESTADOS
  // =========================


  const [
    name,
    setName
  ] = useState("");




  const [
    selectedColor,
    setSelectedColor
  ] = useState("");




  const [
    difficulty,
    setDifficulty
  ] = useState<
    "easy" |
    "medium" |
    "hard"
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
  // CARREGAR DADOS
  // =========================

  useEffect(()=>{


    if(subject){


      setName(
        subject.name
      );


      setSelectedColor(
        subject.color
      );


      setDifficulty(
        subject.difficulty
      );


      setGoal(
        subject.goal
      );


      setFrequency(
        subject.frequency
      );


    }


  },[subject]);









  // =========================
  // SALVAR
  // =========================

  function handleSave(){


    const updatedSubject:Subject = {


      ...subject,


      name:name.trim(),

      color:selectedColor,


      difficulty,

      goal,

      frequency,


    };



    onSave(
      updatedSubject
    );


    onClose();


  }









  // =========================
  // BOTÃO DE OPÇÃO
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

            color:"white"

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

              fontWeight:"700"


            }}


          >


            ✏️ Editar Matéria


          </Text>








          {/* NOME */}


          <TextInput


            value={name}


            onChangeText={setName}


            placeholder="Nome da matéria"


            placeholderTextColor="#666"


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

              marginTop:20

            }}

          >

            Cor


          </Text>




          <View

            style={{

              flexDirection:"row",

              flexWrap:"wrap",

              marginTop:10

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


                    width:35,

                    height:35,

                    borderRadius:20,

                    backgroundColor:color,

                    margin:5,


                    borderWidth:

                      selectedColor === color

                      ? 3

                      : 0,


                    borderColor:"white"


                  }}


                />



              ))

            }



          </View>









          {/* DIFICULDADE */}



          <Text

            style={{

              color:"#888",

              marginTop:20

            }}

          >

            Dificuldade

          </Text>



          <View

            style={{

              flexDirection:"row"

            }}

          >


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


          <Text

            style={{

              color:"#888",

              marginTop:20

            }}

          >

            Objetivo

          </Text>




          <View

            style={{

              flexDirection:"row",

              flexWrap:"wrap"

            }}

          >


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


          <Text

            style={{

              color:"#888",

              marginTop:20

            }}

          >

            Frequência

          </Text>




          <View

            style={{

              flexDirection:"row"

            }}

          >


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









          {/* SALVAR */}



          <Pressable


            onPress={handleSave}


            style={{


              backgroundColor:"#00E676",

              padding:15,

              borderRadius:12,

              marginTop:30


            }}



          >


            <Text

              style={{

                textAlign:"center",

                fontWeight:"700"

              }}

            >

              Salvar Alterações

            </Text>


          </Pressable>









          {/* CANCELAR */}


          <Pressable


            onPress={onClose}


            style={{

              padding:15,

              marginTop:10

            }}


          >


            <Text

              style={{

                color:"#888",

                textAlign:"center"

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