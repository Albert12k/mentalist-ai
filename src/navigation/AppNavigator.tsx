import {
  createBottomTabNavigator,
} from "@react-navigation/bottom-tabs";


import {
  createNativeStackNavigator,
} from "@react-navigation/native-stack";


import {
  NavigationContainer,
} from "@react-navigation/native";



// 📱 TELAS

import HomeScreen
from "../screens/HomeScreen";


import SubjectsScreen
from "../screens/SubjectsScreen";


import SubjectDetailsScreen
from "../screens/SubjectDetailsScreen";




// 🔥 PLACEHOLDER

import {
  View,
  Text,
} from "react-native";





// ===============================
// 🧭 TIPAGEM DAS ROTAS
// ===============================


export type RootStackParamList = {

  MainTabs:undefined;


  SubjectDetails:{
    subject:any;
  };


};






// ===============================
// ⚔️ PLACEHOLDER
// ===============================


function Placeholder({

  title

}:{

  title:string

}){


  return (

    <View

      style={{

        flex:1,

        justifyContent:"center",

        alignItems:"center",

        backgroundColor:"#080810"

      }}

    >

      <Text

        style={{

          color:"white",

          fontSize:20

        }}

      >

        {title}

      </Text>


    </View>


  );


}









// ===============================
// 📱 NAVEGADORES
// ===============================


const Tab =
createBottomTabNavigator();


const Stack =
createNativeStackNavigator<RootStackParamList>();









// ===============================
// 📚 TABS
// ===============================


function MainTabs(){


  return (


    <Tab.Navigator


      screenOptions={{


        headerShown:false,


        tabBarStyle:{


          backgroundColor:"#0A0A12",


          borderTopColor:"#1A1A2E",


        },


        tabBarActiveTintColor:"#7C4DFF",


        tabBarInactiveTintColor:"#666",


      }}


    >






      <Tab.Screen

        name="Home"

        component={HomeScreen}

      />







      <Tab.Screen

        name="Matérias"

        component={SubjectsScreen}

      />







      <Tab.Screen

        name="Desafios"

        children={()=>


          <Placeholder

            title="⚔️ Desafios"

          />


        }

      />







      <Tab.Screen

        name="Progresso"

        children={()=>


          <Placeholder

            title="📊 Progresso"

          />


        }

      />







      <Tab.Screen

        name="Perfil"

        children={()=>


          <Placeholder

            title="👤 Perfil"

          />


        }

      />





    </Tab.Navigator>


  );


}











// ===============================
// 🚀 APP NAVIGATOR
// ===============================


export default function AppNavigator(){


  return (


    <NavigationContainer>


      <Stack.Navigator


        screenOptions={{


          headerShown:false


        }}



      >





        <Stack.Screen

          name="MainTabs"

          component={MainTabs}

        />








        <Stack.Screen

          name="SubjectDetails"

          component={SubjectDetailsScreen}

        />





      </Stack.Navigator>


    </NavigationContainer>


  );


}