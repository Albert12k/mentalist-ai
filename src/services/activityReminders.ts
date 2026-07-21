import { Platform } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";

import { Subject, SubjectEvent } from "../types/Subject";

export const reminderDays = [5, 3, 2, 1] as const;

export type ActivityReminder = {
  subject: Subject;
  event: SubjectEvent;
  daysUntil: number;
};

let notificationDisplayConfigured = false;

// O Expo Go não inclui mais o suporte nativo necessário para notificações no
// Android. Carregar expo-notifications nele interrompe a abertura do app, por
// isso o módulo só é importado em uma build própria do Trilume.
async function getNotifications() {
  if (Platform.OS === "web" || Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    return null;
  }

  return import("expo-notifications");
}

function isReminderEvent(event: SubjectEvent): boolean {
  // Atividades e provas têm prazo. Revisões usam o calendário de estudo.
  return !event.completed && (event.type === "assignment" || event.type === "exam");
}

function eventDateAtNineAM(date: string): Date {
  return new Date(`${date}T09:00:00`);
}

export function getDaysUntil(date: string, now = new Date()): number {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const eventDay = new Date(`${date}T12:00:00`);
  eventDay.setHours(0, 0, 0, 0);

  return Math.round((eventDay.getTime() - today.getTime()) / 86_400_000);
}

// A Home usa esta função para exibir lembretes também na versão web.
export function getActivityReminders(subjects: Subject[], now = new Date()): ActivityReminder[] {
  return subjects
    .flatMap((subject) => subject.events.map((event) => ({
      subject,
      event,
      daysUntil: getDaysUntil(event.date, now),
    })))
    .filter((reminder) => (
      isReminderEvent(reminder.event)
      && reminderDays.includes(reminder.daysUntil as typeof reminderDays[number])
    ))
    .sort((first, second) => first.daysUntil - second.daysUntil);
}

// No Android e iOS, o handler faz a notificação aparecer mesmo quando o app
// está aberto. A web usa o painel de lembretes dentro do Trilume.
export function configureNotificationDisplay(): void {
  if (Platform.OS === "web" || notificationDisplayConfigured) return;
  notificationDisplayConfigured = true;

  void getNotifications().then((Notifications) => {
    if (!Notifications) return;
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  });
}

async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const Notifications = await getNotifications();
  if (!Notifications) return false;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("activity-reminders", {
      name: "Lembretes de atividades",
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  const currentPermission = await Notifications.getPermissionsAsync();
  const permission = currentPermission.granted
    ? currentPermission
    : await Notifications.requestPermissionsAsync();

  return permission.granted;
}

export async function cancelActivityReminders(notificationIds: string[] = []): Promise<void> {
  if (Platform.OS === "web") return;
  const Notifications = await getNotifications();
  if (!Notifications) return;

  await Promise.all(notificationIds.map(async (notificationId) => {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch {
      // O lembrete pode já ter sido exibido ou removido pelo sistema.
    }
  }));
}

// Ao criar ou editar uma atividade, removemos os horários antigos e criamos
// os alertas futuros para 5, 3, 2 e 1 dias antes do vencimento, às 9h.
export async function scheduleActivityReminders(
  event: SubjectEvent,
  subjectName: string,
  previousNotificationIds: string[] = [],
): Promise<string[]> {
  await cancelActivityReminders(previousNotificationIds);

  if (Platform.OS === "web" || !isReminderEvent(event)) return [];

  const Notifications = await getNotifications();
  if (!Notifications) return [];

  const hasPermission = await ensureNotificationPermission();
  if (!hasPermission) return [];

  const now = new Date();
  const deadline = eventDateAtNineAM(event.date);
  const notificationIds: string[] = [];

  for (const daysBefore of reminderDays) {
    const triggerDate = new Date(deadline);
    triggerDate.setDate(triggerDate.getDate() - daysBefore);

    if (triggerDate.getTime() <= now.getTime()) continue;

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Lembrete de atividade",
        body: `${event.title} (${subjectName}) vence em ${daysBefore} dia(s).`,
        data: { eventId: event.id, daysBefore },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        channelId: "activity-reminders",
      },
    });

    notificationIds.push(notificationId);
  }

  return notificationIds;
}
