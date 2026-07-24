import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Ionicons from "@expo/vector-icons/Ionicons";

import ChallengesScreen from "../screens/ChallengesScreen";
import AgendaScreen from "../screens/AgendaScreen";
import HomeScreen from "../screens/HomeScreen";
import ProfileScreen from "../screens/ProfileScreen";
import ProgressScreen from "../screens/ProgressScreen";
import ReviewQueueScreen from "../screens/ReviewQueueScreen";
import SubjectDetailsScreen from "../screens/SubjectDetailsScreen";
import SubjectsScreen from "../screens/SubjectsScreen";
import TrainingScreen from "../screens/TrainingScreen";
import PlansScreen from "../screens/PlansScreen";

export type RootStackParamList = {
  MainTabs: undefined;
  SubjectDetails: {
    subject: any;
    initialSection?: "overview" | "contents" | "materials" | "practice" | "activities";
  };
  Training: {
    mode: "manual" | "guided" | "auto";
    subjectIds: string[];
    openTimer?: boolean;
  };
  ReviewQueue: undefined;
  Plans: undefined;
};

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

const tabIcons = {
  Home: { active: "home", inactive: "home-outline" },
  Matérias: { active: "book", inactive: "book-outline" },
  Agenda: { active: "calendar", inactive: "calendar-outline" },
  Desafios: { active: "trophy", inactive: "trophy-outline" },
  Progresso: { active: "stats-chart", inactive: "stats-chart-outline" },
  Perfil: { active: "person", inactive: "person-outline" },
} as const;

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarIcon: ({ color, size, focused }) => {
          const icons = tabIcons[route.name as keyof typeof tabIcons];
          return <Ionicons name={focused ? icons.active : icons.inactive} color={color} size={size} />;
        },
        tabBarStyle: {
          backgroundColor: "#0A0A12",
          borderTopColor: "#1A1A2E",
          paddingTop: 5,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
        tabBarIconStyle: { marginBottom: 1 },
        tabBarActiveTintColor: "#7C4DFF",
        tabBarInactiveTintColor: "#777582",
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Matérias" component={SubjectsScreen} />
      <Tab.Screen name="Agenda" component={AgendaScreen} />
      <Tab.Screen name="Desafios" component={ChallengesScreen} />
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
        <Stack.Screen name="ReviewQueue" component={ReviewQueueScreen} />
        <Stack.Screen name="Plans" component={PlansScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
