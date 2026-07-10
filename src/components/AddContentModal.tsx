import {
  SafeAreaView,
  Text,
  View,
  Pressable,
  Modal,
  TextInput,
} from "react-native";


import {
  useState
} from "react";



// 🎨 TIPOS

import {
  SubjectContent
} from "../types/Subject";







type Props = {


  visible:boolean;


  onClose:()=>void;



  onAdd:(
    content:SubjectContent
  )=>void;


};








export default function AddContentModal({

  visible,

  onClose,

  onAdd,

}:Props){






  const [

    title,

    setTitle

  ] = useState("");









  function handleAdd(){



    if(!title.trim()) return;





    const newContent: SubjectContent = {

  id: String(Date.now()),

  title: title.trim(),

  completed: false,

  createdAt: new Date().toISOString(),

};






    onAdd(newContent);





    setTitle("");



    onClose();


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


          📚 Novo Conteúdo


        </Text>









        <TextInput


          placeholder="Nome do conteúdo"


          placeholderTextColor="#666"



          value={title}



          onChangeText={setTitle}



          style={{



            backgroundColor:"#161625",



            color:"white",



            padding:14,



            borderRadius:12,



            marginTop:25,



          }}



        />









        <Pressable


          onPress={handleAdd}



          style={{



            backgroundColor:"#7C4DFF",



            padding:15,



            borderRadius:12,



            marginTop:25,



          }}



        >



          <Text


            style={{


              color:"white",


              textAlign:"center",


              fontWeight:"700",


            }}



          >



            Adicionar Conteúdo



          </Text>



        </Pressable>









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









      </SafeAreaView>



    </Modal>


  );


}