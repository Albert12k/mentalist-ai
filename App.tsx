import AppNavigator from "./src/navigation/AppNavigator";
import { SubjectsProvider } from "./src/contexts/SubjectsContext";
import { ProfileProvider } from "./src/contexts/ProfileContext";

export default function App() {
  return (
    <ProfileProvider>
      <SubjectsProvider>
        <AppNavigator />
      </SubjectsProvider>
    </ProfileProvider>
  );
}
