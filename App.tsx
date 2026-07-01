import AppNavigator from "./src/navigation/AppNavigator";
import { SubjectsProvider } from "./src/contexts/SubjectsContext";

export default function App() {
  return (
    <SubjectsProvider>
      <AppNavigator />
    </SubjectsProvider>
  );
}