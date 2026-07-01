import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";

// 📱 TELAS
import HomeScreen from "../screens/HomeScreen";
import SubjectsScreen from "../screens/SubjectsScreen";

// 🔥 (cria placeholders por enquanto)
import { View, Text } from "react-native";

function Placeholder({ title }: { title: string }) {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#080810" }}>
      <Text style={{ color: "white", fontSize: 20 }}>{title}</Text>
    </View>
  );
}

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "#0A0A12",
            borderTopColor: "#1A1A2E",
          },
          tabBarActiveTintColor: "#7C4DFF",
          tabBarInactiveTintColor: "#666",
        }}
      >
        {/* 🏠 HOME */}
        <Tab.Screen name="Home" component={HomeScreen} />

        {/* 📚 MATÉRIAS */}
        <Tab.Screen name="Matérias" component={SubjectsScreen} />

        {/* ⚔️ DESAFIOS */}
        <Tab.Screen
          name="Desafios"
          children={() => <Placeholder title="⚔️ Desafios" />}
        />

        {/* 📊 PROGRESSO */}
        <Tab.Screen
          name="Progresso"
          children={() => <Placeholder title="📊 Progresso" />}
        />

        {/* 👤 PERFIL */}
        <Tab.Screen
          name="Perfil"
          children={() => <Placeholder title="👤 Perfil" />}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}