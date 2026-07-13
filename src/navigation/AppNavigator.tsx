import { Text, View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "../screens/HomeScreen";
import ProfileScreen from "../screens/ProfileScreen";
import ProgressScreen from "../screens/ProgressScreen";
import SubjectDetailsScreen from "../screens/SubjectDetailsScreen";
import SubjectsScreen from "../screens/SubjectsScreen";
import TrainingScreen from "../screens/TrainingScreen";

export type RootStackParamList = {
  MainTabs: undefined;
  SubjectDetails: {
    subject: any;
  };
  Training: {
    mode: "manual" | "guided" | "auto";
    subjectIds: string[];
  };
};

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

function Placeholder({ title }: { title: string }) {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#080810",
      }}
    >
      <Text style={{ color: "white", fontSize: 20 }}>{title}</Text>
    </View>
  );
}

function MainTabs() {
  return (
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
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Matérias" component={SubjectsScreen} />
      <Tab.Screen
        name="Desafios"
        children={() => <Placeholder title="Desafios" />}
      />
      <Tab.Screen name="Progresso" component={ProgressScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="SubjectDetails" component={SubjectDetailsScreen} />
        <Stack.Screen name="Training" component={TrainingScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
