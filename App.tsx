import { useEffect } from "react";
import AppNavigator from "./src/navigation/AppNavigator";
import { SubjectsProvider } from "./src/contexts/SubjectsContext";
import { ProfileProvider } from "./src/contexts/ProfileContext";
import { configureNotificationDisplay } from "./src/services/activityReminders";

export default function App() {
  useEffect(() => {
    configureNotificationDisplay();
  }, []);

  return (
    <ProfileProvider>
      <SubjectsProvider>
        <AppNavigator />
      </SubjectsProvider>
    </ProfileProvider>
  );
}
