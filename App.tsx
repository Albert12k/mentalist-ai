import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AppNavigator from "./src/navigation/AppNavigator";
import { SubjectsProvider } from "./src/contexts/SubjectsContext";
import { ProfileProvider } from "./src/contexts/ProfileContext";
import { AuthProvider } from "./src/contexts/AuthContext";
import AuthGate from "./src/components/AuthGate";
import { configureNotificationDisplay } from "./src/services/activityReminders";

export default function App() {
  useEffect(() => {
    configureNotificationDisplay();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ProfileProvider>
          <SubjectsProvider>
            <AuthGate><AppNavigator /></AuthGate>
          </SubjectsProvider>
        </ProfileProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
